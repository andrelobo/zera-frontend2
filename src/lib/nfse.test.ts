import { describe, expect, it } from 'vitest';
import { getNfseTomadorDocumento } from './nfse';

describe('nfse helpers', () => {
  it('reads tomador document from tomadorCpfCnpj when present on the root payload', () => {
    const nfse = {
      id: 'em-1',
      status: 'ERROR',
      provider: 'PLUGNOTAS',
      tomadorCpfCnpj: '61020788100',
    } as any;

    expect(getNfseTomadorDocumento(nfse)).toBe('61020788100');
  });
});
