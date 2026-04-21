import type { ReactNode } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import TomadorFormPage from './TomadorFormPage';
import TomadoresPage from './TomadoresPage';

const mocks = vi.hoisted(() => ({
  listTomadores: vi.fn(),
  getTomadorById: vi.fn(),
  updateTomador: vi.fn(),
  createTomador: vi.fn(),
  listEmpresas: vi.fn(),
  toast: vi.fn(),
}));

vi.mock('@/services/api', () => ({
  tomadoresApi: {
    list: mocks.listTomadores,
    getById: mocks.getTomadorById,
    update: mocks.updateTomador,
    create: mocks.createTomador,
  },
  empresasApi: {
    list: mocks.listEmpresas,
  },
}));

vi.mock('@/hooks/use-toast', () => ({
  toast: mocks.toast,
}));

const baseTomador = {
  id: 'tom-1',
  empresaCnpj: '43521115000134',
  cpfCnpj: '35577545000140',
  razaoSocial: 'CLIENTE TESTE LTDA',
  nomeFantasia: undefined,
  inscricaoMunicipal: '123456',
  inscricaoEstadual: 'ISENTO',
  suframa: undefined,
  substitutoTributario: true,
  email: 'cliente@teste.com',
  whatsapp: '92999998888',
  endereco: {
    logradouro: 'RUA UM',
    numero: '10',
    complemento: '',
    bairro: 'CENTRO',
    municipio: 'MANAUS',
    uf: 'AM',
    cep: '69010040',
  },
  createdAt: '2026-04-10T00:00:00.000Z',
  updatedAt: '2026-04-10T00:00:00.000Z',
};

const renderWithProviders = (
  ui: ReactNode,
  {
    route = '/tomadores',
    path = '/tomadores',
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false, staleTime: 0 },
        mutations: { retry: false },
      },
    }),
  }: {
    route?: string;
    path?: string;
    queryClient?: QueryClient;
  } = {},
) => render(
  <QueryClientProvider client={queryClient}>
    <MemoryRouter initialEntries={[route]}>
      <Routes>
        <Route path={path} element={ui} />
        <Route path="/tomadores" element={<div>Tomadores</div>} />
      </Routes>
    </MemoryRouter>
  </QueryClientProvider>,
);

describe('Tomadores persistence flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.listTomadores.mockResolvedValue([]);
    mocks.listEmpresas.mockResolvedValue([]);
    mocks.getTomadorById.mockResolvedValue(baseTomador);
    mocks.updateTomador.mockResolvedValue({
      ...baseTomador,
      substitutoTributario: false,
    });
    mocks.createTomador.mockResolvedValue(baseTomador);
  });

  it('shows substituto tributario status from API on the tomadores list', async () => {
    mocks.listTomadores.mockResolvedValue([baseTomador]);

    renderWithProviders(<TomadoresPage />);

    expect(await screen.findByText('CLIENTE TESTE LTDA')).toBeInTheDocument();
    expect(screen.getByText('Sim')).toBeInTheDocument();
  });

  it('invalidates tomador detail cache after editing substituto tributario', async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false, staleTime: 30_000 },
        mutations: { retry: false },
      },
    });
    const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries');

    renderWithProviders(<TomadorFormPage />, {
      route: '/tomadores/tom-1',
      path: '/tomadores/:id',
      queryClient,
    });

    expect(await screen.findByDisplayValue('CLIENTE TESTE LTDA')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Não' }));
    fireEvent.click(screen.getByRole('button', { name: 'Salvar Tomador' }));

    await waitFor(() => {
      expect(mocks.updateTomador).toHaveBeenCalledWith(
        'tom-1',
        expect.objectContaining({ substitutoTributario: false }),
      );
    });

    await waitFor(() => {
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({ queryKey: ['tomadores'] });
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({ queryKey: ['tomador', 'tom-1'] });
    });
  });

  it('forces substituto tributario false when editing cpf tomador', async () => {
    const cpfTomador = {
      ...baseTomador,
      cpfCnpj: '61020788100',
      substitutoTributario: true,
    };

    mocks.getTomadorById.mockResolvedValue(cpfTomador);

    renderWithProviders(<TomadorFormPage />, {
      route: '/tomadores/tom-1',
      path: '/tomadores/:id',
    });

    expect(await screen.findByDisplayValue('CLIENTE TESTE LTDA')).toBeInTheDocument();
    expect(screen.getByText('Substituto Tributário')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Salvar Tomador' }));

    await waitFor(() => {
      expect(mocks.updateTomador).toHaveBeenCalledWith(
        'tom-1',
        expect.objectContaining({ substitutoTributario: false }),
      );
    });
  });
});
