export interface CepAddress {
  cep: string;
  logradouro: string;
  bairro: string;
  cidade: string;
  uf: string;
  complemento?: string;
}

interface ViaCepResponse {
  cep?: string;
  logradouro?: string;
  complemento?: string;
  bairro?: string;
  localidade?: string;
  uf?: string;
  erro?: boolean;
}

const VIACEP_BASE_URL = 'https://viacep.com.br/ws';

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

  const response = await fetch(`${VIACEP_BASE_URL}/${cep}/json/`, {
    headers: { Accept: 'application/json' },
  });

  if (!response.ok) {
    throw new Error('Falha ao consultar CEP.');
  }

  const data = (await response.json()) as ViaCepResponse;
  if (data.erro) {
    throw new Error('CEP não encontrado.');
  }

  return {
    cep: normalizeCep(data.cep || cep),
    logradouro: data.logradouro || '',
    bairro: data.bairro || '',
    cidade: data.localidade || '',
    uf: (data.uf || '').toUpperCase(),
    complemento: data.complemento || '',
  };
};
