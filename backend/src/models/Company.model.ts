import mongoose, { Document, Schema } from "mongoose";

// Type pour les plans d'abonnement
export type CompanyPlan = "free" | "standard" | "premium" | "enterprise";

// Interface définissant la structure d'une entreprise
export interface ICompany extends Document {
  name: string;
  logoUrl?: string;
  plan: CompanyPlan;
  createdAt: Date;
  updatedAt: Date;
}

// Schéma Mongoose pour les entreprises
const companySchema = new Schema<ICompany>(
  {
    name: {
      type: String,
      required: [true, "Le nom de l'entreprise est requis"],
      trim: true,
      unique: true, // Garantir l'unicité du nom d'entreprise
    },
    logoUrl: {
      type: String,
      default: null,
    },
    plan: {
      type: String,
      enum: ["free", "standard", "premium", "enterprise"],
      default: "free",
    },
  },
  {
    timestamps: true, // Ajoute automatiquement createdAt et updatedAt
  }
);

// Création d'un index sur le nom pour optimiser les recherches
companySchema.index({ name: 1 });

// Modèle Mongoose créé à partir du schéma
export const Company = mongoose.model<ICompany>("Company", companySchema);

export default Company;
