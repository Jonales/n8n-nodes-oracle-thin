/**
 * Gerenciador de Connection Pools Oracle - Refatorado
 * Localização: lib/core/connection/pool-manager.ts
 */

import oracledb from 'oracledb';
import { 
  OracleCredentials,
  PoolConfig,
  PoolStatistics,
  PoolManager,
  POOL_CONFIGURATIONS,
  POOL_DEFAULTS,
  ORACLE_ERROR_CODES
} from '@shared';

type Pool = oracledb.Pool;

interface PoolWrapper {
  pool: Pool;
  isActive: boolean;
  createdAt: Date;
  config: PoolConfig;
}

export class OraclePoolManager implements PoolManager {
  private static pools: Map<string, PoolWrapper> = new Map();
  private static defaultConfig: PoolConfig = {
    poolMin: POOL_DEFAULTS.POOL_MIN,
    poolMax: POOL_DEFAULTS.POOL_MAX,
    poolIncrement: POOL_DEFAULTS.POOL_INCREMENT,
    poolTimeout: POOL_DEFAULTS.POOL_TIMEOUT,
    stmtCacheSize: POOL_DEFAULTS.POOL_TIMEOUT,
    queueMax: POOL_DEFAULTS.QUEUE_MAX,
    queueTimeout: POOL_DEFAULTS.QUEUE_TIMEOUT,
    poolPingInterval: POOL_DEFAULTS.POOL_PING_INTERVAL,
    enableStatistics: POOL_DEFAULTS.ENABLE_STATISTICS,
    homogeneous: POOL_DEFAULTS.HOMOGENEOUS,
  };

  /**
   * Obtém ou cria pool de conexões
   */
  static async getPool(
    credentials: OracleCredentials,
    config: Partial<PoolConfig> = {},
    poolType: keyof typeof POOL_CONFIGURATIONS = 'STANDARD'
  ): Promise<Pool> {
    const poolKey = this.generatePoolKey(credentials, poolType);

    // Verificar pool existente
    const existingPool = this.pools.get(poolKey);
    if (existingPool?.isActive) {
      try {
        await this.testPoolConnection(existingPool.pool);
        return existingPool.pool;
      } catch (error) {
        console.warn(`Pool ${poolKey} falhou no teste, recriando...`);
        await this.destroyPool(poolKey);
      }
    }

    // Criar novo pool
    const poolConfig = this.buildPoolConfig(credentials, config, poolType);
    const newPool = await this.createPool(poolConfig);

    // Armazenar pool
    this.pools.set(poolKey, {
      pool: newPool,
      isActive: true,
      createdAt: new Date(),
      config: poolConfig,
    });

    // Configurar eventos
    this.setupPoolEvents(newPool, poolKey);

    return newPool;
  }

  /**
   * Obtém estatísticas do pool
   */
  static async getPoolStatistics(
    credentials: OracleCredentials,
    poolType: keyof typeof POOL_CONFIGURATIONS = 'STANDARD'
  ): Promise<PoolStatistics> {
    const poolKey = this.generatePoolKey(credentials, poolType);
    const poolWrapper = this.pools.get(poolKey);

    if (!poolWrapper) {
      throw new Error(`Pool não encontrado: ${poolKey}`);
    }

    if (!poolWrapper.isActive) {
      throw new Error(`Pool inativo: ${poolKey}`);
    }

    const pool = poolWrapper.pool as any;

    return {
      poolAlias: pool.poolAlias,
      poolMin: pool.poolMin || poolWrapper.config.poolMin!,
      poolMax: pool.poolMax || poolWrapper.config.poolMax!,
      poolIncrement: pool.poolIncrement || poolWrapper.config.poolIncrement!,
      poolTimeout: pool.poolTimeout || poolWrapper.config.poolTimeout!,
      connectionsOpen: pool.connectionsOpen || 0,
      connectionsInUse: pool.connectionsInUse || 0,
      queueLength: pool.queueLength || 0,
      stmtCacheSize: pool.stmtCacheSize || poolWrapper.config.stmtCacheSize!,
      isActive: poolWrapper.isActive,
      createdAt: poolWrapper.createdAt,
    };
  }

  /**
   * Lista todos os pools ativos
   */
  static getActivePoolsInfo(): Array<{
    key: string;
    isActive: boolean;
    createdAt: Date;
    config: PoolConfig;
  }> {
    return Array.from(this.pools.entries()).map(([key, wrapper]) => ({
      key,
      isActive: wrapper.isActive,
      createdAt: wrapper.createdAt,
      config: wrapper.config,
    }));
  }

  /**
   * Fecha pool específico
   */
  static async closePool(
    credentials: OracleCredentials,
    poolType: keyof typeof POOL_CONFIGURATIONS = 'STANDARD'
  ): Promise<void> {
    const poolKey = this.generatePoolKey(credentials, poolType);
    await this.destroyPool(poolKey);
  }

  /**
   * Fecha todos os pools
   */
  static async closeAllPools(): Promise<void> {
    const closePromises = Array.from(this.pools.keys()).map(key => 
      this.destroyPool(key)
    );

    await Promise.allSettled(closePromises);
    this.pools.clear();
    console.log('Todos os pools Oracle foram fechados');
  }

