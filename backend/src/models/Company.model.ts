import mongoose, { Document, Schema } from "mongoose";

// Interface définissant la structure d'une entreprise
export interface ICompany extends Document {
  name: string;
  logoUrl?: string;
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
    },
    logoUrl: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true, // Ajoute automatiquement createdAt et updatedAt
  }
);

// Modèle Mongoose créé à partir du schéma
export const Company = mongoose.model<ICompany>("Company", companySchema);
