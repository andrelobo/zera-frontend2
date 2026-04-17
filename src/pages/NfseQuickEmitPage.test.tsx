import type { ReactNode } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import NfseQuickEmitPage from './NfseQuickEmitPage';

const mocks = vi.hoisted(() => ({
  empresasList: vi.fn(),
  empresaGetByCnpj: vi.fn(),
  emitirQuick: vi.fn(),
  servicosList: vi.fn(),
  servicosAutocomplete: vi.fn(),
  toast: vi.fn(),
  navigate: vi.fn(),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mocks.navigate,
  };
});

vi.mock('@/services/api', () => ({
  empresasApi: {
    list: mocks.empresasList,
    getByCnpj: mocks.empresaGetByCnpj,
  },
  nfseApi: {
    emitirQuick: mocks.emitirQuick,
    servicosList: mocks.servicosList,
    servicosAutocomplete: mocks.servicosAutocomplete,
  },
}));

vi.mock('@/hooks/use-toast', () => ({
  toast: mocks.toast,
}));

const empresaResumo = {
  id: 'empresa-1',
  cnpj: '43.521.115/0001-34',
  razaoSocial: 'BURGUS LTDA',
  createdAt: '2026-04-10T00:00:00.000Z',
  updatedAt: '2026-04-10T00:00:00.000Z',
};

const empresaDetalhe = {
  ...empresaResumo,
  parametroMunicipal: [
    {
      codigo: '6920601',
      cnaeDescricao: 'Atividades de contabilidade',
      vinculos: [
        {
          ctn: '171901',
          ctnDescricao: 'Contabilidade, inclusive serviços técnicos e auxiliares.',
          nbs: '1.1302.21.00',
          nbsDescricao: 'Serviços de contabilidade.',
        },
      ],
    },
    {
      codigo: '7319002',
      cnaeDescricao: 'Promoção de vendas',
      vinculos: [
        {
          ctn: '170601',
          ctnDescricao: 'Propaganda e publicidade, inclusive promoção de vendas.',
          nbs: '1.1406.11.00',
          nbsDescricao: 'Serviços de campanhas publicitárias.',
        },
      ],
    },
  ],
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

describe('NfseQuickEmitPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
      configurable: true,
      value: vi.fn(),
    });
    mocks.empresasList.mockResolvedValue([empresaResumo]);
    mocks.empresaGetByCnpj.mockResolvedValue(empresaDetalhe);
    mocks.servicosList.mockResolvedValue({ items: [], total: 0 });
    mocks.servicosAutocomplete.mockResolvedValue({ items: [], total: 0 });
    mocks.emitirQuick.mockResolvedValue({
      emissionId: 'em-quick-1',
      idempotentReplay: false,
      result: { status: 'PENDING', provider: 'PLUGNOTAS' },
    });
  });

  it('prioritizes services from cadastro do prestador in quick emit', async () => {
    renderPage(<NfseQuickEmitPage />);

    expect(await screen.findByText(/Serviços do cadastro do prestador selecionado/i)).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: /Serviço do cadastro/i })).toBeInTheDocument();
    expect(screen.getByText(/Selecione entre 2 serviço\(s\) cadastrados/i)).toBeInTheDocument();
    expect(mocks.empresaGetByCnpj).toHaveBeenCalledWith('43521115000134');
    expect(screen.queryByText(/Serviço \(autocomplete\)/i)).not.toBeInTheDocument();
  });

  it('falls back to global catalog when cadastro has no services', async () => {
    mocks.empresaGetByCnpj.mockResolvedValue({ ...empresaResumo, parametroMunicipal: [], configOperacionais: [] });

    renderPage(<NfseQuickEmitPage />);

    expect(await screen.findByText(/Cadastro sem serviços configurados\. Usando catálogo global como fallback\./i)).toBeInTheDocument();
    expect(screen.getByText(/Serviço \(autocomplete\)/i)).toBeInTheDocument();
  });

  it('submits quick emission with a service selected from cadastro', async () => {
    renderPage(<NfseQuickEmitPage />);

    fireEvent.change(await screen.findByLabelText(/CPF do tomador/i), { target: { value: '61020788100' } });
    fireEvent.change(screen.getByLabelText(/^Valor$/i), { target: { value: '12345' } });

    const selectTrigger = await screen.findByRole('combobox', { name: /Serviço do cadastro/i });
    fireEvent.click(selectTrigger);
    fireEvent.click(await screen.findByRole('option', { name: /170601 - Serviços de campanhas publicitárias/i }));

    fireEvent.click(screen.getByRole('button', { name: /Emitir NFSe rápida/i }));

    await waitFor(() => {
      expect(mocks.emitirQuick).toHaveBeenCalledWith({
        cnpj: '43521115000134',
        cpfTomador: '61020788100',
        valor: 123.45,
        codigoServico: '170601',
      });
    });
  });
});
