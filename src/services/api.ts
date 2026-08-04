import api from '@/lib/api';
import { formatCNPJ } from '@/utils/validators';
import type {
  LoginRequest, LoginResponse, AcceptInviteRequest, User, CreateUserRequest, UpdateUserRequest, InviteUserRequest, InviteUserResponse,
  Empresa, CreateEmpresaRequest, UpdateEmpresaRequest, ImportCertificadoDigitalRequest, ImportCertificadoDigitalResponse,
  Nfse, EmitirNfseRequest, EmitirNfseResponse, NfseArtifactsStatus, ProviderResponse,
  NfseFilters, PaginatedResponse, EmitirNfseQuickRequest, EmitirNfseQuickResponse, ServicoCatalogItem, NfseBiSummary,
  Tomador, CreateTomadorRequest, UpdateTomadorRequest, CnaeCatalogLookupItem, TomadorCpfLookupResponse,
} from '@/types/api';
import { roleToApi } from '@/lib/roles';

const normalizeEmpresa = (raw: Empresa | Record<string, unknown>): Empresa => {
  const legacy = raw as Record<string, unknown>;
  const providerData = (legacy.providerData as Record<string, unknown> | undefined) ?? {};
  const atividadePrincipal = Array.isArray(providerData.atividade_principal)
    ? (providerData.atividade_principal[0] as Record<string, unknown> | undefined)
    : undefined;
  const simplesData = (providerData.simples as Record<string, unknown> | undefined) ?? {};
  const simeiData = (providerData.simei as Record<string, unknown> | undefined) ?? {};
  const enderecoRaw = (legacy.endereco as Record<string, unknown> | undefined) ?? {};
  const pickString = (...values: unknown[]) => {
    for (const value of values) {
      if (value === null || value === undefined || value === '') continue;
      return String(value);
    }
    return undefined;
  };
  const formatCnpjIfValid = (value: string) => {
    const digits = value.replace(/\D/g, '');
    if (digits.length === 14) return formatCNPJ(digits);
    return value;
  };
  const pickBoolean = (...values: unknown[]) => {
    for (const value of values) {
      if (typeof value === 'boolean') return value;
      if (value === 'true') return true;
      if (value === 'false') return false;
    }
    return undefined;
  };
  const pickStringOrNumberString = (...values: unknown[]) => {
    for (const value of values) {
      if (typeof value === 'string' && value.trim() !== '') return value;
      if (typeof value === 'number' && Number.isFinite(value)) return String(value);
    }
    return undefined;
  };
  const pickStringArray = (...values: unknown[]) => {
    for (const value of values) {
      if (!Array.isArray(value)) continue;
      const items = value
        .map((item) => (item === null || item === undefined ? '' : String(item).trim()))
        .filter((item) => item.length > 0);
      if (items.length > 0) return items;
    }
    return [] as string[];
  };
  const parseJsonIfString = (value: unknown): unknown => {
    if (typeof value !== 'string') return value;
    const trimmed = value.trim();
    if (!trimmed) return value;
    try {
      return JSON.parse(trimmed) as unknown;
    } catch {
      return value;
    }
  };
  const toObjectArray = (value: unknown): Record<string, unknown>[] | null => {
    const parsed = parseJsonIfString(value);
    if (Array.isArray(parsed)) {
      const items = parsed
        .map((item) => ((item && typeof item === 'object') ? (item as Record<string, unknown>) : null))
        .filter((item): item is Record<string, unknown> => item !== null);
      return items.length > 0 ? items : null;
    }
    if (parsed && typeof parsed === 'object') {
      const row = parsed as Record<string, unknown>;
      const nestedCandidates = [
        row.items,
        row.rows,
        row.data,
        row.value,
        row.values,
        row.result,
      ];
      for (const candidate of nestedCandidates) {
        const nested = toObjectArray(candidate);
        if (nested && nested.length > 0) return nested;
      }
      return [row];
    }
    return null;
  };
  const pickCnaesLista = (...values: unknown[]) => {
    for (const value of values) {
      if (!Array.isArray(value)) continue;
      const items = value
        .map((item) => {
          const raw = (item ?? {}) as Record<string, unknown>;
          const codigo = pickString(raw.codigo);
          const descricao = pickString(raw.descricao);
          const isPrincipal = pickBoolean(raw.isPrincipal);
          const isManual = pickBoolean(raw.isManual);
          const anexo = pickString(raw.anexo);
          const anexoLoading = pickBoolean(raw.anexoLoading);
          if (!codigo && !descricao && isPrincipal === undefined && isManual === undefined && anexo === undefined && anexoLoading === undefined) {
            return null;
          }
          return {
            codigo,
            descricao,
            isPrincipal,
            isManual,
            anexo: anexo ?? null,
            anexoLoading,
          };
        })
        .filter((item): item is NonNullable<typeof item> => item !== null);
      if (items.length > 0) return items;
    }
    return undefined;
  };
  const pickObjectArray = (...values: unknown[]) => {
    for (const value of values) {
      const items = toObjectArray(value);
      if (items && items.length > 0) return items;
    }
    return undefined;
  };
  const pickConfigOperacionais = (...values: unknown[]) => {
    const items = pickObjectArray(...values);
    if (!items || items.length === 0) return undefined;
    return items
      .map((raw) => {
        const id = pickString(raw.id);
        const natureza = pickString(raw.natureza);
        const descricao = pickString(raw.descricao);
        if (!id && !natureza && !descricao) return null;
        return { id, natureza, descricao };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);
  };
  const endereco = {
    ...(enderecoRaw as Empresa['endereco']),
    logradouro: pickString(enderecoRaw.logradouro),
    numero: pickString(enderecoRaw.numero),
    complemento: pickString(enderecoRaw.complemento),
    bairro: pickString(enderecoRaw.bairro),
    cidade: pickString(enderecoRaw.cidade, enderecoRaw.municipio),
    uf: pickString(enderecoRaw.uf, enderecoRaw.estado),
    cep: pickString(enderecoRaw.cep),
    descricaoCidade: pickString(enderecoRaw.descricaoCidade, enderecoRaw.municipio),
    estado: pickString(enderecoRaw.estado, enderecoRaw.uf),
  };
  const certificadoRaw = (legacy.certificado as Record<string, unknown> | undefined) ?? {};
  const certificado = Object.keys(certificadoRaw).length > 0 ? {
    filename: pickString(certificadoRaw.filename, certificadoRaw.fileName),
    mimeType: pickString(certificadoRaw.mimeType, certificadoRaw.mime_type),
    size: (() => {
      const value = certificadoRaw.size ?? certificadoRaw.fileSize;
      if (value === null || value === undefined || value === '') return undefined;
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : undefined;
    })(),
    sha256: pickString(certificadoRaw.sha256),
    uploadedAt: pickString(certificadoRaw.uploadedAt, certificadoRaw.uploaded_at),
    expiresAt: pickString(certificadoRaw.expiresAt, certificadoRaw.expires_at),
  } : undefined;
  const hasEndereco = Object.values(endereco).some((value) => value !== undefined && value !== '');
  const simplesSnapshotRaw =
    (legacy.simplesSnapshot as Record<string, unknown> | undefined) ??
    (legacy.simples_snapshot as Record<string, unknown> | undefined);

  return {
    ...(raw as Empresa),
    id: pickString(legacy.id, legacy._id) || '',
    cnpj: formatCnpjIfValid(pickString(legacy.cnpj, legacy.cpf_cnpj) || ''),
    razaoSocial: pickString(legacy.razaoSocial, legacy.nome_razao_social) || '',
    nomeFantasia: pickString(
      legacy.nomeFantasia,
      legacy.nome_fantasia,
      legacy.fantasia,
      legacy.nome,
      providerData.nome_fantasia,
      providerData.fantasia,
      providerData.nome,
    ),
    inscricaoMunicipal: pickString(
      legacy.inscricaoMunicipal,
      legacy.inscricao_municipal,
      providerData.inscricao_municipal,
      providerData.im,
    ),
    inscricaoEstadual: pickString(
      legacy.inscricaoEstadual,
      legacy.inscricao_estadual,
      providerData.inscricao_estadual,
      providerData.ie,
    ),
    suframa: pickString(
      legacy.suframa,
      providerData.suframa,
    ),
    situacaoCadastral: pickString(
      legacy.situacaoCadastral,
      legacy.situacao_cadastral,
      providerData.situacao_cadastral,
    ),
    dataSituacaoCadastral: pickString(
      legacy.dataSituacaoCadastral,
      legacy.data_situacao_cadastral,
      providerData.data_situacao_cadastral,
    ),
    dataInicioAtividade: pickString(
      legacy.dataInicioAtividade,
      legacy.data_inicio_atividade,
      providerData.data_inicio_atividade,
    ),
    cnaeFiscal: pickString(legacy.cnaeFiscal, legacy.cnae_fiscal, providerData.cnae_fiscal),
    cnaeFiscalDescricao: pickString(
      legacy.cnaeFiscalDescricao,
      legacy.cnae_fiscal_descricao,
      providerData.cnae_fiscal_descricao,
      atividadePrincipal?.descricao,
      atividadePrincipal?.text,
    ),
    ctnCodigo: pickString(
      legacy.ctnCodigo,
      legacy.ctn_codigo,
      providerData.ctn_codigo,
    ),
    nbsCodigo: pickString(
      legacy.nbsCodigo,
      legacy.nbs_codigo,
      providerData.nbs_codigo,
    ),
    porte: pickString(legacy.porte, providerData.porte, providerData.porte_empresa),
    naturezaJuridica: pickString(
      legacy.naturezaJuridica,
      legacy.natureza_juridica,
      providerData.natureza_juridica,
    ),
    capitalSocial: (() => {
      const value = legacy.capitalSocial ?? legacy.capital_social ?? providerData.capital_social;
      if (value === null || value === undefined || value === '') return undefined;
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : undefined;
    })(),
    opcaoPeloSimples: pickBoolean(
      legacy.opcaoPeloSimples,
      legacy.opcao_pelo_simples,
      providerData.opcao_pelo_simples,
      simplesData.optante,
    ),
    opcaoPeloMei: pickBoolean(
      legacy.opcaoPeloMei,
      legacy.opcao_pelo_mei,
      providerData.opcao_pelo_mei,
      simeiData.optante,
    ),
    dataOpcaoPeloSimples: pickString(legacy.dataOpcaoPeloSimples, legacy.data_opcao_pelo_simples),
    dataExclusaoDoSimples: pickString(
      legacy.dataExclusaoDoSimples,
      legacy.data_exclusao_do_simples,
    ),
    regimeTributario: pickString(
      legacy.regimeTributario,
      legacy.regime_tributario,
      providerData.regime_tributario,
    ) || (
      pickBoolean(
        legacy.opcaoPeloSimples,
        legacy.opcao_pelo_simples,
        providerData.opcao_pelo_simples,
        simplesData.optante,
      ) === true
        ? 'simples_nacional'
        : undefined
    ),
    aliquotaSimplesNacional:
      (
        typeof simplesSnapshotRaw?.aliquotaEfetiva === 'number'
          ? (simplesSnapshotRaw.aliquotaEfetiva * 100).toFixed(2).replace('.', ',')
          : undefined
      ) || pickString(
        legacy.aliquotaSimplesNacional,
        legacy.aliquota_simples_nacional,
        providerData.aliquota_simples_nacional,
      ),
    apuracaoSimplesNacional: pickString(
      legacy.apuracaoSimplesNacional,
      legacy.apuracao_simples_nacional,
      providerData.apuracao_simples_nacional,
    ),
    rbt12: pickStringOrNumberString(
      legacy.rbt12,
      providerData.rbt12,
    ) || (
      typeof simplesSnapshotRaw?.rbt12 === 'number'
        ? String(simplesSnapshotRaw.rbt12)
        : undefined
    ),
    simplesSnapshot: simplesSnapshotRaw
      ? {
          anexo: pickString(simplesSnapshotRaw.anexo),
          faixa: typeof simplesSnapshotRaw.faixa === 'number' ? simplesSnapshotRaw.faixa : undefined,
          aliquotaNominal:
            typeof simplesSnapshotRaw.aliquotaNominal === 'number'
              ? simplesSnapshotRaw.aliquotaNominal
              : undefined,
          parcelaDeduzir:
            typeof simplesSnapshotRaw.parcelaDeduzir === 'number'
              ? simplesSnapshotRaw.parcelaDeduzir
              : undefined,
          aliquotaEfetiva:
            typeof simplesSnapshotRaw.aliquotaEfetiva === 'number'
              ? simplesSnapshotRaw.aliquotaEfetiva
              : undefined,
          issReferencia:
            typeof simplesSnapshotRaw.issReferencia === 'number'
              ? simplesSnapshotRaw.issReferencia
              : undefined,
          rbt12: typeof simplesSnapshotRaw.rbt12 === 'number' ? simplesSnapshotRaw.rbt12 : undefined,
          valido: pickBoolean(simplesSnapshotRaw.valido),
          calculadoEm: pickString(simplesSnapshotRaw.calculadoEm),
        }
      : undefined,
    cnaesLista: pickCnaesLista(legacy.cnaesLista, legacy.cnaes_lista),
    parametroMunicipal: pickObjectArray(legacy.parametroMunicipal, legacy.parametro_municipal),
    configOperacionais: pickConfigOperacionais(legacy.configOperacionais, legacy.config_operacionais),
    email: pickString(legacy.email),
    certificado,
    whatsapp: pickString(legacy.whatsapp, legacy.telefone, legacy.fone, legacy.ddd_telefone_1),
    fone: pickString(legacy.fone, legacy.telefone, legacy.ddd_telefone_1),
    nfseNum: pickString(legacy.nfseNum, legacy.nfse_num),
    dpsNum: pickString(legacy.dpsNum, legacy.dps_num),
    serieDpsNum: pickString(legacy.serieDpsNum, legacy.serie_dps_num),
    endereco: hasEndereco ? endereco : undefined,
    statusCadastro: pickString(legacy.statusCadastro) as Empresa['statusCadastro'],
    prontoParaEmitir: pickBoolean(legacy.prontoParaEmitir),
    fonteConsulta: pickString(
      legacy.fonteConsulta,
      legacy.fonte_consulta,
      legacy.sourceUsed,
      providerData.sourceUsed,
    ),
    percentualCompletude: (() => {
      const value = legacy.percentualCompletude;
      if (value === null || value === undefined || value === '') return undefined;
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : undefined;
    })(),
    camposFaltantes: pickStringArray(legacy.camposFaltantes),
    camposFaltantesEmissao: pickStringArray(legacy.camposFaltantesEmissao),
  };
};

// Auth
export const authApi = {
  login: (data: LoginRequest) =>
    api.post<LoginResponse>('/auth/login', data, {
      timeout: 30_000,
      skipGlobalErrorToast: true,
    }).then(r => r.data),
  acceptInvite: (data: AcceptInviteRequest) =>
    api.post<LoginResponse>('/auth/accept-invite', data, {
      skipGlobalErrorToast: true,
    }).then(r => r.data),
  warmup: () =>
    api.get('/health', {
      timeout: 20_000,
      skipGlobalErrorToast: true,
    }).then(r => r.data),
  me: () =>
    api.get<User>('/auth/me').then(r => r.data),
};

// NFSe
export const nfseApi = {
  list: (filters: NfseFilters = {}) => {
    const params = {
      ...filters,
      provider: filters.provider,
      empresaCnpj: filters.empresaCnpj ? String(filters.empresaCnpj).replace(/\D/g, '') : undefined,
    };
    return api.get<{ items: Nfse[]; meta: { total: number; page: number; limit: number; totalPages: number } }>('/nfse', { params })
      .then(r => ({
        data: r.data.items || [],
        total: r.data.meta?.total || 0,
        page: r.data.meta?.page || 1,
        limit: r.data.meta?.limit || 10,
        totalPages: r.data.meta?.totalPages || 1,
      } as PaginatedResponse<Nfse>));
  },
  biSummary: (filters: {
    provider?: string;
    status?: string;
    empresaCnpj?: string;
    codigoServico?: string;
    dateFrom?: string;
    dateTo?: string;
  } = {}) =>
    api.get<NfseBiSummary>('/nfse/bi/summary', { params: filters }).then(r => r.data),
  getById: (id: string) =>
    api.get<Nfse>(`/nfse/${id}`).then(r => r.data),
  emitir: (data: EmitirNfseRequest) =>
    api.post<EmitirNfseResponse>('/nfse/emitir', data).then(r => r.data),
  emitirQuick: (data: EmitirNfseQuickRequest) =>
    api.post<EmitirNfseQuickResponse>('/nfse/quick', data).then(r => r.data),
  reemitir: (id: string) =>
    api.post<EmitirNfseResponse>(`/nfse/${id}/reemitir`).then(r => r.data),
  servicosList: (
    input?: { q?: string; limit?: number; page?: number },
    options?: { skipGlobalErrorToast?: boolean },
  ) =>
    api.get<{ items: ServicoCatalogItem[]; total: number }>('/nfse/servicos', {
      params: {
        q: input?.q?.trim() || undefined,
        limit: input?.limit,
        page: input?.page,
      },
      skipGlobalErrorToast: options?.skipGlobalErrorToast,
    }).then(r => r.data),
  servicosAutocomplete: (input?: { q?: string; limit?: number }) =>
    api.get<{ items: ServicoCatalogItem[]; total: number }>('/nfse/servicos/autocomplete', {
      params: {
        q: input?.q?.trim() || undefined,
        limit: input?.limit,
      },
    }).then(r => r.data),
  servicoByCodigo: (codigo: string) =>
    api.get<ServicoCatalogItem>(`/nfse/servicos/${codigo}`).then(r => r.data),
  providerResponse: (id: string) =>
    api.get<Record<string, unknown>>(`/nfse/${id}/provider-response`).then(r => {
      const data = r.data;
      return {
        id: String(data.id || id),
        provider: (data.provider as string | undefined) || undefined,
        externalId: (data.externalId as string | null | undefined) ?? null,
        status: (data.status as ProviderResponse['status']) || undefined,
        canonico: data.canonico as ProviderResponse['canonico'],
        providerRequest: data.providerRequest,
        providerResponse: data.providerResponse,
        error: (data.error as string | null | undefined) ?? null,
        createdAt: (data.createdAt as string | null | undefined) ?? null,
        updatedAt: (data.updatedAt as string | null | undefined) ?? null,
        raw: data.providerResponse || data,
        protocol: (data.externalId as string | undefined) || (data.protocol as string | undefined),
        receivedAt: (data.updatedAt as string | undefined) || new Date().toISOString(),
      } as ProviderResponse;
    }),
  providerResponseByExternalId: (externalId: string) =>
    api.get<Record<string, unknown>>(`/nfse/external/${externalId}/provider-response`).then(r => {
      const data = r.data;
      return {
        id: String(data.id || externalId),
        provider: (data.provider as string | undefined) || undefined,
        externalId: (data.externalId as string | null | undefined) ?? null,
        status: (data.status as ProviderResponse['status']) || undefined,
        canonico: data.canonico as ProviderResponse['canonico'],
        providerRequest: data.providerRequest,
        providerResponse: data.providerResponse,
        error: (data.error as string | null | undefined) ?? null,
        createdAt: (data.createdAt as string | null | undefined) ?? null,
        updatedAt: (data.updatedAt as string | null | undefined) ?? null,
        raw: data.providerResponse || data,
        protocol: (data.externalId as string | undefined) || (data.protocol as string | undefined),
        receivedAt: (data.updatedAt as string | undefined) || new Date().toISOString(),
      } as ProviderResponse;
    }),
  webhookDiagnostics: () =>
    api.get<Record<string, unknown>>('/nfse/webhook/diagnostico').then(r => r.data),
  observabilityByExternalId: (externalId: string) =>
    api.get<Record<string, unknown>>(`/nfse/external/${externalId}/observability`).then(r => r.data),
  artifacts: (id: string) =>
    api.get<NfseArtifactsStatus>(`/nfse/${id}/artifacts`).then(r => r.data),
  downloadXml: (id: string) =>
    api.get(`/nfse/${id}/xml`, { responseType: 'blob' }).then(r => r.data),
  downloadPdf: (id: string) =>
    api.get(`/nfse/${id}/pdf`, { responseType: 'blob' }).then(r => r.data),
  downloadRemoteXml: (id: string) =>
    api.get(`/nfse/${id}/remote/xml`, { responseType: 'blob' }).then(r => r.data),
  downloadRemotePdf: (id: string) =>
    api.get(`/nfse/${id}/remote/pdf`, { responseType: 'blob' }).then(r => r.data),
  syncArtifacts: (id: string) =>
    api.post(`/nfse/${id}/sync-artifacts`).then(r => r.data),
};

// Empresas
const previewEmpresaByCnpj = (cnpj: string) =>
  api.post<Empresa>('/empresas/preview', { cnpj }).then(r => normalizeEmpresa(r.data));

const normalizeTomador = (raw: Tomador | Record<string, unknown>): Tomador => {
  const legacy = raw as Record<string, unknown>;
  const endereco = (legacy.endereco as Record<string, unknown> | undefined) ?? {};
  const pickString = (...values: unknown[]) => {
    for (const value of values) {
      if (value === null || value === undefined || value === '') continue;
      return String(value);
    }
    return undefined;
  };

  return {
    ...(raw as Tomador),
    id: pickString(legacy.id, legacy._id) || '',
    empresaCnpj: pickString(legacy.empresaCnpj, legacy.empresa_cnpj) || '',
    cpfCnpj: pickString(legacy.cpfCnpj, legacy.cpf_cnpj) || '',
    razaoSocial: pickString(legacy.razaoSocial, legacy.razao_social) || '',
    nomeFantasia: pickString(legacy.nomeFantasia, legacy.nome_fantasia),
    inscricaoMunicipal: pickString(legacy.inscricaoMunicipal, legacy.inscricao_municipal),
    inscricaoEstadual: pickString(legacy.inscricaoEstadual, legacy.inscricao_estadual, legacy.ie),
    suframa: pickString(legacy.suframa),
    substitutoTributario: (() => {
      const value = legacy.substitutoTributario ?? legacy.substituto_tributario;
      if (typeof value === 'boolean') return value;
      if (value === 'true') return true;
      if (value === 'false') return false;
      return undefined;
    })(),
    email: pickString(legacy.email),
    whatsapp: pickString(legacy.whatsapp),
    endereco: {
      logradouro: pickString(endereco.logradouro),
      numero: pickString(endereco.numero),
      complemento: pickString(endereco.complemento),
      bairro: pickString(endereco.bairro),
      municipio: pickString(endereco.municipio, endereco.cidade),
      uf: pickString(endereco.uf),
      cep: pickString(endereco.cep),
    },
    servicos: Array.isArray(legacy.servicos)
      ? legacy.servicos
          .map((item) => {
            const row = (item ?? {}) as Record<string, unknown>;
            const codigoServico = pickString(row.codigoServico, row.codigo_servico);
            const descricaoServico = pickString(row.descricaoServico, row.descricao_servico);
            if (!codigoServico || !descricaoServico) return null;
            return {
              codigoServico,
              descricaoServico,
              updatedAt: pickString(row.updatedAt, row.updated_at),
            };
          })
          .filter((item): item is NonNullable<typeof item> => item !== null)
      : undefined,
    createdAt: pickString(legacy.createdAt, legacy.created_at) || new Date().toISOString(),
    updatedAt: pickString(legacy.updatedAt, legacy.updated_at) || new Date().toISOString(),
  };
};

export const empresasApi = {
  list: (input?: { q?: string; limit?: number }) =>
    api.get<Empresa[]>('/empresas', {
      params: {
        q: input?.q?.trim() || undefined,
        limit: input?.limit,
      },
    }).then(r => (r.data || []).map((e: Empresa) => normalizeEmpresa(e))),
  getById: (id: string) =>
    api.get<Empresa>(`/empresas/${id}`).then(r => normalizeEmpresa(r.data)),
  getByCnpj: (cnpj: string) =>
    api.get<Empresa>(`/empresas/cnpj/${cnpj}`).then(r => normalizeEmpresa(r.data)),
  previewByCnpj: previewEmpresaByCnpj,
  previewCnpj: previewEmpresaByCnpj,
  previewcnpj: previewEmpresaByCnpj,
  create: (data: CreateEmpresaRequest) =>
    api.post<Empresa>('/empresas', {
      cnpj: data.cnpj,
      razaoSocial: data.razaoSocial,
      nomeFantasia: data.nomeFantasia,
      inscricaoMunicipal: data.inscricaoMunicipal,
      inscricaoEstadual: data.inscricaoEstadual,
      suframa: data.suframa,
      situacaoCadastral: data.situacaoCadastral,
      dataSituacaoCadastral: data.dataSituacaoCadastral,
      dataInicioAtividade: data.dataInicioAtividade,
      cnaeFiscal: data.cnaeFiscal,
      cnaeFiscalDescricao: data.cnaeFiscalDescricao,
      ctnCodigo: data.ctnCodigo,
      nbsCodigo: data.nbsCodigo,
      porte: data.porte,
      naturezaJuridica: data.naturezaJuridica,
      capitalSocial: data.capitalSocial,
      opcaoPeloSimples: data.opcaoPeloSimples,
      dataOpcaoPeloSimples: data.dataOpcaoPeloSimples,
      dataExclusaoDoSimples: data.dataExclusaoDoSimples,
      opcaoPeloMei: data.opcaoPeloMei,
      regimeTributario: data.regimeTributario,
      aliquotaSimplesNacional: data.aliquotaSimplesNacional,
      apuracaoSimplesNacional: data.apuracaoSimplesNacional,
      rbt12: data.rbt12,
      cnaesLista: data.cnaesLista,
      parametroMunicipal: data.parametroMunicipal,
      configOperacionais: data.configOperacionais,
      email: data.email,
      fone: data.telefone,
      whatsapp: data.whatsapp,
      nfseNum: data.nfseNum,
      dpsNum: data.dpsNum,
      serieDpsNum: data.serieDpsNum,
      endereco: typeof data.endereco === 'object' ? data.endereco : undefined,
    }).then(r => normalizeEmpresa(r.data)),
  update: (id: string, data: UpdateEmpresaRequest) =>
    api.patch<Empresa>(`/empresas/${id}`, {
      razaoSocial: data.razaoSocial,
      nomeFantasia: data.nomeFantasia,
      inscricaoMunicipal: data.inscricaoMunicipal,
      inscricaoEstadual: data.inscricaoEstadual,
      suframa: data.suframa,
      situacaoCadastral: data.situacaoCadastral,
      dataSituacaoCadastral: data.dataSituacaoCadastral,
      dataInicioAtividade: data.dataInicioAtividade,
      cnaeFiscal: data.cnaeFiscal,
      cnaeFiscalDescricao: data.cnaeFiscalDescricao,
      ctnCodigo: data.ctnCodigo,
      nbsCodigo: data.nbsCodigo,
      porte: data.porte,
      naturezaJuridica: data.naturezaJuridica,
      capitalSocial: data.capitalSocial,
      opcaoPeloSimples: data.opcaoPeloSimples,
      dataOpcaoPeloSimples: data.dataOpcaoPeloSimples,
      dataExclusaoDoSimples: data.dataExclusaoDoSimples,
      opcaoPeloMei: data.opcaoPeloMei,
      regimeTributario: data.regimeTributario,
      aliquotaSimplesNacional: data.aliquotaSimplesNacional,
      apuracaoSimplesNacional: data.apuracaoSimplesNacional,
      rbt12: data.rbt12,
      cnaesLista: data.cnaesLista,
      parametroMunicipal: data.parametroMunicipal,
      configOperacionais: data.configOperacionais,
      email: data.email,
      fone: data.telefone,
      whatsapp: data.whatsapp,
      nfseNum: data.nfseNum,
      dpsNum: data.dpsNum,
      serieDpsNum: data.serieDpsNum,
      endereco: typeof data.endereco === 'object' ? data.endereco : undefined,
    }).then(r => normalizeEmpresa(r.data)),
  delete: (id: string) =>
    api.delete(`/empresas/${id}`).then(r => r.data),
  importCertificadoDigital: (data: ImportCertificadoDigitalRequest) => {
    const formData = new FormData();
    formData.append('cnpj', data.cnpj);
    formData.append('senhaCertificado', data.senhaCertificado);
    formData.append('file', data.file);
    return api.post<ImportCertificadoDigitalResponse>('/empresas/certificado/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(r => r.data);
  },
  syncPlugNotasById: (id: string) =>
    api.post<SyncEmpresaPlugNotasResponse>(`/empresas/${id}/plugnotas/sync`).then((r) => r.data),
  syncPlugNotasByCnpj: (cnpj: string) =>
    api.post<SyncEmpresaPlugNotasResponse>(`/empresas/cnpj/${cnpj.replace(/\D/g, '')}/plugnotas/sync`).then((r) => r.data),
  lookupCnaeAnexo: (codigo: string) =>
    api.get<CnaeCatalogLookupItem>('/empresas/lookup/cnae-anexo', {
      params: { codigo: codigo.replace(/\D/g, '') || undefined },
    }).then((r) => r.data),
  lookupCnaeAnexos: (codes: string[]) =>
    api.get<CnaeCatalogLookupItem[]>('/empresas/lookup/cnae-anexo', {
      params: {
        codes: Array.from(new Set(codes.map((code) => code.replace(/\D/g, '')).filter((code) => code.length === 7))).join(',') || undefined,
      },
    }).then((r) => r.data || []),
};

// Tomadores
export const tomadoresApi = {
  list: (input?: { empresaCnpj?: string; q?: string }) =>
    api.get<Tomador[]>('/tomadores', {
      params: {
        empresaCnpj: input?.empresaCnpj?.replace(/\D/g, '') || undefined,
        q: input?.q?.trim() || undefined,
      },
    }).then(r => (r.data || []).map((item) => normalizeTomador(item))),
  autocomplete: (input: { empresaCnpj: string; q: string; limit?: number }) =>
    api.get<Tomador[]>('/tomadores/autocomplete', {
      params: {
        empresaCnpj: input.empresaCnpj.replace(/\D/g, ''),
        q: input.q.trim(),
        limit: input.limit,
      },
    }).then(r => (r.data || []).map((item) => normalizeTomador(item))),
  lookupCpf: (cpf: string) =>
    api.get<TomadorCpfLookupResponse>('/tomadores/lookup/cpf', {
      params: { cpf: cpf.replace(/\D/g, '') || undefined },
    }).then((r) => r.data),
  getById: (id: string) =>
    api.get<Tomador>(`/tomadores/${id}`).then(r => normalizeTomador(r.data)),
  create: (data: CreateTomadorRequest) =>
    api.post<Tomador>('/tomadores', {
      ...data,
      empresaCnpj: data.empresaCnpj.replace(/\D/g, ''),
      cpfCnpj: data.cpfCnpj.replace(/\D/g, ''),
      nomeFantasia: data.nomeFantasia?.trim() || undefined,
      whatsapp: data.whatsapp?.replace(/\D/g, '') || undefined,
      substitutoTributario: typeof data.substitutoTributario === 'boolean' ? data.substitutoTributario : undefined,
    }).then(r => normalizeTomador(r.data)),
  update: (id: string, data: UpdateTomadorRequest) =>
    api.patch<Tomador>(`/tomadores/${id}`, {
      ...data,
      nomeFantasia: data.nomeFantasia?.trim() || undefined,
      whatsapp: data.whatsapp?.replace(/\D/g, '') || undefined,
      substitutoTributario: typeof data.substitutoTributario === 'boolean' ? data.substitutoTributario : undefined,
    }).then(r => normalizeTomador(r.data)),
  delete: (id: string) =>
    api.delete(`/tomadores/${id}`).then(r => r.data),
};

// Users
export const usersApi = {
  list: () =>
    api.get<User[]>('/users').then(r => r.data),
  getById: (id: string) =>
    api.get<User>(`/users/${id}`).then(r => r.data),
  create: (data: CreateUserRequest) =>
    api.post<User>('/users', {
      ...data,
      role: data.role ? roleToApi(data.role) : undefined,
      status: data.status || 'active',
    }).then(r => r.data),
  invite: (data: InviteUserRequest) =>
    api.post<InviteUserResponse>('/users/invite', {
      ...data,
      role: data.role ? roleToApi(data.role) : undefined,
    }).then(r => r.data),
  update: (id: string, data: UpdateUserRequest) =>
    api.patch<User>(`/users/${id}`, {
      ...data,
      role: data.role ? roleToApi(data.role) : undefined,
    }).then(r => r.data),
  delete: (id: string) =>
    api.delete(`/users/${id}`).then(r => r.data),
};
