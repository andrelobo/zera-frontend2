import { beforeEach, describe, expect, it, vi } from 'vitest';
import { listMunicipiosByUf } from './location';

const mocks = vi.hoisted(() => ({
  apiGet: vi.fn(),
}));

vi.mock('@/lib/api', () => ({
  default: {
    get: mocks.apiGet,
  },
}));

describe('location service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns backend municipios when the internal api responds', async () => {
    mocks.apiGet.mockResolvedValue({
      data: [
        { id: 1302603, nome: 'Manaus', uf: 'AM' },
      ],
    });

    const result = await listMunicipiosByUf('am');

    expect(result).toEqual([
      { id: 1302603, nome: 'Manaus', uf: 'AM' },
    ]);
    expect(mocks.apiGet).toHaveBeenCalledWith('/empresas/lookup/municipios', {
      params: { uf: 'AM' },
      skipGlobalErrorToast: true,
    });
  });

  it('returns empty for an invalid uf', async () => {
    const result = await listMunicipiosByUf('');

    expect(result).toEqual([]);
    expect(mocks.apiGet).not.toHaveBeenCalled();
  });

  it('returns empty when the internal api is unavailable', async () => {
    mocks.apiGet.mockRejectedValue(new Error('network down'));

    const result = await listMunicipiosByUf('AM');

    expect(result).toEqual([]);
  });
});
