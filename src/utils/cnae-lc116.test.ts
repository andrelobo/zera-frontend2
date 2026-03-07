import { describe, expect, it } from 'vitest';
import { getDefaultVinculosForCnae, getLC116Item } from './cnae-lc116';

describe('cnae-lc116 healthcare mappings', () => {
  it('maps psicologia e psicanalise with both default links', () => {
    const lc = getLC116Item('8650-0/03');
    const vinculos = getDefaultVinculosForCnae('8650-0/03');

    expect(lc?.item).toBe('4.16');
    expect(lc?.descricao).toBe('Psicologia.');

    expect(vinculos).toHaveLength(2);
    expect(vinculos[0]).toMatchObject({
      ctn: '041601',
      ctnDescricao: 'Psicologia.',
      nbs: '1.2301.98.00',
      nbsDescricao: 'Serviços de psicologia',
    });
    expect(vinculos[1]).toMatchObject({
      ctn: '041501',
      ctnDescricao: 'Psicanálise.',
      nbs: '1.2301.13.00',
      nbsDescricao: 'Serviços psiquiátricos',
    });
  });
});
