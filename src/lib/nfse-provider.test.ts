import { describe, expect, it } from 'vitest';
import type { NfseCanonicalIdentifiers, NfseStatus, ProviderResponse } from '@/types/api';
import { inferNfseDataFromProvider } from './nfse-provider';

const buildProviderResponse = (overrides: Partial<ProviderResponse> = {}): ProviderResponse => ({
  id: 'prov-1',
  raw: {},
  receivedAt: '2026-03-21T00:00:00.000Z',
  ...overrides,
});

describe('inferNfseDataFromProvider', () => {
  it('extracts numeroNfse and dps fields from provider response', () => {
    expect(
      inferNfseDataFromProvider(
        buildProviderResponse({
          providerResponse: {
            retorno: {
              numeroNfse: 1001,
            },
            dps: {
              numero: 38,
              serie: '01',
              id: 'DPS130260324352111500013400001000000000000038',
            },
          },
        }),
      ),
    ).toEqual(
      expect.objectContaining({
        numeroNfse: '1001',
        dpsNum: '38',
        serieDpsNum: '01',
      }),
    );
  });

  it('prefers canonical identifiers over legacy provider shape', () => {
    const canonico: NfseCanonicalIdentifiers = {
      numeroNfse: '2001',
      dpsNumero: '39',
      dpsSerie: '02',
    };
    const status: NfseStatus = 'AUTHORIZED';

    expect(
      inferNfseDataFromProvider(
        buildProviderResponse({
          provider: 'LOBONOTAS',
          status,
          canonico,
          providerResponse: {
            retorno: {
              numeroNfse: 9999,
            },
            dps: {
              numero: 1,
              serie: 'ZZ',
            },
          },
        }),
      ),
    ).toEqual(
      expect.objectContaining({
        numeroNfse: '2001',
        dpsNum: '39',
        serieDpsNum: '02',
      }),
    );
  });

  it('falls back to legacy provider shape when canonico is absent', () => {
    expect(
      inferNfseDataFromProvider(
        buildProviderResponse({
          providerResponse: {
            retorno: {
              numeroNfse: 1001,
            },
            dps: {
              numero: 38,
              serie: '01',
            },
          },
        }),
      ),
    ).toEqual(
      expect.objectContaining({
        numeroNfse: '1001',
        dpsNum: '38',
        serieDpsNum: '01',
      }),
    );
  });
});
