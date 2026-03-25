import { describe, expect, it } from 'vitest';
import { resolveEditorSeed, type CnaeAdicionado } from './CTNSection';

const buildCnae = (
  codigo: string,
  descricao: string,
  overrides?: Partial<CnaeAdicionado>,
): CnaeAdicionado => ({
  codigo,
  cnaeDescricao: descricao,
  lc116Descricao: descricao,
  lc116Item: '17.19',
  vinculos: [
    {
      id: `${codigo}-1`,
      ctn: '171901',
      ctnDescricao: 'Contabilidade',
      nbs: '1.2301.22.00',
      nbsDescricao: 'Servico contábil',
    },
  ],
  ...overrides,
});

describe('CTNSection logic', () => {
  it('rehydrates the top editor from the principal CNAE while the user has not edited it', () => {
    const seed = resolveEditorSeed(
      [
        buildCnae('6201500', 'Desenvolvimento', { isPrincipal: false }),
        buildCnae('6920601', 'Atividades de contabilidade', { isPrincipal: true }),
      ],
      false,
    );

    expect(seed).not.toBeNull();
    expect(seed?.manualCnae).toBe('6920-6/01');
    expect(seed?.manualCtn).toBe('171901');
    expect(seed?.manualNbs).toBe('1.2301.22.00');
  });

  it('does not overwrite the top editor after the user starts editing manually', () => {
    const seed = resolveEditorSeed([buildCnae('6920601', 'Atividades de contabilidade')], true);
    expect(seed).toBeNull();
  });
});
