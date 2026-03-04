/* Compat layer for CNAESection cloned from novastelas.
 * No Supabase dependency in zera-frontend; methods return empty data.
 */
type QueryResult<T = unknown> = Promise<{ data: T; error: null }>;

const emptyResult = <T>(data: T): QueryResult<T> => Promise.resolve({ data, error: null });

const builder = {
  select: (_fields: string) => builder,
  in: (_field: string, _values: string[]) => emptyResult([] as Array<{ codigo_cnae: string; anexo: string | null }>),
  eq: (_field: string, _value: string) => builder,
  maybeSingle: () => emptyResult(null as { anexo?: string | null } | null),
};

export const supabase = {
  from: (_table: string) => builder,
  functions: {
    invoke: (_name: string, _payload?: unknown) => emptyResult({ success: false, anexo: null }),
  },
};
