import { describe, expect, it } from 'vitest';
import {
  FAIXAS_ANEXO_III,
  calcularSimplesAnexoIII,
  distanciaProximaFaixa,
  formatPercent,
  parseCurrencyInput,
} from './simples-nacional';

describe('simples-nacional faixa table', () => {
  it('provides percentual ISS for every faixa of Anexo III', () => {
    expect(FAIXAS_ANEXO_III).toHaveLength(6);

    for (const faixa of FAIXAS_ANEXO_III) {
      expect(Number.isFinite(faixa.percentualIss)).toBe(true);
      expect(formatPercent(faixa.percentualIss)).not.toBe('NaN%');
    }
  });

  it('uses the percentual ISS configuration aligned with novastelas', () => {
    expect(FAIXAS_ANEXO_III.map((item) => item.percentualIss)).toEqual([
      0.335,
      0.32,
      0.325,
      0.325,
      0.335,
      0.215,
    ]);
  });

  it('calculates faixa 2 with aliquota efetiva and ISS referencia correctly', () => {
    const result = calcularSimplesAnexoIII(244_481.63, 'III');

    expect(result.valido).toBe(true);
    expect(result.faixa?.faixa).toBe(2);
    expect(result.aliquotaEfetiva).toBeCloseTo(0.07371484, 6);
    expect(result.issReferencia).toBeCloseTo(0.02358875, 6);
    expect(formatPercent(result.aliquotaEfetiva)).toBe('7,3715%');
    expect(formatPercent(result.issReferencia)).toBe('2,3589%');
  });

  it('calculates faixa 1 ISS referencia correctly', () => {
    const result = calcularSimplesAnexoIII(180_000, 'III');

    expect(result.valido).toBe(true);
    expect(result.faixa?.faixa).toBe(1);
    expect(result.aliquotaEfetiva).toBeCloseTo(0.06, 6);
    expect(result.issReferencia).toBeCloseTo(0.0201, 6);
    expect(formatPercent(result.issReferencia)).toBe('2,01%');
  });

  it('returns invalid result for anexo diferente de III', () => {
    const result = calcularSimplesAnexoIII(180_000, 'V');

    expect(result.valido).toBe(false);
    expect(result.faixa).toBeNull();
    expect(result.alertas[0]).toContain('Anexo V');
  });

  it('returns warning when RBT12 is above the Simples Nacional limit', () => {
    const result = calcularSimplesAnexoIII(4_900_000, 'III');

    expect(result.valido).toBe(false);
    expect(result.alertas[0]).toContain('desenquadramento');
  });

  it('calculates remaining value to the next faixa correctly', () => {
    expect(distanciaProximaFaixa(244_481.63)).toEqual({
      valor: 115_518.37,
      faixaAtual: 2,
      faixaProxima: 3,
    });
  });

  it('parses formatted currency input safely', () => {
    expect(parseCurrencyInput('244.481,63')).toBeCloseTo(244_481.63, 2);
    expect(parseCurrencyInput('')).toBe(0);
  });
});
