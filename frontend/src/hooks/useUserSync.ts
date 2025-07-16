/**
 * Hook personnalisé pour synchroniser les données utilisateur
 * Permet de rafraîchir les données utilisateur quand elles sont modifiées par d'autres utilisateurs
 */

import { useCallback, useEffect, useRef } from 'react';
import { useAuth } from './useAuth';
import axiosInstance from '../api/axiosInstance';

/**
 * Interface pour les événements de synchronisation
 */
interface UserSyncEvent {
  type: 'PHOTO_UPDATED' | 'PROFILE_UPDATED' | 'USER_UPDATED';
  userId: string;
  data?: any;
  timestamp: number;
}

/**
 * Hook pour gérer la synchronisation des données utilisateur
 */
export const useUserSync = () => {
  const { user, refreshUser } = useAuth();
  const syncIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastSyncRef = useRef<number>(Date.now());

  /**
   * Vérifie s'il y a des mises à jour pour l'utilisateur actuel
   */
  const checkForUpdates = useCallback(async () => {
    if (!user?._id) return;

    try {
      // Récupérer les données utilisateur fraîches depuis le serveur
      const response = await axiosInstance.get('/auth/me');
      
      if (!response.data.success) {
        console.error('Erreur lors de la récupération des données utilisateur:', response.data);
        return;
      }

      const freshUserData = response.data.data;
      let hasChanges = false;

      // Comparer la photo de profil
      if (user.photoUrl !== freshUserData.photoUrl) {
        console.log('🔄 Photo de profil mise à jour détectée:', {
          ancienne: user.photoUrl,
          nouvelle: freshUserData.photoUrl,
          timestamp: new Date().toLocaleTimeString()
        });
        hasChanges = true;
      }

      // Comparer d'autres champs importants
      if (user.firstName !== freshUserData.firstName || 
          user.lastName !== freshUserData.lastName ||
          user.role !== freshUserData.role) {
        console.log('🔄 Données utilisateur mises à jour détectées:', {
          firstName: user.firstName !== freshUserData.firstName ? 
            { ancien: user.firstName, nouveau: freshUserData.firstName } : 'inchangé',
          lastName: user.lastName !== freshUserData.lastName ? 
            { ancien: user.lastName, nouveau: freshUserData.lastName } : 'inchangé',
          role: user.role !== freshUserData.role ? 
            { ancien: user.role, nouveau: freshUserData.role } : 'inchangé',
          timestamp: new Date().toLocaleTimeString()
        });
        hasChanges = true;
      }

      // Rafraîchir seulement s'il y a des changements
      if (hasChanges) {
        console.log('🔄 Rafraîchissement des données utilisateur...');
        await refreshUser();
      }

    } catch (error) {
      console.error('Erreur lors de la vérification des mises à jour:', error);
      // En cas d'erreur, ne pas arrêter la synchronisation
    }
  }, [user, refreshUser]);

  /**
   * Force un rafraîchissement immédiat des données utilisateur
   */
  const forceRefresh = useCallback(async () => {
    console.log('🔄 Rafraîchissement forcé des données utilisateur...');
    await refreshUser();
  }, [refreshUser]);

  /**
   * Démarre la synchronisation périodique
   */
  const startSync = useCallback((intervalMs: number = 30000) => {
    if (syncIntervalRef.current) {
      clearInterval(syncIntervalRef.current);
    }

    syncIntervalRef.current = setInterval(() => {
      checkForUpdates();
    }, intervalMs);

    console.log(`🔄 Synchronisation démarrée (intervalle: ${intervalMs}ms)`);
  }, [checkForUpdates]);

  /**
   * Arrête la synchronisation périodique
   */
  const stopSync = useCallback(() => {
    if (syncIntervalRef.current) {
      clearInterval(syncIntervalRef.current);
      syncIntervalRef.current = null;
      console.log('⏹️ Synchronisation arrêtée');
    }
  }, []);

  /**
   * Émet un événement de synchronisation via localStorage pour les autres onglets
   */
  const emitSyncEvent = useCallback((event: UserSyncEvent) => {
    const syncEventKey = 'userSyncEvent';
    localStorage.setItem(syncEventKey, JSON.stringify(event));
    
    // Supprimer l'événement après un court délai pour éviter l'accumulation
    setTimeout(() => {
      localStorage.removeItem(syncEventKey);
    }, 1000);
  }, []);

  /**
   * Écoute les événements de synchronisation des autres onglets
   */
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'userSyncEvent' && e.newValue) {
        try {
          const event: UserSyncEvent = JSON.parse(e.newValue);
          
          // Si l'événement concerne l'utilisateur actuel, rafraîchir
          if (event.userId === user?._id) {
            console.log('🔄 Événement de synchronisation reçu:', event.type);
            forceRefresh();
          }
        } catch (error) {
          console.error('Erreur lors du traitement de l\'événement de sync:', error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [user?._id, forceRefresh]);

  /**
   * Nettoie les intervalles lors du démontage
   */
  useEffect(() => {
    return () => {
      stopSync();
    };
  }, [stopSync]);

  return {
    checkForUpdates,
    forceRefresh,
    startSync,
    stopSync,
    emitSyncEvent,
  };
};

/**
 * Hook simplifié pour auto-démarrer la synchronisation
 */
export const useAutoUserSync = (intervalMs: number = 30000) => {
  const { startSync, stopSync, forceRefresh, emitSyncEvent } = useUserSync();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      startSync(intervalMs);
    } else {
      stopSync();
    }

    return () => stopSync();
  }, [user, startSync, stopSync, intervalMs]);

  return { forceRefresh, emitSyncEvent };
};