import api from '@/lib/api';
import type {
  LoginRequest, LoginResponse, User, CreateUserRequest, UpdateUserRequest,
  Empresa, CreateEmpresaRequest, UpdateEmpresaRequest,
  Nfse, EmitirNfseRequest, NfseArtifact, ProviderResponse,
  NfseFilters, PaginatedResponse,
} from '@/types/api';

// Auth
export const authApi = {
  login: (data: LoginRequest) =>
    api.post<LoginResponse>('/auth/login', data).then(r => r.data),
  me: () =>
    api.get<User>('/auth/me').then(r => r.data),
};

// NFSe
export const nfseApi = {
  list: (filters: NfseFilters = {}) =>
    api.get<PaginatedResponse<Nfse>>('/nfse', { params: filters }).then(r => r.data),
  getById: (id: string) =>
    api.get<Nfse>(`/nfse/${id}`).then(r => r.data),
  emitir: (data: EmitirNfseRequest) =>
    api.post<Nfse>('/nfse/emitir', data).then(r => r.data),
  providerResponse: (id: string) =>
    api.get<ProviderResponse>(`/nfse/${id}/provider-response`).then(r => r.data),
  artifacts: (id: string) =>
    api.get<NfseArtifact[]>(`/nfse/${id}/artifacts`).then(r => r.data),
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
    api.get<Empresa[]>('/empresas').then(r => r.data),
  getById: (id: string) =>
    api.get<Empresa>(`/empresas/${id}`).then(r => r.data),
  getByCnpj: (cnpj: string) =>
    api.get<Empresa>(`/empresas/cnpj/${cnpj}`).then(r => r.data),
  create: (data: CreateEmpresaRequest) =>
    api.post<Empresa>('/empresas', data).then(r => r.data),
  update: (id: string, data: UpdateEmpresaRequest) =>
    api.patch<Empresa>(`/empresas/${id}`, data).then(r => r.data),
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
    api.post<User>('/users', data).then(r => r.data),
  update: (id: string, data: UpdateUserRequest) =>
    api.patch<User>(`/users/${id}`, data).then(r => r.data),
  delete: (id: string) =>
    api.delete(`/users/${id}`).then(r => r.data),
};
