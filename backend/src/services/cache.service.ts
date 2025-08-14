/**
 * Service de Cache Redis pour SmartPlanning
 * 
 * Ce service fournit une couche de cache performante pour réduire
 * la charge sur MongoDB et accélérer les réponses API.
 * 
 * Optimisé pour:
 * - Plannings générés (Planning Wizard)
 * - Données employés par équipe
 * - Statistiques d'entreprise
 * - Sessions utilisateurs
 */

import Redis from 'ioredis';
import chalk from 'chalk';

/**
 * Configuration du service de cache
 */
interface CacheConfig {
  host: string;
  port: number;
  password?: string;
  db: number;
  keyPrefix: string;
  ttl: {
    default: number;      // 1 heure
    planning: number;     // 24 heures
    employees: number;    // 6 heures
    companies: number;    // 12 heures
    sessions: number;     // 7 jours
  };
}

/**
 * Types de clés de cache supportés
 */
export enum CacheKeyType {
  PLANNING_GENERATED = 'planning_generated',
  EMPLOYEES_BY_TEAM = 'employees_team',
  EMPLOYEES_BY_COMPANY = 'employees_company',
  COMPANY_STATS = 'company_stats',
  USER_PERMISSIONS = 'user_permissions',
  TEAM_MEMBERS = 'team_members',
  VACATION_REQUESTS = 'vacation_requests'
}

/**
 * Service de cache Redis centralisé
 */
export class CacheService {
  private redis: Redis | null = null;
  private isConnected = false;
  private config: CacheConfig;

  constructor() {
    this.config = {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      db: parseInt(process.env.REDIS_DB || '0'),
      keyPrefix: 'smartplanning:',
      ttl: {
        default: 3600,        // 1 heure
        planning: 86400,      // 24 heures
        employees: 21600,     // 6 heures
        companies: 43200,     // 12 heures
        sessions: 604800      // 7 jours
      }
    };

    // Initialiser Redis en mode non-bloquant
    this.initializeRedis();
  }

  /**
   * Initialise la connexion Redis
   */
  private async initializeRedis(): Promise<void> {
    try {
      // Configuration Redis avec retry automatique
      this.redis = new Redis({
        host: this.config.host,
        port: this.config.port,
        password: this.config.password,
        db: this.config.db,
        keyPrefix: this.config.keyPrefix,
        maxRetriesPerRequest: 3,
        lazyConnect: true,
        // Éviter les timeouts en développement
        connectTimeout: process.env.NODE_ENV === 'development' ? 5000 : 10000,
        commandTimeout: process.env.NODE_ENV === 'development' ? 2000 : 5000
      });

      // Gestion des événements Redis
      this.redis.on('connect', () => {
        this.isConnected = true;
        console.log(chalk.green('✅ Cache Redis connecté'));
      });

      this.redis.on('error', (error) => {
        this.isConnected = false;
        console.log(chalk.yellow(`⚠️  Cache Redis déconnecté: ${error.message}`));
      });

      this.redis.on('close', () => {
        this.isConnected = false;
        console.log(chalk.gray('🔌 Cache Redis fermé'));
      });

      // Test de connexion
      if (process.env.NODE_ENV !== 'test') {
        await this.redis.ping();
        console.log(chalk.green('🚀 Cache Redis prêt'));
      }

    } catch (error) {
      console.log(chalk.yellow(`⚠️  Cache Redis indisponible: ${error instanceof Error ? error.message : 'Erreur inconnue'}`));
      this.redis = null;
      this.isConnected = false;
    }
  }

  /**
   * Génère une clé de cache structurée
   */
  private generateKey(type: CacheKeyType, identifier: string, suffix?: string): string {
    const parts = [type, identifier];
    if (suffix) parts.push(suffix);
    return parts.join(':');
  }

  /**
   * Récupère une valeur du cache
   */
  async get<T = any>(type: CacheKeyType, identifier: string, suffix?: string): Promise<T | null> {
    if (!this.isConnected || !this.redis) {
      return null;
    }

    try {
      const key = this.generateKey(type, identifier, suffix);
      const value = await this.redis.get(key);
      
      if (value) {
        const parsed = JSON.parse(value);
        console.log(chalk.cyan(`🎯 Cache HIT: ${key}`));
        return parsed;
      }

      console.log(chalk.gray(`🔍 Cache MISS: ${key}`));
      return null;

    } catch (error) {
      console.log(chalk.yellow(`⚠️  Erreur lecture cache: ${error instanceof Error ? error.message : 'Erreur inconnue'}`));
      return null;
    }
  }

