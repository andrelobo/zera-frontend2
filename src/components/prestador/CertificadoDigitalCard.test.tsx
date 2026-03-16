import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import CertificadoDigitalCard from './CertificadoDigitalCard';

describe('CertificadoDigitalCard', () => {
  it('hides import fields when certificate already exists', () => {
    render(
      <CertificadoDigitalCard
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
    render(
      <CertificadoDigitalCard
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
});
