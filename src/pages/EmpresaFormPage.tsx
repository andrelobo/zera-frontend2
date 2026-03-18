import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { empresasApi } from '@/services/api';
import { formatCep, lookupCep, normalizeCep } from '@/services/cep';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { AlertTriangle, Loader2, Save, Settings } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import LoadingState from '@/components/LoadingState';
import RegimeEParametrosSection, { type RegimeTributario as RegimeTributarioTela } from '@/components/RegimeEParametrosSection';
import CTNSection, { type CnaeAdicionado } from '@/components/CTNSection';
import SimplesNacionalSection from '@/components/SimplesNacionalSection';
import CNAESection, { type CNAEAtividade } from '@/components/CNAESection';
import TabelaAnexoIII from '@/components/TabelaAnexoIII';
import EmpresaCard from '@/components/prestador/EmpresaCard';
import EnderecoCard from '@/components/prestador/EnderecoCard';
import ContatoCard from '@/components/prestador/ContatoCard';
import CertificadoDigitalCard from '@/components/prestador/CertificadoDigitalCard';
import IdentificacaoDocumentoCard from '@/components/prestador/IdentificacaoDocumentoCard';
import ConfigOperacionaisSection from '@/components/ConfigOperacionaisSection';
import { calcularSimplesAnexoIII } from '@/utils/simples-nacional';
import { getDefaultVinculosForCnae, getLC116Item, shouldRepairLegacyVinculos } from '@/utils/cnae-lc116';
import { getCTNByCode } from '@/utils/ctn-data';
import { getNBSDescricao } from '@/utils/nbs-data';
import { formatPhone, normalizeLogradouro, sanitizeAddressNumber } from '@/utils/validators';
import type { Empresa } from '@/types/api';

interface EmpresaFormData {
  razaoSocial: string;
  cnpj: string;
  nomeFantasia: string;
  inscricaoMunicipal: string;
  inscricaoEstadual: string;
  suframa: string;
  situacaoCadastral: string;
  dataSituacaoCadastral: string;
  dataInicioAtividade: string;
  cnaeFiscal: string;
  cnaeFiscalDescricao: string;
  ctnCodigo: string;
  nbsCodigo: string;
  porte: string;
  naturezaJuridica: string;
  capitalSocial: string;
  opcaoPeloSimples: '' | 'true' | 'false';
  opcaoPeloMei: '' | 'true' | 'false';
  dataOpcaoPeloSimples: string;
  dataExclusaoDoSimples: string;
  regimeTributario: '' | 'simples_nacional' | 'lucro_presumido' | 'lucro_real';
  aliquotaSimplesNacional: string;
  apuracaoSimplesNacional: string;
  rbt12: string;
  endereco: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  uf: string;
  cep: string;
  telefone: string;
  whatsapp: string;
  email: string;
}
export type { EmpresaFormData };

type PrestadorSubTab = 'cadastro' | 'regime' | 'parametros';
type ConfigOperacionalItem = {
  id: string;
  natureza: string;
  descricao: string;
};

const campoLabel: Record<string, string> = {
  razaoSocial: 'Razão social',
  inscricaoMunicipal: 'Inscrição municipal',
  cnaeFiscal: 'CNAE fiscal',
  cnaeFiscalDescricao: 'Descrição do CNAE',
  regimeTributario: 'Regime tributário',
  apuracaoSimplesNacional: 'Apuração do Simples Nacional',
  aliquotaSimplesNacional: 'Alíquota do Simples Nacional',
  'endereco.logradouro': 'Logradouro',
  'endereco.numero': 'Número',
  'endereco.bairro': 'Bairro',
  'endereco.cidade': 'Cidade',
  'endereco.uf': 'UF',
  'endereco.cep': 'CEP',
  'certificado.uploadedAt': 'Certificado digital',
};

const toCampoLabel = (field: string) => campoLabel[field] ?? field;
const TICKER_STORAGE_KEY = 'zera_global_ticker_tributario_v1';

export const formatLocalidadeUfDisplay = (cidade?: string, uf?: string) => {
  const safeCidade = String(cidade || '');
  const safeUf = String(uf || '');
  if (safeCidade && safeUf) return `${safeCidade} - ${safeUf}`;
  return safeCidade || safeUf || '';
};

const parseLocalidadeUfInput = (value: string) => {
  const raw = String(value || '');
  const separatorIndex = raw.lastIndexOf('-');

  if (separatorIndex === -1) {
    return {
      cidade: raw,
      uf: '',
    };
  }

  return {
    cidade: raw.slice(0, separatorIndex).trim(),
    uf: raw.slice(separatorIndex + 1).trim().toUpperCase(),
  };
};

const ToggleSwitch = ({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
}) => (
  <label className="flex items-center gap-3 cursor-pointer select-none">
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`switch-track ${checked ? 'switch-track-on' : 'switch-track-off'}`}
    >
      <span className={`switch-thumb ${checked ? 'translate-x-4' : 'translate-x-0'}`} />
    </button>
    <span className="text-sm text-foreground">{label}</span>
  </label>
);

const toDateInputValue = (value?: string | null) => {
  if (!value) return '';
  const trimmed = value.trim();
  const brDate = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(trimmed);
  const normalized = brDate ? `${brDate[3]}-${brDate[2]}-${brDate[1]}` : trimmed;
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
};

const toBooleanSelectValue = (value?: boolean | null) => {
  if (value === true) return 'true';
  if (value === false) return 'false';
  return '';
};

const fromBooleanSelectValue = (value: string): boolean | null | undefined => {
  if (value === 'true') return true;
  if (value === 'false') return false;
  return undefined;
};

const toTelaRegime = (regime: EmpresaFormData['regimeTributario']): RegimeTributarioTela => {
  if (regime === 'simples_nacional') return 'simples';
  if (regime === 'lucro_presumido') return 'presumido';
  if (regime === 'lucro_real') return 'real';
  return null;
};

const fromTelaRegime = (regime: RegimeTributarioTela): EmpresaFormData['regimeTributario'] => {
  if (regime === 'simples') return 'simples_nacional';
  if (regime === 'presumido') return 'lucro_presumido';
  if (regime === 'real') return 'lucro_real';
  return '';
};

const formatPercentValue = (value: number): string =>
  (value * 100).toFixed(2).replace('.', ',');

const formatCnpj = (value: string) => {
  const digits = value.replace(/\D/g, '').slice(0, 14);
  return digits
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2');
};

const toUpperTrimmed = (value: unknown): string => String(value ?? '').toUpperCase();
const clearAutofillCadastroFields = (prev: EmpresaFormData): EmpresaFormData => ({
  ...prev,
  razaoSocial: '',
  nomeFantasia: '',
  inscricaoEstadual: '',
  suframa: '',
  situacaoCadastral: '',
  dataSituacaoCadastral: '',
  dataInicioAtividade: '',
  cnaeFiscal: '',
  cnaeFiscalDescricao: '',
  porte: '',
  naturezaJuridica: '',
  capitalSocial: '',
  opcaoPeloSimples: '',
  opcaoPeloMei: '',
  dataOpcaoPeloSimples: '',
  dataExclusaoDoSimples: '',
  endereco: '',
  numero: '',
  complemento: '',
  bairro: '',
  cidade: '',
  uf: '',
  cep: '',
  telefone: '',
  whatsapp: '',
  email: '',
});

const isEmpresaAutocompleteCandidate = (empresa: Empresa) => {
  const raw = empresa as unknown as Record<string, unknown>;
  return raw.found !== false;
};

