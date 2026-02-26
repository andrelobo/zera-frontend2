import api from '@/lib/api';

export interface MunicipioOption {
  id: number;
  nome: string;
  uf: string;
}

export const listMunicipiosByUf = async (ufRaw: string): Promise<MunicipioOption[]> => {
  const uf = String(ufRaw || '').trim().toUpperCase();
  if (uf.length !== 2) return [];
  const response = await api.get<MunicipioOption[]>('/empresas/lookup/municipios', {
    params: { uf },
  });
  return response.data || [];
};
