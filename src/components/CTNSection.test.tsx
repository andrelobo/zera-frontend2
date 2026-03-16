/** @vitest-environment jsdom */

import '@testing-library/jest-dom/vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import CTNSection from './CTNSection';

describe('CTNSection UI', () => {
  it('rehydrates top editor fields from saved CNAE data', async () => {
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

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Ex: 6201-5/00 ou 6201500')).toHaveValue('6920-6/01');
    });

    expect(screen.getByPlaceholderText('Buscar CTN...')).toHaveValue('17.19.01');
    expect(screen.getByPlaceholderText('Buscar NBS...')).toHaveValue('1.1302.21.00');
  });
});
