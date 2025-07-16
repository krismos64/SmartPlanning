/**
 * Hook spécialisé pour les mises à jour de profil avec synchronisation automatique
 */

import { useCallback } from 'react';
import { useAuth } from './useAuth';
import { useUserSync } from './useUserSync';
import { updateUserProfile, uploadFile } from '../services/api';
import axiosInstance from '../api/axiosInstance';

export const useProfileUpdate = () => {
  const { user, refreshUser, updateUser } = useAuth();
  const { emitSyncEvent, forceRefresh } = useUserSync();

  /**
   * Met à jour la photo de profil avec synchronisation
   * Utilise l'endpoint dédié /users/:id/photo pour un workflow simplifié
   */
  const updateProfilePhoto = useCallback(async (file: File) => {
    if (!user?._id) {
      throw new Error('Utilisateur non connecté');
    }

    try {
      console.log('📸 Début de la mise à jour de la photo de profil...');
      
      // Utiliser l'endpoint dédié /users/:id/photo qui fait tout en une fois
      const formData = new FormData();
      formData.append('file', file);

      const response = await axiosInstance.put(`/users/${user._id}/photo`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        const newPhotoUrl = response.data.photoUrl;
        console.log('✅ Photo mise à jour:', newPhotoUrl);

        // Mettre à jour directement l'utilisateur avec la nouvelle photo
        // au lieu de faire un refresh complet qui peut causer des boucles
        updateUser({ photoUrl: newPhotoUrl });

        // Émettre un événement de synchronisation pour les autres onglets
        emitSyncEvent({
          type: 'PHOTO_UPDATED',
          userId: user._id,
          data: { photoUrl: newPhotoUrl },
          timestamp: Date.now()
        });

        console.log('🔄 Événement de synchronisation émis pour photo mise à jour');
        return { success: true, imageUrl: newPhotoUrl };
      } else {
        throw new Error('Échec de la mise à jour de la photo');
      }

    } catch (error) {
      console.error('❌ Erreur lors de la mise à jour de la photo:', error);
      throw error;
    }
  }, [user, refreshUser, emitSyncEvent]);

  /**
   * Met à jour une photo de profil d'un autre utilisateur (admin/manager)
   */
  const updateOtherUserPhoto = useCallback(async (userId: string, file: File) => {
    if (!user?._id) {
      throw new Error('Utilisateur non connecté');
    }

    try {
      console.log(`📸 Début de la mise à jour de la photo pour l'utilisateur ${userId}...`);
      
      // Utiliser l'endpoint dédié pour la mise à jour de photo par ID
      const formData = new FormData();
      formData.append('file', file);

      const response = await axiosInstance.put(`/users/${userId}/photo`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        console.log('✅ Photo mise à jour pour l\'utilisateur:', userId, response.data.photoUrl);

        // Émettre un événement de synchronisation pour l'utilisateur ciblé
        emitSyncEvent({
          type: 'PHOTO_UPDATED',
          userId: userId,
          data: { photoUrl: response.data.photoUrl },
          timestamp: Date.now()
        });

        console.log('🔄 Événement de synchronisation émis pour utilisateur:', userId);
        return { success: true, photoUrl: response.data.photoUrl };
      } else {
        throw new Error('Échec de la mise à jour de la photo');
      }

    } catch (error) {
      console.error('❌ Erreur lors de la mise à jour de la photo d\'un autre utilisateur:', error);
      throw error;
    }
  }, [user, emitSyncEvent]);

  /**
   * Met à jour le profil général avec synchronisation
   */
  const updateProfile = useCallback(async (profileData: any) => {
    if (!user?._id) {
      throw new Error('Utilisateur non connecté');
    }

    try {
      console.log('📝 Début de la mise à jour du profil...');
      
      const updatedProfile = await updateUserProfile(profileData);
      console.log('✅ Profil mis à jour:', updatedProfile);

      // Mettre à jour directement l'utilisateur avec les nouvelles données
      // au lieu de faire un refresh complet qui peut causer des boucles
      updateUser(profileData);

      // Émettre un événement de synchronisation
      emitSyncEvent({
        type: 'PROFILE_UPDATED',
        userId: user._id,
        data: profileData,
        timestamp: Date.now()
      });

      console.log('🔄 Événement de synchronisation émis pour profil mis à jour');
      return { success: true, profile: updatedProfile };

    } catch (error) {
      console.error('❌ Erreur lors de la mise à jour du profil:', error);
      throw error;
    }
  }, [user, refreshUser, emitSyncEvent]);

  return {
    updateProfilePhoto,
    updateOtherUserPhoto,
    updateProfile,
    forceRefresh
  };
};