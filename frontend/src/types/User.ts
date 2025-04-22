export type UserRole = "admin" | "directeur" | "manager" | "employé";

export interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  status: "active" | "inactive";
  createdAt: string;
}
