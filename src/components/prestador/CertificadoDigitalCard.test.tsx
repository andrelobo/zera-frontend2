import type { ReactNode } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import CertificadoDigitalCard from './CertificadoDigitalCard';

const {
  importCertificadoDigital,
  toastSuccess,
  toastError,
  toastInfo,
} = vi.hoisted(() => ({
  importCertificadoDigital: vi.fn(),
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
  toastInfo: vi.fn(),
}));

vi.mock('@/services/api', () => ({
  empresasApi: {
    importCertificadoDigital,
  },
}));

vi.mock('sonner', () => ({
  toast: {
    success: toastSuccess,
    error: toastError,
    info: toastInfo,
  },
}));

const renderWithQueryClient = (ui: ReactNode) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      {ui}
    </QueryClientProvider>,
  );
};

describe('CertificadoDigitalCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('hides import fields when certificate already exists', () => {
    renderWithQueryClient(
      <CertificadoDigitalCard
        cnpj="12.345.678/0001-90"
        certificado={{
          filename: 'certiapa.pfx',
          uploadedAt: '2026-02-22T17:31:38.702Z',
        }}
      />,
    );

    expect(screen.getByText(/Certificado digital já importado/)).toBeTruthy();
    expect(screen.queryByText('Arquivo do Certificado')).toBeNull();
    expect(screen.queryByText('Senha do Certificado')).toBeNull();
    expect(screen.getByRole('button', { name: 'Substituir certificado' })).toBeTruthy();
  });

  it('shows import fields after clicking replace', () => {
    renderWithQueryClient(
      <CertificadoDigitalCard
        cnpj="12.345.678/0001-90"
        certificado={{
          filename: 'certiapa.pfx',
          uploadedAt: '2026-02-22T17:31:38.702Z',
        }}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Substituir certificado' }));

    expect(screen.getByText('Arquivo do Certificado')).toBeTruthy();
    expect(screen.getByText('Senha do Certificado')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Cancelar substituição' })).toBeTruthy();
  });

  it('imports certificate through API and refresh callback', async () => {
    const onImported = vi.fn().mockResolvedValue(undefined);
    importCertificadoDigital.mockResolvedValue({
      cnpj: '12345678000190',
      fileName: 'novo-certificado.pfx',
      fileSize: 10,
      uploadedAt: '2026-03-17T10:00:00.000Z',
    });

    renderWithQueryClient(
      <CertificadoDigitalCard cnpj="12.345.678/0001-90" onImported={onImported} />,
    );

    const file = new File(['123'], 'novo-certificado.pfx', { type: 'application/x-pkcs12' });
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(fileInput, { target: { files: [file] } });
    fireEvent.change(screen.getByPlaceholderText('Digite a senha do certificado'), {
      target: { value: 'segredo' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Importar certificado' }));

    await waitFor(() => {
      expect(importCertificadoDigital).toHaveBeenCalledWith({
        cnpj: '12345678000190',
        senhaCertificado: 'segredo',
        file,
      });
    });

    await waitFor(() => {
      expect(onImported).toHaveBeenCalledTimes(1);
    });

    expect(screen.getByText(/Certificado digital já importado/)).toBeTruthy();
  });
});
