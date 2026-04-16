import React, { useState } from 'react';
import { act, render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
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
});
