import { describe, expect, it, vi, beforeEach } from 'vitest';

const mockPost = vi.fn();
const mockGet = vi.fn();
const mockPatch = vi.fn();
const mockDelete = vi.fn();

vi.mock('@/lib/api', () => ({
  default: {
    post: mockPost,
    get: mockGet,
    patch: mockPatch,
    delete: mockDelete,
  },
}));

describe('new API flows', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('imports digital certificate with multipart form-data', async () => {
    const { empresasApi } = await import('@/services/api');
    const file = new File(['cert-content'], 'certificado.pfx', { type: 'application/x-pkcs12' });
    const response = {
      cnpj: '12345678000190',
      fileName: 'certificado.pfx',
      fileSize: 12,
      uploadedAt: '2026-02-16T10:00:00.000Z',
    };
    mockPost.mockResolvedValue({ data: response });

    const result = await empresasApi.importCertificadoDigital({
      cnpj: '12.345.678/0001-90',
      senhaCertificado: 'senha-secreta',
      file,
    });

    expect(result).toEqual(response);
    expect(mockPost).toHaveBeenCalledTimes(1);
    expect(mockPost).toHaveBeenCalledWith(
      '/empresas/certificado/import',
      expect.any(FormData),
      expect.objectContaining({
        headers: expect.objectContaining({ 'Content-Type': 'multipart/form-data' }),
      }),
    );

    const sentFormData = mockPost.mock.calls[0][1] as FormData;
    expect(sentFormData.get('cnpj')).toBe('12.345.678/0001-90');
    expect(sentFormData.get('senhaCertificado')).toBe('senha-secreta');
    expect(sentFormData.get('file')).toBe(file);
  });

  it('propagates backend error on certificate import', async () => {
    const { empresasApi } = await import('@/services/api');
    const backendError = {
      response: {
        data: {
          code: 'CERTIFICADO_REQUIRED',
          message: 'Certificado ausente.',
          correlationId: 'corr-123',
        },
      },
    };
    mockPost.mockRejectedValue(backendError);

    await expect(empresasApi.importCertificadoDigital({
      cnpj: '12345678000190',
      senhaCertificado: 'x',
      file: new File(['x'], 'a.p12'),
    })).rejects.toEqual(backendError);
  });

  it('emits quick NFSe with required payload', async () => {
    const { nfseApi } = await import('@/services/api');
    const response = {
      emissionId: 'em-123',
      idempotentReplay: false,
      result: {
        status: 'PENDING',
        provider: 'PLUGNOTAS',
      },
    };
    mockPost.mockResolvedValue({ data: response });

    const result = await nfseApi.emitirQuick({
      cnpj: '43521115000134',
      cpfTomador: '12345678901',
      valor: 89.9,
      codigoServico: '060101',
    });

    expect(result).toEqual(response);
    expect(mockPost).toHaveBeenCalledWith('/nfse/quick', {
      cnpj: '43521115000134',
      cpfTomador: '12345678901',
      valor: 89.9,
      codigoServico: '060101',
    });
  });

  it('emits quick NFSe preserving sent fields', async () => {
    const { nfseApi } = await import('@/services/api');
    const response = {
      emissionId: 'em-124',
      idempotentReplay: false,
      result: {
        status: 'PENDING',
        provider: 'PLUGNOTAS',
      },
    };
    mockPost.mockResolvedValue({ data: response });

    const result = await nfseApi.emitirQuick({
      cnpj: '12345678000190',
      cpfTomador: '12345678901',
      valor: 120,
      codigoServico: '060101',
    });

    expect(result).toEqual(response);
    expect(mockPost).toHaveBeenCalledWith('/nfse/quick', {
      cnpj: '12345678000190',
      cpfTomador: '12345678901',
      valor: 120,
      codigoServico: '060101',
    });
  });

  it('retries a pre-transmission NFSe error through the dedicated endpoint', async () => {
    const { nfseApi } = await import('@/services/api');
    const response = {
      emissionId: 'em-retry-1',
      idempotentReplay: false,
      result: { status: 'PENDING', provider: 'LOBONOTAS' },
    };
    mockPost.mockResolvedValue({ data: response });

    await expect(nfseApi.reemitir('6a70eb85caa874f842b4a576')).resolves.toEqual(response);
    expect(mockPost).toHaveBeenCalledWith(
      '/nfse/6a70eb85caa874f842b4a576/reemitir',
    );
  });

  it('queries cpf lookup for tomador enrichment', async () => {
    const { tomadoresApi } = await import('@/services/api');
    const response = {
      cpf: '61020788100',
      source: 'hubdev_cadastropf',
      found: true,
      usefulData: true,
      maskedByLgpd: false,
      nome: 'Andre Lobo',
    };
    mockGet.mockResolvedValue({ data: response });

    const result = await tomadoresApi.lookupCpf('610.207.881-00', '43.521.115/0001-34');

    expect(result).toEqual(response);
    expect(mockGet).toHaveBeenCalledWith('/tomadores/lookup/cpf', {
      params: { cpf: '61020788100', empresaCnpj: '43521115000134' },
    });
  });

  it('normalizes and deduplicates company scopes when updating a user', async () => {
    const { usersApi } = await import('@/services/api');
    mockPatch.mockResolvedValue({ data: { id: 'user-1' } });

    await usersApi.update('user-1', {
      role: 'manager',
      allowedCompanyCnpjs: ['43.521.115/0001-34', '43521115000134'],
    });

    expect(mockPatch).toHaveBeenCalledWith('/users/user-1', {
      role: 'manager',
      allowedCompanyCnpjs: ['43521115000134'],
    });
  });

  it('queries service autocomplete', async () => {
    const { nfseApi } = await import('@/services/api');
    const response = {
      items: [{ codigoServico: '060101', itemLc116: '6.01', descricao: 'Barbearia' }],
      total: 1,
    };
    mockGet.mockResolvedValue({ data: response });

    const result = await nfseApi.servicosAutocomplete({ q: 'barb', limit: 8 });

    expect(result).toEqual(response);
    expect(mockGet).toHaveBeenCalledWith('/nfse/servicos/autocomplete', {
      params: { q: 'barb', limit: 8 },
    });
  });

  it('queries service list endpoint', async () => {
    const { nfseApi } = await import('@/services/api');
    const response = {
      items: [{ codigoServico: '060101', itemLc116: '6.01', descricao: 'Barbearia' }],
      total: 1,
    };
    mockGet.mockResolvedValue({ data: response });

    const result = await nfseApi.servicosList({ q: 'barb', limit: 8, page: 1 });

    expect(result).toEqual(response);
    expect(mockGet).toHaveBeenCalledWith('/nfse/servicos', {
      params: { q: 'barb', limit: 8, page: 1 },
    });
  });

  it('queries service list endpoint with trimmed params and request options', async () => {
    const { nfseApi } = await import('@/services/api');
    const response = { items: [], total: 0 };
    mockGet.mockResolvedValue({ data: response });

    await nfseApi.servicosList(
      { q: '  corte  ', limit: 5, page: 2 },
      { skipGlobalErrorToast: true },
    );

    expect(mockGet).toHaveBeenCalledWith('/nfse/servicos', {
      params: { q: 'corte', limit: 5, page: 2 },
      skipGlobalErrorToast: true,
    });
  });

  it('maps paginated NFSe list and normalizes provider filter', async () => {
    const { nfseApi } = await import('@/services/api');
    mockGet.mockResolvedValue({
      data: {
        items: [{ id: 'n1', status: 'PENDING' }],
        meta: { total: 12, page: 3, limit: 5, totalPages: 3 },
      },
    });

    const result = await nfseApi.list({ provider: 'PLUGNOTAS', page: 3, limit: 5 });

    expect(mockGet).toHaveBeenCalledWith('/nfse', {
      params: { provider: 'PLUGNOTAS', page: 3, limit: 5 },
    });
    expect(result).toEqual({
      data: [{ id: 'n1', status: 'PENDING' }],
      total: 12,
      page: 3,
      limit: 5,
      totalPages: 3,
    });
  });

  it('sanitizes empresaCnpj in NFSe list filters', async () => {
    const { nfseApi } = await import('@/services/api');
    mockGet.mockResolvedValue({
      data: {
        items: [],
        meta: { total: 0, page: 1, limit: 1, totalPages: 1 },
      },
    });

    await nfseApi.list({ empresaCnpj: '43.521.115/0001-34', limit: 1 });

    expect(mockGet).toHaveBeenCalledWith('/nfse', {
      params: { empresaCnpj: '43521115000134', limit: 1 },
    });
  });

  it('applies NFSe list defaults when backend omits meta and items', async () => {
    const { nfseApi } = await import('@/services/api');
    mockGet.mockResolvedValue({ data: {} });

    const result = await nfseApi.list();

    expect(result).toEqual({
      data: [],
      total: 0,
      page: 1,
      limit: 10,
      totalPages: 1,
    });
  });

  it('maps provider response envelope to normalized shape', async () => {
    const { nfseApi } = await import('@/services/api');
    const payload = {
      id: 'prov-1',
      provider: 'PLUGNOTAS',
      externalId: 'ext-1',
      status: 'AUTHORIZED',
      providerRequest: { sent: true },
      providerResponse: { ok: true },
      error: null,
      createdAt: '2026-02-10T10:00:00.000Z',
      updatedAt: '2026-02-10T10:01:00.000Z',
    };
    mockGet.mockResolvedValue({ data: payload });

    const result = await nfseApi.providerResponse('emission-1');

    expect(mockGet).toHaveBeenCalledWith('/nfse/emission-1/provider-response');
    expect(result).toEqual({
      id: 'prov-1',
      provider: 'PLUGNOTAS',
      externalId: 'ext-1',
      status: 'AUTHORIZED',
      providerRequest: { sent: true },
      providerResponse: { ok: true },
      error: null,
      createdAt: '2026-02-10T10:00:00.000Z',
      updatedAt: '2026-02-10T10:01:00.000Z',
      raw: { ok: true },
      protocol: 'ext-1',
      receivedAt: '2026-02-10T10:01:00.000Z',
    });
  });

  it('maps provider response by externalId envelope to normalized shape', async () => {
    const { nfseApi } = await import('@/services/api');
    const payload = {
      id: 'prov-2',
      provider: 'PLUGNOTAS',
      externalId: 'ext-2',
      status: 'AUTHORIZED',
      providerRequest: { sent: true },
      providerResponse: [{ retorno: { numeroNfse: '25' }, dps: { numero: 38, serie: '01' } }],
      error: null,
      createdAt: '2026-03-18T00:49:48.000Z',
      updatedAt: '2026-03-18T00:49:56.000Z',
    };
    mockGet.mockResolvedValue({ data: payload });

    const result = await nfseApi.providerResponseByExternalId('ext-2');

    expect(mockGet).toHaveBeenCalledWith('/nfse/external/ext-2/provider-response');
    expect(result).toEqual({
      id: 'prov-2',
      provider: 'PLUGNOTAS',
      externalId: 'ext-2',
      status: 'AUTHORIZED',
      providerRequest: { sent: true },
      providerResponse: [{ retorno: { numeroNfse: '25' }, dps: { numero: 38, serie: '01' } }],
      error: null,
      createdAt: '2026-03-18T00:49:48.000Z',
      updatedAt: '2026-03-18T00:49:56.000Z',
      raw: [{ retorno: { numeroNfse: '25' }, dps: { numero: 38, serie: '01' } }],
      protocol: 'ext-2',
      receivedAt: '2026-03-18T00:49:56.000Z',
    });
  });

  it('normalizes empresa id from _id fallback', async () => {
    const { empresasApi } = await import('@/services/api');
    mockGet.mockResolvedValue({
      data: [
        { _id: 'mongo-1', razaoSocial: 'Empresa A', cnpj: '123' },
        { id: 'api-2', _id: 'mongo-2', razaoSocial: 'Empresa B', cnpj: '456' },
      ],
    });

    const result = await empresasApi.list();

    expect(mockGet).toHaveBeenCalledWith('/empresas', {
      params: { q: undefined, limit: undefined },
    });
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual(expect.objectContaining({
      _id: 'mongo-1',
      id: 'mongo-1',
      razaoSocial: 'Empresa A',
      cnpj: '123',
    }));
    expect(result[1]).toEqual(expect.objectContaining({
      id: 'api-2',
      _id: 'mongo-2',
      razaoSocial: 'Empresa B',
      cnpj: '456',
    }));
  });

  it('sends parametroMunicipal and configOperacionais on empresa create', async () => {
    const { empresasApi } = await import('@/services/api');
    mockPost.mockResolvedValue({
      data: {
        id: 'empresa-1',
        cnpj: '43521115000134',
        razaoSocial: 'BURGUS LTDA',
        parametroMunicipal: [{ codigo: '6201500' }],
        configOperacionais: [{ id: 'svc-1', natureza: 'TRIBUTAVEL', descricao: 'SERVICO' }],
      },
    });

    await empresasApi.create({
      cnpj: '43521115000134',
      razaoSocial: 'BURGUS LTDA',
      parametroMunicipal: [{ codigo: '6201500', vinculos: [{ ctn: '1.01' }] }],
      configOperacionais: [{ id: 'svc-1', natureza: 'TRIBUTAVEL', descricao: 'SERVICO' }],
    });

    expect(mockPost).toHaveBeenCalledWith('/empresas', expect.objectContaining({
      cnpj: '43521115000134',
      razaoSocial: 'BURGUS LTDA',
      parametroMunicipal: [{ codigo: '6201500', vinculos: [{ ctn: '1.01' }] }],
      configOperacionais: [{ id: 'svc-1', natureza: 'TRIBUTAVEL', descricao: 'SERVICO' }],
    }));
  });

  it('normalizes parametroMunicipal/configOperacionais when backend returns JSON string', async () => {
    const { empresasApi } = await import('@/services/api');
    mockGet.mockResolvedValue({
      data: [
        {
          id: 'empresa-1',
          cnpj: '43521115000134',
          razaoSocial: 'BURGUS LTDA',
          parametro_municipal: '[{"codigo":"6201500","cnaeDescricao":"DESENVOLVIMENTO"}]',
          config_operacionais: '[{"id":"svc-1","natureza":"Contabilidade","descricao":"Servico contabil"}]',
        },
      ],
    });

    const result = await empresasApi.list();
    expect(result).toHaveLength(1);
    expect(result[0].parametroMunicipal).toEqual([
      { codigo: '6201500', cnaeDescricao: 'DESENVOLVIMENTO' },
    ]);
    expect(result[0].configOperacionais).toEqual([
      { id: 'svc-1', natureza: 'Contabilidade', descricao: 'Servico contabil' },
    ]);
  });

  it('normalizes parametroMunicipal/configOperacionais when backend returns object wrapper', async () => {
    const { empresasApi } = await import('@/services/api');
    mockGet.mockResolvedValue({
      data: [
        {
          id: 'empresa-1',
          cnpj: '43521115000134',
          razaoSocial: 'BURGUS LTDA',
          parametroMunicipal: { items: [{ codigo: '8650003', vinculos: [{ ctn: '041601' }] }] },
          configOperacionais: { rows: [{ id: 'svc-2', natureza: 'Psicologia', descricao: 'Atendimento' }] },
        },
      ],
    });

    const result = await empresasApi.list();
    expect(result).toHaveLength(1);
    expect(result[0].parametroMunicipal).toEqual([
      { codigo: '8650003', vinculos: [{ ctn: '041601' }] },
    ]);
    expect(result[0].configOperacionais).toEqual([
      { id: 'svc-2', natureza: 'Psicologia', descricao: 'Atendimento' },
    ]);
  });

  it('normalizes simples snapshot and numeric rbt12 for empresa list', async () => {
    const { empresasApi } = await import('@/services/api');
    mockGet.mockResolvedValue({
      data: [
        {
          id: 'empresa-1',
          cnpj: '43521115000134',
          razaoSocial: 'BURGUS LTDA',
          rbt12: 240000,
          aliquotaSimplesNacional: '6,00',
          simplesSnapshot: {
            anexo: 'III',
            rbt12: 240000,
            aliquotaEfetiva: 0.073715,
            issReferencia: 0.023589,
            valido: true,
          },
        },
      ],
    });

    const result = await empresasApi.list();

    expect(result).toHaveLength(1);
    expect(result[0].rbt12).toBe('240000');
    expect(result[0].aliquotaSimplesNacional).toBe('7,37');
    expect(result[0].simplesSnapshot).toEqual(expect.objectContaining({
      anexo: 'III',
      rbt12: 240000,
      aliquotaEfetiva: 0.073715,
      issReferencia: 0.023589,
      valido: true,
    }));
  });

  it('propagates backend error on quick emission', async () => {
    const { nfseApi } = await import('@/services/api');
    const backendError = {
      response: {
        data: {
          code: 'QUICK_PRESTADOR_NO_CERT',
          message: 'Prestador sem certificado.',
          correlationId: 'corr-789',
        },
      },
    };
    mockPost.mockRejectedValue(backendError);

    await expect(nfseApi.emitirQuick({
      cnpj: '43521115000134',
      cpfTomador: '12345678901',
      valor: 100,
      codigoServico: '060101',
    })).rejects.toEqual(backendError);
  });
});
