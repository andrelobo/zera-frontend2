import { describe, expect, it } from 'vitest';
import type { NfseCanonicalIdentifiers, NfseStatus, ProviderResponse } from '@/types/api';
import { getProviderArtifactFileName, getProviderDisplayName, inferNfseDataFromProvider, isLegacyProvider } from './nfse-provider';

const buildProviderResponse = (overrides: Partial<ProviderResponse> = {}): ProviderResponse => ({
  id: 'prov-1',
  raw: {},
  receivedAt: '2026-03-21T00:00:00.000Z',
  ...overrides,
});

describe('provider presentation', () => {
  it('values the proprietary engine without changing provider identifiers', () => {
    expect(getProviderDisplayName('LOBONOTAS')).toBe('LOBONOTAS — Ambiente Nacional');
    expect(getProviderDisplayName('PLUGNOTAS')).toBe('PlugNotas — legado desativado');
    expect(getProviderDisplayName('MOCK')).toBe('Ambiente de teste');
  });

  it('recognizes only PlugNotas as legacy provider', () => {
    expect(isLegacyProvider(' plugnotas ')).toBe(true);
    expect(isLegacyProvider('LOBONOTAS')).toBe(false);
  });

  it('identifies LOBONOTAS PDF and XML filenames without changing legacy artifacts', () => {
    expect(getProviderArtifactFileName('LOBONOTAS', 'NFS123', 'pdf')).toBe('lobonotas-nfse-NFS123.pdf');
    expect(getProviderArtifactFileName('LOBONOTAS', 'NFS123', 'xml')).toBe('lobonotas-nfse-NFS123.xml');
    expect(getProviderArtifactFileName('PLUGNOTAS', 'legacy-1', 'xml')).toBe('nfse-legacy-1.xml');
  });
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
