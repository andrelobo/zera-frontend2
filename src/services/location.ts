import api from '@/lib/api';
import axios from 'axios';

export interface MunicipioOption {
  id: number;
  nome: string;
  uf: string;
}

interface IbgeMunicipioOption {
  id: number;
  nome: string;
}

const fetchMunicipiosFromIbge = async (uf: string): Promise<MunicipioOption[]> => {
  const response = await fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${uf}/municipios?orderBy=nome`);
  if (!response.ok) {
    throw new Error('Falha ao consultar municipios.');
  }
  const rows = (await response.json()) as IbgeMunicipioOption[];
  return rows.map((item) => ({
    id: item.id,
    nome: item.nome,
    uf,
  }));
};

export const listMunicipiosByUf = async (ufRaw: string): Promise<MunicipioOption[]> => {
  const uf = String(ufRaw || '').trim().toUpperCase();
  if (uf.length !== 2) return [];
  try {
    const response = await api.get<MunicipioOption[]>('/empresas/lookup/municipios', {
      params: { uf },
      skipGlobalErrorToast: true,
    });
    const rows = response.data || [];
    if (rows.length > 0) return rows;
    return await fetchMunicipiosFromIbge(uf);
  } catch (error) {
    try {
      return await fetchMunicipiosFromIbge(uf);
    } catch (fallbackError) {
      if (axios.isAxiosError(error) && error.response?.status && error.response.status !== 404) {
        throw error;
      }
      throw fallbackError;
    }
  }
};
