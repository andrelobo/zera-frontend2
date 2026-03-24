import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AxiosError } from 'axios';
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
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
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

  it('falls back to ibge when the internal api returns an empty list', async () => {
    mocks.apiGet.mockResolvedValue({ data: [] });
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [{ id: 1302603, nome: 'Manaus' }],
    } as Response);

    const result = await listMunicipiosByUf('AM');

    expect(result).toEqual([
      { id: 1302603, nome: 'Manaus', uf: 'AM' },
    ]);
    expect(global.fetch).toHaveBeenCalledWith('https://servicodados.ibge.gov.br/api/v1/localidades/estados/AM/municipios?orderBy=nome');
  });

  it('falls back to ibge when the internal api endpoint is unavailable', async () => {
    mocks.apiGet.mockRejectedValue(new AxiosError('not found', 'ERR_BAD_REQUEST', undefined, undefined, {
      status: 404,
      statusText: 'Not Found',
      headers: {},
      config: {} as never,
      data: {},
    }));
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [{ id: 3550308, nome: 'Sao Paulo' }],
    } as Response);

    const result = await listMunicipiosByUf('SP');

    expect(result).toEqual([
      { id: 3550308, nome: 'Sao Paulo', uf: 'SP' },
    ]);
  });
});
