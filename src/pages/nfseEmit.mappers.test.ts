import { describe, expect, it } from 'vitest';
import type { Empresa } from '@/types/api';
import { hasFavoriteConfig, mapFavoritosFromParametroMunicipal, mapListaServicoFromConfig, pickEmpresaForEmissao } from './nfseEmit.mappers';

const baseEmpresa = (overrides: Partial<Empresa>): Empresa => ({
  id: overrides.id ?? 'empresa-1',
  cnpj: overrides.cnpj ?? '43521115000134',
  razaoSocial: overrides.razaoSocial ?? 'BURGUS LTDA',
  createdAt: overrides.createdAt ?? '2026-03-01T00:00:00.000Z',
  updatedAt: overrides.updatedAt ?? '2026-03-01T00:00:00.000Z',
  ...overrides,
});

describe('nfseEmit mappers', () => {
  it('maps favoritos from formato atual de parametroMunicipal', () => {
    const empresa = baseEmpresa({
      parametroMunicipal: [
        {
          codigo: '8650-0/03',
          cnaeDescricao: 'Atividades de psicologia e psicanálise',
          lc116Item: '04.16',
          vinculos: [
            { ctn: '041601', ctnDescricao: 'Psicologia', nbs: '1.2301.98.00', nbsDescricao: 'Serviços de psicologia' },
          ],
        },
      ],
    });

    const favoritos = mapFavoritosFromParametroMunicipal(empresa);
    expect(favoritos).toHaveLength(1);
    expect(favoritos[0].codigo).toBe('8650003');
    expect(favoritos[0].vinculos[0].ctn).toBe('041601');
  });

  it('maps favoritos from chaves legadas e fallback sem vinculos', () => {
    const empresa = baseEmpresa({
      parametroMunicipal: [
        {
          codigoCnae: '6201500',
          descricao: 'Desenvolvimento de software',
          itemLc116: '1.01',
          ctnCodigo: '10100',
          descricaoCtn: 'Análise e desenvolvimento',
          nbsCodigo: '1.0101.00.00',
          descricaoNbs: 'Serviço de software',
        },
      ],
    });

    const favoritos = mapFavoritosFromParametroMunicipal(empresa);
    expect(favoritos).toHaveLength(1);
    expect(favoritos[0].codigo).toBe('6201500');
    expect(favoritos[0].vinculos).toHaveLength(1);
    expect(favoritos[0].vinculos[0]).toMatchObject({
      ctn: '10100',
      nbs: '1.0101.00.00',
    });
  });

  it('creates fallback favoritos from cadastro when parametroMunicipal is empty', () => {
    const empresa = baseEmpresa({
      cnaeFiscal: '8630503',
      cnaeFiscalDescricao: 'Atividade médica ambulatorial restrita a consultas',
      ctnCodigo: '041501',
      nbsCodigo: '1.2301.13.00',
      parametroMunicipal: [],
    });

    const favoritos = mapFavoritosFromParametroMunicipal(empresa);
    expect(favoritos).toHaveLength(1);
    expect(favoritos[0].vinculos[0]).toMatchObject({
      ctn: '041501',
      nbs: '1.2301.13.00',
    });
    expect(favoritos[0].vinculos[0].ctnDescricao).toBeTruthy();
    expect(favoritos[0].vinculos[0].nbsDescricao).toBeTruthy();
  });

  it('maps lista servico from formatos atual e legado', () => {
    const empresa = baseEmpresa({
      configOperacionais: [
        { id: 'a1', natureza: 'Contabilidade', descricao: 'Serviço contábil', codigoServico: '171901', aliquota: '5,00' },
        { id: 'b2', codigo: 'Psicologia', nomeServico: 'Atendimento psicológico' } as unknown as { id: string; natureza: string; descricao: string },
      ],
    });

    const lista = mapListaServicoFromConfig(empresa);
    expect(lista).toHaveLength(2);
    expect(lista[0]).toMatchObject({ id: 'a1', natureza: 'Contabilidade', descricao: 'Serviço contábil', codigoServico: '171901', aliquota: '5,00' });
    expect(lista[1]).toMatchObject({ id: 'b2', natureza: 'Psicologia', descricao: 'Atendimento psicológico' });
  });

  it('detects when empresa has favorites/config data', () => {
    expect(hasFavoriteConfig(baseEmpresa({}))).toBe(false);
    expect(hasFavoriteConfig(baseEmpresa({ parametroMunicipal: [{ codigo: '6201500' as unknown as never }] }))).toBe(true);
    expect(hasFavoriteConfig(baseEmpresa({ configOperacionais: [{ id: 'x', natureza: 'Contabilidade', descricao: 'Serviço' }] }))).toBe(true);
  });

  it('picks empresa com maior completude para emissao', () => {
    const empresaSemDados = baseEmpresa({
      id: 'empresa-sem',
      updatedAt: '2026-03-06T09:00:00.000Z',
    });
    const empresaComConfig = baseEmpresa({
      id: 'empresa-config',
      updatedAt: '2026-03-05T09:00:00.000Z',
      configOperacionais: [{ id: 'c1', natureza: 'Contabilidade', descricao: 'Serviço' }],
    });
    const empresaCompleta = baseEmpresa({
      id: 'empresa-completa',
      updatedAt: '2026-03-04T09:00:00.000Z',
      prontoParaEmitir: true,
      parametroMunicipal: [{ codigo: '6201500' as unknown as never }],
      configOperacionais: [{ id: 'c2', natureza: 'Fiscal', descricao: 'Serviço fiscal' }],
    });

    const picked = pickEmpresaForEmissao([empresaSemDados, empresaComConfig, empresaCompleta]);
    expect(picked?.id).toBe('empresa-completa');
  });
});
