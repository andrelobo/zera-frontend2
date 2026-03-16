import { describe, expect, it } from 'vitest';
import { resolveEditorSeed, type CnaeAdicionado } from './CTNSection';

describe('CTNSection logic', () => {
  it('hydrates top editor fields from principal saved CNAE', () => {
    const cnaes: CnaeAdicionado[] = [
      {
        codigo: '6920601',
        cnaeDescricao: 'Atividades de contabilidade',
        lc116Descricao: 'Contabilidade, inclusive serviços técnicos e auxiliares.',
        lc116Item: '17.19',
        isPrincipal: true,
        vinculos: [
          {
            id: 'v1',
            ctn: '171901',
            ctnDescricao: 'Contabilidade, inclusive serviços técnicos e auxiliares.',
            nbs: '1.1302.21.00',
            nbsDescricao: 'Serviços de contabilidade.',
          },
        ],
      },
    ];

    const seed = resolveEditorSeed(cnaes, {
      manualCnae: '',
      manualCtn: '',
      manualNbs: '',
    });

    expect(seed).toMatchObject({
      manualCnae: '6920-6/01',
      manualCtn: '171901',
      manualNbs: '1.1302.21.00',
      manualCnaeDescricaoIBGE: 'Atividades de contabilidade',
      detectedItem: '17',
      detectedNbsPrefix: '1.13',
    });
  });

  it('does not override a valid manual selection still present in the list', () => {
    const cnaes: CnaeAdicionado[] = [
      {
        codigo: '6920601',
        cnaeDescricao: 'Atividades de contabilidade',
        lc116Descricao: 'Contabilidade, inclusive serviços técnicos e auxiliares.',
        lc116Item: '17.19',
        isPrincipal: true,
        vinculos: [{ id: 'v1', ctn: '171901', nbs: '1.1302.21.00' }],
      },
    ];

    const seed = resolveEditorSeed(cnaes, {
      manualCnae: '6920-6/01',
      manualCtn: '171901',
      manualNbs: '1.1302.21.00',
    });

    expect(seed).toBeNull();
  });
});
