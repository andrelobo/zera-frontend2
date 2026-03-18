import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import EmpresaCard from './EmpresaCard';
import EnderecoCard from './EnderecoCard';
import ContatoCard from './ContatoCard';

describe('prestador cards', () => {
  it('forwards empresa fields and cnpj toggle actions correctly', () => {
    const onFieldChange = vi.fn();
    const onCNPJChange = vi.fn();
    const onSimplesToggle = vi.fn();

    render(
      <EmpresaCard
        data={{
          cnpj: '43.521.115/0001-34',
          nomeEmpresarial: 'BURGUS LTDA',
          nomeFantasia: 'ECONTABILIS LTDA',
          inscricaoMunicipal: '51754301',
          inscricaoEstadual: 'ISENTO',
          suframa: 'NP',
          dataOpcaoSimples: '2021-09-15',
        }}
        onFieldChange={onFieldChange}
        onCNPJChange={onCNPJChange}
        loadingCNPJ={false}
        simplesStatus={true}
        onSimplesToggle={onSimplesToggle}
      />,
    );

    fireEvent.change(screen.getByPlaceholderText('00.000.000/0000-00'), { target: { value: '43521115000134' } });
    fireEvent.change(screen.getByPlaceholderText('Razão Social'), { target: { value: 'BURGUS LTDA AJUSTADA' } });
    fireEvent.click(screen.getByRole('button', { name: 'Não' }));

    expect(onCNPJChange).toHaveBeenCalledWith('43521115000134');
    expect(onFieldChange).toHaveBeenCalledWith('nomeEmpresarial', 'BURGUS LTDA AJUSTADA');
    expect(onSimplesToggle).toHaveBeenCalledWith(false);
    expect(screen.getByText(/Opção desde:/)).toBeTruthy();
  });

  it('forwards cep and address changes correctly', () => {
    const onFieldChange = vi.fn();
    const onCEPChange = vi.fn();

    render(
      <EnderecoCard
        cep="69010-040"
        logradouro="R SALDANHA MARINHO"
        numero="606"
        complemento="SALA 255"
        bairro="CENTRO"
        localidadeUf="Manaus - AM"
        onFieldChange={onFieldChange}
        onCEPChange={onCEPChange}
        loadingCEP={false}
      />,
    );

    fireEvent.change(screen.getByPlaceholderText('00000-000'), { target: { value: '69010040' } });
    fireEvent.change(screen.getByPlaceholderText('Rua, Av., etc.'), { target: { value: 'Rua Nova' } });
    fireEvent.change(screen.getByPlaceholderText('Nº'), { target: { value: '12A-B' } });
    fireEvent.change(screen.getByPlaceholderText('Cidade - UF'), { target: { value: 'Coari - AM' } });

    expect(onCEPChange).toHaveBeenCalledWith('69010040');
    expect(onFieldChange).toHaveBeenCalledWith('logradouro', 'Rua Nova');
    expect(onFieldChange).toHaveBeenCalledWith('numero', '12-' );
    expect(onFieldChange).toHaveBeenCalledWith('localidadeUf', 'Coari - AM');
  });

  it('forwards raw whatsapp input and email changes', () => {
    const onFieldChange = vi.fn();

    render(
      <ContatoCard
        email="contato@empresa.com.br"
        whatsapp=""
        onFieldChange={onFieldChange}
      />,
    );

    fireEvent.change(screen.getByPlaceholderText('contato@empresa.com.br'), { target: { value: 'novo@empresa.com.br' } });
    fireEvent.change(screen.getByPlaceholderText('(00) 00000-0000'), { target: { value: '92991594210' } });

    expect(onFieldChange).toHaveBeenCalledWith('email', 'novo@empresa.com.br');
    expect(onFieldChange).toHaveBeenCalledWith('whatsapp', '92991594210');
  });

  it('does not trim whatsapp input while typing', () => {
    const onFieldChange = vi.fn();

    render(
      <ContatoCard
        email=""
        whatsapp=""
        onFieldChange={onFieldChange}
      />,
    );

    fireEvent.change(screen.getByPlaceholderText('contato@empresa.com.br'), {
      target: { value: '  contato@empresa.com.br  ' },
    });
    fireEvent.change(screen.getByPlaceholderText('(00) 00000-0000'), {
      target: { value: ' 92991594210 ' },
    });

    expect(onFieldChange).toHaveBeenCalledWith('email', 'contato@empresa.com.br');
    expect(onFieldChange).toHaveBeenCalledWith('whatsapp', ' 92991594210 ');
  });
});
