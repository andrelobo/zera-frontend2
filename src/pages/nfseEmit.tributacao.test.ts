import { describe, expect, it } from 'vitest';
import type { Empresa } from '@/types/api';
import {
  determinarParametroIssEmissao,
  formatIssPercentForSimples,
  resolveEmpresaTributacao,
  resolveIssAutomation,
} from './nfseEmit.tributacao';

const baseEmpresa = (overrides: Partial<Empresa>): Empresa => ({
  id: overrides.id ?? 'empresa-1',
  cnpj: overrides.cnpj ?? '43521115000134',
  razaoSocial: overrides.razaoSocial ?? 'BURGUS LTDA',
  createdAt: overrides.createdAt ?? '2026-03-01T00:00:00.000Z',
  updatedAt: overrides.updatedAt ?? '2026-03-01T00:00:00.000Z',
  ...overrides,
});

describe('nfseEmit tributacao', () => {
  it('resolves empresa tributacao from simples snapshot first', () => {
    const empresa = baseEmpresa({
      opcaoPeloSimples: true,
      rbt12: '999999',
      simplesSnapshot: {
        anexo: 'III',
        rbt12: 244481.63,
      },
    });

    expect(resolveEmpresaTributacao(empresa)).toEqual({
      optanteSimples: true,
      simplesAnexo: 'III',
      rbt12: 244481.63,
    });
  });

  it('falls back to principal CNAE anexo and parses formatted rbt12 string', () => {
    const empresa = baseEmpresa({
      opcaoPeloSimples: true,
      rbt12: '244.481,63',
      cnaesLista: [
        { codigo: '6920601', descricao: 'Contabilidade', anexo: 'III', isPrincipal: true },
      ],
    });

    expect(resolveEmpresaTributacao(empresa)).toEqual({
      optanteSimples: true,
      simplesAnexo: 'III',
      rbt12: 244481.63,
    });
  });

  it('determines parametro ISS with same priorities as novastelas', () => {
    expect(determinarParametroIssEmissao(true, 'Manaus', 'AM', true, 'III')).toBe('iss_retencao_substituicao');
    expect(determinarParametroIssEmissao(false, 'Manaus', 'AM', true, 'III')).toBe('iss_proprio_municipio');
    expect(determinarParametroIssEmissao(false, 'Itacoatiara', 'AM', true, 'III')).toBe('iss_outro_municipio');
    expect(determinarParametroIssEmissao(false, 'Manaus', 'AM', false, 'III')).toBe('');
  });

  it('formats ISS percent from Simples calculation for substituto tributario', () => {
    expect(formatIssPercentForSimples(180000, 'III')).toBe('2,01');
    expect(formatIssPercentForSimples(244481.63, 'III')).toBe('2,36');
  });

  it('auto applies ISS retention and aliquota for simples anexo III when tomador is substituto', () => {
    expect(resolveIssAutomation({
      optanteSimples: true,
      simplesAnexo: 'III',
      rbt12: 180000,
      tomadorSubstituto: true,
      localMunicipio: 'Manaus',
      localUf: 'AM',
      aliquotaAtual: '',
    })).toEqual({
      parametroIssAplicado: 'iss_retencao_substituicao',
      issRetido: true,
      aliquota: '2,01',
    });
  });

  it('clears aliquota for simples anexo III without substituicao', () => {
    expect(resolveIssAutomation({
      optanteSimples: true,
      simplesAnexo: 'III',
      rbt12: 180000,
      tomadorSubstituto: false,
      localMunicipio: 'Manaus',
      localUf: 'AM',
      aliquotaAtual: '5,00',
    })).toEqual({
      parametroIssAplicado: 'iss_proprio_municipio',
      issRetido: false,
      aliquota: '',
    });
  });

  it('preserves current aliquota for non-simples substituto scenario', () => {
    expect(resolveIssAutomation({
      optanteSimples: false,
      simplesAnexo: '',
      rbt12: 0,
      tomadorSubstituto: true,
      localMunicipio: 'Manaus',
      localUf: 'AM',
      aliquotaAtual: '5,00',
    })).toEqual({
      parametroIssAplicado: '',
      issRetido: true,
      aliquota: '5,00',
    });
  });
});
