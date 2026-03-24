import type { Empresa } from '@/types/api';
import { calcularSimplesAnexoIII } from '@/utils/simples-nacional';

export type ParametroIssEmissao =
  | ''
  | 'iss_outro_municipio'
  | 'iss_proprio_municipio'
  | 'iss_retencao_substituicao';

export function resolveParametroIssLabel(value: ParametroIssEmissao): string {
  const map: Record<Exclude<ParametroIssEmissao, ''>, string> = {
    iss_outro_municipio: 'Anexo III – ISS devido a outro(s) Municipio(s)',
    iss_proprio_municipio: 'Anexo III – ISS devido ao proprio Municipio',
    iss_retencao_substituicao: 'Anexo III – Com retencao/substituicao tributaria de ISS',
  };

  return value ? map[value] || '' : '';
}

interface EmpresaTributacao {
  optanteSimples: boolean;
  simplesAnexo: string;
  rbt12: number;
}

interface ResolveIssAutomationInput extends EmpresaTributacao {
  tomadorSubstituto: boolean;
  localMunicipio: string;
  localUf: string;
  aliquotaAtual: string;
}

function parseDecimal(value: number | string | null | undefined): number {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (typeof value !== 'string') return 0;

  const normalized = value.trim();
  if (!normalized) return 0;

  return Number.parseFloat(normalized.replace(/\./g, '').replace(',', '.')) || 0;
}

function normalizeAnexo(value: unknown): string {
  return String(value || '')
    .replace(/anexo\s*/i, '')
    .trim()
    .toUpperCase();
}

function resolveAnexoFromEmpresa(empresa?: Empresa | null): string {
  const snapshotAnexo = normalizeAnexo(empresa?.simplesSnapshot?.anexo);
  if (snapshotAnexo) return snapshotAnexo;

  const principalCnaeAnexo = normalizeAnexo(
    empresa?.cnaesLista?.find((item) => item?.isPrincipal)?.anexo,
  );
  if (principalCnaeAnexo) return principalCnaeAnexo;

  const firstCnaeAnexo = normalizeAnexo(empresa?.cnaesLista?.find((item) => item?.anexo)?.anexo);
  if (firstCnaeAnexo) return firstCnaeAnexo;

  return '';
}

export function resolveEmpresaTributacao(empresa?: Empresa | null): EmpresaTributacao {
  return {
    optanteSimples: Boolean(empresa?.opcaoPeloSimples),
    simplesAnexo: resolveAnexoFromEmpresa(empresa),
    rbt12: parseDecimal(empresa?.simplesSnapshot?.rbt12 ?? empresa?.rbt12),
  };
}

export function determinarParametroIssEmissao(
  isSub: boolean,
  localMunicipio: string,
  localUf: string,
  optanteSimples: boolean,
  simplesAnexo: string,
): ParametroIssEmissao {
  if (!optanteSimples || simplesAnexo !== 'III') return '';
  if (isSub) return 'iss_retencao_substituicao';

  const municipio = String(localMunicipio || '').trim().toLowerCase();
  const uf = String(localUf || '').trim().toUpperCase();
  const isManaus = municipio.includes('manaus') && uf === 'AM';

  if (isManaus) return 'iss_proprio_municipio';
  return 'iss_outro_municipio';
}

export function formatIssPercentForSimples(rbt12: number, simplesAnexo: string): string {
  const calculo = calcularSimplesAnexoIII(rbt12, simplesAnexo || '');
  return calculo.valido ? (calculo.issReferencia * 100).toFixed(2).replace('.', ',') : '';
}

export function resolveIssAutomation({
  optanteSimples,
  simplesAnexo,
  rbt12,
  tomadorSubstituto,
  localMunicipio,
  localUf,
  aliquotaAtual,
}: ResolveIssAutomationInput): {
  parametroIssAplicado: ParametroIssEmissao;
  issRetido: boolean;
  aliquota: string;
} {
  const parametroIssAplicado = determinarParametroIssEmissao(
    tomadorSubstituto,
    localMunicipio,
    localUf,
    optanteSimples,
    simplesAnexo,
  );

  if (optanteSimples && simplesAnexo === 'III') {
    if (tomadorSubstituto) {
      return {
        parametroIssAplicado,
        issRetido: true,
        aliquota: formatIssPercentForSimples(rbt12, simplesAnexo),
      };
    }

    return {
      parametroIssAplicado,
      issRetido: false,
      aliquota: '',
    };
  }

  if (tomadorSubstituto) {
    return {
      parametroIssAplicado,
      issRetido: true,
      aliquota: aliquotaAtual,
    };
  }

  return {
    parametroIssAplicado,
    issRetido: false,
    aliquota: optanteSimples ? '' : aliquotaAtual,
  };
}
