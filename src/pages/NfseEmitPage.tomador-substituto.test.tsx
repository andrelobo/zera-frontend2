import type { ReactNode } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import NfseEmitPage from './NfseEmitPage';

const mocks = vi.hoisted(() => ({
  empresasList: vi.fn(),
  empresaGetByCnpj: vi.fn(),
  empresaPreviewByCnpj: vi.fn(),
  tomadoresList: vi.fn(),
  tomadoresAutocomplete: vi.fn(),
  emitirNfse: vi.fn(),
  listMunicipiosByUf: vi.fn(),
  lookupCep: vi.fn(),
  toast: vi.fn(),
}));

vi.mock('@/services/api', () => ({
  empresasApi: {
    list: mocks.empresasList,
    getByCnpj: mocks.empresaGetByCnpj,
    previewByCnpj: mocks.empresaPreviewByCnpj,
  },
  tomadoresApi: {
    list: mocks.tomadoresList,
    autocomplete: mocks.tomadoresAutocomplete,
  },
  nfseApi: {
    emitir: mocks.emitirNfse,
  },
}));

vi.mock('@/hooks/use-toast', () => ({
  toast: mocks.toast,
}));

vi.mock('@/services/location', () => ({
  listMunicipiosByUf: mocks.listMunicipiosByUf,
}));

vi.mock('@/services/cep', () => ({
  lookupCep: mocks.lookupCep,
}));

const empresaBase = {
  id: 'empresa-1',
  cnpj: '43.521.115/0001-34',
  razaoSocial: 'BURGUS LTDA',
  createdAt: '2026-04-10T00:00:00.000Z',
  updatedAt: '2026-04-10T00:00:00.000Z',
  opcaoPeloSimples: true,
  rbt12: 180000,
  cnaesLista: [
    {
      codigo: '6920601',
      descricao: 'Atividades de contabilidade',
      isPrincipal: true,
      anexo: 'III',
    },
  ],
  endereco: {
    logradouro: 'RUA UM',
    numero: '10',
    bairro: 'CENTRO',
    cidade: 'Manaus',
    uf: 'AM',
    cep: '69010040',
  },
};

const tomadorSim = {
  id: 'tom-sim',
  empresaCnpj: '43521115000134',
  cpfCnpj: '35577545000140',
  razaoSocial: 'TOMADOR SIM',
  substitutoTributario: true,
  inscricaoMunicipal: '123',
  email: 'sim@teste.com',
  endereco: {
    municipio: 'Manaus',
    uf: 'AM',
    cep: '69010040',
    logradouro: 'RUA A',
    numero: '1',
    bairro: 'CENTRO',
  },
  createdAt: '2026-04-10T00:00:00.000Z',
  updatedAt: '2026-04-10T00:00:00.000Z',
};

const tomadorNao = {
  id: 'tom-nao',
  empresaCnpj: '43521115000134',
  cpfCnpj: '32751008000186',
  razaoSocial: 'TOMADOR NAO',
  substitutoTributario: false,
  inscricaoMunicipal: '456',
  email: 'nao@teste.com',
  endereco: {
    municipio: 'Manaus',
    uf: 'AM',
    cep: '69050010',
    logradouro: 'RUA B',
    numero: '2',
    bairro: 'CHAPADA',
  },
  createdAt: '2026-04-10T00:00:00.000Z',
  updatedAt: '2026-04-10T00:00:00.000Z',
};

const renderPage = (ui: ReactNode) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: 0 },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        {ui}
      </MemoryRouter>
    </QueryClientProvider>,
  );
};

describe('NfseEmitPage tomador substituto', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.empresasList.mockResolvedValue([empresaBase]);
    mocks.empresaGetByCnpj.mockResolvedValue(empresaBase);
    mocks.empresaPreviewByCnpj.mockResolvedValue(empresaBase);
    mocks.tomadoresList.mockResolvedValue([tomadorSim, tomadorNao]);
    mocks.tomadoresAutocomplete.mockResolvedValue([tomadorSim, tomadorNao]);
    mocks.listMunicipiosByUf.mockResolvedValue([{ id: 1302603, nome: 'Manaus', uf: 'AM' }]);
    mocks.lookupCep.mockResolvedValue({
      logradouro: 'RUA UM',
      bairro: 'CENTRO',
      cidade: 'Manaus',
      uf: 'AM',
    });
    mocks.emitirNfse.mockResolvedValue({
      emissionId: 'em-1',
      idempotentReplay: false,
      result: { status: 'PENDING', provider: 'PLUGNOTAS' },
    });
  });

  it('reacts inside the emission screen when switching from substituto to non-substituto tomador', async () => {
    renderPage(<NfseEmitPage />);

    const seletor = await screen.findByRole('button', { name: /Selecione \(2\)/i });

    fireEvent.click(seletor);
    fireEvent.click(await screen.findByRole('button', { name: /TOMADOR SIM/i }));

    await waitFor(() => {
      expect(
        screen.getByText(/Com retencao\/substituicao tributaria de ISS/i),
      ).toBeInTheDocument();
    });
    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByDisplayValue('2,01')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Selecione \(2\)/i }));
    fireEvent.click(await screen.findByRole('button', { name: /TOMADOR NAO/i }));

    await waitFor(() => {
      expect(screen.getByText(/ISS devido ao proprio Municipio/i)).toBeInTheDocument();
    });
    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'false');
    expect(screen.queryByDisplayValue('2,01')).not.toBeInTheDocument();
    expect(
      screen.getByTitle('Optante do Simples Nacional - alíquota paga na guia única'),
    ).toBeDisabled();
  });

  it('derives substituto tributario when the user types a registered tomador document manually', async () => {
    renderPage(<NfseEmitPage />);

    const [_, docInput] = await screen.findAllByPlaceholderText('00.000.000/0000-00');

    fireEvent.change(docInput, { target: { value: '35577545000140' } });

    await waitFor(() => {
      expect(screen.getByText(/Tomador já cadastrado: TOMADOR SIM/i)).toBeInTheDocument();
      expect(
        screen.getByText(/Com retencao\/substituicao tributaria de ISS/i),
      ).toBeInTheDocument();
    });
    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'true');

    fireEvent.change(docInput, { target: { value: '32751008000186' } });

    await waitFor(() => {
      expect(screen.getByText(/Tomador já cadastrado: TOMADOR NAO/i)).toBeInTheDocument();
      expect(screen.getByText(/ISS devido ao proprio Municipio/i)).toBeInTheDocument();
    });
    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'false');
  });
});
