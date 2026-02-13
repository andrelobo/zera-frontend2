import type { ProviderResponse } from '@/types/api';

interface NfseInferredData {
  valor?: number;
  descricao?: string;
  tomadorRazaoSocial?: string;
  tomadorCpfCnpj?: string;
  codigoServico?: string;
  numeroNfse?: string;
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

export const inferNfseDataFromProvider = (provider?: ProviderResponse | null): NfseInferredData => {
  if (!provider) return {};

  const providerRequest = asRecord(provider.providerRequest);
  const payload = firstFromArray(providerRequest?.payload);
  const payloadObj = asRecord(payload);

  const payloadTomador = asRecord(payloadObj?.tomador);
  const payloadServico = asRecord(firstFromArray(payloadObj?.servico));
  const payloadServicoValor = asRecord(payloadServico?.valor);

  const providerResponseRoot = asRecord(firstFromArray(provider.providerResponse));
  const responseTomador = asRecord(providerResponseRoot?.tomador);
  const responseServico = asRecord(firstFromArray(providerResponseRoot?.servico));
  const responseServicoValor = asRecord(responseServico?.valor);
  const responseRetorno = asRecord(providerResponseRoot?.retorno);

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

  const codigoServico =
    (typeof payloadServico?.codigo === 'string' ? payloadServico.codigo : undefined) ??
    (typeof responseServico?.codigo === 'string' ? responseServico.codigo : undefined);

  const numeroNfseRaw = responseRetorno?.numeroNfse ?? providerResponseRoot?.numeroNfse;
  const numeroNfse =
    typeof numeroNfseRaw === 'string'
      ? numeroNfseRaw
      : (typeof numeroNfseRaw === 'number' ? String(numeroNfseRaw) : undefined);

  return {
    valor,
    descricao,
    tomadorRazaoSocial,
    tomadorCpfCnpj,
    codigoServico,
    numeroNfse,
  };
};
