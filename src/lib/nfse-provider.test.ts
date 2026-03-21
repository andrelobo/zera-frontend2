import { describe, expect, it } from 'vitest';
import { inferNfseDataFromProvider } from './nfse-provider';

describe('inferNfseDataFromProvider', () => {
  it('extracts numeroNfse and dps fields from provider response', () => {
    expect(
      inferNfseDataFromProvider({
        id: 'prov-1',
        raw: {},
        receivedAt: '2026-03-21T00:00:00.000Z',
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
      } as any),
    ).toEqual(
      expect.objectContaining({
        numeroNfse: '1001',
        dpsNum: '38',
        serieDpsNum: '01',
      }),
    );
  });
});
