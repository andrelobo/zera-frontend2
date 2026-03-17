import React, { useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import TomadorSection, { type TomadorSectionData } from './TomadorSection';

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
});