const mapEmpresaToForm = (empresa: Empresa, previous: EmpresaFormData): EmpresaFormData => {
  const legacy = empresa as Record<string, unknown>;
  const endereco = (empresa.endereco || {}) as Record<string, unknown>;
  const providerData = (legacy.providerData as Record<string, unknown> | undefined) ?? {};
  const atividadePrincipal = Array.isArray(providerData.atividade_principal)
    ? (providerData.atividade_principal[0] as Record<string, unknown> | undefined)
    : undefined;
  const simplesData = (providerData.simples as Record<string, unknown> | undefined) ?? {};

  const hasSimples = (
    empresa.opcaoPeloSimples === true
    || legacy.opcao_pelo_simples === true
    || providerData.opcao_pelo_simples === true
    || simplesData.optante === true
  );

  return {
    razaoSocial: toUpperTrimmed(empresa.razaoSocial || legacy.razao_social || previous.razaoSocial),
    cnpj: formatCnpj(String(empresa.cnpj || previous.cnpj)),
    nomeFantasia: toUpperTrimmed(
      empresa.nomeFantasia
      || legacy.nome_fantasia
      || legacy.fantasia
      || providerData.nome_fantasia
      || providerData.fantasia
      || providerData.nome
      || previous.nomeFantasia,
    ),
    inscricaoMunicipal: toUpperTrimmed(empresa.inscricaoMunicipal || legacy.inscricao_municipal || previous.inscricaoMunicipal),
    inscricaoEstadual: toUpperTrimmed(empresa.inscricaoEstadual || legacy.inscricao_estadual || previous.inscricaoEstadual),
    suframa: toUpperTrimmed(empresa.suframa || legacy.suframa || previous.suframa),
    situacaoCadastral: toUpperTrimmed(empresa.situacaoCadastral || legacy.situacao_cadastral || previous.situacaoCadastral),
    dataSituacaoCadastral: toDateInputValue(
      empresa.dataSituacaoCadastral
      || (legacy.data_situacao_cadastral as string | undefined)
      || (providerData.data_situacao_cadastral as string | undefined),
    ) || previous.dataSituacaoCadastral,
    dataInicioAtividade: toDateInputValue(
      empresa.dataInicioAtividade
      || (legacy.data_inicio_atividade as string | undefined)
      || (providerData.data_inicio_atividade as string | undefined),
    ) || previous.dataInicioAtividade,
    cnaeFiscal: String(
      empresa.cnaeFiscal
      || legacy.cnae_fiscal
      || providerData.cnae_fiscal
      || previous.cnaeFiscal,
    ),
    cnaeFiscalDescricao: toUpperTrimmed(
      empresa.cnaeFiscalDescricao
      || (
        legacy.cnae_fiscal_descricao
        || providerData.cnae_fiscal_descricao
        || atividadePrincipal?.descricao
        || previous.cnaeFiscalDescricao
      )),
    ctnCodigo: String(
      legacy.ctnCodigo
      || legacy.ctn_codigo
      || providerData.ctn_codigo
      || previous.ctnCodigo,
    ),
    nbsCodigo: String(
      legacy.nbsCodigo
      || legacy.nbs_codigo
      || providerData.nbs_codigo
      || previous.nbsCodigo,
    ),
    porte: toUpperTrimmed(
      empresa.porte
      || providerData.descricao_porte
      || legacy.porte
      || providerData.porte
      || previous.porte,
    ),
    naturezaJuridica: toUpperTrimmed(empresa.naturezaJuridica || legacy.natureza_juridica || previous.naturezaJuridica),
    capitalSocial: String(empresa.capitalSocial || legacy.capital_social || previous.capitalSocial),
    opcaoPeloSimples: toBooleanSelectValue(
      empresa.opcaoPeloSimples ?? (legacy.opcao_pelo_simples as boolean | null | undefined),
    ) || previous.opcaoPeloSimples,
    opcaoPeloMei: toBooleanSelectValue(
      empresa.opcaoPeloMei ?? (legacy.opcao_pelo_mei as boolean | null | undefined),
    ) || previous.opcaoPeloMei,
    dataOpcaoPeloSimples: toDateInputValue(
      empresa.dataOpcaoPeloSimples ?? (legacy.data_opcao_pelo_simples as string | null | undefined),
    ) || previous.dataOpcaoPeloSimples,
    dataExclusaoDoSimples: toDateInputValue(
      empresa.dataExclusaoDoSimples ?? (legacy.data_exclusao_do_simples as string | null | undefined),
    ) || previous.dataExclusaoDoSimples,
    regimeTributario: (
      empresa as unknown as { regimeTributario?: EmpresaFormData['regimeTributario'] }
    ).regimeTributario
      || (legacy.regime_tributario as EmpresaFormData['regimeTributario'] | undefined)
      || (hasSimples ? 'simples_nacional' : undefined)
      || previous.regimeTributario,
    aliquotaSimplesNacional:
      String(
        empresa.aliquotaSimplesNacional
          || (legacy.aliquota_simples_nacional as string | undefined)
          || previous.aliquotaSimplesNacional,
      ),
    apuracaoSimplesNacional:
      String(
        empresa.apuracaoSimplesNacional
          || (legacy.apuracao_simples_nacional as string | undefined)
          || previous.apuracaoSimplesNacional,
      ),
    rbt12: String(
      legacy.rbt12
      || providerData.rbt12
      || previous.rbt12,
    ),
    endereco: normalizeLogradouro(empresa.endereco?.logradouro || endereco.logradouro || previous.endereco),
    numero: String(empresa.endereco?.numero || endereco.numero || previous.numero),
    complemento: toUpperTrimmed(empresa.endereco?.complemento || endereco.complemento || previous.complemento),
    bairro: toUpperTrimmed(empresa.endereco?.bairro || endereco.bairro || previous.bairro),
    cidade: toUpperTrimmed(
      empresa.cidade || empresa.endereco?.cidade || empresa.endereco?.descricaoCidade || endereco.municipio || previous.cidade,
    ),
    uf: toUpperTrimmed(empresa.uf || empresa.endereco?.uf || empresa.endereco?.estado || previous.uf),
    cep: formatCep(empresa.cep || empresa.endereco?.cep || String(endereco.cep || previous.cep)),
    telefone: formatPhone(String(empresa.telefone || empresa.fone || empresa.whatsapp || legacy.ddd_telefone_1 || previous.telefone || '')),
    whatsapp: formatPhone(String(empresa.whatsapp || empresa.telefone || empresa.fone || legacy.ddd_telefone_1 || previous.whatsapp || '')),
    email: empresa.email || String(legacy.email || previous.email),
  };
};

export const applyEmpresaAutocompleteMerge = (
  previous: EmpresaFormData,
  empresas: Empresa[],
): EmpresaFormData => {
  let merged = clearAutofillCadastroFields(previous);

  for (const empresa of empresas.filter(isEmpresaAutocompleteCandidate)) {
    merged = mapEmpresaToForm(empresa, merged);
  }

  return {
    ...merged,
    // Regra operacional: IM não deve vir por autocomplete.
    inscricaoMunicipal: previous.inscricaoMunicipal,
  };
};

const mapEmpresaCnaesListaToRegime = (empresa: Empresa): CNAEAtividade[] => {
  if (!Array.isArray(empresa.cnaesLista)) return [];
  return empresa.cnaesLista
    .map((item) => {
      const codigo = String(item?.codigo ?? '').replace(/\D/g, '');
      if (!codigo) return null;
      const descricao = String(item?.descricao ?? '').trim() || 'CNAE principal';
      return {
        codigo,
        descricao,
        isPrincipal: Boolean(item?.isPrincipal),
        isManual: item?.isManual ?? true,
        anexo: item?.anexo ?? null,
        anexoLoading: Boolean(item?.anexoLoading),
      } satisfies CNAEAtividade;
    })
    .filter((item): item is CNAEAtividade => item !== null);
};

