import { INodeType, IExecuteFunctions } from 'n8n-workflow';
import { OracleDatabaseHandler } from '../core/OracleDatabaseHandler';
import { OracleAdvancedHandler } from '../core/OracleAdvancedHandler';
import { OracleVectorStoreHandler } from '../core/OracleVectorStoreHandler';
import { ChatMemoryHandler } from '../core/ChatMemoryHandler';

/**
 * Factory para criação de handlers Oracle com arquitetura modular
 * Centraliza a instanciação e configuração dos diferentes tipos de nodes
 */
export class OracleFactory {
  /**
   * Criar handler para Oracle Database básico com parametrização
   */
  static createDatabaseNode(node: INodeType, functions: IExecuteFunctions) {
    return new OracleDatabaseHandler(node, functions);
  }

  /**
   * Criar handler para Oracle Database Advanced com recursos avançados
   */
  static createAdvancedNode(node: INodeType, functions: IExecuteFunctions) {
    return new OracleAdvancedHandler(node, functions);
  }

  /**
   * Criar handler para Oracle Vector Store
   */
  static createVectorStoreNode(node: INodeType, functions: IExecuteFunctions) {
    return new OracleVectorStoreHandler(node, functions);
  }

  /**
   * Criar handler para Chat Memory
   */
  static createChatMemoryNode(node: INodeType, functions: IExecuteFunctions) {
    return new ChatMemoryHandler(node, functions);
  }

  /**
   * Método utilitário para detectar automaticamente o tipo de handler necessário
   * baseado no nome do node
   */
  static createHandlerByNodeName(nodeName: string, node: INodeType, functions: IExecuteFunctions) {
    switch (nodeName) {
      case 'oracleDatabase':
      case 'oracleDatabaseParameterized':
        return this.createDatabaseNode(node, functions);
        
      case 'oracleDatabaseAdvanced':
        return this.createAdvancedNode(node, functions);
        
      case 'oracleVectorStore':
        return this.createVectorStoreNode(node, functions);
        
      case 'chatMemory':
        return this.createChatMemoryNode(node, functions);
        
      default:
        throw new Error(`Tipo de node não suportado: ${nodeName}`);
    }
  }
}
