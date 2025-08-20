/**
 * AQOperations - Oracle Advanced Queuing migrado para lib/core/operations
 */
import oracledb, { Connection } from 'oracledb';
import {
  AQMessage,
  AQEnqueueOptions,
  AQDequeueOptions,
  AQQueueInfo,
  AQOperationResult,
  ServiceResult
} from '@shared';

export class AQOperations {
  private connection: Connection;

  constructor(connection: Connection) {
    this.connection = connection;
  }

  /**
   * Enviar mensagem para a fila (Enqueue)
   */
  async enqueueMessage(
    queueName: string,
    message: AQMessage,
    options: AQEnqueueOptions = {}
  ): Promise<ServiceResult<AQOperationResult>> {
    const {
      visibility = 'ON_COMMIT',
      deliveryMode = 'PERSISTENT',
      transformation,
      sequence,
    } = options;

    try {
      const payloadType = this.determinePayloadType(message.payload);
      const plsqlBlock = `
        DECLARE
          enqueue_options DBMS_AQ.ENQUEUE_OPTIONS_T;
          message_properties DBMS_AQ.MESSAGE_PROPERTIES_T;
          message_handle RAW(16);
          ${this.getPayloadDeclaration(payloadType)}
        BEGIN
          -- Configurar opções de enqueue
          enqueue_options.visibility := DBMS_AQ.${visibility};
          enqueue_options.delivery_mode := DBMS_AQ.${deliveryMode};
          ${sequence ? `enqueue_options.sequence := ${sequence};` : ''}
          ${transformation ? `enqueue_options.transformation := '${transformation}';` : ''}

          -- Configurar propriedades da mensagem
          ${message.correlationId ? `message_properties.correlation := '${message.correlationId}';` : ''}
          ${message.delay ? `message_properties.delay := ${message.delay};` : ''}
          ${message.expiration ? `message_properties.expiration := ${message.expiration};` : ''}
          ${message.priority ? `message_properties.priority := ${message.priority};` : ''}

          -- Criar payload da mensagem
          ${this.createPayloadAssignment(payloadType, message.payload)}

          -- Enfileirar mensagem
          DBMS_AQ.ENQUEUE(
            queue_name => :queue_name,
            enqueue_options => enqueue_options,
            message_properties => message_properties,
            payload => message_payload,
            msgid => message_handle
          );

          :message_id := RAWTOHEX(message_handle);
          :enqueue_time := SYSTIMESTAMP;
          ${visibility === 'IMMEDIATE' ? 'COMMIT;' : ''}
        END;
      `;

      const binds = {
        queue_name: queueName,
        message_id: {
          dir: oracledb.BIND_OUT,
          type: oracledb.STRING,
          maxSize: 32,
        },
        enqueue_time: { dir: oracledb.BIND_OUT, type: oracledb.DATE },
      };

      const result = await this.connection.execute(plsqlBlock, binds);
      const outBinds = result.outBinds as { [key: string]: any };

      return {
        success: true,
        data: {
          success: true,
          messageId: outBinds?.message_id as string,
          enqueueTime: outBinds?.enqueue_time as Date,
          correlationId: message.correlationId,
        },
        message: 'Mensagem enfileirada com sucesso'
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        success: false,
        message: `Erro ao enfileirar mensagem: ${errorMessage}`
      };
    }
  }

