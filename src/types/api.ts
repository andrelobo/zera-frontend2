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
  inscricaoEstadual?: string;
  suframa?: string;
  situacaoCadastral?: string;
  dataSituacaoCadastral?: string;
  dataInicioAtividade?: string;
  cnaeFiscal?: number | string;
  cnaeFiscalDescricao?: string;
  ctnCodigo?: string;
  nbsCodigo?: string;
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
  rbt12?: number | string;
  simplesSnapshot?: {
    anexo?: string;
    faixa?: number;
    aliquotaNominal?: number;
    parcelaDeduzir?: number;
    aliquotaEfetiva?: number;
    issReferencia?: number;
    rbt12?: number;
    valido?: boolean;
    calculadoEm?: string;
  };
  biCatalogoResumo?: {
    totalCnaes: number;
    totalFavoritosMunicipais: number;
    totalVinculosMunicipais: number;
    totalConfigOperacionais: number;
  };
  cnaesLista?: Array<{
    codigo?: number | string;
    descricao?: string;
    isPrincipal?: boolean;
    isManual?: boolean;
    anexo?: string | null;
    anexoLoading?: boolean;
  }>;
  parametroMunicipal?: Array<Record<string, unknown>>;
  configOperacionais?: Array<{
    id?: string;
    natureza?: string;
    descricao?: string;
  }>;
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
  whatsapp?: string;
  nfseNum?: string;
  dpsNum?: string;
  serieDpsNum?: string;
  fone?: string;
  email?: string;
  statusCadastro?: 'PENDENTE' | 'COMPLETO';
  prontoParaEmitir?: boolean;
  percentualCompletude?: number;
  camposFaltantes?: string[];
  camposFaltantesEmissao?: string[];
  fonteConsulta?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEmpresaRequest {
  razaoSocial?: string;
  nomeFantasia?: string;
  cnpj: string;
  inscricaoMunicipal?: string;
  inscricaoEstadual?: string;
  suframa?: string;
  situacaoCadastral?: string;
  dataSituacaoCadastral?: string;
  dataInicioAtividade?: string;
  cnaeFiscal?: number | string;
  cnaeFiscalDescricao?: string;
  ctnCodigo?: string;
  nbsCodigo?: string;
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
  rbt12?: number | string;
  cnaesLista?: Array<{
    codigo?: number | string;
    descricao?: string;
    isPrincipal?: boolean;
    isManual?: boolean;
    anexo?: string | null;
    anexoLoading?: boolean;
  }>;
  parametroMunicipal?: Array<Record<string, unknown>>;
  configOperacionais?: Array<{
    id?: string;
    natureza?: string;
    descricao?: string;
  }>;
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
  whatsapp?: string;
  nfseNum?: string;
  dpsNum?: string;
  serieDpsNum?: string;
  email?: string;
}

export type UpdateEmpresaRequest = Partial<CreateEmpresaRequest>;

export interface CnaeCatalogLookupItem {
  codigoCnae: string;
  descricao?: string;
  anexo: string;
  permiteFatorR: boolean;
  found: boolean;
  source: 'catalog' | 'fallback_default' | string;
}

// Tomadores
export interface Tomador {
  id: string;
  _id?: string;
  empresaCnpj: string;
  cpfCnpj: string;
  razaoSocial: string;
  nomeFantasia?: string;
  inscricaoMunicipal?: string;
  inscricaoEstadual?: string;
  suframa?: string;
  substitutoTributario?: boolean;
  email?: string;
  whatsapp?: string;
  endereco?: {
    logradouro?: string;
    numero?: string;
    complemento?: string;
    bairro?: string;
    municipio?: string;
    uf?: string;
    cep?: string;
  };
  servicos?: Array<{
    codigoServico: string;
    descricaoServico: string;
    updatedAt?: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTomadorRequest {
  empresaCnpj: string;
  cpfCnpj: string;
  razaoSocial: string;
  nomeFantasia?: string;
  inscricaoMunicipal?: string;
  inscricaoEstadual?: string;
  suframa?: string;
  substitutoTributario?: boolean;
  email?: string;
  whatsapp?: string;
  endereco?: {
    logradouro?: string;
    numero?: string;
    complemento?: string;
    bairro?: string;
    municipio?: string;
    uf?: string;
    cep?: string;
  };
  servicos?: Array<{
    codigoServico: string;
    descricaoServico: string;
  }>;
}

export type UpdateTomadorRequest = Partial<Omit<CreateTomadorRequest, 'empresaCnpj' | 'cpfCnpj'>>;

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
    baseCalculo?: number;
    desconto?: number;
  };
  tomadorCnpjCpf?: string;
  tomadorRazaoSocial?: string;
  descricaoServico?: string;
  valorServico?: number;
  baseCalculo?: number;
  desconto?: number;
  aliquotaIss?: number;
  valorIss?: number;
  retPis?: number;
  retCofins?: number;
  retCsll?: number;
  retIr?: number;
  retInss?: number;
  codigoServico?: string;
  competencia?: string;
  dataEmissao?: string;
  errorCode?: string;
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EmitirNfseRequest {
  numeroNfse?: string;
  competencia?: string;
  dataEmissao?: string;
  localPrestacao?: {
    pais?: string;
    uf?: string;
    municipio?: string;
  };
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
    baseCalculo?: number;
    desconto?: number;
    retencoesFederais?: {
      pis?: number;
      cofins?: number;
      csll?: number;
      ir?: number;
      inss?: number;
    };
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
  dateFrom?: string;
  dateTo?: string;
  sort?: string;
  order?: 'ASC' | 'DESC';
}

export interface NfseBiSummary {
  totals: {
    totalEmissoes: number;
    totalAutorizadas: number;
    totalPendentes: number;
    totalRejeitadas: number;
    totalCanceladas: number;
    totalComErro: number;
    somaValorServico: number;
    somaBaseCalculo: number;
    somaDesconto: number;
    somaValorIss: number;
    somaRetencoes: number;
    ticketMedio: number;
  };
  retencoes: {
    pis: number;
    cofins: number;
    csll: number;
    ir: number;
    inss: number;
  };
  tributacaoTotal?: {
    federal: number;
    estadual: number;
    municipal: number;
  };
  seriesCompetencia: Array<{
    competencia: string;
    quantidade: number;
    valorServico: number;
    valorIss: number;
  }>;
  topServicos: Array<{
    codigoServico: string;
    descricaoServico: string;
    quantidade: number;
    valorServico: number;
  }>;
  topMunicipiosPrestacao?: Array<{
    municipio: string;
    uf: string;
    quantidade: number;
    valorServico: number;
  }>;
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
