import { describe, expect, it } from 'vitest';
import { resolveDashboardRbt12, selectDashboardItems } from './useDashboardData';

describe('selectDashboardItems', () => {
  it('prefers PLUGNOTAS items when they exist', () => {
    const items = [
      { id: '1', provider: 'MANUAL' },
      { id: '2', provider: 'PLUGNOTAS' },
      { id: '3', provider: 'plugnotas' },
    ];

    expect(selectDashboardItems(items)).toEqual([
      { id: '2', provider: 'PLUGNOTAS' },
      { id: '3', provider: 'plugnotas' },
    ]);
  });

  it('falls back to all items when none are marked as PLUGNOTAS', () => {
    const items = [
      { id: '1', provider: '' },
      { id: '2' },
      { id: '3', provider: 'MANUAL' },
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