  /**
   * Receber mensagem da fila (Dequeue)
   */
  async dequeueMessage(
    queueName: string,
    options: AQDequeueOptions = {}
  ): Promise<ServiceResult<AQOperationResult>> {
    const {
      consumerName,
      dequeueMode = 'REMOVE',
      navigation = 'FIRST_MESSAGE',
      visibility = 'ON_COMMIT',
      waitTime = 5,
      correlationId,
      condition,
      transformation,
      msgIdToDequeue,
    } = options;

    try {
      const plsqlBlock = `
        DECLARE
          dequeue_options DBMS_AQ.DEQUEUE_OPTIONS_T;
          message_properties DBMS_AQ.MESSAGE_PROPERTIES_T;
          message_handle RAW(16);
          message_payload SYS.AQ$_JMS_TEXT_MESSAGE;
          no_messages EXCEPTION;
          PRAGMA EXCEPTION_INIT(no_messages, -25228);
        BEGIN
          -- Configurar opções de dequeue
          dequeue_options.dequeue_mode := DBMS_AQ.${dequeueMode};
          dequeue_options.navigation := DBMS_AQ.${navigation};
          dequeue_options.visibility := DBMS_AQ.${visibility};
          dequeue_options.wait := ${waitTime};
          ${consumerName ? `dequeue_options.consumer_name := '${consumerName}';` : ''}
          ${correlationId ? `dequeue_options.correlation := '${correlationId}';` : ''}
          ${condition ? `dequeue_options.deq_condition := '${condition}';` : ''}
          ${transformation ? `dequeue_options.transformation := '${transformation}';` : ''}
          ${msgIdToDequeue ? `dequeue_options.msgid := HEXTORAW('${msgIdToDequeue}');` : ''}

          -- Desenfileirar mensagem
          DBMS_AQ.DEQUEUE(
            queue_name => :queue_name,
            dequeue_options => dequeue_options,
            message_properties => message_properties,
            payload => message_payload,
            msgid => message_handle
          );

          :message_id := RAWTOHEX(message_handle);
          :correlation_id := message_properties.correlation;
          :dequeue_time := SYSTIMESTAMP;
          :attempt_count := message_properties.attempts;
          :payload_text := message_payload.get_text();
          :success := 1;
          ${visibility === 'IMMEDIATE' ? 'COMMIT;' : ''}

        EXCEPTION
          WHEN no_messages THEN
            :success := 0;
            :error_msg := 'Nenhuma mensagem disponível na fila';
          WHEN OTHERS THEN
            :success := 0;
            :error_msg := SQLERRM;
        END;
      `;

      const binds = {
        queue_name: queueName,
        message_id: {
          dir: oracledb.BIND_OUT,
          type: oracledb.STRING,
          maxSize: 32,
        },
        correlation_id: {
          dir: oracledb.BIND_OUT,
          type: oracledb.STRING,
          maxSize: 128,
        },
        dequeue_time: { dir: oracledb.BIND_OUT, type: oracledb.DATE },
        attempt_count: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
        payload_text: {
          dir: oracledb.BIND_OUT,
          type: oracledb.STRING,
          maxSize: 4000,
        },
        success: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
        error_msg: {
          dir: oracledb.BIND_OUT,
          type: oracledb.STRING,
          maxSize: 1000,
        },
      };

      const result = await this.connection.execute(plsqlBlock, binds);
      const outBinds = result.outBinds as any;

      if (outBinds.success === 1) {
        return {
          success: true,
          data: {
            success: true,
            messageId: outBinds.message_id,
            correlationId: outBinds.correlation_id,
            dequeueTime: outBinds.dequeue_time,
            attemptCount: outBinds.attempt_count,
            payload: this.parsePayload(outBinds.payload_text),
          },
          message: 'Mensagem desenfileirada com sucesso'
        };
      } else {
        return {
          success: false,
          message: outBinds.error_msg || 'Falha no dequeue'
        };
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        success: false,
        message: `Erro ao desenfileirar mensagem: ${errorMessage}`
      };
    }
  }

  /**
   * Enviar múltiplas mensagens em batch
   */
  async enqueueBatch(
    queueName: string,
    messages: AQMessage[],
    options: AQEnqueueOptions = {}
  ): Promise<ServiceResult<AQOperationResult[]>> {
    const results: AQOperationResult[] = [];

    for (const message of messages) {
      const result = await this.enqueueMessage(queueName, message, options);
      if (result.data) {
        results.push(result.data);
      }
    }

    return {
      success: true,
      data: results,
      message: `Batch de ${results.length} mensagens processado`
    };
  }

  /**
   * Receber múltiplas mensagens
   */
  async dequeueMultiple(
    queueName: string,
    maxMessages = 10,
    options: AQDequeueOptions = {}
  ): Promise<ServiceResult<AQOperationResult[]>> {
    const results: AQOperationResult[] = [];
    let messagesReceived = 0;

    while (messagesReceived < maxMessages) {
      const result = await this.dequeueMessage(queueName, {
        ...options,
        waitTime: messagesReceived === 0 ? options.waitTime || 5 : 0,
      });

      if (result.success && result.data) {
        results.push(result.data);
        messagesReceived++;
      } else {
        if (result.message?.includes('Nenhuma mensagem disponível')) {
          break;
        }
        results.push({
          success: false,
          error: result.message
        });
        break;
      }
    }

    return {
      success: true,
      data: results,
      message: `${results.filter(r => r.success).length} mensagens recebidas`
    };
  }

  /**
   * Obter informações da fila
   */
  async getQueueInfo(queueName: string): Promise<ServiceResult<AQQueueInfo>> {
    const sql = `
      SELECT
        q.name as queue_name,
        q.queue_type,
        q.max_retries,
        q.retry_delay,
        q.retention_time,
        qt.ready + qt.waiting as message_count,
        qt.ready as pending_messages
      FROM user_queues q
      JOIN user_queue_tables qt ON q.queue_table = qt.queue_table
      WHERE UPPER(q.name) = UPPER(:queue_name)
    `;

    try {
      const result = await this.connection.execute(
        sql,
        { queue_name: queueName },
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      );

      if (result.rows && result.rows.length > 0) {
        const row = result.rows[0] as any;
        
        return {
          success: true,
          data: {
            queueName: row.QUEUE_NAME,
            queueType: row.QUEUE_TYPE,
            maxRetries: row.MAX_RETRIES,
            retryDelay: row.RETRY_DELAY,
            retentionTime: row.RETENTION_TIME,
            messageCount: row.MESSAGE_COUNT,
            pendingMessages: row.PENDING_MESSAGES,
          },
          message: 'Informações da fila obtidas com sucesso'
        };
      } else {
        return {
          success: false,
          message: `Fila '${queueName}' não encontrada`
        };
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        success: false,
        message: `Erro ao obter informações da fila: ${errorMessage}`
      };
    }
  }

