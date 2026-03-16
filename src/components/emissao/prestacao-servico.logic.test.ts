import { describe, expect, it } from 'vitest';
import {
  resolveFavoritoSelecionado,
  resolvePrestacaoFromFavorito,
  resolvePrestacaoFromListaServico,
  type ListaServicoItem,
  type PrestacaoServicoData,
} from './PrestacaoServicoSection';

const INITIAL_DATA: PrestacaoServicoData = {
  codigoServico: '',
  descricaoServico: '',
  localPrestacao: '',
  valorServico: '',
  aliquota: '',
  baseCalculo: '',
  issRetido: false,
  desconto: '',
  retPis: '',
  retCofins: '',
  retCsll: '',
  retIr: '',
  retInss: '',
};

describe('PrestacaoServicoSection logic', () => {
  it('picks first favorite when no codigoServico is set', () => {
    const favoritos = [
      {
        codigo: '6920601',
        cnaeDescricao: 'Atividades de contabilidade',
        lc116Item: '17.19',
        vinculos: [{ ctn: '171901', ctnDescricao: 'Contabilidade, inclusive serviços técnicos e auxiliares.' }],
      },
    ];

    const favorito = resolveFavoritoSelecionado(favoritos, '');
    expect(favorito?.codigo).toBe('6920601');
  });

  it('autofills codigoServico and descricaoServico from selected favorite', () => {
    const favoritoSelecionado = {
      codigo: '6920601',
      cnaeDescricao: 'Atividades de contabilidade',
      lc116Item: '17.19',
      vinculos: [{ ctn: '171901', ctnDescricao: 'Contabilidade, inclusive serviços técnicos e auxiliares.' }],
    };

    const resolved = resolvePrestacaoFromFavorito(INITIAL_DATA, favoritoSelecionado);
    expect(resolved?.nextData.codigoServico).toBe('171901');
    expect(resolved?.nextData.descricaoServico.toLowerCase()).toContain('contabilidade');
  });

  it('fills code, description and aliquota from lista servico', () => {
    const item: ListaServicoItem = {
      id: 'svc-1',
      natureza: 'Contabilidade',
      descricao: 'Serviço contábil mensal',
      codigoServico: '171901',
      aliquota: '5,00',
    };

    const next = resolvePrestacaoFromListaServico(INITIAL_DATA, item, false, false);
    expect(next.codigoServico).toBe('171901');
    expect(next.descricaoServico).toBe('Serviço contábil mensal');
    expect(next.aliquota).toBe('5,00');
  });

  it('does not override aliquota from lista servico for optante simples', () => {
    const item: ListaServicoItem = {
      id: 'svc-1',
      natureza: 'Contabilidade',
      descricao: 'Serviço contábil mensal',
      codigoServico: '171901',
      aliquota: '5,00',
    };

    const next = resolvePrestacaoFromListaServico(
      { ...INITIAL_DATA, aliquota: '6,00' },
      item,
      true,
      false,
    );
    expect(next.aliquota).toBe('6,00');
  });
});
