import api from '@/lib/api';
import type {
  LoginRequest, LoginResponse, User, CreateUserRequest, UpdateUserRequest,
  Empresa, CreateEmpresaRequest, UpdateEmpresaRequest, ImportCertificadoDigitalRequest, ImportCertificadoDigitalResponse,
  Nfse, EmitirNfseRequest, EmitirNfseResponse, NfseArtifactsStatus, ProviderResponse,
  NfseFilters, PaginatedResponse, EmitirNfseQuickRequest, EmitirNfseQuickResponse, ServicoCatalogItem,
} from '@/types/api';
import { roleToApi } from '@/lib/roles';

const normalizeEmpresa = (raw: Empresa | Record<string, unknown>): Empresa => {
  const legacy = raw as Record<string, unknown>;
  const providerData = (legacy.providerData as Record<string, unknown> | undefined) ?? {};
  const enderecoRaw = (legacy.endereco as Record<string, unknown> | undefined) ?? {};
  const pickString = (...values: unknown[]) => {
    for (const value of values) {
      if (value === null || value === undefined || value === '') continue;
      return String(value);
    }
    return undefined;
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
  const hasEndereco = Object.values(endereco).some((value) => value !== undefined && value !== '');

  return {
    ...(raw as Empresa),
    id: pickString(legacy.id, legacy._id) || '',
    cnpj: pickString(legacy.cnpj, legacy.cpf_cnpj) || '',
    razaoSocial: pickString(legacy.razaoSocial, legacy.nome_razao_social) || '',
    nomeFantasia: pickString(legacy.nomeFantasia, legacy.nome_fantasia),
    inscricaoMunicipal: pickString(legacy.inscricaoMunicipal, legacy.inscricao_municipal),
    situacaoCadastral: pickString(
      legacy.situacaoCadastral,
      legacy.situacao_cadastral,
      providerData.situacao_cadastral,
    ),
    dataSituacaoCadastral: pickString(
      legacy.dataSituacaoCadastral,
      legacy.data_situacao_cadastral,
    ),
    dataInicioAtividade: pickString(
      legacy.dataInicioAtividade,
      legacy.data_inicio_atividade,
      providerData.data_inicio_atividade,
    ),
    cnaeFiscal: pickString(legacy.cnaeFiscal, legacy.cnae_fiscal),
    cnaeFiscalDescricao: pickString(legacy.cnaeFiscalDescricao, legacy.cnae_fiscal_descricao),
    porte: pickString(legacy.porte, providerData.porte),
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
    opcaoPeloSimples: typeof legacy.opcaoPeloSimples === 'boolean'
      ? legacy.opcaoPeloSimples
      : typeof legacy.opcao_pelo_simples === 'boolean'
        ? legacy.opcao_pelo_simples
        : undefined,
    opcaoPeloMei: typeof legacy.opcaoPeloMei === 'boolean'
      ? legacy.opcaoPeloMei
      : typeof legacy.opcao_pelo_mei === 'boolean'
        ? legacy.opcao_pelo_mei
        : undefined,
    dataOpcaoPeloSimples: pickString(legacy.dataOpcaoPeloSimples, legacy.data_opcao_pelo_simples),
    dataExclusaoDoSimples: pickString(
      legacy.dataExclusaoDoSimples,
      legacy.data_exclusao_do_simples,
    ),
    email: pickString(legacy.email),
    fone: pickString(legacy.fone, legacy.telefone, legacy.ddd_telefone_1),
    endereco: hasEndereco ? endereco : undefined,
  };
};

// Auth
export const authApi = {
  login: (data: LoginRequest) =>
    api.post<LoginResponse>('/auth/login', data).then(r => r.data),
  me: () =>
    api.get<User>('/auth/me').then(r => r.data),
};

// NFSe
export const nfseApi = {
  list: (filters: NfseFilters = {}) => {
    const params = {
      ...filters,
      provider: filters.provider ? String(filters.provider).toLowerCase() : undefined,
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
  getById: (id: string) =>
    api.get<Nfse>(`/nfse/${id}`).then(r => r.data),
  emitir: (data: EmitirNfseRequest) =>
    api.post<EmitirNfseResponse>('/nfse/emitir', data).then(r => r.data),
  emitirQuick: (data: EmitirNfseQuickRequest) =>
    api.post<EmitirNfseQuickResponse>('/nfse/quick', data).then(r => r.data),
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
      situacaoCadastral: data.situacaoCadastral,
      dataSituacaoCadastral: data.dataSituacaoCadastral,
      dataInicioAtividade: data.dataInicioAtividade,
      cnaeFiscal: data.cnaeFiscal,
      cnaeFiscalDescricao: data.cnaeFiscalDescricao,
      porte: data.porte,
      naturezaJuridica: data.naturezaJuridica,
      capitalSocial: data.capitalSocial,
      opcaoPeloSimples: data.opcaoPeloSimples,
      dataOpcaoPeloSimples: data.dataOpcaoPeloSimples,
      dataExclusaoDoSimples: data.dataExclusaoDoSimples,
      opcaoPeloMei: data.opcaoPeloMei,
      email: data.email,
      fone: data.telefone,
      endereco: typeof data.endereco === 'object' ? data.endereco : undefined,
    }).then(r => normalizeEmpresa(r.data)),
  update: (id: string, data: UpdateEmpresaRequest) =>
    api.patch<Empresa>(`/empresas/${id}`, {
      razaoSocial: data.razaoSocial,
      nomeFantasia: data.nomeFantasia,
      inscricaoMunicipal: data.inscricaoMunicipal,
      situacaoCadastral: data.situacaoCadastral,
      dataSituacaoCadastral: data.dataSituacaoCadastral,
      dataInicioAtividade: data.dataInicioAtividade,
      cnaeFiscal: data.cnaeFiscal,
      cnaeFiscalDescricao: data.cnaeFiscalDescricao,
      porte: data.porte,
      naturezaJuridica: data.naturezaJuridica,
      capitalSocial: data.capitalSocial,
      opcaoPeloSimples: data.opcaoPeloSimples,
      dataOpcaoPeloSimples: data.dataOpcaoPeloSimples,
      dataExclusaoDoSimples: data.dataExclusaoDoSimples,
      opcaoPeloMei: data.opcaoPeloMei,
      email: data.email,
      fone: data.telefone,
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
  update: (id: string, data: UpdateUserRequest) =>
    api.patch<User>(`/users/${id}`, {
      ...data,
      role: data.role ? roleToApi(data.role) : undefined,
    }).then(r => r.data),
  delete: (id: string) =>
    api.delete(`/users/${id}`).then(r => r.data),
};
