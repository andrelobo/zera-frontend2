import api from '@/lib/api';

export interface CepAddress {
  cep: string;
  logradouro: string;
  bairro: string;
  cidade: string;
  uf: string;
  complemento?: string;
}

export const normalizeCep = (value: string) => value.replace(/\D/g, '').slice(0, 8);

export const formatCep = (value: string) => {
  const cep = normalizeCep(value);
  if (cep.length <= 5) return cep;
  return `${cep.slice(0, 5)}-${cep.slice(5)}`;
};

export const lookupCep = async (rawCep: string): Promise<CepAddress> => {
  const cep = normalizeCep(rawCep);
  if (cep.length !== 8) {
    throw new Error('CEP inválido. Informe 8 dígitos.');
  }

  try {
    const response = await api.get<CepAddress>(`/empresas/lookup/cep/${cep}`);
    const data = response.data;

    return {
      cep: normalizeCep(data?.cep || cep),
      logradouro: data?.logradouro || '',
      bairro: data?.bairro || '',
      cidade: data?.cidade || '',
      uf: String(data?.uf || '').toUpperCase(),
      complemento: data?.complemento || '',
    };
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } }; message?: string };
    const message =
      err.response?.data?.message ||
      err.message ||
      'Falha ao consultar CEP.';
    throw new Error(String(message));
  }
};
