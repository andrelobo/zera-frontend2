/** @vitest-environment jsdom */

import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import CTNSection from './CTNSection';

describe('CTNSection UI', () => {
  it('keeps the top editor empty even when favorites are inherited from saved CNAEs', () => {
    render(
      <CTNSection
        ctnSelecionado={null}
        onCtnChange={vi.fn()}
        onCnaesChange={vi.fn()}
        savedCnaes={[
          {
            codigo: '6920601',
            cnaeDescricao: 'Atividades de contabilidade',
            lc116Descricao: 'Contabilidade, inclusive serviços técnicos e auxiliares.',
            lc116Item: '17.19',
            isPrincipal: true,
            vinculos: [
              {
                id: 'v1',
                ctn: '171901',
                ctnDescricao: 'Contabilidade, inclusive serviços técnicos e auxiliares.',
                nbs: '1.1302.21.00',
                nbsDescricao: 'Serviços de contabilidade.',
              },
            ],
          },
        ]}
      />,
    );

    expect(screen.getByPlaceholderText('Ex: 6201-5/00 ou 6201500')).toHaveValue('');
    expect(screen.getByPlaceholderText('Buscar CTN...')).toHaveValue('');
    expect(screen.getByPlaceholderText('Buscar NBS...')).toHaveValue('');
    expect(screen.getByText('Serviços Favoritos')).toBeInTheDocument();
    expect(screen.getByText('Atividades de contabilidade')).toBeInTheDocument();
  });

  it('keeps the CNAE field editable while favorites remain visible below', () => {
    render(
      <CTNSection
        ctnSelecionado={null}
        onCtnChange={vi.fn()}
        onCnaesChange={vi.fn()}
        savedCnaes={[
          {
            codigo: '6920601',
            cnaeDescricao: 'Atividades de contabilidade',
            lc116Descricao: 'Contabilidade, inclusive serviços técnicos e auxiliares.',
            lc116Item: '17.19',
            isPrincipal: true,
            vinculos: [
              {
                id: 'v1',
                ctn: '171901',
                ctnDescricao: 'Contabilidade, inclusive serviços técnicos e auxiliares.',
                nbs: '1.1302.21.00',
                nbsDescricao: 'Serviços de contabilidade.',
              },
            ],
          },
        ]}
      />,
    );

    const cnaeInput = screen.getByPlaceholderText('Ex: 6201-5/00 ou 6201500');
    expect(cnaeInput).toHaveValue('');

    fireEvent.change(cnaeInput, { target: { value: '6201' } });

    expect(cnaeInput).toHaveValue('6201');
    expect(screen.getByText('Atividades de contabilidade')).toBeInTheDocument();
  });
});
