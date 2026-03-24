import { describe, expect, it } from 'vitest';
import { FAIXAS_ANEXO_III, formatPercent } from './simples-nacional';

describe('simples-nacional faixa table', () => {
  it('provides percentual ISS for every faixa of Anexo III', () => {
    expect(FAIXAS_ANEXO_III).toHaveLength(6);

    for (const faixa of FAIXAS_ANEXO_III) {
      expect(Number.isFinite(faixa.percentualIss)).toBe(true);
      expect(formatPercent(faixa.percentualIss)).not.toBe('NaN%');
    }

    expect(formatPercent(FAIXAS_ANEXO_III[0].percentualIss)).toBe('2,01%');
  });
});
