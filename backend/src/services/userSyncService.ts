/**
 * Service de synchronisation des données utilisateur
 * Gère les notifications quand les données utilisateur sont mises à jour
 */

import { EventEmitter } from 'events';

interface UserUpdateEvent {
  type: 'PHOTO_UPDATED' | 'PROFILE_UPDATED' | 'USER_UPDATED';
  userId: string;
  updatedBy: string;
  changes: Record<string, any>;
  timestamp: number;
}

class UserSyncService extends EventEmitter {
  private activeConnections: Map<string, any[]> = new Map();

  /**
   * Notifie qu'un utilisateur a été mis à jour
   */
  notifyUserUpdate(userId: string, updatedBy: string, changes: Record<string, any>) {
    const event: UserUpdateEvent = {
      type: 'USER_UPDATED',
      userId,
      updatedBy,
      changes,
      timestamp: Date.now()
    };

    // Si la photo a été changée, créer un événement spécifique
    if (changes.photoUrl) {
      const photoEvent: UserUpdateEvent = {
        ...event,
        type: 'PHOTO_UPDATED'
      };
      this.emit('photoUpdated', photoEvent);
      console.log(`📸 Photo mise à jour pour l'utilisateur ${userId} par ${updatedBy}`);
    }

    // Émettre l'événement général
    this.emit('userUpdated', event);
    console.log(`👤 Utilisateur ${userId} mis à jour par ${updatedBy}:`, changes);
  }

  /**
   * Notifie qu'un profil a été mis à jour
   */
  notifyProfileUpdate(userId: string, updatedBy: string, changes: Record<string, any>) {
    const event: UserUpdateEvent = {
      type: 'PROFILE_UPDATED',
      userId,
      updatedBy,
      changes,
      timestamp: Date.now()
    };

    this.emit('profileUpdated', event);
    this.emit('userUpdated', event);
    console.log(`📝 Profil mis à jour pour l'utilisateur ${userId} par ${updatedBy}:`, changes);
  }

  /**
   * Enregistre une connexion active pour les notifications en temps réel
   */
  registerConnection(userId: string, connection: any) {
    if (!this.activeConnections.has(userId)) {
      this.activeConnections.set(userId, []);
    }
    this.activeConnections.get(userId)!.push(connection);
  }

  /**
   * Supprime une connexion active
   */
  unregisterConnection(userId: string, connection: any) {
    const connections = this.activeConnections.get(userId);
    if (connections) {
      const index = connections.indexOf(connection);
      if (index > -1) {
        connections.splice(index, 1);
      }
      if (connections.length === 0) {
        this.activeConnections.delete(userId);
      }
    }
  }

  /**
   * Obtient le nombre de connexions actives
   */
  getActiveConnectionsCount(): number {
    let total = 0;
    this.activeConnections.forEach(connections => {
      total += connections.length;
    });
    return total;
  }

  /**
   * Obtient les statistiques de synchronisation
   */
  getStats() {
    return {
      activeUsers: this.activeConnections.size,
      totalConnections: this.getActiveConnectionsCount(),
      lastEvents: this.listenerCount('userUpdated')
    };
  }
}

// Instance singleton
export const userSyncService = new UserSyncService();

/**
 * Middleware pour notifier automatiquement les mises à jour d'utilisateur
 */
export const notifyUserUpdate = (userId: string, updatedBy: string, changes: Record<string, any>) => {
  userSyncService.notifyUserUpdate(userId, updatedBy, changes);
};

/**
 * Middleware pour notifier automatiquement les mises à jour de profil
 */
export const notifyProfileUpdate = (userId: string, updatedBy: string, changes: Record<string, any>) => {
  userSyncService.notifyProfileUpdate(userId, updatedBy, changes);
};

export default userSyncService;