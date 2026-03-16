import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import PrestadorSection from './PrestadorSection';

const mocks = vi.hoisted(() => ({
  getByCnpj: vi.fn(),
  previewByCnpj: vi.fn(),
  lookupCep: vi.fn(),
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
}));

vi.mock('@/services/api', () => ({
  empresasApi: {
    getByCnpj: mocks.getByCnpj,
    previewByCnpj: mocks.previewByCnpj,
  },
}));

vi.mock('@/services/cep', () => ({
  lookupCep: mocks.lookupCep,
}));

vi.mock('sonner', () => ({
  toast: {
    success: mocks.toastSuccess,
    error: mocks.toastError,
  },
}));

const baseData = {
  nomeEmpresarial: '',
  nomeFantasia: '',
  cnpj: '',
  inscricaoMunicipal: '',
  inscricaoEstadual: '',
  suframa: '',
  cep: '',
  logradouro: '',
  numero: '',
  complemento: '',
  bairro: '',
  localidadeUf: '',
  email: '',
  whatsapp: '',
};

describe('emissao PrestadorSection UI', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('autocompletes prestador by cnpj using backend data', async () => {
    const onChange = vi.fn();
    const onAutosave = vi.fn();
    const onSimplesDetected = vi.fn();

    mocks.getByCnpj.mockResolvedValue({
      razaoSocial: 'BURGUS LTDA',
      nomeFantasia: 'ECONTABILIS LTDA',
      inscricaoMunicipal: '51754301',
      inscricaoEstadual: 'ISENTO',
      suframa: 'NP',
      endereco: {
        cep: '69010040',
        logradouro: 'R SALDANHA MARINHO',
        numero: '606',
        complemento: 'SALA 255',
        bairro: 'CENTRO',
        cidade: 'Manaus',
        uf: 'AM',
      },
      email: 'contato@econtabilis.com',
      whatsapp: '92991594210',
      opcaoPeloSimples: true,
    });
    mocks.previewByCnpj.mockRejectedValue(new Error('preview off'));

    render(
      <PrestadorSection
        data={baseData}
        onChange={onChange}
        onAutosave={onAutosave}
        onSimplesDetected={onSimplesDetected}
      />,
    );

    fireEvent.change(screen.getByPlaceholderText('00.000.000/0000-00'), { target: { value: '43521115000134' } });

    await waitFor(() => {
      expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ cnpj: '43.521.115/0001-34' }));
      expect(onChange).toHaveBeenCalledWith(expect.objectContaining({
        nomeEmpresarial: 'BURGUS LTDA',
        nomeFantasia: 'ECONTABILIS LTDA',
        inscricaoMunicipal: '51754301',
        inscricaoEstadual: 'ISENTO',
        suframa: 'NP',
        cep: '69010-040',
        logradouro: 'R SALDANHA MARINHO',
        numero: '606',
        complemento: 'SALA 255',
        bairro: 'CENTRO',
        localidadeUf: 'Manaus - AM',
        email: 'contato@econtabilis.com',
        whatsapp: '(92) 99159-4210',
      }));
    });

    expect(onSimplesDetected).toHaveBeenCalledWith(true);
    expect(mocks.toastSuccess).toHaveBeenCalled();
    expect(await screen.findByText(/Fonte do autocomplete: Banco \(ZERA\)/)).toBeTruthy();
  });

  it('autocompletes address by cep', async () => {
    const onChange = vi.fn();
    const onAutosave = vi.fn();

    mocks.lookupCep.mockResolvedValue({
      logradouro: 'AV Djalma Batista',
      bairro: 'Chapada',
      cidade: 'Manaus',
      uf: 'AM',
    });

    render(
      <PrestadorSection
        data={{ ...baseData, cnpj: '43.521.115/0001-34' }}
        onChange={onChange}
        onAutosave={onAutosave}
      />,
    );

    fireEvent.change(screen.getByPlaceholderText('00000-000'), { target: { value: '69050010' } });

    await waitFor(() => {
      expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ cep: '69050-010' }));
      expect(onChange).toHaveBeenCalledWith(expect.objectContaining({
        logradouro: 'AV DJALMA BATISTA',
        bairro: 'Chapada',
        localidadeUf: 'Manaus - AM',
      }));
    });

    expect(mocks.toastSuccess).toHaveBeenCalled();
  });

  it('does not trigger cnpj lookup when locked', async () => {
    const onChange = vi.fn();

    render(
      <PrestadorSection
        data={{ ...baseData, cnpj: '43.521.115/0001-34' }}
        onChange={onChange}
        onAutosave={vi.fn()}
        lockCnpj
      />,
    );

    fireEvent.change(screen.getByPlaceholderText('00.000.000/0000-00'), { target: { value: '11111111000191' } });

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(mocks.getByCnpj).not.toHaveBeenCalled();
    expect(mocks.previewByCnpj).not.toHaveBeenCalled();
  });
});
