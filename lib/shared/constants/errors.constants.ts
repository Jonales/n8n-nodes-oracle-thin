/**
 * Constantes de erros padronizadas para Oracle nodes
 * Localização: src/shared/constants/errors.constants.ts
 */

export const ORACLE_ERROR_CODES = {
  // Erros de conexão
  CONNECTION: {
    TNS_LISTENER_NOT_FOUND: 'ORA-12541',
    SERVICE_NAME_NOT_FOUND: 'ORA-12514',
    SID_NOT_FOUND: 'ORA-12505',
    INVALID_CREDENTIALS: 'ORA-01017',
    DATABASE_NOT_AVAILABLE: 'ORA-01034',
    CONNECTION_TIMEOUT: 'ORA-12170',
    CONNECTION_REFUSED: 'ECONNREFUSED',
    HOST_NOT_FOUND: 'ENOTFOUND',
    TIMEOUT: 'ETIMEDOUT',
  },
  
  // Erros de transação
  TRANSACTION: {
    DEADLOCK: 'ORA-00060',
    SERIALIZATION_FAILURE: 'ORA-08177',
    RESOURCE_BUSY: 'ORA-00054',
    RESOURCE_BUSY_NOWAIT: 'ORA-30006',
  },
  
  // Erros de PL/SQL
  PLSQL: {
    COMPILATION_ERROR: 'PLS-00103',
    INVALID_CURSOR: 'ORA-01001',
    NO_DATA_FOUND: 'ORA-01403',
    TOO_MANY_ROWS: 'ORA-01422',
    INVALID_IDENTIFIER: 'PLS-00201',
  },
  
  // Erros de dados
  DATA: {
    CONSTRAINT_VIOLATION: 'ORA-00001',
    NULL_CONSTRAINT: 'ORA-01400',
    FOREIGN_KEY_VIOLATION: 'ORA-02291',
    INVALID_NUMBER: 'ORA-01722',
    DATE_FORMAT_ERROR: 'ORA-01861',
    BUFFER_TOO_SMALL: 'ORA-06502',
  }
} as const;

export const ORACLE_ERROR_MESSAGES = {
  [ORACLE_ERROR_CODES.CONNECTION.TNS_LISTENER_NOT_FOUND]: 
    'Listener Oracle não encontrado. Verifique se o serviço Oracle está rodando e o host/porta estão corretos.',
    
  [ORACLE_ERROR_CODES.CONNECTION.SERVICE_NAME_NOT_FOUND]: 
    'Service name não encontrado. Verifique o nome do serviço Oracle na string de conexão.',
    
  [ORACLE_ERROR_CODES.CONNECTION.SID_NOT_FOUND]: 
    'SID não existe. Verifique o SID ou service_name do banco Oracle.',
    
  [ORACLE_ERROR_CODES.CONNECTION.INVALID_CREDENTIALS]: 
    'Credenciais inválidas: Nome de usuário ou senha incorretos.',
    
  [ORACLE_ERROR_CODES.CONNECTION.DATABASE_NOT_AVAILABLE]: 
    'Oracle não está disponível: O banco de dados Oracle não está rodando.',
    
  [ORACLE_ERROR_CODES.CONNECTION.CONNECTION_TIMEOUT]: 
    'Timeout de conexão: Verifique se o firewall não está bloqueando a conexão.',
    
  [ORACLE_ERROR_CODES.CONNECTION.CONNECTION_REFUSED]: 
    'Conexão rejeitada: Verifique se o Oracle está rodando na porta especificada.',
    
  [ORACLE_ERROR_CODES.CONNECTION.HOST_NOT_FOUND]: 
    'Host não encontrado: Verifique o endereço do servidor Oracle na string de conexão.',
    
  [ORACLE_ERROR_CODES.CONNECTION.TIMEOUT]: 
    'Timeout de conexão: Servidor Oracle demorou muito para responder. Verifique conectividade de rede.',
    
  [ORACLE_ERROR_CODES.TRANSACTION.DEADLOCK]: 
    'Deadlock detectado. A operação foi cancelada para resolver o impasse.',
    
  [ORACLE_ERROR_CODES.TRANSACTION.SERIALIZATION_FAILURE]: 
    'Falha de serialização: Transação foi interrompida devido a conflito com outra transação.',
    
  [ORACLE_ERROR_CODES.TRANSACTION.RESOURCE_BUSY]: 
    'Recurso ocupado: Outro processo está usando o recurso solicitado.',
    
  [ORACLE_ERROR_CODES.PLSQL.NO_DATA_FOUND]: 
    'Nenhum dado encontrado: A consulta não retornou resultados.',
    
  [ORACLE_ERROR_CODES.PLSQL.TOO_MANY_ROWS]: 
    'Muitas linhas retornadas: SELECT INTO retornou mais de uma linha.',
    
  [ORACLE_ERROR_CODES.DATA.CONSTRAINT_VIOLATION]: 
    'Violação de restrição: Chave duplicada ou valor único já existe.',
    
  [ORACLE_ERROR_CODES.DATA.NULL_CONSTRAINT]: 
    'Campo obrigatório: Tentativa de inserir valor nulo em campo NOT NULL.',
    
  [ORACLE_ERROR_CODES.DATA.FOREIGN_KEY_VIOLATION]: 
    'Violação de chave estrangeira: Referência a registro inexistente.',
    
  [ORACLE_ERROR_CODES.DATA.INVALID_NUMBER]: 
    'Número inválido: Erro na conversão de string para número.',
    
  [ORACLE_ERROR_CODES.DATA.DATE_FORMAT_ERROR]: 
    'Formato de data inválido: Erro na conversão de string para data.'
} as const;

export const NODE_ERROR_TYPES = {
  VALIDATION: 'VALIDATION_ERROR',
  CONNECTION: 'CONNECTION_ERROR',
  QUERY: 'QUERY_ERROR',
  PARAMETER: 'PARAMETER_ERROR',
  TIMEOUT: 'TIMEOUT_ERROR',
  PERMISSION: 'PERMISSION_ERROR',
  CONFIGURATION: 'CONFIGURATION_ERROR'
} as const;

export const ERROR_SEVERITY = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  CRITICAL: 'CRITICAL'
} as const;

export const RETRY_STRATEGIES = {
  NONE: 'NONE',
  LINEAR: 'LINEAR',
  EXPONENTIAL: 'EXPONENTIAL',
  IMMEDIATE: 'IMMEDIATE'
} as const;

export const DEFAULT_ERROR_CONFIG = {
  maxRetries: 3,
  retryDelay: 1000,
  retryStrategy: RETRY_STRATEGIES.EXPONENTIAL,
  backoffMultiplier: 2,
  maxRetryDelay: 10000,
  retryableErrors: [
    ORACLE_ERROR_CODES.TRANSACTION.DEADLOCK,
    ORACLE_ERROR_CODES.TRANSACTION.SERIALIZATION_FAILURE,
    ORACLE_ERROR_CODES.TRANSACTION.RESOURCE_BUSY,
    ORACLE_ERROR_CODES.TRANSACTION.RESOURCE_BUSY_NOWAIT,
    ORACLE_ERROR_CODES.CONNECTION.CONNECTION_TIMEOUT,
    ORACLE_ERROR_CODES.CONNECTION.TIMEOUT
  ]
} as const;
