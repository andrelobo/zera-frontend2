import { describe, expect, it } from 'vitest';
import { selectDashboardItems } from './useDashboardData';

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