export const mapEmpresaParametroMunicipal = (empresa: Empresa): CnaeAdicionado[] => {
  if (!Array.isArray(empresa.parametroMunicipal)) return [];
  return empresa.parametroMunicipal
    .map((item) => {
      const raw = (item ?? {}) as Record<string, unknown>;
      const codigo = String(raw.codigo ?? '').replace(/\D/g, '');
      if (!codigo) return null;
      const vinculosRaw = Array.isArray(raw.vinculos) ? raw.vinculos : [];
      const seen = new Set<string>();
      const vinculos = vinculosRaw
        .map((vinculo, idx) => {
          const row = (vinculo ?? {}) as Record<string, unknown>;
          const ctn = String(row.ctn ?? '').trim() || undefined;
          const ctnDescricaoRaw = String(row.ctnDescricao ?? '').trim() || undefined;
          const nbs = String(row.nbs ?? '').trim() || undefined;
          const nbsDescricaoRaw = String(row.nbsDescricao ?? '').trim() || undefined;
          const ctnDescricao = ctn ? (getCTNByCode(ctn)?.descricao || ctnDescricaoRaw) : undefined;
          const nbsDescricao = nbs ? ((getNBSDescricao(nbs) || undefined) || nbsDescricaoRaw) : undefined;
          const dedupeKey = `${ctn || ''}|${nbs || ''}`;
          if (seen.has(dedupeKey)) return null;
          seen.add(dedupeKey);
          return {
            id: String(row.id ?? `imported_${codigo}_${idx + 1}`),
            ctn,
            ctnDescricao,
            nbs,
            nbsDescricao,
          };
        })
        .filter((vinculo): vinculo is NonNullable<typeof vinculo> => Boolean(vinculo && (vinculo.ctn || vinculo.nbs)));
      const vinculosSanitizados = shouldRepairLegacyVinculos(codigo, vinculos)
        ? getDefaultVinculosForCnae(codigo).map((item, index) => ({
            id: `repaired_${codigo}_${index + 1}`,
            ctn: item.ctn,
            ctnDescricao: item.ctnDescricao,
            nbs: item.nbs,
            nbsDescricao: item.nbsDescricao,
          }))
        : vinculos;

      return {
        codigo,
        cnaeDescricao: String(raw.cnaeDescricao ?? '').trim() || 'CNAE principal',
        lc116Descricao: String(raw.lc116Descricao ?? '').trim(),
        lc116Item: String(raw.lc116Item ?? '').trim(),
        vinculos: vinculosSanitizados,
        isManual: Boolean(raw.isManual),
        isPrincipal: Boolean(raw.isPrincipal),
        vinculadoSN: Boolean(raw.vinculadoSN),
      } satisfies CnaeAdicionado;
    })
    .filter((item): item is CnaeAdicionado => item !== null);
};

const mapEmpresaConfigOperacionais = (empresa: Empresa): ConfigOperacionalItem[] => {
  if (!Array.isArray(empresa.configOperacionais)) return [];
  return empresa.configOperacionais
    .map((item, idx) => {
      const id = String(item?.id ?? '').trim() || `imported_${idx + 1}`;
      const natureza = String(item?.natureza ?? '').trim();
      const descricao = String(item?.descricao ?? '').trim();
      if (!natureza && !descricao) return null;
      return { id, natureza, descricao };
    })
    .filter((item): item is ConfigOperacionalItem => item !== null);
};

export const buildCanonicalParametroMunicipal = (
  currentItems: CnaeAdicionado[],
  form: EmpresaFormData,
): CnaeAdicionado[] => {
  if (currentItems.length > 0) return currentItems;

  const codigo = String(form.cnaeFiscal || '').replace(/\D/g, '');
  if (!codigo) return [];

  const lc = getLC116Item(codigo);
  const vinculosPadrao = getDefaultVinculosForCnae(codigo);
  const vinculos = vinculosPadrao.length > 0
    ? vinculosPadrao.map((item, index) => ({
        id: `save_${codigo}_${index + 1}`,
        ctn: item.ctn,
        ctnDescricao: item.ctnDescricao,
        nbs: item.nbs,
        nbsDescricao: item.nbsDescricao,
      }))
    : [{
        id: `save_${codigo}`,
        ctn: form.ctnCodigo || undefined,
        ctnDescricao: form.ctnCodigo ? (getCTNByCode(form.ctnCodigo)?.descricao || undefined) : undefined,
        nbs: form.nbsCodigo || undefined,
        nbsDescricao: form.nbsCodigo ? (getNBSDescricao(form.nbsCodigo) || undefined) : undefined,
      }].filter((item) => item.ctn || item.nbs);

  return [{
    codigo,
    cnaeDescricao: form.cnaeFiscalDescricao || lc?.cnaeDescricao || 'CNAE principal',
    lc116Descricao: lc?.descricao || '',
    lc116Item: lc?.item || '',
    vinculos,
    isPrincipal: true,
    vinculadoSN: true,
  }];
};

export const buildEmpresaUpdatePayload = (
  form: EmpresaFormData,
  cnaesRegime: CNAEAtividade[],
  cnaesParam: CnaeAdicionado[],
  configOperacionais: ConfigOperacionalItem[],
  extra: {
    nfseNum?: string;
    dpsNum?: string;
    serieDpsNum?: string;
  } = {},
) => {
  const parametroMunicipalCanonico = buildCanonicalParametroMunicipal(cnaesParam, form);
  const principalParametroMunicipal =
    parametroMunicipalCanonico.find((item) => item.isPrincipal)
    || parametroMunicipalCanonico[0];
  const primeiroVinculoPrincipal = principalParametroMunicipal?.vinculos?.[0];
  const capitalSocialNumber = form.capitalSocial.trim()
    ? Number(form.capitalSocial.replace(/\./g, '').replace(',', '.'))
    : undefined;

  return {
    cnpj: form.cnpj,
    razaoSocial: form.razaoSocial,
    nomeFantasia: form.nomeFantasia || undefined,
    inscricaoMunicipal: form.inscricaoMunicipal || undefined,
    inscricaoEstadual: form.inscricaoEstadual || undefined,
    suframa: form.suframa || undefined,
    situacaoCadastral: form.situacaoCadastral || undefined,
    dataSituacaoCadastral: form.dataSituacaoCadastral || undefined,
    dataInicioAtividade: form.dataInicioAtividade || undefined,
    cnaeFiscal: form.cnaeFiscal || undefined,
    cnaeFiscalDescricao: form.cnaeFiscalDescricao || undefined,
    ctnCodigo: primeiroVinculoPrincipal?.ctn || form.ctnCodigo || undefined,
    nbsCodigo: primeiroVinculoPrincipal?.nbs || form.nbsCodigo || undefined,
    porte: form.porte || undefined,
    naturezaJuridica: form.naturezaJuridica || undefined,
    capitalSocial: Number.isFinite(capitalSocialNumber) ? capitalSocialNumber : undefined,
    opcaoPeloSimples: fromBooleanSelectValue(form.opcaoPeloSimples),
    opcaoPeloMei: fromBooleanSelectValue(form.opcaoPeloMei),
    dataOpcaoPeloSimples: form.dataOpcaoPeloSimples || undefined,
    dataExclusaoDoSimples: form.dataExclusaoDoSimples || undefined,
    regimeTributario: form.regimeTributario || undefined,
    aliquotaSimplesNacional: form.aliquotaSimplesNacional || undefined,
    apuracaoSimplesNacional: form.apuracaoSimplesNacional || undefined,
    rbt12: form.rbt12.trim()
      ? Number(form.rbt12.replace(/\./g, '').replace(',', '.'))
      : undefined,
    cnaesLista: cnaesRegime
      .map((item) => ({
        codigo: String(item.codigo ?? '').replace(/\D/g, '') || undefined,
        descricao: item.descricao || undefined,
        isPrincipal: item.isPrincipal,
        isManual: item.isManual,
        anexo: item.anexo ?? undefined,
        anexoLoading: item.anexoLoading,
      }))
      .filter((item) => Boolean(item.codigo)),
    parametroMunicipal: parametroMunicipalCanonico as unknown as Record<string, unknown>[],
    configOperacionais: configOperacionais
      .map((item) => ({
        id: item.id || undefined,
        natureza: item.natureza || undefined,
        descricao: item.descricao || undefined,
      }))
      .filter((item) => Boolean(item.natureza || item.descricao)),
    email: form.email || undefined,
    telefone: form.telefone || form.whatsapp || undefined,
    whatsapp: form.whatsapp || form.telefone || undefined,
    nfseNum: extra.nfseNum || undefined,
    dpsNum: extra.dpsNum || undefined,
    serieDpsNum: extra.serieDpsNum || undefined,
    endereco: {
      logradouro: form.endereco || undefined,
      numero: form.numero || undefined,
      complemento: form.complemento || undefined,
      bairro: form.bairro || undefined,
      cidade: form.cidade || undefined,
      uf: form.uf || undefined,
      cep: normalizeCep(form.cep) || undefined,
    },
  };
};

