/**
 * Hooks pour la gestion des équipes via l'API d'administration
 *
 * @module hooks/adminTeams
 */

export { default as useCreateAdminTeam } from "./useCreateAdminTeam";
export { default as useDeleteAdminTeam } from "./useDeleteAdminTeam";
export { default as useFetchAdminTeams } from "./useFetchAdminTeams";
export { default as useUpdateAdminTeam } from "./useUpdateAdminTeam";

export type { CreateAdminTeamInput } from "./useCreateAdminTeam";
export type { AdminTeam } from "./useFetchAdminTeams";
export type { UpdateAdminTeamInput } from "./useUpdateAdminTeam";
