import {
  ICredentialsDecrypted,
  ICredentialType,
  INodeCredentialTestResult,
  Icon,
  INodeProperties,
} from 'n8n-workflow';
import oracledb from 'oracledb';

export type IOracleCredentials = {
  user: string;
  password: string;
  connectionString: string;
  thinMode?: boolean;
  connectTimeout?: number;
  poolMin?: number;
  poolMax?: number;
  poolIncrement?: number;
  enableAriaCompliant?: boolean;
};

export class Oracle implements ICredentialType {
  name = 'oracleCredentials';
  displayName = 'Oracle Database';
  documentationUrl = 'https://docs.n8n.io/integrations/builtin/credentials/oracle/';
	
  icon: Icon = 'file:oracle.svg';

  properties: INodeProperties[] = [
    {
      displayName: 'User',
      name: 'user',
      type: 'string',
      default: '',
      required: true,
      description: 'Nome de usuário para conectar ao banco Oracle',
      placeholder: 'hr, system, etc.',
    },
    {
      displayName: 'Password',
      name: 'password',
      type: 'string',
      typeOptions: {
        password: true,
      },
      default: '',
      required: true,
      description: 'Senha do usuário Oracle',
    },
    {
      displayName: 'Connection String',
      name: 'connectionString',
      type: 'string',
      default: 'localhost:1521/XEPDB1',
      placeholder: 'host:port/service_name ou TNS_NAME',
      description: 'String de conexão Oracle. Formatos aceitos:<br/>• host:port/service_name (Ex: localhost:1521/XEPDB1)<br/>• host:port:sid (Ex: localhost:1521:XE)<br/>• TNS_NAME (Ex: PROD_DB)',
      required: true,
    },
    {
      displayName: 'Use Thin Mode',
      name: 'thinMode',
      type: 'boolean',
      default: true,
      description: 'Usar Oracle Thin Mode (recomendado - não requer instalação do Oracle Client)',
    },
    {
      displayName: 'Advanced Options',
      name: 'advancedOptions',
      type: 'collection',
      placeholder: 'Add Option',
      default: {},
      options: [
        {
          displayName: 'Connection Timeout (seconds)',
          name: 'connectTimeout',
          type: 'number',
          default: 60,
          description: 'Tempo limite para estabelecer conexão (em segundos)',
          typeOptions: {
            minValue: 1,
            maxValue: 300,
          },
        },
        {
          displayName: 'Pool Min Size',
          name: 'poolMin',
          type: 'number',
          default: 1,
          description: 'Número mínimo de conexões no pool',
          typeOptions: {
            minValue: 0,
            maxValue: 100,
          },
        },
        {
          displayName: 'Pool Max Size',
          name: 'poolMax',
          type: 'number',
          default: 10,
          description: 'Número máximo de conexões no pool',
          typeOptions: {
            minValue: 1,
            maxValue: 1000,
          },
        },
        {
          displayName: 'Pool Increment',
          name: 'poolIncrement',
          type: 'number',
          default: 1,
          description: 'Número de conexões a serem criadas quando o pool precisar crescer',
          typeOptions: {
            minValue: 1,
            maxValue: 10,
          },
        },
        {
          displayName: 'Enable ARIA Compliance',
          name: 'enableAriaCompliant',
          type: 'boolean',
          default: false,
          description: 'Habilitar conformidade ARIA para acessibilidade',
        },
      ],
    },
  ];

