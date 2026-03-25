/** @vitest-environment jsdom */

import '@testing-library/jest-dom/vitest';
import React, { useState } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import PrestacaoServicoSection, { type ListaServicoItem, type PrestacaoServicoData } from './PrestacaoServicoSection';

const INITIAL_DATA: PrestacaoServicoData = {
  codigoServico: '',
  descricaoServico: '',
  localPrestacao: '',
  valorServico: '',
  aliquota: '',
  baseCalculo: '',
  issRetido: false,
  desconto: '',
  retPis: '',
  retCofins: '',
  retCsll: '',
  retIr: '',
  retInss: '',
};

function renderHarness({
  favoritos,
  listaServico = [],
}: {
  favoritos: Array<{
    codigo: string;
    cnaeDescricao: string;
    lc116Item: string;
    vinculos: { ctn?: string; ctnDescricao?: string; nbs?: string; nbsDescricao?: string }[];
  }>;
  listaServico?: ListaServicoItem[];
}) {
  const Harness = () => {
    const [data, setData] = useState<PrestacaoServicoData>(INITIAL_DATA);
    return (
      <PrestacaoServicoSection
        data={data}
        onChange={setData}
        mostrarRetencoesFederais
        favoritos={favoritos}
        listaServico={listaServico}
      />
    );
  };

  return render(<Harness />);
}

describe('PrestacaoServicoSection UI', () => {
  it('keeps favoritos only as suggestion on an empty emission', async () => {
    renderHarness({
      favoritos: [
        {
          codigo: '6920601',
          cnaeDescricao: 'Atividades de contabilidade',
          lc116Item: '17.19',
          vinculos: [
            {
              ctn: '171901',
              ctnDescricao: 'Contabilidade, inclusive serviços técnicos e auxiliares.',
              nbs: '1.1302.21.00',
              nbsDescricao: 'Serviços de contabilidade.',
            },
          ],
        },
      ],
    });

    const favoritosInput = screen.getByPlaceholderText('Buscar entre 1 serviço(s)...');
    const ctnInput = screen.getByPlaceholderText('Buscar código ou descrição...');
    const descricaoInput = screen.getByPlaceholderText('Descreva o serviço prestado conforme a NFS-e...');

    expect(favoritosInput).toHaveValue('');
    expect(ctnInput).toHaveValue('');
    expect(descricaoInput).toHaveValue('');
  });

  it('autofills CTN and keeps descricao vazia after selecting a favorite', async () => {
    renderHarness({
      favoritos: [
        {
          codigo: '6920601',
          cnaeDescricao: 'Atividades de contabilidade',
          lc116Item: '17.19',
          vinculos: [
            {
              ctn: '171901',
              ctnDescricao: 'Contabilidade, inclusive serviços técnicos e auxiliares.',
              nbs: '1.1302.21.00',
              nbsDescricao: 'Serviços de contabilidade.',
            },
          ],
        },
      ],
    });

    const favoritosInput = screen.getByPlaceholderText('Buscar entre 1 serviço(s)...');
    fireEvent.focus(favoritosInput);

    const favoritoOption = await screen.findByRole('button', {
      name: /171901/i,
    });
    fireEvent.click(favoritoOption);

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Buscar entre 1 serviço(s)...')).toHaveValue(
        '6920-6/01 — Atividades de contabilidade',
      );
    });

    expect(screen.getByPlaceholderText('Buscar código ou descrição...')).toHaveValue('17.19.01');
    expect(screen.getByPlaceholderText('Descreva o serviço prestado conforme a NFS-e...')).toHaveValue('');
  });

  it('appends descricao from Lista Serviço selection without replacing CTN', async () => {
    renderHarness({
      favoritos: [
        {
          codigo: '6920601',
          cnaeDescricao: 'Atividades de contabilidade',
          lc116Item: '17.19',
          vinculos: [{ ctn: '171901', ctnDescricao: 'Contabilidade.' }],
        },
      ],
      listaServico: [
        {
          id: 'svc-1',
          natureza: 'Contabilidade',
          descricao: 'Serviço contábil mensal',
        },
      ],
    });

    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'svc-1' } });

    expect(screen.getByPlaceholderText('Descreva o serviço prestado conforme a NFS-e...')).toHaveValue(
      'Serviço contábil mensal',
    );
    expect(screen.getByPlaceholderText('Buscar código ou descrição...')).toHaveValue('');
  });

  it('does not commit manual CTN typing on blur by itself', async () => {
    renderHarness({
      favoritos: [],
    });

    const ctnInput = screen.getByPlaceholderText('Buscar código ou descrição...') as HTMLInputElement;

    fireEvent.focus(ctnInput);
    fireEvent.change(ctnInput, { target: { value: '171901' } });
    expect(ctnInput.value).toBe('171901');

    fireEvent.blur(ctnInput, { target: { value: '171901' } });

    expect(screen.getByPlaceholderText('Descreva o serviço prestado conforme a NFS-e...')).toHaveValue('');
  });

  it('keeps descricao do servico editable after autopreenchimento', async () => {
    renderHarness({
      favoritos: [
        {
          codigo: '6920601',
          cnaeDescricao: 'Atividades de contabilidade',
          lc116Item: '17.19',
          vinculos: [
            {
              ctn: '171901',
              ctnDescricao: 'Contabilidade, inclusive serviços técnicos e auxiliares.',
            },
          ],
        },
      ],
    });

    const favoritosInput = screen.getByPlaceholderText('Buscar entre 1 serviço(s)...');
    fireEvent.focus(favoritosInput);
    fireEvent.click(
      await screen.findByRole('button', {
        name: /171901/i,
      }),
    );

    const descricaoInput = screen.getByPlaceholderText(
      'Descreva o serviço prestado conforme a NFS-e...',
    ) as HTMLTextAreaElement;

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Buscar código ou descrição...')).toHaveValue('17.19.01');
    });

    expect(descricaoInput.value).toBe('');

    fireEvent.change(descricaoInput, { target: { value: 'Descrição ajustada manualmente' } });
    expect(descricaoInput.value).toBe('Descrição ajustada manualmente');
  });
});
