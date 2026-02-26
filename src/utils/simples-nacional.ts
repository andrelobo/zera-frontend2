// Tabela Anexo III do Simples Nacional
export interface FaixaAnexoIII {
  faixa: number;
  limiteInferior: number;
  limiteSuperior: number;
  aliquotaNominal: number;
  parcelaDeduzir: number;
}

export const FAIXAS_ANEXO_III: FaixaAnexoIII[] = [
  { faixa: 1, limiteInferior: 0, limiteSuperior: 180000, aliquotaNominal: 0.06, parcelaDeduzir: 0 },
  { faixa: 2, limiteInferior: 180000.01, limiteSuperior: 360000, aliquotaNominal: 0.112, parcelaDeduzir: 9360 },
  { faixa: 3, limiteInferior: 360000.01, limiteSuperior: 720000, aliquotaNominal: 0.135, parcelaDeduzir: 17640 },
  { faixa: 4, limiteInferior: 720000.01, limiteSuperior: 1800000, aliquotaNominal: 0.16, parcelaDeduzir: 35640 },
  { faixa: 5, limiteInferior: 1800000.01, limiteSuperior: 3600000, aliquotaNominal: 0.21, parcelaDeduzir: 125640 },
  { faixa: 6, limiteInferior: 3600000.01, limiteSuperior: 4800000, aliquotaNominal: 0.33, parcelaDeduzir: 648000 },
];

export interface CalculoSimplesResult {
  faixa: FaixaAnexoIII | null;
  aliquotaEfetiva: number;
  issReferencia: number;
  alertas: string[];
  valido: boolean;
}

const PERCENTUAL_ISS_ANEXO_III = 0.335; // 33,5% da alíquota efetiva

export function calcularSimplesAnexoIII(rbt12: number, anexo: string): CalculoSimplesResult {
  const alertas: string[] = [];

  if (rbt12 <= 0) {
    return { faixa: null, aliquotaEfetiva: 0, issReferencia: 0, alertas: ['Informe um valor válido de RBT12 (Receita Bruta 12 meses).'], valido: false };
  }

  if (anexo !== 'III') {
    return { faixa: null, aliquotaEfetiva: 0, issReferencia: 0, alertas: [`Este CNAE não pertence ao Anexo III (pertence ao Anexo ${anexo}). Verifique o enquadramento.`], valido: false };
  }

  if (rbt12 > 4800000) {
    alertas.push('RBT12 acima do limite do Simples Nacional (R$ 4.800.000). Possível desenquadramento.');
    return { faixa: null, aliquotaEfetiva: 0, issReferencia: 0, alertas, valido: false };
  }

  const faixa = FAIXAS_ANEXO_III.find(f => rbt12 >= f.limiteInferior && rbt12 <= f.limiteSuperior) || null;

  if (!faixa) {
    return { faixa: null, aliquotaEfetiva: 0, issReferencia: 0, alertas: ['Não foi possível determinar a faixa.'], valido: false };
  }

  const aliquotaEfetiva = ((rbt12 * faixa.aliquotaNominal) - faixa.parcelaDeduzir) / rbt12;
  const issReferencia = aliquotaEfetiva * PERCENTUAL_ISS_ANEXO_III;

  return { faixa, aliquotaEfetiva, issReferencia, alertas, valido: true };
}

export function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function formatPercent(value: number): string {
  return (value * 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 4 }) + '%';
}

export function parseCurrencyInput(value: string): number {
  if (!value) return 0;
  return parseFloat(value.replace(/\./g, '').replace(',', '.')) || 0;
}

export function formatCurrencyInput(value: number): string {
  if (value === 0) return '';
  return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function distanciaProximaFaixa(rbt12: number): { valor: number; faixaAtual: number; faixaProxima: number } | null {
  if (rbt12 <= 0 || rbt12 > 4800000) return null;
  const faixaAtual = FAIXAS_ANEXO_III.find(f => rbt12 >= f.limiteInferior && rbt12 <= f.limiteSuperior);
  if (!faixaAtual || faixaAtual.faixa === 6) return null;
  return {
    valor: faixaAtual.limiteSuperior - rbt12,
    faixaAtual: faixaAtual.faixa,
    faixaProxima: faixaAtual.faixa + 1,
  };
}
