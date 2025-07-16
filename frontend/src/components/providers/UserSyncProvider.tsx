/**
 * Composant Provider pour la synchronisation automatique des données utilisateur
 */

import React, { useEffect } from 'react';
import { useAutoUserSync } from '../../hooks/useUserSync';
import { useAuth } from '../../hooks/useAuth';

interface UserSyncProviderProps {
  children: React.ReactNode;
  syncInterval?: number;
}

/**
 * Provider qui démarre automatiquement la synchronisation des données utilisateur
 */
export const UserSyncProvider: React.FC<UserSyncProviderProps> = ({ 
  children, 
  syncInterval = 30000 // 30 secondes par défaut
}) => {
  const { user } = useAuth();
  const { forceRefresh, emitSyncEvent } = useAutoUserSync(syncInterval);

  useEffect(() => {
    if (user) {
      console.log('🔄 Synchronisation utilisateur activée pour:', user.firstName, user.lastName);
      console.log('⏱️ Intervalle de synchronisation:', syncInterval + 'ms');
    }
  }, [user, syncInterval]);

  // Exposer les fonctions de synchronisation globalement pour debug
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).forceUserRefresh = forceRefresh;
      (window as any).emitUserSyncEvent = emitSyncEvent;
      (window as any).userSyncProvider = true;
      (window as any).syncInterval = syncInterval;
      
      // Fonction pour vérifier l'état de la synchronisation
      (window as any).getSyncStatus = () => ({
        isActive: true,
        interval: syncInterval,
        user: user ? `${user.firstName} ${user.lastName}` : 'Non connecté',
        userId: user?._id,
        photoUrl: user?.photoUrl
      });
    }
  }, [forceRefresh, emitSyncEvent, syncInterval, user]);

  return <>{children}</>;
};