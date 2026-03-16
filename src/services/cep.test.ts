import { afterEach, describe, expect, it, vi } from 'vitest';
import { formatCep, lookupCep, normalizeCep } from '@/services/cep';
import api from '@/lib/api';

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
    vi.spyOn(api, 'get').mockResolvedValue({
      data: {
        cep: '69010-040',
        logradouro: 'Rua Exemplo',
        bairro: 'Centro',
        cidade: 'Manaus',
        uf: 'am',
      },
    } as never);

    const result = await lookupCep('69010040');

    expect(result).toEqual({
      cep: '69010040',
      logradouro: 'Rua Exemplo',
      numero: '',
      bairro: 'Centro',
      cidade: 'Manaus',
      uf: 'AM',
      complemento: '',
    });
  });

  it('accepts fallback payload keys from providers', async () => {
    vi.spyOn(api, 'get').mockResolvedValue({
      data: {
        cep: '69017-020',
        street: 'R FREI JOSE DE LEONISSA',
        addressNumber: '123',
        neighborhood: 'ALVORADA',
        city: 'Manaus',
        state: 'am',
      },
    } as never);

    const result = await lookupCep('69017020');

    expect(result).toEqual({
      cep: '69017020',
      logradouro: 'R FREI JOSE DE LEONISSA',
      numero: '123',
      bairro: 'ALVORADA',
      cidade: 'Manaus',
      uf: 'AM',
      complemento: '',
    });
  });

  it('throws when backend returns error', async () => {
    vi.spyOn(api, 'get').mockRejectedValue({
      response: { data: { message: 'CEP não encontrado.' } },
    });

    await expect(lookupCep('99999999')).rejects.toThrow('CEP não encontrado.');
  });
});
