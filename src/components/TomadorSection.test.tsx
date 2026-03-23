import React, { useState } from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import TomadorSection, { type TomadorSectionData } from './TomadorSection';

const mocks = vi.hoisted(() => ({
  previewByCnpj: vi.fn(),
  lookupCep: vi.fn(),
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
}));

vi.mock('@/services/api', () => ({
  empresasApi: {
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

const baseTomador = (): TomadorSectionData => ({
  nomeEmpresarial: '',
  nomeFantasia: '',
  cnpjCpf: '35.577.545/0001-40',
  inscricaoMunicipal: '',
  inscricaoEstadual: '',
  suframa: '',
  substitutoTributario: false,
  cep: '',
  logradouro: 'AV GETULIO VARGAS',
  numero: '',
  complemento: '',
  bairro: '',
  localidadeUf: '',
  email: '',
  whatsapp: '',
});

describe('TomadorSection UI', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('allows editing logradouro after prefilled value without swallowing spaces', () => {
    const Harness = () => {
      const [data, setData] = useState(baseTomador());

      return (
        <TomadorSection
          data={data}
          onChange={setData}
          onAutosave={vi.fn()}
        />
      );
    };

    render(<Harness />);

    const input = screen.getByPlaceholderText('Rua, Av., etc.') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'Avenida ' } });
    expect(input.value).toBe('AV ');

    fireEvent.change(input, { target: { value: 'Avenida Brasil' } });
    expect(input.value).toBe('AV BRASIL');
  });

  it('allows editing localidade, cep and whatsapp after prefilled values', async () => {
    const Harness = () => {
      const [data, setData] = useState({
        ...baseTomador(),
        cep: '69010-040',
        localidadeUf: 'Manaus - AM',
        whatsapp: '(92) 99159-4210',
      });

      return (
        <TomadorSection
          data={data}
          onChange={setData}
          onAutosave={vi.fn()}
        />
      );
    };

    render(<Harness />);

    const cepInput = screen.getByPlaceholderText('00000-000') as HTMLInputElement;
    const localidadeInput = screen.getByPlaceholderText('Cidade - UF') as HTMLInputElement;
    const whatsappInput = screen.getByPlaceholderText('(00) 00000-0000') as HTMLInputElement;

    mocks.lookupCep.mockResolvedValue({
      logradouro: 'AV DJALMA BATISTA',
      bairro: 'CHAPADA',
      cidade: 'Manaus',
      uf: 'AM',
    });

    await act(async () => {
      fireEvent.change(cepInput, { target: { value: '69050010' } });
    });
    expect(cepInput.value).toBe('69050-010');

    await act(async () => {
      fireEvent.change(localidadeInput, { target: { value: 'Coari - AM' } });
    });
    expect(localidadeInput.value).toBe('Coari - AM');

    await act(async () => {
      fireEvent.change(whatsappInput, { target: { value: '92981234567' } });
    });
    expect(whatsappInput.value).toBe('92981234567');

    await act(async () => {
      fireEvent.blur(whatsappInput, { target: { value: '92981234567' } });
    });
    expect(whatsappInput.value).toBe('(92) 98123-4567');
  });
});