  async testConnection(credentials: ICredentialsDecrypted): Promise<INodeCredentialTestResult> {
    const credData = credentials.data as IOracleCredentials;
    const { 
      user, 
      password, 
      connectionString, 
      thinMode = true,
      connectTimeout = 60,
      poolMin = 1,
      poolMax = 10,
      poolIncrement = 1,
      enableAriaCompliant = false
    } = credData;

    // Validações básicas
    if (!user?.trim()) {
      return {
        status: 'Error',
        message: 'Nome de usuário é obrigatório',
      };
    }

    if (!password) {
      return {
        status: 'Error',
        message: 'Senha é obrigatória',
      };
    }

    if (!connectionString?.trim()) {
      return {
        status: 'Error',
        message: 'String de conexão é obrigatória',
      };
    }

    let connection: oracledb.Connection | undefined;

    try {
      // Configurar thin mode se especificado
      if (thinMode !== undefined) {
        oracledb.thin = thinMode;
      }

      // Configurações de conexão
      const connectionConfig: oracledb.ConnectionAttributes = {
        user: user.trim(),
        password,
        connectionString: connectionString.trim(),
        connectTimeout: connectTimeout * 1000, // Converter para milissegundos
      };

      // Configurações avançadas se fornecidas
      if (enableAriaCompliant) {
        connectionConfig.privilege = oracledb.SYSDBA;
      }

      // Estabelecer conexão
      connection = await oracledb.getConnection(connectionConfig);

      // Executar query de teste mais robusta
      const testQuery = `
        SELECT 
          'Connection Test Success' AS STATUS,
          USER AS CURRENT_USER,
          SYSDATE AS SERVER_TIME,
          (SELECT VERSION FROM V$INSTANCE) AS DB_VERSION,
          SYS_CONTEXT('USERENV', 'DB_NAME') AS DB_NAME
        FROM DUAL
      `;

      const result = await connection.execute(
        testQuery,
        [],
        { 
          outFormat: oracledb.OUT_FORMAT_OBJECT,
          maxRows: 1
        }
      );

      interface TestRow {
        STATUS: string;
        CURRENT_USER: string;
        SERVER_TIME: Date;
        DB_VERSION?: string;
        DB_NAME?: string;
      }

      const rows = result.rows as TestRow[];
      const testResult = rows?.[0];

      if (!testResult) {
        throw new Error('Nenhum resultado retornado da query de teste');
      }

      const successMessage = [
        `Conexão estabelecida com sucesso!`,
        `Usuário: ${testResult.CURRENT_USER}`,
        testResult.DB_NAME && `Database: ${testResult.DB_NAME}`,
        testResult.DB_VERSION && `Versão: ${testResult.DB_VERSION}`,
        `Modo: ${thinMode ? 'Thin' : 'Thick'}`
      ].filter(Boolean).join(' | ');

      return {
        status: 'OK',
        message: successMessage,
      };

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      return {
        status: 'Error',
        message: this.parseOracleError(errorMessage),
      };
    } finally {
      // Garantir que a conexão seja fechada
      if (connection) {
        try {
          await connection.close();
        } catch (closeError) {
          console.warn('Erro ao fechar conexão Oracle:', closeError);
        }
      }
    }
  }

  private parseOracleError(errorMessage: string): string {
    const errorMappings = [
      {
        pattern: /ORA-12541|TNS-12541/i,
        message: 'Erro de conexão: Listener Oracle não encontrado. Verifique se o serviço Oracle está rodando e o host/porta estão corretos.'
      },
      {
        pattern: /ORA-01017/i,
        message: 'Credenciais inválidas: Nome de usuário ou senha incorretos.'
      },
      {
        pattern: /ORA-12514/i,
        message: 'Service name não encontrado. Verifique o nome do serviço Oracle na string de conexão.'
      },
      {
        pattern: /ORA-12505/i,
        message: 'SID não existe. Verifique o SID ou service_name do banco Oracle.'
      },
      {
        pattern: /ORA-28040/i,
        message: 'Falha na autenticação: Versão do cliente incompatível ou configuração de segurança restritiva.'
      },
      {
        pattern: /ORA-00942/i,
        message: 'Permissões insuficientes: Usuário não tem permissão para acessar tabelas do sistema.'
      },
      {
        pattern: /ENOTFOUND|getaddrinfo ENOTFOUND/i,
        message: 'Host não encontrado: Verifique o endereço do servidor Oracle na string de conexão.'
      },
      {
        pattern: /ECONNREFUSED|connect ECONNREFUSED/i,
        message: 'Conexão rejeitada: Verifique se o Oracle está rodando na porta especificada.'
      },
      {
        pattern: /ETIMEDOUT|connect ETIMEDOUT/i,
        message: 'Timeout de conexão: Servidor Oracle demorou muito para responder. Verifique conectividade de rede.'
      },
      {
        pattern: /ORA-12170/i,
        message: 'Timeout de conexão: Verifique se o firewall não está bloqueando a conexão.'
      },
      {
        pattern: /ORA-01034/i,
        message: 'Oracle não está disponível: O banco de dados Oracle não está rodando.'
      },
      {
        pattern: /ORA-01089/i,
        message: 'Shutdown imediato em progresso: O Oracle está sendo desligado.'
      }
    ];

    // Procurar por padrões conhecidos
    for (const mapping of errorMappings) {
      if (mapping.pattern.test(errorMessage)) {
        return mapping.message;
      }
    }

    // Se não encontrou um padrão conhecido, retorna uma mensagem genérica com o erro original
    return `Erro de conexão: ${errorMessage}`;
  }
}