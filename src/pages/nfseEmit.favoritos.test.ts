import { describe, expect, it } from 'vitest';
import { combineFavoritosEmissao, mapFavoritosTomador } from './NfseEmitPage';

describe('NfseEmitPage favoritos', () => {
  it('does not prefix tomador labels in emitted favorites', () => {
    const favoritos = mapFavoritosTomador([
      {
        codigoServico: '171901',
        descricaoServico: 'Serviços de contabilidade',
      },
    ]);

    expect(favoritos).toHaveLength(1);
    expect(favoritos[0].cnaeDescricao).toBe('Serviços de contabilidade');
  });

  it('prioritizes prestador favorites before tomador-derived favorites', () => {
    const favoritosPrestador = [
      {
        codigo: '6920601',
        cnaeDescricao: 'Atividades de contabilidade',
        lc116Item: '17.19',
        vinculos: [{ ctn: '171901', ctnDescricao: 'Contabilidade.' }],
      },
    ];

    const favoritosTomador = mapFavoritosTomador([
      {
        codigoServico: '171901',
        descricaoServico: 'Serviços de contabilidade',
      },
    ]);

    const combinados = combineFavoritosEmissao(favoritosPrestador, favoritosTomador);

    expect(combinados).toHaveLength(2);
    expect(combinados[0].cnaeDescricao).toBe('Atividades de contabilidade');
    expect(combinados[1].cnaeDescricao).toBe('Serviços de contabilidade');
  });
});
