import type { ListaServicoItem } from '@/components/emissao/PrestacaoServicoSection';
import type { Empresa } from '@/types/api';

type FavoritoVinculo = {
  ctn?: string;
  ctnDescricao?: string;
  nbs?: string;
  nbsDescricao?: string;
};

export type FavoritoMapeado = {
  codigo: string;
  cnaeDescricao: string;
  lc116Item: string;
  vinculos: FavoritoVinculo[];
};

const asObject = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' ? (value as Record<string, unknown>) : {};

const asArray = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);

const pickFirstString = (raw: Record<string, unknown>, keys: string[]): string => {
  for (const key of keys) {
    const value = raw[key];
    if (value === null || value === undefined || value === '') continue;
    return String(value).trim();
  }
  return '';
};

const parseDateMs = (value: unknown) => {
  const date = value ? new Date(String(value)) : null;
  const ms = date?.getTime();
  return Number.isFinite(ms) ? Number(ms) : 0;
};

export const mapFavoritosFromParametroMunicipal = (empresa?: Empresa): FavoritoMapeado[] => {
  const rows = asArray(empresa?.parametroMunicipal);
  return rows
    .map((item) => {
      const raw = asObject(item);
      const codigo = pickFirstString(raw, ['codigo', 'codigoCnae', 'cnaeCodigo', 'cnae']).replace(/\D/g, '');
      if (!codigo) return null;
      const vinculosRaw = asArray(raw.vinculos);
      const vinculos = vinculosRaw
        .map((v) => {
          const row = asObject(v);
          const ctn = pickFirstString(row, ['ctn', 'ctnCodigo', 'codigoCtn']) || undefined;
          const ctnDescricao = pickFirstString(row, ['ctnDescricao', 'descricaoCtn']) || undefined;
          const nbs = pickFirstString(row, ['nbs', 'nbsCodigo', 'codigoNbs']) || undefined;
          const nbsDescricao = pickFirstString(row, ['nbsDescricao', 'descricaoNbs']) || undefined;
          if (!ctn && !nbs) return null;
          return { ctn, ctnDescricao, nbs, nbsDescricao };
        })
        .filter((v): v is FavoritoVinculo => Boolean(v));
      if (vinculos.length === 0) {
        const fallbackCtn = pickFirstString(raw, ['ctn', 'ctnCodigo']);
        const fallbackNbs = pickFirstString(raw, ['nbs', 'nbsCodigo']);
        if (fallbackCtn || fallbackNbs) {
          vinculos.push({
            ctn: fallbackCtn || undefined,
            ctnDescricao: pickFirstString(raw, ['ctnDescricao', 'descricaoCtn']) || undefined,
            nbs: fallbackNbs || undefined,
            nbsDescricao: pickFirstString(raw, ['nbsDescricao', 'descricaoNbs']) || undefined,
          });
        }
      }
      return {
        codigo,
        cnaeDescricao: pickFirstString(raw, ['cnaeDescricao', 'descricao', 'cnaeFiscalDescricao']) || 'CNAE principal',
        lc116Item: pickFirstString(raw, ['lc116Item', 'itemLc116', 'lc116']),
        vinculos,
      };
    })
    .filter((item): item is FavoritoMapeado => Boolean(item));
};

export const mapListaServicoFromConfig = (empresa?: Empresa): ListaServicoItem[] => {
  const rows = asArray(empresa?.configOperacionais);
  return rows
    .map((item, index) => {
      const raw = asObject(item);
      const natureza = pickFirstString(raw, ['natureza', 'codigoServico', 'codigo']);
      const descricao = pickFirstString(raw, ['descricao', 'nomeServico', 'nome']);
      if (!natureza && !descricao) return null;
      return {
        id: pickFirstString(raw, ['id']) || `cfg-${index + 1}`,
        natureza,
        descricao,
        codigoServico: pickFirstString(raw, ['codigoServico']) || undefined,
        aliquota: pickFirstString(raw, ['aliquota']) || undefined,
      };
    })
    .filter((item): item is ListaServicoItem => Boolean(item));
};

export const hasFavoriteConfig = (empresa: Empresa | null | undefined) =>
  asArray(empresa?.parametroMunicipal).length > 0 || asArray(empresa?.configOperacionais).length > 0;

export const pickEmpresaForEmissao = (empresas: Empresa[]): Empresa | null => {
  if (!Array.isArray(empresas) || empresas.length === 0) return null;
  const ranked = [...empresas].sort((a, b) => {
    const aParam = asArray(a.parametroMunicipal).length;
    const bParam = asArray(b.parametroMunicipal).length;
    const aCfg = asArray(a.configOperacionais).length;
    const bCfg = asArray(b.configOperacionais).length;
    const aScore = (aParam * 20) + (aCfg * 10) + (a.prontoParaEmitir ? 3 : 0) + (a.cnpj ? 1 : 0);
    const bScore = (bParam * 20) + (bCfg * 10) + (b.prontoParaEmitir ? 3 : 0) + (b.cnpj ? 1 : 0);
    if (aScore !== bScore) return bScore - aScore;
    return parseDateMs(b.updatedAt) - parseDateMs(a.updatedAt);
  });
  return ranked[0] ?? null;
};