  /**
   * Stocke une valeur dans le cache avec TTL approprié
   */
  async set<T = any>(
    type: CacheKeyType, 
    identifier: string, 
    value: T, 
    customTtl?: number,
    suffix?: string
  ): Promise<boolean> {
    if (!this.isConnected || !this.redis) {
      return false;
    }

    try {
      const key = this.generateKey(type, identifier, suffix);
      const serializedValue = JSON.stringify(value);
      
      // Détermine le TTL selon le type de données
      let ttl = customTtl || this.config.ttl.default;
      
      switch (type) {
        case CacheKeyType.PLANNING_GENERATED:
          ttl = this.config.ttl.planning;
          break;
        case CacheKeyType.EMPLOYEES_BY_TEAM:
        case CacheKeyType.EMPLOYEES_BY_COMPANY:
          ttl = this.config.ttl.employees;
          break;
        case CacheKeyType.COMPANY_STATS:
          ttl = this.config.ttl.companies;
          break;
        case CacheKeyType.USER_PERMISSIONS:
          ttl = this.config.ttl.sessions;
          break;
      }

      await this.redis.setex(key, ttl, serializedValue);
      console.log(chalk.green(`💾 Cache SET: ${key} (TTL: ${ttl}s)`));
      return true;

    } catch (error) {
      console.log(chalk.yellow(`⚠️  Erreur écriture cache: ${error instanceof Error ? error.message : 'Erreur inconnue'}`));
      return false;
    }
  }

  /**
   * Supprime une clé spécifique du cache
   */
  async delete(type: CacheKeyType, identifier: string, suffix?: string): Promise<boolean> {
    if (!this.isConnected || !this.redis) {
      return false;
    }

    try {
      const key = this.generateKey(type, identifier, suffix);
      const deleted = await this.redis.del(key);
      
      if (deleted > 0) {
        console.log(chalk.red(`🗑️  Cache DELETE: ${key}`));
        return true;
      }
      
      return false;

    } catch (error) {
      console.log(chalk.yellow(`⚠️  Erreur suppression cache: ${error instanceof Error ? error.message : 'Erreur inconnue'}`));
      return false;
    }
  }

  /**
   * Supprime toutes les clés d'un type donné avec un pattern
   */
  async deletePattern(type: CacheKeyType, pattern: string = '*'): Promise<number> {
    if (!this.isConnected || !this.redis) {
      return 0;
    }

    try {
      const searchPattern = `${this.config.keyPrefix}${type}:${pattern}`;
      const keys = await this.redis.keys(searchPattern);
      
      if (keys.length > 0) {
        // Supprimer les clés par batch pour éviter de bloquer Redis
        const batchSize = 100;
        let deletedCount = 0;
        
        for (let i = 0; i < keys.length; i += batchSize) {
          const batch = keys.slice(i, i + batchSize);
          // Retirer le préfixe pour la suppression
          const keysWithoutPrefix = batch.map(key => key.replace(this.config.keyPrefix, ''));
          const deleted = await this.redis.del(...keysWithoutPrefix);
          deletedCount += deleted;
        }
        
        console.log(chalk.red(`🗑️  Cache DELETE PATTERN: ${searchPattern} (${deletedCount} clés)`));
        return deletedCount;
      }
      
      return 0;

    } catch (error) {
      console.log(chalk.yellow(`⚠️  Erreur suppression pattern: ${error instanceof Error ? error.message : 'Erreur inconnue'}`));
      return 0;
    }
  }

  /**
   * Invalide le cache des plannings pour un employé
   */
  async invalidatePlanningCache(employeeId: string, year?: number, weekNumber?: number): Promise<void> {
    const patterns = [
      employeeId, // Tous les plannings de l'employé
    ];

    if (year && weekNumber) {
      patterns.push(`${employeeId}:${year}:${weekNumber}`);
    }

    for (const pattern of patterns) {
      await this.deletePattern(CacheKeyType.PLANNING_GENERATED, pattern);
    }
  }

