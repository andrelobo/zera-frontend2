// API Types for ZERA NFSe System

export interface ApiError {
  code: string;
  message: string;
  correlationId?: string;
  details?: unknown;
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
  accessToken?: string;
  access_token?: string;
}

export interface User {
  id: string;
  email: string;
  name?: string;
  role: UserRole;
  status?: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export type UserRole = 'admin' | 'manager' | 'user' | 'ADMIN' | 'OPERATOR';

export interface CreateUserRequest {
  email: string;
  name: string;
  password: string;
  role?: UserRole;
  status?: 'active' | 'inactive';
}

export interface UpdateUserRequest {
  email?: string;
  name?: string;
  password?: string;
  role?: UserRole;
  status?: 'active' | 'inactive';
}

// Empresa
export interface Empresa {
  id: string;
  _id?: string;
  razaoSocial: string;
  nomeFantasia?: string;
  cnpj: string;
  inscricaoMunicipal?: string;
  situacaoCadastral?: string;
  dataSituacaoCadastral?: string;
  dataInicioAtividade?: string;
  cnaeFiscal?: number | string;
  cnaeFiscalDescricao?: string;
  porte?: string;
  naturezaJuridica?: string;
  capitalSocial?: number;
  opcaoPeloSimples?: boolean | null;
  dataOpcaoPeloSimples?: string | null;
  dataExclusaoDoSimples?: string | null;
  opcaoPeloMei?: boolean | null;
  regimeTributario?: 'simples_nacional' | 'lucro_presumido' | 'lucro_real' | string;
  aliquotaSimplesNacional?: number | string;
  apuracaoSimplesNacional?: string;
  endereco?: {
    logradouro?: string;
    numero?: string;
    complemento?: string;
    bairro?: string;
    cidade?: string;
    uf?: string;
    cep?: string;
    descricaoCidade?: string;
    estado?: string;
  };
  cidade?: string;
  uf?: string;
  cep?: string;
  telefone?: string;
  fone?: string;
  email?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEmpresaRequest {
  razaoSocial?: string;
  nomeFantasia?: string;
  cnpj: string;
  inscricaoMunicipal?: string;
  situacaoCadastral?: string;
  dataSituacaoCadastral?: string;
  dataInicioAtividade?: string;
  cnaeFiscal?: number | string;
  cnaeFiscalDescricao?: string;
  porte?: string;
  naturezaJuridica?: string;
  capitalSocial?: number;
  opcaoPeloSimples?: boolean | null;
  dataOpcaoPeloSimples?: string | null;
  dataExclusaoDoSimples?: string | null;
  opcaoPeloMei?: boolean | null;
  regimeTributario?: 'simples_nacional' | 'lucro_presumido' | 'lucro_real' | string;
  aliquotaSimplesNacional?: number | string;
  apuracaoSimplesNacional?: string;
  endereco?: string | {
    logradouro?: string;
    numero?: string;
    complemento?: string;
    bairro?: string;
    cidade?: string;
    uf?: string;
    cep?: string;
  };
  cidade?: string;
  uf?: string;
  cep?: string;
  telefone?: string;
  email?: string;
}

export type UpdateEmpresaRequest = Partial<CreateEmpresaRequest>;

// NFSe
export type NfseStatus = 'PENDING' | 'PROCESSING' | 'AUTHORIZED' | 'REJECTED' | 'ERROR' | 'CANCELLED';
export type NfseProvider = 'PLUGNOTAS' | 'MANAUS' | 'MOCK';

export interface NfseAddress {
  logradouro?: string;
  numero?: string;
  bairro?: string;
  municipio?: string;
  uf?: string;
  cep?: string;
}

export interface Nfse {
  id: string;
  numero?: string;
  status: NfseStatus;
  provider: NfseProvider | string;
  externalId?: string;
  empresaId?: string;
  empresa?: Empresa;
  tomador?: {
    cpfCnpj?: string;
    razaoSocial?: string;
    inscricaoMunicipal?: string;
    endereco?: NfseAddress;
  };
  prestador?: {
    cnpj?: string;
    inscricaoMunicipal?: string;
    razaoSocial?: string;
  };
  servico?: {
    codigoNacional?: string;
    codigoTributacao?: string;
    codigoMunicipal?: string;
    descricao?: string;
    valor?: number;
  };
  tomadorCnpjCpf?: string;
  tomadorRazaoSocial?: string;
  descricaoServico?: string;
  valorServico?: number;
  aliquotaIss?: number;
  valorIss?: number;
  codigoServico?: string;
  errorCode?: string;
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EmitirNfseRequest {
  prestador: {
    cnpj: string;
    inscricaoMunicipal?: string;
    razaoSocial?: string;
    regimeTributarioSn?: {
      opSimpNac?: number;
      regApTribSN?: number;
      regEspTrib?: number;
    };
    endereco?: NfseAddress;
  };
  tomador: {
    cpfCnpj: string;
    razaoSocial: string;
    inscricaoMunicipal?: string;
    endereco?: NfseAddress;
  };
  servico: {
    codigoNacional: string;
    codigoTributacao?: string;
    codigoMunicipal?: string;
    descricao: string;
    valor: number;
    iss?: {
      tipoTributacao?: number;
      exigibilidade?: number;
      retido?: boolean;
      aliquota?: number;
    };
    tributacaoTotal?: {
      federal?: number;
      estadual?: number;
      municipal?: number;
    };
  };
  referenciaExterna: string;
}

export interface EmitirNfseResponse {
  emissionId: string;
  idempotentReplay: boolean;
  result: {
    protocol?: string;
    status?: NfseStatus;
    idNota?: string;
    raw?: unknown;
  };
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
  id: string;
  provider?: string;
  externalId?: string | null;
  status?: NfseStatus;
  providerRequest?: unknown;
  providerResponse?: unknown;
  error?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  raw: unknown;
  protocol?: string;
  receivedAt: string;
}

export interface NfseArtifactsStatus {
  id: string;
  externalId?: string;
  hasXml: boolean;
  hasPdf: boolean;
  status: NfseStatus;
  updatedAt: string;
}

export interface ServicoCatalogItem {
  codigoServico: string;
  itemLc116?: string;
  sequencial?: number;
  descricao: string;
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

// Certificado digital
export interface ImportCertificadoDigitalRequest {
  cnpj: string;
  senhaCertificado: string;
  file: File;
}

export interface ImportCertificadoDigitalResponse {
  cnpj: string;
  fileName: string;
  fileSize: number;
  uploadedAt: string;
  expiresAt?: string;
  issuer?: string;
}

// Emissao rapida
export interface EmitirNfseQuickRequest {
  cnpj: string;
  cpfTomador: string;
  valor: number;
  codigoServico: string;
}

export interface EmitirNfseQuickResponse {
  emissionId: string;
  idempotentReplay: boolean;
  result: {
    status: NfseStatus;
    provider: NfseProvider | string;
    externalId?: string;
    providerResponse?: unknown;
    providerRequest?: unknown;
  };
}
