import { describe, expect, it } from 'vitest';
import {
  mergeTomadorFromCepResult,
  mergeTomadorFromCnpjResult,
  type TomadorSectionData,
} from './TomadorSection';

const baseTomador = (): TomadorSectionData => ({
  nomeEmpresarial: '',
  nomeFantasia: '',
  cnpjCpf: '35.577.545/0001-40',
  inscricaoMunicipal: '',
  inscricaoEstadual: '',
  suframa: '',
  substitutoTributario: false,
  cep: '',
  logradouro: '',
  numero: '',
  complemento: '',
  bairro: '',
  localidadeUf: '',
  email: '',
  whatsapp: '',
});

describe('TomadorSection logic', () => {
  it('merges autocomplete CNPJ payload preserving formatting rules', () => {
    const merged = mergeTomadorFromCnpjResult(baseTomador(), {
      razao_social: 'BURGUS LTDA',
      nome_fantasia: 'ECONTABILIS LTDA',
      inscricao_estadual: 'ISENTO',
      suframa: 'NP',
      cep: '69010040',
      logradouro: 'R SALDANHA MARINHO',
      numero: '606',
      complemento: 'SALA 255',
      bairro: 'CENTRO',
      municipio: 'MANAUS',
      uf: 'AM',
      email: 'contato@econtabilis.com',
      telefone: '92991594210',
    });

    expect(merged).toMatchObject({
      nomeEmpresarial: 'BURGUS LTDA',
      nomeFantasia: 'ECONTABILIS LTDA',
      inscricaoEstadual: 'ISENTO',
      suframa: 'NP',
      cep: '69010-040',
      logradouro: 'R SALDANHA MARINHO',
      numero: '606',
      complemento: 'SALA 255',
      bairro: 'CENTRO',
      localidadeUf: 'MANAUS - AM',
      email: 'contato@econtabilis.com',
    });
    expect(merged.whatsapp).toContain('(92)');
  });

  it('merges CEP lookup without wiping existing complementary fields', () => {
    const merged = mergeTomadorFromCepResult(
      {
        ...baseTomador(),
        numero: '12',
        complemento: 'SALA 1',
        email: 'x@y.com',
      },
      {
        logradouro: 'AV GETULIO VARGAS',
        bairro: 'CENTRO',
        municipio: 'MANAUS',
        uf: 'AM',
      },
    );

    expect(merged).toMatchObject({
      logradouro: 'AV GETULIO VARGAS',
      bairro: 'CENTRO',
      localidadeUf: 'MANAUS - AM',
      numero: '12',
      complemento: 'SALA 1',
      email: 'x@y.com',
    });
  });
});