  /**
   * Verifica se pool está ativo
   */
  static hasActivePool(
    credentials: OracleCredentials,
    poolType: keyof typeof POOL_CONFIGURATIONS = 'STANDARD'
  ): boolean {
    const poolKey = this.generatePoolKey(credentials, poolType);
    const poolWrapper = this.pools.get(poolKey);
    return poolWrapper !== undefined && poolWrapper.isActive;
  }

  /**
   * Constrói configuração do pool
   */
  private static buildPoolConfig(
    credentials: OracleCredentials,
    userConfig: Partial<PoolConfig>,
    poolType: keyof typeof POOL_CONFIGURATIONS
  ): PoolConfig {
    const baseConfig = POOL_CONFIGURATIONS[poolType] || POOL_CONFIGURATIONS.STANDARD;
    
    return {
      ...this.defaultConfig,
      ...baseConfig,
      ...userConfig,
      user: credentials.user,
      password: credentials.password,
      connectionString: credentials.connectionString,
    };
  }

  /**
   * Cria novo pool
   */
  private static async createPool(config: PoolConfig): Promise<Pool> {
    try {
      const pool = await oracledb.createPool(config as any);
      console.log(`Pool Oracle criado: ${config.user}@${config.connectionString}`);
      return pool;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Falha ao criar pool: ${errorMessage}`);
    }
  }

  /**
   * Testa conexão do pool
   */
  private static async testPoolConnection(pool: Pool): Promise<void> {
    let connection: oracledb.Connection | undefined;
    try {
      connection = await pool.getConnection();
      await connection.execute('SELECT 1 FROM DUAL');
    } finally {
      if (connection) {
        await connection.close();
      }
    }
  }

  /**
   * Configura eventos do pool
   */
  private static setupPoolEvents(pool: Pool, poolKey: string): void {
    try {
      const poolWithEvents = pool as any;
      if (poolWithEvents.on && typeof poolWithEvents.on === 'function') {
        poolWithEvents.on('connectionRequest', () => {
          console.log(`Pool ${poolKey}: Conexão solicitada`);
        });

        poolWithEvents.on('connectionCreated', () => {
          console.log(`Pool ${poolKey}: Nova conexão criada`);
        });

        poolWithEvents.on('connectionDestroyed', () => {
          console.log(`Pool ${poolKey}: Conexão destruída`);
        });
      }
    } catch (error) {
      console.warn(`Erro ao configurar eventos do pool ${poolKey}:`, error);
    }
  }

  /**
   * Destrói pool específico
   */
  private static async destroyPool(poolKey: string): Promise<void> {
    const poolWrapper = this.pools.get(poolKey);
    if (!poolWrapper) return;

    try {
      if (poolWrapper.isActive) {
        await poolWrapper.pool.close(10);
        poolWrapper.isActive = false;
      }
      
      this.pools.delete(poolKey);
      console.log(`Pool ${poolKey} fechado`);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`Erro ao fechar pool ${poolKey}: ${errorMessage}`);
      
      // Marcar como inativo e remover mesmo com erro
      poolWrapper.isActive = false;
      this.pools.delete(poolKey);
    }
  }

  /**
   * Gera chave única para o pool
   */
  private static generatePoolKey(
    credentials: OracleCredentials,
    poolType: keyof typeof POOL_CONFIGURATIONS
  ): string {
    return `${credentials.user}@${credentials.connectionString}:${poolType}`;
  }
}

/**
 * Factory para pools específicos
 */
export class PoolFactory {
  /**
   * Cria pool padrão
   */
  static async createStandardPool(credentials: OracleCredentials): Promise<Pool> {
    return OraclePoolManager.getPool(credentials, {}, 'STANDARD');
  }

  /**
   * Cria pool para alto volume
   */
  static async createHighVolumePool(credentials: OracleCredentials): Promise<Pool> {
    return OraclePoolManager.getPool(credentials, {}, 'HIGH_VOLUME');
  }

  /**
   * Cria pool OLTP
   */
  static async createOLTPPool(credentials: OracleCredentials): Promise<Pool> {
    return OraclePoolManager.getPool(credentials, {}, 'OLTP');
  }

  /**
   * Cria pool para analytics
   */
  static async createAnalyticsPool(credentials: OracleCredentials): Promise<Pool> {
    return OraclePoolManager.getPool(credentials, {}, 'ANALYTICS');
  }
}

// Cleanup automático
const handleProcessExit = async (signal: string) => {
  console.log(`Sinal ${signal} recebido. Fechando pools Oracle...`);
  try {
    await OraclePoolManager.closeAllPools();
  } catch (error) {
    console.error('Erro ao fechar pools:', error);
  } finally {
    process.exit(0);
  }
};

process.on('SIGINT', () => handleProcessExit('SIGINT'));
process.on('SIGTERM', () => handleProcessExit('SIGTERM'));
process.on('beforeExit', async () => {
  await OraclePoolManager.closeAllPools();
});
