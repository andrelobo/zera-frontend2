/** @vitest-environment jsdom */

import '@testing-library/jest-dom/vitest';
import React, { useState } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import PrestacaoServicoSection, { type ListaServicoItem, type PrestacaoServicoData } from './PrestacaoServicoSection';
import { getCTNByCode } from '@/utils/ctn-data';

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
  it('autofills CTN and description from saved favorite config', async () => {
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

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Buscar entre 1 serviço(s)...')).toHaveValue(
        '6920-6/01 — Atividades de contabilidade',
      );
    });

    expect(screen.getByPlaceholderText('Buscar código ou descrição...')).toHaveValue('17.19.01');
    expect(screen.getByPlaceholderText('Descreva o serviço prestado conforme a NFS-e...')).toHaveValue(
      getCTNByCode('171901')?.descricao ?? '',
    );
  });

  it('fills code and description from Lista Serviço selection', async () => {
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
          codigoServico: '171901',
          aliquota: '5,00',
        },
      ],
    });

    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'svc-1' } });

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Buscar código ou descrição...')).toHaveValue('17.19.01');
    });

    expect(screen.getByPlaceholderText('Descreva o serviço prestado conforme a NFS-e...')).toHaveValue(
      'Serviço contábil mensal',
    );
  });
});