  /**
   * Invalide le cache des employés pour une équipe/entreprise
   */
  async invalidateEmployeeCache(companyId?: string, teamId?: string): Promise<void> {
    if (teamId) {
      await this.deletePattern(CacheKeyType.EMPLOYEES_BY_TEAM, teamId);
      await this.deletePattern(CacheKeyType.TEAM_MEMBERS, teamId);
    }

    if (companyId) {
      await this.deletePattern(CacheKeyType.EMPLOYEES_BY_COMPANY, companyId);
      await this.deletePattern(CacheKeyType.COMPANY_STATS, companyId);
    }
  }

  /**
   * Obtient les statistiques du cache
   */
  async getStats(): Promise<any> {
    if (!this.isConnected || !this.redis) {
      return { connected: false, error: 'Redis non connecté' };
    }

    try {
      const info = await this.redis.info('memory');
      const keyspace = await this.redis.info('keyspace');
      const stats = await this.redis.info('stats');
      
      // Parse des infos Redis
      const memoryInfo = info.split('\r\n').reduce((acc: any, line) => {
        const [key, value] = line.split(':');
        if (key && value) acc[key] = value;
        return acc;
      }, {});

      return {
        connected: this.isConnected,
        memory: {
          used: memoryInfo.used_memory_human,
          peak: memoryInfo.used_memory_peak_human,
          fragmentation: memoryInfo.mem_fragmentation_ratio
        },
        keyspace: keyspace,
        uptime: memoryInfo.uptime_in_seconds,
        version: memoryInfo.redis_version
      };

    } catch (error) {
      return { 
        connected: false, 
        error: error instanceof Error ? error.message : 'Erreur inconnue' 
      };
    }
  }

  /**
   * Vide complètement le cache (utilisation avec précaution)
   */
  async flush(): Promise<boolean> {
    if (!this.isConnected || !this.redis) {
      return false;
    }

    try {
      await this.redis.flushdb();
      console.log(chalk.red('🧹 Cache vidé complètement'));
      return true;

    } catch (error) {
      console.log(chalk.yellow(`⚠️  Erreur vidage cache: ${error instanceof Error ? error.message : 'Erreur inconnue'}`));
      return false;
    }
  }

  /**
   * Ferme la connexion Redis proprement
   */
  async disconnect(): Promise<void> {
    if (this.redis) {
      await this.redis.quit();
      this.redis = null;
      this.isConnected = false;
      console.log(chalk.gray('👋 Cache Redis déconnecté proprement'));
    }
  }

  /**
   * Vérifie si Redis est disponible
   */
  isAvailable(): boolean {
    return this.isConnected && this.redis !== null;
  }
}

// Instance singleton du service de cache
export const cacheService = new CacheService();

// Helpers pour les cas d'utilisation courants
export const CacheHelpers = {
  /**
   * Clé de cache pour un planning généré
   */
  planningKey: (employeeId: string, year: number, weekNumber: number) => 
    `${employeeId}:${year}:${weekNumber}`,

  /**
   * Clé de cache pour les employés d'une équipe
   */
  teamEmployeesKey: (teamId: string) => teamId,

  /**
   * Clé de cache pour les employés d'une entreprise
   */
  companyEmployeesKey: (companyId: string) => companyId,

  /**
   * Clé de cache pour les permissions d'un utilisateur
   */
  userPermissionsKey: (userId: string) => userId,

  /**
   * TTL par défaut pour chaque type de données (en secondes)
   */
  getTTL: (type: CacheKeyType): number => {
    const ttls = {
      [CacheKeyType.PLANNING_GENERATED]: 86400,    // 24h
      [CacheKeyType.EMPLOYEES_BY_TEAM]: 21600,     // 6h
      [CacheKeyType.EMPLOYEES_BY_COMPANY]: 21600,  // 6h
      [CacheKeyType.COMPANY_STATS]: 43200,         // 12h
      [CacheKeyType.USER_PERMISSIONS]: 604800,     // 7j
      [CacheKeyType.TEAM_MEMBERS]: 21600,          // 6h
      [CacheKeyType.VACATION_REQUESTS]: 3600       // 1h
    };
    return ttls[type] || 3600;
  }
};