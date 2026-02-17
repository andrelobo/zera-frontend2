import { afterEach, describe, expect, it, vi } from 'vitest';
import { formatCep, lookupCep, normalizeCep } from '@/services/cep';

describe('cep service', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('normalizes and formats CEP', () => {
    expect(normalizeCep('69.010-040')).toBe('69010040');
    expect(formatCep('69010040')).toBe('69010-040');
    expect(formatCep('69010')).toBe('69010');
  });

  it('throws on invalid CEP length', async () => {
    await expect(lookupCep('123')).rejects.toThrow('CEP inválido. Informe 8 dígitos.');
  });

  it('maps ViaCEP payload to normalized address', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        cep: '69010-040',
        logradouro: 'Rua Exemplo',
        bairro: 'Centro',
        localidade: 'Manaus',
        uf: 'am',
      }),
    } as Response);

    const result = await lookupCep('69010040');

    expect(result).toEqual({
      cep: '69010040',
      logradouro: 'Rua Exemplo',
      bairro: 'Centro',
      cidade: 'Manaus',
      uf: 'AM',
      complemento: '',
    });
  });

  it('throws when ViaCEP returns erro=true', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ erro: true }),
    } as Response);

    await expect(lookupCep('99999999')).rejects.toThrow('CEP não encontrado.');
  });
});
