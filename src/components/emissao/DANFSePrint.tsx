import React from 'react';

interface PrintData {
  prestador: {
    cnpj: string;
    inscricaoMunicipal: string;
    nomeEmpresarial: string;
    nomeFantasia: string;
  };
  tomador: {
    cnpjCpf: string;
    nomeRazaoSocial: string;
    inscricaoMunicipal: string;
    email: string;
    logradouro: string;
    numero: string;
    complemento: string;
    bairro: string;
    localidadeUf: string;
    cep: string;
  };
  localPrestacao: {
    pais: string;
    uf: string;
    municipio: string;
  };
  servico: {
    codigoServico: string;
    descricaoServico: string;
    valorServico: string;
    aliquota: string;
    baseCalculo: string;
    desconto: string;
    issRetido: boolean;
  };
  valores: {
    valorBruto: number;
    desconto: number;
    issValor: number;
    retPis: number;
    retCofins: number;
    retCsll: number;
    retIr: number;
    retInss: number;
  };
}

function fmt(v: number) {
  return v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const Cell: React.FC<{ label: string; value: string; className?: string }> = ({ label, value, className = '' }) => (
  <td className={`danfse-cell ${className}`}>
    <span className="danfse-cell-label">{label}</span>
    <span className="danfse-cell-value">{value || '—'}</span>
  </td>
);

const DANFSePrint: React.FC<{ data: PrintData }> = ({ data }) => {
  const totalRetencoes =
    (data.servico.issRetido ? data.valores.issValor : 0) +
    data.valores.retPis + data.valores.retCofins +
    data.valores.retCsll + data.valores.retIr + data.valores.retInss;
  const valorLiquido = data.valores.valorBruto - data.valores.desconto - totalRetencoes;

  const enderecoTomador = [
    data.tomador.logradouro,
    data.tomador.numero,
    data.tomador.complemento,
    data.tomador.bairro,
  ].filter(Boolean).join(', ');

  return (
    <div className="danfse-print-container">
      {/* Cabeçalho */}
      <table className="danfse-table">
        <tbody>
          <tr>
            <td colSpan={4} className="danfse-header">
              <div className="danfse-header-inner">
                <div className="danfse-header-title">
                  <strong>PREFEITURA MUNICIPAL</strong>
                  <span>SECRETARIA DE FINANÇAS</span>
                </div>
                <div className="danfse-header-doc">
                  <strong>NFS-e</strong>
                  <span>NOTA FISCAL DE SERVIÇOS ELETRÔNICA</span>
                  <span className="danfse-header-num">Nº ________</span>
                </div>
                <div className="danfse-header-info">
                  <span>Data/Hora Emissão: __/__/____ __:__</span>
                  <span>Competência: __/____</span>
                  <span>Código Verificação: ________</span>
                </div>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      {/* Prestador */}
      <table className="danfse-table">
        <thead>
          <tr>
            <th colSpan={4} className="danfse-section-header">PRESTADOR DE SERVIÇOS</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <Cell label="CNPJ" value={data.prestador.cnpj} />
            <Cell label="Inscrição Municipal" value={data.prestador.inscricaoMunicipal} />
            <Cell label="Nome/Razão Social" value={data.prestador.nomeEmpresarial} className="danfse-cell-wide" />
            <Cell label="Nome Fantasia" value={data.prestador.nomeFantasia} />
          </tr>
        </tbody>
      </table>

      {/* Tomador */}
      <table className="danfse-table">
        <thead>
          <tr>
            <th colSpan={4} className="danfse-section-header">TOMADOR DE SERVIÇOS</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <Cell label="CPF/CNPJ" value={data.tomador.cnpjCpf} />
            <Cell label="Inscrição Municipal" value={data.tomador.inscricaoMunicipal} />
            <Cell label="Nome/Razão Social" value={data.tomador.nomeRazaoSocial} className="danfse-cell-wide" />
            <Cell label="E-mail" value={data.tomador.email} />
          </tr>
          <tr>
            <Cell label="Endereço" value={enderecoTomador} className="danfse-cell-wide" />
            <Cell label="Município/UF" value={data.tomador.localidadeUf} />
            <Cell label="CEP" value={data.tomador.cep} />
            <Cell label="País" value="Brasil" />
          </tr>
        </tbody>
      </table>

      {/* Discriminação */}
      <table className="danfse-table">
        <thead>
          <tr>
            <th colSpan={4} className="danfse-section-header">DISCRIMINAÇÃO DOS SERVIÇOS</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <Cell label="Código do Serviço" value={data.servico.codigoServico} />
            <Cell label="Local da Prestação" value={`${data.localPrestacao.municipio}${data.localPrestacao.uf ? ' - ' + data.localPrestacao.uf : ''}`} className="danfse-cell-wide" />
            <Cell label="País" value={data.localPrestacao.pais} />
            <Cell label="ISS Retido" value={data.servico.issRetido ? 'SIM' : 'NÃO'} />
          </tr>
          <tr>
            <td colSpan={4} className="danfse-cell">
              <span className="danfse-cell-label">Descrição do Serviço</span>
              <span className="danfse-cell-value danfse-cell-desc">{data.servico.descricaoServico || '—'}</span>
            </td>
          </tr>
        </tbody>
      </table>

      {/* Valores */}
      <table className="danfse-table">
        <thead>
          <tr>
            <th colSpan={6} className="danfse-section-header">VALORES</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <Cell label="Valor dos Serviços (R$)" value={fmt(data.valores.valorBruto)} />
            <Cell label="Desconto (R$)" value={fmt(data.valores.desconto)} />
            <Cell label="Base de Cálculo (R$)" value={fmt(data.valores.valorBruto - data.valores.desconto)} />
            <Cell label="Alíquota (%)" value={data.servico.aliquota || '—'} />
            <Cell label="Valor ISS (R$)" value={fmt(data.valores.issValor)} />
            <Cell label="ISS Retido (R$)" value={data.servico.issRetido ? fmt(data.valores.issValor) : '0,00'} />
          </tr>
        </tbody>
      </table>

      {/* Retenções */}
      <table className="danfse-table">
        <thead>
          <tr>
            <th colSpan={5} className="danfse-section-header">RETENÇÕES FEDERAIS</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <Cell label="PIS (R$)" value={fmt(data.valores.retPis)} />
            <Cell label="COFINS (R$)" value={fmt(data.valores.retCofins)} />
            <Cell label="CSLL (R$)" value={fmt(data.valores.retCsll)} />
            <Cell label="IR (R$)" value={fmt(data.valores.retIr)} />
            <Cell label="INSS (R$)" value={fmt(data.valores.retInss)} />
          </tr>
        </tbody>
      </table>

      {/* Valor Líquido */}
      <table className="danfse-table">
        <tbody>
          <tr>
            <td className="danfse-cell danfse-cell-total">
              <span className="danfse-cell-label">VALOR LÍQUIDO DA NFS-e (R$)</span>
              <span className="danfse-cell-value danfse-total-value">{fmt(Math.max(0, valorLiquido))}</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default DANFSePrint;
