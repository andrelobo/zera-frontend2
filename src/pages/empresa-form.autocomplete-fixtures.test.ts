import { describe, expect, it } from 'vitest';
import type { Empresa } from '@/types/api';
import type { EmpresaFormData } from './EmpresaFormPage';
import { applyEmpresaAutocompleteMerge } from './EmpresaFormPage';

const emptyForm = (): EmpresaFormData => ({
  razaoSocial: '',
  cnpj: '',
  nomeFantasia: '',
  inscricaoMunicipal: 'PRESERVAR-IM',
  inscricaoEstadual: '',
  suframa: '',
  situacaoCadastral: '',
  dataSituacaoCadastral: '',
  dataInicioAtividade: '',
  cnaeFiscal: '',
  cnaeFiscalDescricao: '',
  ctnCodigo: '',
  nbsCodigo: '',
  porte: '',
  naturezaJuridica: '',
  capitalSocial: '',
  opcaoPeloSimples: '',
  opcaoPeloMei: '',
  dataOpcaoPeloSimples: '',
  dataExclusaoDoSimples: '',
  regimeTributario: '',
  aliquotaSimplesNacional: '',
  apuracaoSimplesNacional: '',
  rbt12: '',
  endereco: '',
  numero: '',
  complemento: '',
  bairro: '',
  cidade: '',
  uf: '',
  cep: '',
  telefone: '',
  whatsapp: '',
  email: '',
  plugNotasAtivoNfseNacional: false,
  plugNotasConsultaAutomaticaDfe: false,
  plugNotasConsultarDfePrestador: false,
  plugNotasConsultarDfeTomador: false,
  plugNotasConsultarDfeIntermediario: false,
  plugNotasEmailAutomatico: false,
});

type Fixture = {
  cnpj: string;
  razaoSocial: string;
  fantasia?: string;
  cidade: string;
  uf: string;
  email: string;
};

const fixtures: Fixture[] = [
  { cnpj: '33.592.510/0001-54', razaoSocial: 'VALE S.A.', fantasia: 'VALE', cidade: 'RIO DE JANEIRO', uf: 'RJ', email: 'contato@vale.com' },
  { cnpj: '07.526.557/0001-00', razaoSocial: 'AMBEV S.A.', fantasia: 'AMBEV', cidade: 'SAO PAULO', uf: 'SP', email: 'ri@ambev.com.br' },
  { cnpj: '00.000.000/0001-91', razaoSocial: 'BANCO DO BRASIL S.A.', fantasia: 'BANCO DO BRASIL', cidade: 'BRASILIA', uf: 'DF', email: 'ri@bb.com.br' },
  { cnpj: '33.000.167/0001-01', razaoSocial: 'PETROLEO BRASILEIRO S.A. PETROBRAS', fantasia: 'PETROBRAS', cidade: 'RIO DE JANEIRO', uf: 'RJ', email: 'petrobras@petrobras.com.br' },
  { cnpj: '47.960.950/0001-21', razaoSocial: 'MAGAZINE LUIZA S.A.', fantasia: 'MAGAZINE LUIZA', cidade: 'FRANCA', uf: 'SP', email: 'ri@magazineluiza.com.br' },
  { cnpj: '60.701.190/0001-04', razaoSocial: 'ITAU UNIBANCO HOLDING S.A.', fantasia: 'ITAU UNIBANCO', cidade: 'SAO PAULO', uf: 'SP', email: 'ri@itau-unibanco.com.br' },
  { cnpj: '02.558.157/0001-62', razaoSocial: 'TELEFONICA BRASIL S.A.', fantasia: 'VIVO', cidade: 'SAO PAULO', uf: 'SP', email: 'ri.br@telefonica.com' },
  { cnpj: '61.532.644/0001-15', razaoSocial: 'NATURA COSMETICOS S.A.', fantasia: 'NATURA', cidade: 'SAO PAULO', uf: 'SP', email: 'ri@natura.net' },
  { cnpj: '84.429.695/0001-11', razaoSocial: 'WEG S.A.', fantasia: 'WEG', cidade: 'JARAGUA DO SUL', uf: 'SC', email: 'ri@weg.net' },
  { cnpj: '09.346.601/0001-25', razaoSocial: 'B3 S.A. - BRASIL, BOLSA, BALCAO', fantasia: 'B3', cidade: 'SAO PAULO', uf: 'SP', email: 'ri@b3.com.br' },
];

const empresaFromFixture = (fixture: Fixture): Empresa => ({
  id: fixture.cnpj.replace(/\D/g, ''),
  cnpj: fixture.cnpj,
  razaoSocial: fixture.razaoSocial,
  nomeFantasia: fixture.fantasia,
  email: fixture.email,
  endereco: {
    logradouro: 'AV TESTE',
    numero: '100',
    bairro: 'CENTRO',
    cidade: fixture.cidade,
    uf: fixture.uf,
    cep: '01001-000',
  },
  createdAt: '2026-03-17T00:00:00.000Z',
  updatedAt: '2026-03-17T00:00:00.000Z',
} as Empresa);

describe('EmpresaFormPage autocomplete fixtures', () => {
  it.each(fixtures)('hydrates form from fixture $cnpj', (fixture) => {
    const result = applyEmpresaAutocompleteMerge(emptyForm(), [empresaFromFixture(fixture)]);

    expect(result.cnpj).toBe(fixture.cnpj);
    expect(result.razaoSocial).toBe(fixture.razaoSocial);
    expect(result.nomeFantasia).toBe(fixture.fantasia);
    expect(result.endereco).toBe('AV TESTE');
    expect(result.cidade).toBe(fixture.cidade);
    expect(result.uf).toBe(fixture.uf);
    expect(result.email).toBe(fixture.email);
    expect(result.inscricaoMunicipal).toBe('PRESERVAR-IM');
  });

  it('ignores found false responses and keeps valid preview data', () => {
    const result = applyEmpresaAutocompleteMerge(emptyForm(), [
      { found: false } as unknown as Empresa,
      empresaFromFixture(fixtures[0]),
    ]);

    expect(result.cnpj).toBe(fixtures[0].cnpj);
    expect(result.razaoSocial).toBe(fixtures[0].razaoSocial);
  });

  it('prefers simples snapshot effective rate over legacy aliquota when available', () => {
    const result = applyEmpresaAutocompleteMerge(emptyForm(), [
      {
        ...empresaFromFixture(fixtures[0]),
        regimeTributario: 'simples_nacional',
        aliquotaSimplesNacional: '6,00',
        rbt12: '240000',
        simplesSnapshot: {
          anexo: 'III',
          rbt12: 240000,
          aliquotaEfetiva: 0.073715,
          issReferencia: 0.023589,
          valido: true,
        },
      } as Empresa,
    ]);

    expect(result.rbt12).toBe('240000');
    expect(result.aliquotaSimplesNacional).toBe('7,37');
  });
});
