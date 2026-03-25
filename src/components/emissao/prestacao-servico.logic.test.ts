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
  it('does not force a favorite when codigoServico is empty', () => {
    const favoritos = [
      {
        codigo: '6920601',
        cnaeDescricao: 'Atividades de contabilidade',
        lc116Item: '17.19',
        vinculos: [{ ctn: '171901', ctnDescricao: 'Contabilidade, inclusive serviços técnicos e auxiliares.' }],
      },
    ];

    const favorito = resolveFavoritoSelecionado(favoritos, '');
    expect(favorito).toBeNull();
  });

  it('resolves the matching favorite when codigoServico already exists', () => {
    const favoritos = [
      {
        codigo: '6920601',
        cnaeDescricao: 'Atividades de contabilidade',
        lc116Item: '17.19',
        vinculos: [{ ctn: '171901', ctnDescricao: 'Contabilidade, inclusive serviços técnicos e auxiliares.' }],
      },
    ];

    const favorito = resolveFavoritoSelecionado(favoritos, '171901');
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
    expect(resolved?.nextData.descricaoServico).toBe('');
  });

  it('appends description from lista servico without changing CTN or aliquota', () => {
    const item: ListaServicoItem = {
      id: 'svc-1',
      natureza: 'Contabilidade',
      descricao: 'Serviço contábil mensal',
      codigoServico: '171901',
      aliquota: '5,00',
    };

    const next = resolvePrestacaoFromListaServico(INITIAL_DATA, item);
    expect(next.codigoServico).toBe('');
    expect(next.descricaoServico).toBe('Serviço contábil mensal');
    expect(next.aliquota).toBe('');
  });

  it('appends descricao mantendo texto anterior', () => {
    const item: ListaServicoItem = {
      id: 'svc-1',
      natureza: 'Contabilidade',
      descricao: 'Serviço contábil mensal',
      codigoServico: '171901',
      aliquota: '5,00',
    };

    const next = resolvePrestacaoFromListaServico(
      { ...INITIAL_DATA, descricaoServico: 'Linha inicial' },
      item,
    );
    expect(next.descricaoServico).toBe('Linha inicial\nServiço contábil mensal');
  });
});
