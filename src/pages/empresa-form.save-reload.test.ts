import { describe, expect, it } from 'vitest';
import type { Empresa } from '@/types/api';
import {
  buildEmpresaSuccessRedirect,
  buildCanonicalParametroMunicipal,
  buildEmpresaUpdatePayload,
  mapEmpresaParametroMunicipal,
  shouldResetConfigOperacionaisOnCnaeChange,
} from './EmpresaFormPage';

describe('EmpresaFormPage save/reload', () => {
  it('builds canonical parametroMunicipal on save and reads it back consistently', () => {
    const form = {
      razaoSocial: 'BURGUS LTDA',
      cnpj: '43.521.115/0001-34',
      nomeFantasia: 'ECONTABILIS LTDA',
      inscricaoMunicipal: '51754301',
      inscricaoEstadual: 'ISENTO',
      suframa: 'NP',
      situacaoCadastral: 'ATIVA',
      dataSituacaoCadastral: '2021-09-15',
      dataInicioAtividade: '2021-09-15',
      cnaeFiscal: '8650003',
      cnaeFiscalDescricao: 'ATIVIDADES DE PSICOLOGIA E PSICANÁLISE',
      ctnCodigo: '',
      nbsCodigo: '',
      porte: 'EMPRESA DE PEQUENO PORTE',
      naturezaJuridica: 'SOCIEDADE EMPRESÁRIA LIMITADA',
      capitalSocial: '120000',
      opcaoPeloSimples: 'true' as const,
      opcaoPeloMei: 'false' as const,
      dataOpcaoPeloSimples: '2021-09-15',
      dataExclusaoDoSimples: '',
      regimeTributario: 'simples_nacional' as const,
      aliquotaSimplesNacional: '6,00',
      apuracaoSimplesNacional: 'MENSAL',
      rbt12: '180000',
      endereco: 'RUA SALDANHA MARINHO',
      numero: '606',
      complemento: 'SALA 255',
      bairro: 'CENTRO',
      cidade: 'MANAUS',
      uf: 'AM',
      cep: '69010-040',
      telefone: '(92) 99159-4210',
      whatsapp: '(92) 99159-4210',
      email: 'contato@econtabilis.com',
    };

    const canonical = buildCanonicalParametroMunicipal([], form);
    expect(canonical).toHaveLength(1);
    expect(canonical[0].codigo).toBe('8650003');
    expect(canonical[0].vinculos).toHaveLength(2);
    expect(canonical[0].vinculos[0].ctn).toBe('041601');
    expect(canonical[0].vinculos[1].ctn).toBe('041501');

    const payload = buildEmpresaUpdatePayload(
      form,
      [{ codigo: '8650003', descricao: 'Atividades de psicologia e psicanálise', isPrincipal: true, isManual: true, anexo: 'III', anexoLoading: false }],
      [],
      [],
    );

    expect(payload.ctnCodigo).toBe('041601');
    expect(payload.nbsCodigo).toBe('1.2301.98.00');
    expect(Array.isArray(payload.parametroMunicipal)).toBe(true);

    const persistedEmpresa = {
      id: 'empresa-1',
      cnpj: '43521115000134',
      razaoSocial: 'BURGUS LTDA',
      createdAt: '2026-03-01T00:00:00.000Z',
      updatedAt: '2026-03-01T00:00:00.000Z',
      parametroMunicipal: payload.parametroMunicipal,
    } as Empresa;

    const reloaded = mapEmpresaParametroMunicipal(persistedEmpresa);
    expect(reloaded).toHaveLength(1);
    expect(reloaded[0].codigo).toBe('8650003');
    expect(reloaded[0].vinculos[0].ctn).toBe('041601');
    expect(reloaded[0].vinculos[0].nbs).toBe('1.2301.98.00');
  });

  it('clears lista servico when principal CNAE changes', () => {
    expect(shouldResetConfigOperacionaisOnCnaeChange('8650003', '8122200', true)).toBe(true);
    expect(shouldResetConfigOperacionaisOnCnaeChange('8650003', '8650003', true)).toBe(false);
    expect(shouldResetConfigOperacionaisOnCnaeChange('8650003', '8122200', false)).toBe(false);
  });

  it('keeps user on same empresa and current tab after successful update', () => {
    expect(buildEmpresaSuccessRedirect('empresa-1', 'cadastro', 'COMPLETO')).toBe('/empresas/empresa-1?secao=cadastro');
    expect(buildEmpresaSuccessRedirect('empresa-1', 'regime', 'COMPLETO')).toBe('/empresas/empresa-1?secao=regime');
    expect(buildEmpresaSuccessRedirect('empresa-1', 'parametros', 'COMPLETO')).toBe('/empresas/empresa-1?secao=parametros');
  });

  it('redirects pendente cadastro to same empresa on regime tab', () => {
    expect(buildEmpresaSuccessRedirect('empresa-1', 'parametros', 'PENDENTE')).toBe('/empresas/empresa-1?secao=regime');
  });
});
