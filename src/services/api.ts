import api from '@/lib/api';
import type {
  LoginRequest, LoginResponse, User, CreateUserRequest, UpdateUserRequest,
  Empresa, CreateEmpresaRequest, UpdateEmpresaRequest,
  Nfse, EmitirNfseRequest, EmitirNfseResponse, NfseArtifactsStatus, ProviderResponse,
  NfseFilters, PaginatedResponse,
} from '@/types/api';
import { roleToApi } from '@/lib/roles';

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
export const empresasApi = {
  list: () =>
    api.get<Empresa[]>('/empresas').then(r => (r.data || []).map((e: Empresa) => ({ ...e, id: e.id || e._id || '' }))),
  getById: (id: string) =>
    api.get<Empresa>(`/empresas/${id}`).then(r => ({ ...r.data, id: r.data.id || r.data._id || '' })),
  getByCnpj: (cnpj: string) =>
    api.get<Empresa>(`/empresas/cnpj/${cnpj}`).then(r => ({ ...r.data, id: r.data.id || r.data._id || '' })),
  create: (data: CreateEmpresaRequest) =>
    api.post<Empresa>('/empresas', { cnpj: data.cnpj }).then(r => ({ ...r.data, id: r.data.id || r.data._id || '' })),
  update: (id: string, data: UpdateEmpresaRequest) =>
    api.patch<Empresa>(`/empresas/${id}`, {
      razaoSocial: data.razaoSocial,
      nomeFantasia: data.nomeFantasia,
      inscricaoMunicipal: data.inscricaoMunicipal,
      email: data.email,
      fone: data.telefone,
      endereco: typeof data.endereco === 'object' ? data.endereco : undefined,
    }).then(r => ({ ...r.data, id: r.data.id || r.data._id || '' })),
  delete: (id: string) =>
    api.delete(`/empresas/${id}`).then(r => r.data),
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
