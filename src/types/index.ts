// Tipos do Sistema de Gestão de Licenças Prêmio - TRANSALVADOR

export type UserRole = 'admin' | 'rh';

export interface User {
  id: string;
  email: string;
  nome: string;
  role: UserRole;
  createdAt: Date;
}

export interface Servidor {
  id: string;
  nome: string;
  dataNascimento: Date;
  sexo: 'M' | 'F';
  matricula: string;
  registroUnico: string;
  rg: string;
  cpf: string;
  dataAdmissao: Date;
  cargo: string;
  lotacao: string;
  vinculo: string;
  filiacao?: string;
  endereco?: string;
  telefone?: string;
  email?: string;
}

export interface Processo {
  id: string;
  servidorId: string;
  numeroProcesso: string;
  processoAnterior?: string;
  dataAbertura: Date;
  quinquenio: number;
  status: 'ATIVO' | 'PENDENTE' | 'FINALIZADO';
  situacao: 'DEFERIDO' | 'INDEFERIDO' | 'EM_ANALISE' | 'DEFERIDO_PUBLICADO';
  dataPublicacao?: Date;
  responsavel?: string;
  nivel?: string;
}

export interface Falta {
  id: string;
  matricula: string;
  nomeServidor: string;
  evento: string;
  tipoEvento: string;
  competencia: string;
  referencia: string;
  tipoReferencia: string;
  tipoFolha: string;
  cargo: string;
  situacao: string;
  valor: number;
}

export interface Afastamento {
  id: string;
  matricula: string;
  registroUnico: string;
  nomeServidor: string;
  motivo: 'FERIAS' | 'ATESTADO_LICENCA_MEDICA' | 'LICENCA_PREMIO' | 'OUTROS';
  motivoDescricao: string;
  documentoReferencia?: string;
  inicioRelatorio: Date;
  fimRelatorio: Date;
  cadastroAfastamento: Date;
  inicioEvento: Date;
  fimEvento: Date;
  dataPublicacao?: Date;
  cargo: string;
  funcao?: string;
  gerencia: string;
}

export interface Quinquenio {
  numero: number;
  dataInicio: Date;
  dataFim: Date;
  diasCorridos: number;
  faltas: {
    quantidade: number;
    diasDesconto: number;
  };
  atestados: {
    quantidade: number;
    diasDesconto: number;
  };
  outrosAfastamentos: {
    lista: Afastamento[];
    diasDesconto: number;
  };
  totalDescontos: number;
  diasLiquidos: number;
  resultado: 'DEFERIDO' | 'INDEFERIDO';
  diferenca: number;
  processoNumero?: string;
}

export interface CalculoServidor {
  servidor: Servidor;
  quinquenios: Quinquenio[];
  totalQuinqueniosDeferidos: number;
}

export interface DashboardKPIs {
  vencidos: number;
  urgentes: number;
  proximos: number;
  emBreve: number;
  totalProcessos: number;
  tempoMedioPublicacao: number;
  totalServidores: number;
}

export interface ProcessosPorAno {
  ano: number;
  quantidade: number;
}

export interface ProcessosPorSituacao {
  situacao: string;
  quantidade: number;
  percentual: number;
}

export interface LogAtividade {
  id: string;
  dataHora: Date;
  usuario: string;
  tipoAcao: 'UPLOAD' | 'CERTIDAO_GERADA' | 'PORTARIA_GERADA' | 'LOGIN' | 'LOGOUT' | 'USUARIO_CRIADO' | 'USUARIO_EDITADO' | 'CONFIGURACAO_ALTERADA';
  detalhes: string;
  ip?: string;
}

export interface Autoridade {
  id: string;
  cargo: string;
  nome: string;
}

export interface ConfiguracaoSistema {
  diasQuinquenio: number;
  descontoFalta: number;
  descontoAtestado: number;
  logoUrl?: string;
  assinaturaUrl?: string;
  cabecalhoPadrao: string;
  rodapePadrao: string;
  autoridades: Autoridade[];
}
