import api from '@/lib/api';
import axios from 'axios';

export interface MunicipioOption {
  id: number;
  nome: string;
  uf: string;
}

export const listMunicipiosByUf = async (ufRaw: string): Promise<MunicipioOption[]> => {
  const uf = String(ufRaw || '').trim().toUpperCase();
  if (uf.length !== 2) return [];
  try {
    const response = await api.get<MunicipioOption[]>('/empresas/lookup/municipios', {
      params: { uf },
      skipGlobalErrorToast: true,
    });
    return response.data || [];
  } catch (error) {
    // Some backend versions don't expose this endpoint yet.
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return [];
    }
    throw error;
  }
};
