// API Types for ZERA NFSe System

export interface ApiError {
  code: string;
  message: string;
  correlationId?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Auth
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'OPERATOR';
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserRequest {
  email: string;
  name: string;
  password: string;
  role: 'ADMIN' | 'OPERATOR';
}

export interface UpdateUserRequest {
  email?: string;
  name?: string;
  password?: string;
  role?: 'ADMIN' | 'OPERATOR';
}

// Empresa
export interface Empresa {
  id: string;
  razaoSocial: string;
  nomeFantasia?: string;
  cnpj: string;
  inscricaoMunicipal?: string;
  endereco?: string;
  cidade?: string;
  uf?: string;
  cep?: string;
  telefone?: string;
  email?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEmpresaRequest {
  razaoSocial: string;
  nomeFantasia?: string;
  cnpj: string;
  inscricaoMunicipal?: string;
  endereco?: string;
  cidade?: string;
  uf?: string;
  cep?: string;
  telefone?: string;
  email?: string;
}

export interface UpdateEmpresaRequest extends Partial<CreateEmpresaRequest> {}

// NFSe
export type NfseStatus = 'PENDING' | 'PROCESSING' | 'AUTHORIZED' | 'REJECTED' | 'ERROR' | 'CANCELLED';
export type NfseProvider = 'MANAUS' | 'MOCK';

export interface Nfse {
  id: string;
  numero?: string;
  status: NfseStatus;
  provider: NfseProvider;
  empresaId: string;
  empresa?: Empresa;
  tomadorCnpjCpf?: string;
  tomadorRazaoSocial?: string;
  descricaoServico: string;
  valorServico: number;
  aliquotaIss?: number;
  valorIss?: number;
  codigoServico?: string;
  errorCode?: string;
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EmitirNfseRequest {
  empresaId: string;
  tomadorCnpjCpf?: string;
  tomadorRazaoSocial?: string;
  descricaoServico: string;
  valorServico: number;
  aliquotaIss?: number;
  codigoServico?: string;
}

export interface NfseArtifact {
  id: string;
  nfseId: string;
  type: 'XML' | 'PDF';
  source: 'LOCAL' | 'REMOTE';
  filename: string;
  url?: string;
  createdAt: string;
}

export interface ProviderResponse {
  raw: unknown;
  protocol?: string;
  receivedAt: string;
}

// Filters
export interface NfseFilters {
  page?: number;
  limit?: number;
  status?: NfseStatus;
  provider?: NfseProvider;
  sort?: string;
  order?: 'ASC' | 'DESC';
}
