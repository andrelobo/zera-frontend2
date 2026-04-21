import React, { useState } from 'react';
import { act, render, screen, fireEvent, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import TomadorEmissao, { INITIAL_TOMADOR } from './TomadorEmissao';

const mocks = vi.hoisted(() => ({
  previewByCnpj: vi.fn(),
  lookupCpf: vi.fn(),
  lookupCep: vi.fn(),
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
}));

vi.mock('@/services/api', () => ({
  empresasApi: {
    previewByCnpj: mocks.previewByCnpj,
  },
  tomadoresApi: {
    lookupCpf: mocks.lookupCpf,
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

describe('TomadorEmissao UI', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('hides inscricao municipal when cpf is being used', () => {
    render(
      <TomadorEmissao
        data={{ ...INITIAL_TOMADOR, cnpjCpf: '610.207.881-00' }}
        onChange={vi.fn()}
        tomadores={[]}
      />,
    );

    expect(screen.queryByText('Inscrição Municipal')).toBeNull();
  });

  it('shows inscricao municipal when cnpj is being used', () => {
    render(
      <TomadorEmissao
        data={{ ...INITIAL_TOMADOR, cnpjCpf: '32.751.008/0001-86' }}
        onChange={vi.fn()}
        tomadores={[]}
      />,
    );

    expect(screen.getByText('Inscrição Municipal')).toBeTruthy();
  });

  it('autocompletes manual cpf in emissao using backend enrichment', async () => {
    mocks.lookupCpf.mockResolvedValue({
      cpf: '61020788100',
      source: 'hubdev_cadastropf',
      found: true,
      usefulData: true,
      maskedByLgpd: false,
      nome: 'Andre Lobo',
      email: 'andre@zera.app',
      endereco: {
        cep: '69010040',
        logradouro: 'Rua Saldanha Marinho',
        numero: '606',
        complemento: 'Sala 255',
        bairro: 'Centro',
        municipio: 'Manaus',
        uf: 'AM',
      },
    });

    const Harness = () => {
      const [data, setData] = useState(INITIAL_TOMADOR);
      return (
        <TomadorEmissao
          data={data}
          onChange={setData}
          tomadores={[]}
        />
      );
    };

    render(<Harness />);

    const docInput = screen.getByPlaceholderText('00.000.000/0000-00') as HTMLInputElement;

    await act(async () => {
      fireEvent.change(docInput, { target: { value: '61020788100' } });
    });

    await waitFor(() => {
      expect(mocks.lookupCpf).toHaveBeenCalledWith('61020788100');
      expect(screen.getByDisplayValue('Andre Lobo')).toBeTruthy();
    });
  });

  it('autocompletes manual cnpj in emissao using our preview api', async () => {
    mocks.previewByCnpj.mockResolvedValue({
      razaoSocial: 'BURGUS LTDA',
      inscricaoMunicipal: '51754301',
      email: 'contato@econtabilis.com',
      endereco: {
        cep: '69010040',
        logradouro: 'Rua Saldanha Marinho',
        numero: '606',
        complemento: 'Sala 255',
        bairro: 'Centro',
        cidade: 'Manaus',
        uf: 'AM',
      },
    });

    const Harness = () => {
      const [data, setData] = useState(INITIAL_TOMADOR);
      return (
        <TomadorEmissao
          data={data}
          onChange={setData}
          tomadores={[]}
        />
      );
    };

    render(<Harness />);

    const docInput = screen.getByPlaceholderText('00.000.000/0000-00') as HTMLInputElement;

    await act(async () => {
      fireEvent.change(docInput, { target: { value: '43521115000134' } });
    });

    await waitFor(() => {
      expect(mocks.previewByCnpj).toHaveBeenCalledWith('43521115000134');
      expect(screen.getByDisplayValue('BURGUS LTDA')).toBeTruthy();
      expect(screen.getByDisplayValue('51754301')).toBeTruthy();
    });
  });

  it('opens missing tomador data fields for a manual cpf not found in cadastro', async () => {
    mocks.lookupCpf.mockResolvedValue({
      cpf: '61020788100',
      found: false,
      usefulData: false,
    });

    const Harness = () => {
      const [data, setData] = useState(INITIAL_TOMADOR);
      return (
        <TomadorEmissao
          data={data}
          onChange={setData}
          tomadores={[]}
        />
      );
    };

    render(<Harness />);

    fireEvent.change(screen.getByPlaceholderText('00.000.000/0000-00'), { target: { value: '61020788100' } });

    expect(await screen.findByText('Dados do tomador para esta nota')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('00000-000')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Rua, Av., etc.')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Nº')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Bairro')).toBeInTheDocument();
  });

  it('lets the user choose whether a manual emission tomador goes to cadastro', () => {
    const onSyncTomadorCadastroChange = vi.fn();

    render(
      <TomadorEmissao
        data={{ ...INITIAL_TOMADOR, cnpjCpf: '610.207.881-00' }}
        onChange={vi.fn()}
        tomadores={[]}
        syncTomadorCadastro={false}
        onSyncTomadorCadastroChange={onSyncTomadorCadastroChange}
      />,
    );

    expect(screen.getByText('Cadastrar no cadastro de tomadores?')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Sim' }));
    expect(onSyncTomadorCadastroChange).toHaveBeenCalledWith(true);

    fireEvent.click(screen.getByRole('button', { name: 'Não' }));
    expect(onSyncTomadorCadastroChange).toHaveBeenCalledWith(false);
  });

  it('does not ask to cadastrar when the tomador already exists in cadastro', () => {
    render(
      <TomadorEmissao
        data={{ ...INITIAL_TOMADOR, cnpjCpf: '610.207.881-00' }}
        onChange={vi.fn()}
        tomadores={[{
          id: 'tom-1',
          empresaCnpj: '43521115000134',
          cpfCnpj: '61020788100',
          razaoSocial: 'ANDRE LOBO',
          substitutoTributario: false,
          createdAt: '2026-04-10T00:00:00.000Z',
          updatedAt: '2026-04-10T00:00:00.000Z',
        }]}
      />,
    );

    expect(screen.queryByText('Cadastrar no cadastro de tomadores?')).toBeNull();
    expect(screen.getByText(/Tomador já cadastrado: ANDRE LOBO/i)).toBeInTheDocument();
  });

  it('starts with Nao selected for a manual emission tomador', () => {
    render(
      <TomadorEmissao
        data={{ ...INITIAL_TOMADOR, cnpjCpf: '610.207.881-00' }}
        onChange={vi.fn()}
        tomadores={[]}
        syncTomadorCadastro={false}
      />,
    );

    expect(screen.getByRole('button', { name: 'Não' })).toHaveClass('bg-primary');
    expect(screen.getByRole('button', { name: 'Sim' })).not.toHaveClass('bg-primary');
  });

  it('autocompletes missing tomador address by cep during emission', async () => {
    mocks.lookupCpf.mockResolvedValue({
      cpf: '61020788100',
      found: false,
      usefulData: false,
    });
    mocks.lookupCep.mockResolvedValue({
      logradouro: 'AV Djalma Batista',
      bairro: 'Chapada',
      cidade: 'Manaus',
      uf: 'AM',
    });

    const Harness = () => {
      const [data, setData] = useState(INITIAL_TOMADOR);
      return (
        <TomadorEmissao
          data={data}
          onChange={setData}
          tomadores={[]}
        />
      );
    };

    render(<Harness />);

    fireEvent.change(screen.getByPlaceholderText('00.000.000/0000-00'), { target: { value: '61020788100' } });
    const cepInput = await screen.findByPlaceholderText('00000-000');

    await act(async () => {
      fireEvent.change(cepInput, { target: { value: '69050010' } });
    });

    await waitFor(() => {
      expect(mocks.lookupCep).toHaveBeenCalledWith('69050010');
      expect(screen.getByDisplayValue('AV DJALMA BATISTA')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Chapada')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Manaus - AM')).toBeInTheDocument();
    });
  });
});