  /**
   * Criar nova fila
   */
  async createQueue(
    queueName: string,
    queueTableName: string,
    payloadType = 'SYS.AQ$_JMS_TEXT_MESSAGE',
    options: {
      maxRetries?: number;
      retryDelay?: number;
      retentionTime?: number;
      comment?: string;
    } = {}
  ): Promise<ServiceResult<boolean>> {
    const { maxRetries = 5, retryDelay = 0, retentionTime = 0, comment } = options;

    try {
      const plsqlBlock = `
        BEGIN
          -- Criar queue table se não existir
          BEGIN
            DBMS_AQADM.CREATE_QUEUE_TABLE(
              queue_table => :queue_table_name,
              queue_payload_type => :payload_type,
              sort_list => 'PRIORITY,ENQ_TIME',
              multiple_consumers => TRUE,
              message_grouping => DBMS_AQADM.NONE,
              compatible => '10.0.0'
            );
          EXCEPTION
            WHEN OTHERS THEN
              IF SQLCODE != -24001 THEN -- Table already exists
                RAISE;
              END IF;
          END;

          -- Criar queue
          DBMS_AQADM.CREATE_QUEUE(
            queue_name => :queue_name,
            queue_table => :queue_table_name,
            queue_type => DBMS_AQADM.NORMAL_QUEUE,
            max_retries => :max_retries,
            retry_delay => :retry_delay,
            retention_time => :retention_time
            ${comment ? `, comment => '${comment}'` : ''}
          );

          -- Iniciar queue
          DBMS_AQADM.START_QUEUE(queue_name => :queue_name);
          :result := 'SUCCESS';

        EXCEPTION
          WHEN OTHERS THEN
            :result := SQLERRM;
        END;
      `;

      const binds = {
        queue_name: queueName,
        queue_table_name: queueTableName,
        payload_type: payloadType,
        max_retries: maxRetries,
        retry_delay: retryDelay,
        retention_time: retentionTime,
        result: {
          dir: oracledb.BIND_OUT,
          type: oracledb.STRING,
          maxSize: 1000,
        },
      };

      const result = await this.connection.execute(plsqlBlock, binds);
      const outBinds = result.outBinds as { [key: string]: any };
      const success = outBinds?.result === 'SUCCESS';

      return {
        success,
        data: success,
        message: success 
          ? `Fila '${queueName}' criada com sucesso`
          : `Erro ao criar fila: ${outBinds?.result}`
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        success: false,
        message: `Erro ao criar fila: ${errorMessage}`
      };
    }
  }

  /**
   * Listar filas disponíveis
   */
  async listQueues(): Promise<ServiceResult<string[]>> {
    const sql = `
      SELECT name
      FROM user_queues
      WHERE queue_type = 'NORMAL_QUEUE'
      ORDER BY name
    `;

    try {
      const result = await this.connection.execute(
        sql,
        {},
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      );

      const queues = (result.rows as any[]).map(row => row.NAME);
      
      return {
        success: true,
        data: queues,
        message: `${queues.length} filas encontradas`
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        success: false,
        message: `Erro ao listar filas: ${errorMessage}`
      };
    }
  }

  // Métodos auxiliares privados
  private determinePayloadType(payload: any): string {
    if (typeof payload === 'string') {
      return 'TEXT';
    } else if (typeof payload === 'object') {
      return 'JSON';
    } else {
      return 'RAW';
    }
  }

  private getPayloadDeclaration(payloadType: string): string {
    switch (payloadType) {
      case 'TEXT':
        return 'message_payload SYS.AQ$_JMS_TEXT_MESSAGE;';
      case 'JSON':
        return 'message_payload SYS.AQ$_JMS_TEXT_MESSAGE;';
      default:
        return 'message_payload RAW(2000);';
    }
  }

  private createPayloadAssignment(payloadType: string, payload: any): string {
    switch (payloadType) {
      case 'TEXT':
        return `
          message_payload := SYS.AQ$_JMS_TEXT_MESSAGE.construct;
          message_payload.set_text('${payload.toString().replace(/'/g, "\\'\\''")}');
        `;
      case 'JSON':
        return `
          message_payload := SYS.AQ$_JMS_TEXT_MESSAGE.construct;
          message_payload.set_text('${JSON.stringify(payload).replace(/'/g, "\\'\\''")}');
        `;
      default:
        return `message_payload := UTL_RAW.CAST_TO_RAW('${payload}');`;
    }
  }

  private parsePayload(payloadText: string): any {
    if (!payloadText) return null;
    try {
      return JSON.parse(payloadText);
    } catch {
      return payloadText;
    }
  }
}

// Factory para diferentes tipos de operações AQ
export class AQOperationsFactory {
  static createHighFrequencyOperator(connection: Connection): AQOperations {
    return new AQOperations(connection);
  }

  static createReliableOperator(connection: Connection): AQOperations {
    return new AQOperations(connection);
  }

  static createBatchProcessor(connection: Connection): AQOperations {
    return new AQOperations(connection);
  }
}