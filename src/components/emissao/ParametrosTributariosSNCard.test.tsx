import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import ParametrosTributariosSNCard from './ParametrosTributariosSNCard';

describe('ParametrosTributariosSNCard', () => {
  it('renders the title and expands the automatic rule list', () => {
    render(<ParametrosTributariosSNCard />);

    const button = screen.getByRole('button', {
      name: /Prestação de serviços, exceto para o exterior\./i,
    });

    expect(screen.queryByText(/Regra automática na emissão da nfse por tomador e local\./i)).not.toBeInTheDocument();

    fireEvent.click(button);

    expect(screen.getByText(/Regra automática na emissão da nfse por tomador e local\./i)).toBeInTheDocument();
    expect(
      screen.getByText(/Não sujeitos ao fator "r" e tributados pelo Anexo III, com retenção\/substituição tributária de ISS\./i),
    ).toBeInTheDocument();
  });
});
