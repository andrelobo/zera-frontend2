import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import TomadorEmissao, { INITIAL_TOMADOR } from './TomadorEmissao';

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
});
