import type { Nfse } from '@/types/api';

export const getNfseValor = (nfse: Nfse): number => {
  if (typeof nfse.valorServico === 'number') return nfse.valorServico;
  if (typeof nfse.servico?.valor === 'number') return nfse.servico.valor;
  return 0;
};

export const getNfseDescricao = (nfse: Nfse): string => {
  return nfse.descricaoServico || nfse.servico?.descricao || '—';
};

export const getNfseTomadorNome = (nfse: Nfse): string => {
  return nfse.tomadorRazaoSocial || nfse.tomador?.razaoSocial || '—';
};

export const getNfseTomadorDocumento = (nfse: Nfse): string => {
  return nfse.tomadorCnpjCpf || (nfse as Nfse & { tomadorCpfCnpj?: string | null }).tomadorCpfCnpj || nfse.tomador?.cpfCnpj || '—';
};


export const getNfsePrestadorNome = (nfse: Nfse): string => {
  return nfse.prestador?.razaoSocial || nfse.empresa?.razaoSocial || '—';
};

export const getNfsePrestadorDocumento = (nfse: Nfse): string => {
  return nfse.prestador?.cnpj || nfse.empresaCnpj || nfse.empresa?.cnpj || '—';
};

export const getNfseCodigoServico = (nfse: Nfse): string => {
  return nfse.codigoServico || nfse.servico?.codigoNacional || '—';
};
