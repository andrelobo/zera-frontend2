import type { ProviderResponse } from '@/types/api';

const normalizeProviderName = (provider?: string | null): string => provider?.trim().toUpperCase() || '';

export const isLegacyProvider = (provider?: string | null): boolean => (
  normalizeProviderName(provider) === 'PLUGNOTAS'
);

export const getProviderDisplayName = (provider?: string | null): string => {
  const normalized = normalizeProviderName(provider);
  if (normalized === 'LOBONOTAS') return 'LOBONOTAS — Ambiente Nacional';
  if (normalized === 'PLUGNOTAS') return 'PlugNotas — legado desativado';
  if (normalized === 'MANAUS') return 'Manaus';
  if (normalized === 'MOCK') return 'Ambiente de teste';
  return provider?.trim() || 'Não informado';
};

export const getProviderArtifactFileName = (
  provider: string | null | undefined,
  id: string,
  extension: 'xml' | 'pdf',
): string => {
  const prefix = normalizeProviderName(provider) === 'LOBONOTAS' ? 'lobonotas-nfse' : 'nfse';
  return `${prefix}-${id}.${extension}`;
};

interface NfseInferredData {
  valor?: number;
  descricao?: string;
  tomadorRazaoSocial?: string;
  tomadorCpfCnpj?: string;
  prestadorRazaoSocial?: string;
  prestadorCpfCnpj?: string;
  codigoServico?: string;
  numeroNfse?: string;
  dpsNum?: string;
  serieDpsNum?: string;
}

const asRecord = (value: unknown): Record<string, unknown> | null => {
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value) as unknown;
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>;
      }
    } catch {
      return null;
    }
  }
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
};

const firstFromArray = (value: unknown): unknown => {
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value) as unknown;
      return Array.isArray(parsed) ? parsed[0] : parsed;
    } catch {
      return value;
    }
  }
  return Array.isArray(value) ? value[0] : value;
};

const toNumber = (value: unknown): number | undefined => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const n = Number(value);
    if (Number.isFinite(n)) return n;
  }
  return undefined;
};

const asString = (value: unknown): string | undefined => {
  if (typeof value === 'string' && value.trim() !== '') return value;
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return undefined;
};

export const inferNfseDataFromProvider = (provider?: ProviderResponse | null): NfseInferredData => {
  if (!provider) return {};

  const canonico = asRecord(provider.canonico) ?? {};

  const providerRequest = asRecord(provider.providerRequest);
  const payload = firstFromArray(providerRequest?.payload);
  const payloadObj = asRecord(payload);

  const payloadTomador = asRecord(payloadObj?.tomador);
  const payloadPrestador = asRecord(payloadObj?.prestador);
  const payloadServico = asRecord(firstFromArray(payloadObj?.servico));
  const payloadServicoValor = asRecord(payloadServico?.valor);

  const providerResponseRoot = asRecord(firstFromArray(provider.providerResponse));
  const responseTomador = asRecord(providerResponseRoot?.tomador);
  const responsePrestador = asRecord(providerResponseRoot?.prestador);
  const responseServico = asRecord(firstFromArray(providerResponseRoot?.servico));
  const responseServicoValor = asRecord(responseServico?.valor);
  const responseRetorno = asRecord(providerResponseRoot?.retorno);
  const responseDps = asRecord(providerResponseRoot?.dps);

  const valor =
    toNumber(payloadServicoValor?.servico) ??
    toNumber(responseServicoValor?.servico);

  const descricao =
    (typeof payloadServico?.discriminacao === 'string' ? payloadServico.discriminacao : undefined) ??
    (typeof payloadServico?.descricao === 'string' ? payloadServico.descricao : undefined) ??
    (typeof responseServico?.discriminacao === 'string' ? responseServico.discriminacao : undefined);

  const tomadorRazaoSocial =
    (typeof payloadTomador?.razaoSocial === 'string' ? payloadTomador.razaoSocial : undefined) ??
    (typeof responseTomador?.razaoSocial === 'string' ? responseTomador.razaoSocial : undefined);

  const tomadorCpfCnpj =
    (typeof payloadTomador?.cpfCnpj === 'string' ? payloadTomador.cpfCnpj : undefined) ??
    (typeof responseTomador?.cpfCnpj === 'string' ? responseTomador.cpfCnpj : undefined);

  const prestadorRazaoSocial =
    (typeof payloadPrestador?.razaoSocial === 'string' ? payloadPrestador.razaoSocial : undefined) ??
    (typeof responsePrestador?.razaoSocial === 'string' ? responsePrestador.razaoSocial : undefined);

  const prestadorCpfCnpj =
    (typeof payloadPrestador?.cpfCnpj === 'string' ? payloadPrestador.cpfCnpj : undefined) ??
    (typeof responsePrestador?.cpfCnpj === 'string' ? responsePrestador.cpfCnpj : undefined);

  const codigoServico =
    (typeof payloadServico?.codigo === 'string' ? payloadServico.codigo : undefined) ??
    (typeof responseServico?.codigo === 'string' ? responseServico.codigo : undefined);

  const numeroNfseRaw = responseRetorno?.numeroNfse ?? providerResponseRoot?.numeroNfse;
  const numeroNfse = asString(canonico?.numeroNfse)
    ?? (typeof numeroNfseRaw === 'string'
      ? numeroNfseRaw
      : (typeof numeroNfseRaw === 'number' ? String(numeroNfseRaw) : undefined));
  const dpsNum = asString(canonico?.dpsNumero)
    ?? asString(responseDps?.numero);
  const serieDpsNum = asString(canonico?.dpsSerie)
    ?? asString(responseDps?.serie);

  return {
    valor,
    descricao,
    tomadorRazaoSocial,
    tomadorCpfCnpj,
    prestadorRazaoSocial,
    prestadorCpfCnpj,
    codigoServico,
    numeroNfse,
    dpsNum,
    serieDpsNum,
  };
};