export const shouldResetConfigOperacionaisOnCnaeChange = (
  previousCnae: string,
  nextCnae: string,
  hasConfigOperacionais: boolean,
) => {
  const prev = String(previousCnae || '').replace(/\D/g, '');
  const next = String(nextCnae || '').replace(/\D/g, '');
  if (!prev || !next) return false;
  if (prev === next) return false;
  return hasConfigOperacionais;
};

const updatePrincipalCnaeWithConfigReset = (
  previousCnae: string,
  nextCodigo: string,
  nextDescricao: string | undefined,
  hasConfigOperacionais: boolean,
  setConfigOperacionais: React.Dispatch<React.SetStateAction<ConfigOperacionalItem[]>>,
  setForm: React.Dispatch<React.SetStateAction<EmpresaFormData>>,
) => {
  const nextNormalized = String(nextCodigo || '').replace(/\D/g, '');
  if (shouldResetConfigOperacionaisOnCnaeChange(previousCnae, nextNormalized, hasConfigOperacionais)) {
    setConfigOperacionais([]);
  }
  setForm((prev) => ({
    ...prev,
    cnaeFiscal: nextCodigo,
    cnaeFiscalDescricao: nextDescricao || prev.cnaeFiscalDescricao,
  }));
  return nextNormalized;
};

export const buildEmpresaSuccessRedirect = (
  empresaId: string | undefined,
  secao: PrestadorSubTab,
  statusCadastro?: Empresa['statusCadastro'],
) => {
  if (!empresaId) return '/empresas';
  if (statusCadastro === 'PENDENTE') {
    return `/empresas/${empresaId}?secao=regime`;
  }
  return `/empresas/${empresaId}?secao=${secao}`;
};

export const resolveConfigOperacionaisAtivos = (
  items: ConfigOperacionalItem[],
  configCnaeContext: string,
  currentCnae: string,
) => {
  const context = String(configCnaeContext || '').replace(/\D/g, '');
  const current = String(currentCnae || '').replace(/\D/g, '');
  if (!context || !current) return items;
  return context === current ? items : [];
};

export const hasConfigOperacionaisContextMismatch = (
  items: ConfigOperacionalItem[],
  configCnaeContext: string,
  currentCnae: string,
) => {
  if (items.length === 0) return false;
  const context = String(configCnaeContext || '').replace(/\D/g, '');
  const current = String(currentCnae || '').replace(/\D/g, '');
  if (!context || !current) return false;
  return context !== current;
};

const EmpresaFormPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const isEdit = !!id;

  const { data: existing, isLoading, refetch: refetchEmpresa } = useQuery({
    queryKey: ['empresa', id],
    queryFn: () => empresasApi.getById(id!),
    enabled: isEdit,
  });

  const [form, setForm] = useState<EmpresaFormData>({
    razaoSocial: '', cnpj: '', nomeFantasia: '', inscricaoMunicipal: '', inscricaoEstadual: '', suframa: '',
    situacaoCadastral: '', dataSituacaoCadastral: '', dataInicioAtividade: '',
    cnaeFiscal: '', cnaeFiscalDescricao: '', ctnCodigo: '', nbsCodigo: '', porte: '', naturezaJuridica: '', capitalSocial: '',
    opcaoPeloSimples: '', opcaoPeloMei: '', dataOpcaoPeloSimples: '', dataExclusaoDoSimples: '',
    regimeTributario: '', aliquotaSimplesNacional: '', apuracaoSimplesNacional: '', rbt12: '',
    endereco: '', numero: '', complemento: '', bairro: '', cidade: '', uf: '', cep: '', telefone: '', whatsapp: '', email: '',
  });
  const initialSubTab = (() => {
    const secao = searchParams.get('secao');
    if (secao === 'regime') return 'regime';
    if (secao === 'parametros') return 'parametros';
    return 'cadastro';
  })();
  const [prestadorSubTab, setPrestadorSubTab] = useState<PrestadorSubTab>(initialSubTab);
  const [lastPreviewCnpj, setLastPreviewCnpj] = useState('');
  const [lastPreviewAttemptCnpj, setLastPreviewAttemptCnpj] = useState('');
  const [cnaesRegime, setCnaesRegime] = useState<CNAEAtividade[]>([]);
  const [cnaesParam, setCnaesParam] = useState<CnaeAdicionado[]>([]);
  const [configOperacionais, setConfigOperacionais] = useState<ConfigOperacionalItem[]>([]);
  const [configOperacionaisContextCnae, setConfigOperacionaisContextCnae] = useState('');
  const [regimeApuracaoSNParametro, setRegimeApuracaoSNParametro] = useState(false);
  const [informarAliquotaSN, setInformarAliquotaSN] = useState(false);
  const [nfseNum, setNfseNum] = useState('');
  const [dpsNum, setDpsNum] = useState('');
  const [serieDpsNum, setSerieDpsNum] = useState('');
  const [lastApuracaoSimples, setLastApuracaoSimples] = useState('MENSAL');
  const [lastAliquotaSimples, setLastAliquotaSimples] = useState('0,00');
  const [ultimoResumoCadastro, setUltimoResumoCadastro] = useState<{
    statusCadastro?: Empresa['statusCadastro'];
    prontoParaEmitir?: boolean;
    percentualCompletude?: number;
    camposFaltantes?: string[];
    camposFaltantesEmissao?: string[];
  } | null>(null);
  const [localidadeUfInput, setLocalidadeUfInput] = useState('');
  const lastPrincipalCnaeRef = useRef('');

  const focusCertificadoCard = () => {
    if (typeof window === 'undefined') return;
    window.requestAnimationFrame(() => {
      document.getElementById('certificado-digital-card')?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    });
  };

  useEffect(() => {
    if (existing) {
      setForm((prev) => mapEmpresaToForm(existing, prev));
      setNfseNum(String((existing as Record<string, unknown>).nfseNum ?? ''));
      setDpsNum(String((existing as Record<string, unknown>).dpsNum ?? ''));
      setSerieDpsNum(String((existing as Record<string, unknown>).serieDpsNum ?? ''));
      const cnaesFromBackend = mapEmpresaCnaesListaToRegime(existing);
      if (cnaesFromBackend.length > 0) {
        setCnaesRegime(cnaesFromBackend);
      }
      const parametroMunicipalFromBackend = mapEmpresaParametroMunicipal(existing);
      if (parametroMunicipalFromBackend.length > 0) {
        setCnaesParam(parametroMunicipalFromBackend);
      }
      const configOperacionaisFromBackend = mapEmpresaConfigOperacionais(existing);
      if (configOperacionaisFromBackend.length > 0) {
        setConfigOperacionais(configOperacionaisFromBackend);
      }
      setConfigOperacionaisContextCnae(String(existing.cnaeFiscal || '').replace(/\D/g, ''));
      setLastPreviewCnpj(existing.cnpj.replace(/\D/g, ''));
      setUltimoResumoCadastro({
        statusCadastro: existing.statusCadastro,
        prontoParaEmitir: existing.prontoParaEmitir,
        percentualCompletude: existing.percentualCompletude,
        camposFaltantes: existing.camposFaltantes,
        camposFaltantesEmissao: existing.camposFaltantesEmissao,
      });
      lastPrincipalCnaeRef.current = String(existing.cnaeFiscal || '').replace(/\D/g, '');
    }
  }, [existing]);

  useEffect(() => {
    setLocalidadeUfInput(formatLocalidadeUfDisplay(form.cidade, form.uf));
  }, [form.cidade, form.uf]);

  useEffect(() => {
    const nextCnae = String(form.cnaeFiscal || '').replace(/\D/g, '');
    if (!nextCnae) return;

    if (!lastPrincipalCnaeRef.current) {
      lastPrincipalCnaeRef.current = nextCnae;
      return;
    }

    if (!shouldResetConfigOperacionaisOnCnaeChange(lastPrincipalCnaeRef.current, nextCnae, configOperacionais.length > 0)) {
      lastPrincipalCnaeRef.current = nextCnae;
      return;
    }

    setConfigOperacionais([]);
    lastPrincipalCnaeRef.current = nextCnae;
  }, [form.cnaeFiscal, configOperacionais.length]);

  useEffect(() => {
    const currentCnae = String(form.cnaeFiscal || '').replace(/\D/g, '');
    if (!currentCnae || !configOperacionaisContextCnae) return;
    if (currentCnae === configOperacionaisContextCnae) return;
    if (configOperacionais.length === 0) {
      setConfigOperacionaisContextCnae(currentCnae);
      return;
    }
    setConfigOperacionais([]);
    setConfigOperacionaisContextCnae(currentCnae);
  }, [form.cnaeFiscal, configOperacionais.length, configOperacionaisContextCnae]);

  useEffect(() => {
    const hasApuracao = form.apuracaoSimplesNacional.trim().length > 0;
    const hasAliquota = form.aliquotaSimplesNacional.trim().length > 0;
    setRegimeApuracaoSNParametro(hasApuracao);
    setInformarAliquotaSN(hasAliquota);
    if (hasApuracao) setLastApuracaoSimples(form.apuracaoSimplesNacional);
    if (hasAliquota) setLastAliquotaSimples(form.aliquotaSimplesNacional);
  }, [form.apuracaoSimplesNacional, form.aliquotaSimplesNacional]);

  useEffect(() => {
    if (cnaesRegime.length > 0) return;
    const codigo = String(form.cnaeFiscal || '').replace(/\D/g, '');
    if (!codigo) return;
    setCnaesRegime([
      {
        codigo,
        descricao: form.cnaeFiscalDescricao || 'CNAE principal',
        isPrincipal: true,
        isManual: true,
        anexo: 'III',
        anexoLoading: false,
      },
    ]);
  }, [cnaesRegime.length, form.cnaeFiscal, form.cnaeFiscalDescricao]);

  useEffect(() => {
    if (cnaesParam.length > 0) return;
    const codigo = String(form.cnaeFiscal || '').replace(/\D/g, '');
    if (!codigo) return;
    const lc = getLC116Item(codigo);
    const vinculosPadrao = getDefaultVinculosForCnae(codigo);
    setCnaesParam([
      {
        codigo,
        cnaeDescricao: form.cnaeFiscalDescricao || lc?.cnaeDescricao || 'CNAE principal',
        lc116Descricao: lc?.descricao || '',
        lc116Item: lc?.item || '',
        vinculos: vinculosPadrao.length > 0
          ? vinculosPadrao.map((item, index) => ({
              id: `initial_${index + 1}`,
              ctn: item.ctn,
              ctnDescricao: item.ctnDescricao,
              nbs: item.nbs,
              nbsDescricao: item.nbsDescricao,
            }))
          : [
              {
                id: 'initial',
                ctn: form.ctnCodigo || undefined,
                ctnDescricao: form.ctnCodigo ? (getCTNByCode(form.ctnCodigo)?.descricao || undefined) : undefined,
                nbs: form.nbsCodigo || undefined,
                nbsDescricao: form.nbsCodigo ? (getNBSDescricao(form.nbsCodigo) || undefined) : undefined,
              },
            ],
        isPrincipal: true,
      },
    ]);
  }, [cnaesParam.length, form.cnaeFiscal, form.cnaeFiscalDescricao, form.ctnCodigo, form.nbsCodigo]);

  useEffect(() => {
    const regimeItems = cnaesRegime
      .map((item) => ({
        codigo: String(item.codigo ?? '').replace(/\D/g, ''),
        descricao: item.descricao,
        isPrincipal: Boolean(item.isPrincipal),
      }))
      .filter((item) => Boolean(item.codigo));

    if (regimeItems.length === 0) return;

    setCnaesParam((prev) => {
      const prevByCode = new Map(prev.map((item) => [item.codigo, item]));
      const regimeCodes = new Set(regimeItems.map((item) => item.codigo));
      const next: CnaeAdicionado[] = [];

      for (const regimeItem of regimeItems) {
        const lc = getLC116Item(regimeItem.codigo);
        const existing = prevByCode.get(regimeItem.codigo);

        if (existing) {
          next.push({
            ...existing,
            codigo: regimeItem.codigo,
            cnaeDescricao: regimeItem.descricao || existing.cnaeDescricao,
            lc116Descricao: existing.lc116Descricao || lc?.descricao || '',
            lc116Item: existing.lc116Item || lc?.item || '',
            isPrincipal: regimeItem.isPrincipal,
            vinculadoSN: true,
          });
          continue;
        }

        const vinculosPadrao = getDefaultVinculosForCnae(regimeItem.codigo);
        next.push({
          codigo: regimeItem.codigo,
          cnaeDescricao: regimeItem.descricao || lc?.cnaeDescricao || 'CNAE principal',
          lc116Descricao: lc?.descricao || '',
          lc116Item: lc?.item || '',
          vinculos: vinculosPadrao.length > 0
            ? vinculosPadrao.map((item, index) => ({
                id: `sync_${regimeItem.codigo}_${index + 1}`,
                ctn: item.ctn,
                ctnDescricao: item.ctnDescricao,
                nbs: item.nbs,
                nbsDescricao: item.nbsDescricao,
              }))
            : [
                {
                  id: `sync_${regimeItem.codigo}`,
                  ctn: regimeItem.isPrincipal ? (form.ctnCodigo || undefined) : undefined,
                  ctnDescricao: regimeItem.isPrincipal && form.ctnCodigo
                    ? (getCTNByCode(form.ctnCodigo)?.descricao || undefined)
                    : undefined,
                  nbs: regimeItem.isPrincipal ? (form.nbsCodigo || undefined) : undefined,
                  nbsDescricao: regimeItem.isPrincipal && form.nbsCodigo
                    ? (getNBSDescricao(form.nbsCodigo) || undefined)
                    : undefined,
                },
              ],
          isPrincipal: regimeItem.isPrincipal,
          vinculadoSN: true,
        });
      }

      for (const item of prev) {
        if (!item.vinculadoSN && !regimeCodes.has(item.codigo)) {
          next.push(item);
        }
      }

      return next;
    });
  }, [cnaesRegime, form.ctnCodigo, form.nbsCodigo]);

  const rbt12Number = Number(form.rbt12.replace(/\./g, '').replace(',', '.')) || 0;
  const cnaePrincipalRegime =
    cnaesRegime.find((item) => item.isPrincipal)
    || cnaesRegime.find((item) => String(item.codigo).replace(/\D/g, '') === String(form.cnaeFiscal || '').replace(/\D/g, ''))
    || cnaesRegime[0];
  const simplesAnexo = String(cnaePrincipalRegime?.anexo || 'III')
    .replace(/anexo\s*/i, '')
    .replace(/[^IViv]/g, '')
    .toUpperCase()
    || 'III';
  const simplesCalculo = calcularSimplesAnexoIII(rbt12Number, simplesAnexo);
  const regimeTela = toTelaRegime(form.regimeTributario);

  useEffect(() => {
    if (regimeTela !== 'simples') return;

    if (!form.apuracaoSimplesNacional.trim()) {
      update('apuracaoSimplesNacional', 'MENSAL');
    }

    if (!simplesCalculo.valido) return;

    const aliquotaAuto = formatPercentValue(simplesCalculo.aliquotaEfetiva);
    setRegimeApuracaoSNParametro(true);
    setInformarAliquotaSN(true);
    setLastAliquotaSimples(aliquotaAuto);

    setForm((prev) => {
      const atual = prev.aliquotaSimplesNacional.trim();
      if (atual === aliquotaAuto) return prev;
      return { ...prev, aliquotaSimplesNacional: aliquotaAuto };
    });
  }, [
    regimeTela,
    form.apuracaoSimplesNacional,
    simplesCalculo.valido,
    simplesCalculo.aliquotaEfetiva,
  ]);

  useEffect(() => {
    const secao = searchParams.get('secao');
    if (secao === 'regime' || secao === 'parametros' || secao === 'cadastro') {
      setPrestadorSubTab(secao);
      return;
    }
    setPrestadorSubTab('cadastro');
  }, [searchParams]);

  const cepDigits = useMemo(() => normalizeCep(form.cep), [form.cep]);
  const currentCnaeContext = useMemo(() => String(form.cnaeFiscal || '').replace(/\D/g, ''), [form.cnaeFiscal]);
  const configOperacionaisContextMismatch = useMemo(
    () => hasConfigOperacionaisContextMismatch(configOperacionais, configOperacionaisContextCnae, currentCnaeContext),
    [configOperacionais, configOperacionaisContextCnae, currentCnaeContext],
  );
  const configOperacionaisAtivos = useMemo(
    () => resolveConfigOperacionaisAtivos(configOperacionais, configOperacionaisContextCnae, currentCnaeContext),
    [configOperacionais, configOperacionaisContextCnae, currentCnaeContext],
  );

  const cepLookupQuery = useQuery({
    queryKey: ['cep-lookup', 'empresa-form', cepDigits],
    queryFn: () => lookupCep(cepDigits),
    enabled: cepDigits.length === 8,
    staleTime: 60 * 60 * 1000,
  });

  useEffect(() => {
    if (!cepLookupQuery.data) return;
    const address = cepLookupQuery.data;
    setForm((prev) => ({
      ...prev,
      endereco: normalizeLogradouro(address.logradouro || prev.endereco),
      numero: String(address.numero || prev.numero),
      complemento: toUpperTrimmed(address.complemento || prev.complemento),
      bairro: toUpperTrimmed(address.bairro || prev.bairro),
      cidade: address.cidade || prev.cidade,
      uf: address.uf || prev.uf,
      cep: formatCep(address.cep),
    }));
  }, [cepLookupQuery.data]);

  const mutation = useMutation({
    mutationFn: () => {
      const payload = buildEmpresaUpdatePayload(form, cnaesRegime, cnaesParam, configOperacionaisAtivos, {
        nfseNum,
        dpsNum,
        serieDpsNum,
      });
      return isEdit ? empresasApi.update(id!, {
      razaoSocial: payload.razaoSocial,
      nomeFantasia: payload.nomeFantasia,
      inscricaoMunicipal: payload.inscricaoMunicipal,
      inscricaoEstadual: payload.inscricaoEstadual,
      suframa: payload.suframa,
      situacaoCadastral: payload.situacaoCadastral,
      dataSituacaoCadastral: payload.dataSituacaoCadastral,
      dataInicioAtividade: payload.dataInicioAtividade,
      cnaeFiscal: payload.cnaeFiscal,
      cnaeFiscalDescricao: payload.cnaeFiscalDescricao,
      ctnCodigo: payload.ctnCodigo,
      nbsCodigo: payload.nbsCodigo,
      porte: payload.porte,
      naturezaJuridica: payload.naturezaJuridica,
      capitalSocial: payload.capitalSocial,
      opcaoPeloSimples: payload.opcaoPeloSimples,
      opcaoPeloMei: payload.opcaoPeloMei,
      dataOpcaoPeloSimples: payload.dataOpcaoPeloSimples,
      dataExclusaoDoSimples: payload.dataExclusaoDoSimples,
      regimeTributario: payload.regimeTributario,
      aliquotaSimplesNacional: payload.aliquotaSimplesNacional,
      apuracaoSimplesNacional: payload.apuracaoSimplesNacional,
      rbt12: payload.rbt12,
      cnaesLista: payload.cnaesLista,
      parametroMunicipal: payload.parametroMunicipal,
      configOperacionais: payload.configOperacionais,
      email: payload.email,
      telefone: payload.telefone,
      whatsapp: payload.whatsapp,
      nfseNum: payload.nfseNum,
      dpsNum: payload.dpsNum,
      serieDpsNum: payload.serieDpsNum,
      endereco: payload.endereco,
    }) : empresasApi.create(payload);
    },
    onSuccess: (empresa) => {
      setUltimoResumoCadastro({
        statusCadastro: empresa.statusCadastro,
        prontoParaEmitir: empresa.prontoParaEmitir,
        percentualCompletude: empresa.percentualCompletude,
        camposFaltantes: empresa.camposFaltantes,
        camposFaltantesEmissao: empresa.camposFaltantesEmissao,
      });
      queryClient.invalidateQueries({ queryKey: ['empresas'] });

      if (empresa.statusCadastro === 'PENDENTE') {
        const pendenciasGerais = (empresa.camposFaltantes || []).slice(0, 4).map(toCampoLabel);
        const pendenciasEmissao = (empresa.camposFaltantesEmissao || []).slice(0, 4).map(toCampoLabel);
        const partes: string[] = [`Completude atual: ${empresa.percentualCompletude ?? 0}%.`];
        if (pendenciasGerais.length > 0) {
          partes.push(`Pendências gerais: ${pendenciasGerais.join(', ')}.`);
        }
        if (pendenciasEmissao.length > 0) {
          partes.push(`Para emitir: ${pendenciasEmissao.join(', ')}.`);
        }
        toast({
          title: 'Cadastro salvo com pendências',
          description: `${partes.join(' ')} Continue nas próximas etapas para liberar emissão.`,
        });
        const targetEmpresaId = empresa.id || id;
        navigate(buildEmpresaSuccessRedirect(targetEmpresaId, prestadorSubTab, empresa.statusCadastro));
        return;
      }

      toast({ title: isEdit ? 'Empresa atualizada' : 'Empresa criada' });
      navigate(buildEmpresaSuccessRedirect(empresa.id || id, prestadorSubTab, empresa.statusCadastro));
    },
  });

  const previewMutation = useMutation({
    mutationFn: async (cnpj: string) => {
      const settled = await Promise.allSettled([
        empresasApi.getByCnpj(cnpj),
        empresasApi.previewByCnpj(cnpj),
      ]);

      const empresas = settled
        .filter((result): result is PromiseFulfilledResult<Empresa> => result.status === 'fulfilled')
        .map((result) => result.value);

      if (empresas.length === 0) {
        throw new Error('Não foi possível obter dados de autocomplete para este CNPJ.');
      }

      return { cnpj, empresas };
    },
    onSuccess: ({ cnpj, empresas }) => {
      setLastPreviewCnpj(cnpj);
      setForm((prev) => applyEmpresaAutocompleteMerge(prev, empresas));
      toast({
        title: 'Dados preenchidos',
        description: 'Autocompletar por CNPJ concluiu com CNPJA como fonte principal e fallback automático.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Falha ao autocompletar',
        description: error instanceof Error ? error.message : 'Não foi possível buscar dados para este CNPJ.',
        variant: 'destructive',
      });
    },
  });

  const update = (key: keyof EmpresaFormData, value: string) => {
    const uppercaseFields = new Set<keyof EmpresaFormData>([
      'razaoSocial',
      'nomeFantasia',
      'inscricaoMunicipal',
      'inscricaoEstadual',
      'suframa',
      'situacaoCadastral',
      'cnaeFiscalDescricao',
      'ctnCodigo',
      'nbsCodigo',
      'porte',
      'naturezaJuridica',
      'endereco',
      'complemento',
      'bairro',
      'cidade',
      'uf',
    ]);
    const normalizedValue = key === 'endereco'
      ? normalizeLogradouro(String(value ?? ''))
      : (uppercaseFields.has(key) ? value.toUpperCase() : value);
    setForm(prev => ({ ...prev, [key]: normalizedValue }));
  };

  const handlePrestadorChange = (field: string, value: string) => {
    if (field !== 'cnpj') {
      if (field === 'whatsapp' || field === 'telefone') {
        update(field as keyof EmpresaFormData, formatPhone(value));
        return;
      }
      if (field === 'numero') {
        update('numero', sanitizeAddressNumber(value));
        return;
      }
      if (field === 'nomeEmpresarial') {
        update('razaoSocial', value);
        return;
      }
      if (field === 'logradouro') {
        update('endereco', value);
        return;
      }
      update(field as keyof EmpresaFormData, value);
      return;
    }
    const formatted = formatCnpj(value);
    const digits = formatted.replace(/\D/g, '');
    setForm((prev) => ({ ...prev, cnpj: formatted }));
    if (digits !== lastPreviewCnpj) {
      setLastPreviewAttemptCnpj('');
    }
    if (digits.length < 14) {
      setLastPreviewCnpj('');
    }
  };

  useEffect(() => {
    if (isEdit) return;
    const cnpj = form.cnpj.replace(/\D/g, '');
    if (cnpj.length !== 14) return;
    if (
      previewMutation.isPending
      || lastPreviewCnpj === cnpj
      || lastPreviewAttemptCnpj === cnpj
    ) return;
    setLastPreviewAttemptCnpj(cnpj);
    previewMutation.mutate(cnpj);
  }, [form.cnpj, isEdit, lastPreviewAttemptCnpj, lastPreviewCnpj, previewMutation]);
  const cadastroPendente = ultimoResumoCadastro?.statusCadastro === 'PENDENTE';
  const camposPendentes = ultimoResumoCadastro?.camposFaltantes || [];
  const camposEmissaoPendentes = ultimoResumoCadastro?.camposFaltantesEmissao || [];
  const certificadoPendente = camposEmissaoPendentes.includes('certificado.uploadedAt');
  const handleCnaesChange = (items: CnaeAdicionado[]) => {
    setCnaesParam(items);
    const principal = items.find((item) => item.isPrincipal) || items[0];
    if (!principal) {
      return;
    }
    const previousPrincipal = lastPrincipalCnaeRef.current || String(form.cnaeFiscal || '').replace(/\D/g, '');
    const nextPrincipal = String(principal.codigo || '').replace(/\D/g, '');
    if (shouldResetConfigOperacionaisOnCnaeChange(previousPrincipal, nextPrincipal, configOperacionais.length > 0)) {
      setConfigOperacionais([]);
    }
    lastPrincipalCnaeRef.current = nextPrincipal;
    const primeiroVinculo = principal.vinculos[0];
    setForm((prev) => ({
      ...prev,
      cnaeFiscal: principal.codigo,
      cnaeFiscalDescricao: principal.cnaeDescricao || prev.cnaeFiscalDescricao,
      ctnCodigo: primeiroVinculo?.ctn || '',
      nbsCodigo: primeiroVinculo?.nbs || '',
    }));
  };

  useEffect(() => {
    if (!simplesCalculo.valido || !simplesCalculo.faixa) return;
    if (typeof window === 'undefined') return;

    const snapshot = {
      cnaeAnexo: simplesAnexo,
      faixa: simplesCalculo.faixa.faixa,
      rbt12: rbt12Number,
      issReferencia: simplesCalculo.issReferencia,
      aliquotaEfetiva: simplesCalculo.aliquotaEfetiva,
    };

    window.localStorage.setItem(TICKER_STORAGE_KEY, JSON.stringify(snapshot));
    window.dispatchEvent(new Event('zera:ticker:update'));
  }, [rbt12Number, simplesCalculo, simplesAnexo]);

  if (isEdit && isLoading) return <LoadingState />;

  return (
    <div className="min-h-screen flex w-full">
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-card border-b border-border sticky top-0 z-10 px-4 sm:px-6 py-2 flex items-center gap-2">
          <div className="flex items-center gap-3 shrink-0">
            <SidebarTrigger />
            <h2 className="text-base font-semibold text-foreground">O Prestador</h2>
          </div>
        </header>

        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-4 space-y-2">
      <form className="space-y-4">
        {cadastroPendente && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm">
            <div className="flex items-center gap-2 text-destructive font-medium">
              <AlertTriangle className="w-4 h-4" />
              Cadastro incompleto ({ultimoResumoCadastro?.percentualCompletude ?? 0}%)
            </div>
            {camposPendentes.length > 0 && (
              <p className="mt-2 text-destructive/90">
                Pendências gerais: {camposPendentes.slice(0, 6).map(toCampoLabel).join(', ')}.
              </p>
            )}
            {camposEmissaoPendentes.length > 0 && (
              <p className="mt-1 text-destructive/90">
                Emissão bloqueada até concluir: {camposEmissaoPendentes.slice(0, 6).map(toCampoLabel).join(', ')}.
              </p>
            )}
            {certificadoPendente && (
              <div className="mt-3">
                <button
                  type="button"
                  className="btn-outline h-9 px-3 text-xs sm:text-sm"
                  onClick={() => {
                    setPrestadorSubTab('cadastro');
                    focusCertificadoCard();
                  }}
                >
                  Importar certificado digital agora
                </button>
              </div>
            )}
          </div>
        )}
        {prestadorSubTab === 'cadastro' && (
          <div className="space-y-2">
            <EmpresaCard
              data={{
                cnpj: form.cnpj,
                nomeEmpresarial: form.razaoSocial,
                nomeFantasia: form.nomeFantasia,
                inscricaoMunicipal: form.inscricaoMunicipal,
                inscricaoEstadual: form.inscricaoEstadual,
                suframa: form.suframa,
                dataOpcaoSimples: form.dataOpcaoPeloSimples,
              }}
              onFieldChange={(field, value) => handlePrestadorChange(field, value)}
              onCNPJChange={(value) => handlePrestadorChange('cnpj', value)}
              loadingCNPJ={previewMutation.isPending}
              simplesStatus={form.opcaoPeloSimples === 'true' ? true : form.opcaoPeloSimples === 'false' ? false : null}
              onSimplesToggle={(value) => update('opcaoPeloSimples', value ? 'true' : 'false')}
            />

            <EnderecoCard
              cep={form.cep}
              logradouro={form.endereco}
              numero={form.numero}
              complemento={form.complemento}
              bairro={form.bairro}
              localidadeUf={localidadeUfInput}
              onFieldChange={(field, value) => {
                if (field !== 'localidadeUf') {
                  handlePrestadorChange(field, value);
                  return;
                }
                setLocalidadeUfInput(value);
              }}
              onFieldBlur={(field, value) => {
                if (field !== 'localidadeUf') return;
                const { cidade, uf } = parseLocalidadeUfInput(value);
                update('cidade', cidade);
                update('uf', uf);
              }}
              onCEPChange={(value) => update('cep', formatCep(value))}
              loadingCEP={cepLookupQuery.isFetching}
            />

            <ContatoCard
              email={form.email}
              whatsapp={form.whatsapp}
              onFieldChange={(field, value) => handlePrestadorChange(field, value)}
              onFieldBlur={(field, value) => {
                if (field === 'whatsapp') {
                  update('whatsapp', formatPhone(value));
                }
              }}
            />

            <CertificadoDigitalCard
              cnpj={form.cnpj}
              certificado={((existing as unknown as Record<string, unknown> | undefined)?.certificado as { filename?: string; uploadedAt?: string } | undefined) ?? null}
              onImported={async () => {
                if (!isEdit) return;
                await refetchEmpresa();
              }}
            />

            <IdentificacaoDocumentoCard
              nfseNum={nfseNum}
              onNfseNumChange={setNfseNum}
              dpsNum={dpsNum}
              onDpsNumChange={setDpsNum}
              serieDpsNum={serieDpsNum}
              onSerieDpsNumChange={setSerieDpsNum}
            />

          </div>
        )}

        {prestadorSubTab === 'regime' && (
          <div className="space-y-2">
            <RegimeEParametrosSection
              regime={regimeTela}
              onRegimeChange={(regime) => update('regimeTributario', fromTelaRegime(regime))}
              informarAliquotaSN={form.aliquotaSimplesNacional.trim().length > 0}
              onInformarAliquotaChange={(value) => update('aliquotaSimplesNacional', value ? form.aliquotaSimplesNacional || '0,00' : '')}
              aliquotaSN={form.aliquotaSimplesNacional}
              onAliquotaSNChange={(value) => update('aliquotaSimplesNacional', value)}
              regimeApuracaoSNParametro={form.apuracaoSimplesNacional.trim().length > 0}
              onRegimeApuracaoSNParametroChange={(value) => update('apuracaoSimplesNacional', value ? 'MENSAL' : '')}
              onAutosave={() => undefined}
            />

            <CNAESection
              cnpj={form.cnpj}
              cnaeEscolhido={form.cnaeFiscal || null}
              onCnaeEscolhidoChange={(codigo, descricao) => {
                lastPrincipalCnaeRef.current = updatePrincipalCnaeWithConfigReset(
                  lastPrincipalCnaeRef.current || String(form.cnaeFiscal || '').replace(/\D/g, ''),
                  codigo,
                  descricao,
                  configOperacionais.length > 0,
                  setConfigOperacionais,
                  setForm,
                );
              }}
              rbt12={rbt12Number}
              cnaesLista={cnaesRegime}
              onCnaesListaChange={(lista) => {
                setCnaesRegime(lista);
                const principal = lista.find((item) => item.isPrincipal) || lista[0];
                if (!principal) return;
                lastPrincipalCnaeRef.current = updatePrincipalCnaeWithConfigReset(
                  lastPrincipalCnaeRef.current || String(form.cnaeFiscal || '').replace(/\D/g, ''),
                  String(principal.codigo),
                  principal.descricao,
                  configOperacionais.length > 0,
                  setConfigOperacionais,
                  setForm,
                );
              }}
            />

            {regimeTela === 'simples' && (
              <SimplesNacionalSection
                cnaePrincipal={String(form.cnaeFiscal || '')}
                cnaeDescricao={form.cnaeFiscalDescricao}
                cnaeAnexo={simplesAnexo}
                rbt12={rbt12Number}
                onRbt12Change={(value) => update('rbt12', value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }))}
                calculo={simplesCalculo}
                alertas={simplesCalculo.alertas}
                permiteFatorR={false}
              />
            )}

            {regimeTela === 'simples' && (
              <TabelaAnexoIII faixaAtual={simplesCalculo.faixa?.faixa ?? null} />
            )}

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => mutation.mutate()}
                disabled={mutation.isPending}
                className="flex items-center gap-2 text-sm py-2 btn-primary"
              >
                {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                SALVAR
              </button>
            </div>
          </div>
        )}

        {prestadorSubTab === 'parametros' && (
          <div className="space-y-2">
            {(regimeTela === 'simples' || !regimeTela) && (
              <div className="section-card p-3">
                <h2 className="section-title text-sm mb-2">
                  <Settings className="w-4 h-4 text-primary" />
                  Parâmetros Federais
                </h2>
                <div className="space-y-2 p-2.5 rounded-lg bg-muted/50 border border-border">
                  <ToggleSwitch
                    checked={regimeApuracaoSNParametro}
                    onChange={(value) => {
                      setRegimeApuracaoSNParametro(value);
                      if (value) {
                        update('apuracaoSimplesNacional', lastApuracaoSimples || 'MENSAL');
                        return;
                      }
                      if (form.apuracaoSimplesNacional.trim().length > 0) {
                        setLastApuracaoSimples(form.apuracaoSimplesNacional);
                      }
                      update('apuracaoSimplesNacional', '');
                    }}
                    label="Regime de apuração dos tributos federais e municipal pelo Simples Nacional"
                  />
                  <ToggleSwitch
                    checked={informarAliquotaSN}
                    onChange={(value) => {
                      setInformarAliquotaSN(value);
                      if (value) {
                        update('aliquotaSimplesNacional', lastAliquotaSimples || '0,00');
                        return;
                      }
                      if (form.aliquotaSimplesNacional.trim().length > 0) {
                        setLastAliquotaSimples(form.aliquotaSimplesNacional);
                      }
                      update('aliquotaSimplesNacional', '');
                    }}
                    label="Informar alíquota do Simples Nacional"
                  />
                  {informarAliquotaSN && (
                    <div>
                      <label className="field-label whitespace-nowrap">Simples Nacional</label>
                      <div className="relative w-[74px]">
                        <input
                          className="field-input pr-7 border-primary"
                          type="text"
                          placeholder="00,00"
                          maxLength={5}
                          value={form.aliquotaSimplesNacional}
                          onChange={(e) => {
                            let value = e.target.value.replace(/[^\d]/g, '').slice(0, 4);
                            if (value.length > 2) value = `${value.slice(0, -2)},${value.slice(-2)}`;
                            if (value.trim().length > 0) setLastAliquotaSimples(value);
                            update('aliquotaSimplesNacional', value);
                          }}
                        />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">%</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {regimeTela && regimeTela !== 'simples' && (
              <div className="section-card p-3">
                <h2 className="section-title text-sm mb-2">
                  <Settings className="w-4 h-4 text-primary" />
                  Parâmetros Federais
                </h2>
                <p className="text-sm text-muted-foreground">
                  Configurações federais para {regimeTela === 'presumido' ? 'Lucro Presumido' : 'Lucro Real'} serão disponibilizadas em breve.
                </p>
              </div>
            )}

            <div className="section-card p-3">
              <h2 className="section-title text-sm mb-2">
                <Settings className="w-4 h-4 text-primary" />
                Parâmetros Municipais
              </h2>
              <CTNSection
                ctnSelecionado={form.ctnCodigo || null}
                onCtnChange={(codigo, _descricao, _itemFormatado) => update('ctnCodigo', codigo)}
                savedCnaes={cnaesParam}
                onCnaesChange={handleCnaesChange}
                regimeCnaes={cnaesRegime}
              />
            </div>

            {configOperacionaisContextMismatch && (
              <div className="rounded-lg border border-warning/30 bg-warning/10 p-3 text-sm">
                <div className="font-medium text-foreground">
                  A Lista Serviço pertence ao CNAE anterior.
                </div>
                <p className="mt-1 text-foreground/80">
                  Revise, edite ou remova os itens antes de salvar. Enquanto isso, esses serviços não serão considerados para o CNAE atual.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="btn-outline h-9 px-3 text-xs sm:text-sm"
                    onClick={() => setConfigOperacionais([])}
                  >
                    Limpar lista antiga
                  </button>
                  <button
                    type="button"
                    className="btn-outline h-9 px-3 text-xs sm:text-sm"
                    onClick={() => setConfigOperacionaisContextCnae(currentCnaeContext)}
                  >
                    Manter neste CNAE
                  </button>
                </div>
              </div>
            )}

            <ConfigOperacionaisSection
              items={configOperacionais}
              onChange={(items) => {
                setConfigOperacionais(items);
                setConfigOperacionaisContextCnae(String(form.cnaeFiscal || '').replace(/\D/g, ''));
              }}
            />

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => mutation.mutate()}
                disabled={mutation.isPending}
                className="flex items-center gap-2 text-sm py-2 btn-primary"
              >
                {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                SALVAR
              </button>
            </div>
          </div>
        )}

      </form>
        </main>
      </div>
    </div>
  );
};

export default EmpresaFormPage;
