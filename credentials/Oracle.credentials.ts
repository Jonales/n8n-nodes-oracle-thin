import {
  ICredentialsDecrypted,
  ICredentialType,
  INodeCredentialTestResult,
  INodeProperties,
} from 'n8n-workflow';
import oracledb from 'oracledb';

export type IOracleCredentials = {
	user: string;
	password: string;
	connectionString: string;
	thinMode?: boolean;
};

export class Oracle implements ICredentialType {
  name = 'oracleCredentials';
  displayName = 'Oracle Credentials';
  documentationUrl = 'oracleCredentials';

  properties: INodeProperties[] = [
    {
      displayName: 'User',
      name: 'user',
      type: 'string',
      default: 'system',
      required: true,
      description: 'Username para conectar ao banco Oracle',
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
      description: 'Senha do usuário',
    },
    {
      displayName: 'Connection String',
      name: 'connectionString',
      type: 'string',
      default: 'localhost:1521/XEPDB1',
      placeholder: 'host:port/service_name ou TNS_NAME',
      description: 'String de conexão Oracle (host:port/service_name) ou nome TNS',
      required: true,
    },
    {
      displayName: 'Use Thin Mode',
      name: 'thinMode',
      type: 'boolean',
      default: true,
      description: 'Usar thin mode (recomendado - não requer instalação do Oracle client)',
    },
  ];

  async testConnection(credentials: ICredentialsDecrypted): Promise<INodeCredentialTestResult> {
    const { user, password, connectionString, thinMode } = credentials.data as IOracleCredentials;

    try {
      // Configurar thin mode se especificado
      if (thinMode !== undefined) {
        oracledb.thin = thinMode;
      }

      const connection = await oracledb.getConnection({
        user,
        password,
        connectionString,
      });

      const result = await connection.execute(
        'SELECT \'Connection Test\' AS STATUS, USER AS CURRENT_USER, SYSDATE AS SERVER_TIME FROM DUAL',
        [],
        { outFormat: oracledb.OUT_FORMAT_OBJECT },
      );

      await connection.close();

			interface TestRow {
				STATUS: string;
				CURRENT_USER: string;
				SERVER_TIME: Date;
			}

			const rows = result.rows as TestRow[];
			const currentUser = rows?.[0]?.CURRENT_USER || user;

			return {
			  status: 'OK',
			  message: `Conexao bem-sucedida! Usuario: ${currentUser}`,
			};
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);

      let friendlyMessage = errorMessage;

      if (errorMessage.includes('ORA-12541')) {
        friendlyMessage =
					'Erro de conexao: Servico Oracle nao encontrado. Verifique host, porta e service_name.';
      } else if (errorMessage.includes('ORA-01017')) {
        friendlyMessage = 'Credenciais invalidas: Usuario ou senha incorretos.';
      } else if (errorMessage.includes('ORA-12514')) {
        friendlyMessage = 'service_name nao encontrado. Verifique o nome do servico Oracle.';
      } else if (errorMessage.includes('ENOTFOUND')) {
        friendlyMessage = 'Host nao encontrado. Verifique o endereco do servidor Oracle.';
      } else if (errorMessage.includes('ECONNREFUSED')) {
        friendlyMessage =
					'Conexao rejeitada. Verifique se o Oracle esta rodando na porta especificada.';
      } else if (errorMessage.includes('ORA-12505')) {
        friendlyMessage = 'SID nao existe. Verifique o SID ou service_name do banco Oracle.';
      } else if (errorMessage.includes('ORA-28040')) {
        friendlyMessage =
					'Falha na autenticacao. Versao do cliente incompativel ou configuracao de seguranca.';
      }

      return {
        status: 'Error',
        message: friendlyMessage,
      };
    }
  }
}
