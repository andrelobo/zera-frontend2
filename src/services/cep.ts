import api from '@/lib/api';
import axios from 'axios';

export interface CepAddress {
  cep: string;
  logradouro: string;
  numero?: string;
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
    const response = await api.get<CepAddress>(`/empresas/lookup/cep/${cep}`, {
      skipGlobalErrorToast: true,
    });
    const raw = (response.data ?? {}) as Record<string, unknown>;
    const pick = (...keys: string[]) => {
      for (const key of keys) {
        const value = raw[key];
        if (typeof value === 'string' && value.trim().length > 0) return value;
      }
      return '';
    };

    return {
      cep: normalizeCep(pick('cep') || cep),
      logradouro: pick('logradouro', 'street'),
      numero: pick('numero', 'number', 'addressNumber'),
      bairro: pick('bairro', 'district', 'neighborhood'),
      cidade: pick('cidade', 'localidade', 'city'),
      uf: pick('uf', 'estado', 'state').toUpperCase(),
      complemento: pick('complemento', 'complement'),
    };
  } catch (error: unknown) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return {
        cep,
        logradouro: '',
        bairro: '',
        cidade: '',
        uf: '',
        complemento: '',
      };
    }
    const err = error as { response?: { data?: { message?: string } }; message?: string };
    const message =
      err.response?.data?.message ||
      err.message ||
      'Falha ao consultar CEP.';
    throw new Error(String(message));
  }
};
