/*
 * Compat layer for CNAESection cloned from novastelas.
 * In zera-frontend we do not use Supabase SDK directly, so this shim
 * emulates only the subset required by CNAESection.
 */

type QueryResult<T = unknown> = Promise<{ data: T; error: null }>;

type CnaeCatalogRow = {
  codigo_cnae: string;
  anexo: string | null;
};

const STORAGE_KEY = 'zera_cnae_catalogo_cache_v1';

const emptyResult = <T>(data: T): QueryResult<T> => Promise.resolve({ data, error: null });

const normalizeCode = (value: string) => String(value || '').replace(/\D/g, '');

const readCache = (): Record<string, string | null> => {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, string | null>;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
};

const writeCache = (cache: Record<string, string | null>) => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
  } catch {
    // noop
  }
};

const inferAnexo = (_codigo: string): string => {
  // Compat operacional: manter experiência do novastelas com anexo preenchido.
  // Sem serviço dedicado no zera-frontend, adotamos Anexo III como fallback padrão.
  return 'III';
};

const createBuilder = (table: string) => {
  let selectedField = '';
  let inValues: string[] = [];
  let eqValue = '';

  return {
    select: (fields: string) => {
      selectedField = fields;
      return createBuilder(table).withState(selectedField, inValues, eqValue);
    },
    in: (_field: string, values: string[]) => {
      inValues = values;
      return createBuilder(table).withState(selectedField, inValues, eqValue).execIn();
    },
    eq: (_field: string, value: string) => {
      eqValue = value;
      return createBuilder(table).withState(selectedField, inValues, eqValue);
    },
    maybeSingle: () => {
      if (table !== 'cnae_catalogo') return emptyResult(null);
      const cache = readCache();
      const code = normalizeCode(eqValue);
      const cached = cache[code] ?? null;
      if (selectedField.includes('anexo')) {
        return emptyResult(cached ? { anexo: cached } : null);
      }
      return emptyResult(null);
    },
    withState: (sf: string, iv: string[], ev: string) => {
      selectedField = sf;
      inValues = iv;
      eqValue = ev;
      return {
        select: (fields: string) => createBuilder(table).withState(fields, inValues, eqValue),
        in: (_field: string, values: string[]) => createBuilder(table).withState(selectedField, values, eqValue).execIn(),
        eq: (_field: string, value: string) => createBuilder(table).withState(selectedField, inValues, value),
        maybeSingle: () => createBuilder(table).withState(selectedField, inValues, eqValue).maybeSingle(),
        execIn: () => createBuilder(table).withState(selectedField, inValues, eqValue).execIn(),
      };
    },
    execIn: () => {
      if (table !== 'cnae_catalogo') return emptyResult([] as CnaeCatalogRow[]);
      const cache = readCache();
      const rows: CnaeCatalogRow[] = [];
      for (const raw of inValues) {
        const code = normalizeCode(raw);
        const cached = cache[code];
        if (cached) {
          rows.push({ codigo_cnae: code, anexo: cached });
        }
      }
      return emptyResult(rows);
    },
  };
};

export const supabase = {
  from: (table: string) => createBuilder(table),
  functions: {
    invoke: (_name: string, payload?: { body?: { codigo_cnae?: string } }) => {
      const code = normalizeCode(payload?.body?.codigo_cnae || '');
      const anexo = code ? inferAnexo(code) : null;
      if (code && anexo) {
        const cache = readCache();
        cache[code] = anexo;
        writeCache(cache);
      }
      return emptyResult({ success: Boolean(anexo), anexo });
    },
  },
};
