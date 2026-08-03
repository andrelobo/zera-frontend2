import { describe, expect, it } from 'vitest';
import { resolveDashboardRbt12, selectDashboardItems } from './useDashboardData';

describe('selectDashboardItems', () => {
  it('prefers items with canonical fiscal identifiers regardless of provider', () => {
    const items = [
      { id: '1', provider: 'MANUAL' },
      { id: '2', provider: 'PLUGNOTAS', numeroNfse: '1001' },
      { id: '3', provider: 'LOBONOTAS', dpsNum: '38' },
    ];

    expect(selectDashboardItems(items)).toEqual([
      { id: '2', provider: 'PLUGNOTAS', numeroNfse: '1001' },
      { id: '3', provider: 'LOBONOTAS', dpsNum: '38' },
    ]);
  });

  it('keeps legacy PLUGNOTAS emissions when they carry identifiers', () => {
    const items = [
      { id: '1', provider: 'PLUGNOTAS', numeroNfse: '1002', dpsNum: '40' },
      { id: '2', provider: 'LOBONOTAS', numeroNfse: '2001' },
    ];

    expect(selectDashboardItems(items)).toEqual(items);
  });

  it('falls back to all items when none carry fiscal identifiers', () => {
    const items = [
      { id: '1', provider: '' },
      { id: '2' },
      { id: '3', provider: 'PLUGNOTAS' },
    ];

    expect(selectDashboardItems(items)).toEqual(items);
  });
});

describe('resolveDashboardRbt12', () => {
  it('prefers bi summary total when available', () => {
    expect(resolveDashboardRbt12(180000, { totals: { somaValorServico: 244481.63 } })).toBe(244481.63);
  });

  it('falls back to provided rbt12 when summary total is absent', () => {
    expect(resolveDashboardRbt12(180000, { totals: {} })).toBe(180000);
    expect(resolveDashboardRbt12(180000, null)).toBe(180000);
  });
});
