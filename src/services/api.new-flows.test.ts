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

  it('emits quick NFSe with minimal payload', async () => {
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

    const result = await nfseApi.emitirQuick({ cpfTomador: '12345678901', valor: 89.9 });

    expect(result).toEqual(response);
    expect(mockPost).toHaveBeenCalledWith('/nfse/quick', { cpfTomador: '12345678901', valor: 89.9 });
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

    await expect(nfseApi.emitirQuick({ cpfTomador: '12345678901', valor: 100 })).rejects.toEqual(backendError);
  });
});
