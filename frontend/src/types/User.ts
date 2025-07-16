export type UserRole = "admin" | "directeur" | "manager" | "employee";

export interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  status: "active" | "inactive";
  createdAt: string;
  photoUrl?: string; // URL de la photo de profil (optionnelle)
  companyId?: string;
  teamId?: string; // ID de l'équipe assignée
  companyName?: string; // Nom de l'entreprise
  token?: string;
  userId?: string; // Ajout de userId pour la compatibilité avec le middleware d'auth
  profileCompleted?: boolean; // Indique si le profil est complet
}
