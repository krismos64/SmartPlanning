import mongoose, { Document, Model, Schema } from "mongoose";

// Définition des plans de souscription
enum SubscriptionPlan {
  FREE = "free",
  STANDARD = "standard",
  PREMIUM = "premium",
}

// Définition des thèmes
enum ThemeType {
  LIGHT = "light",
  DARK = "dark",
}

// Interface pour les paramètres de l'entreprise
interface CompanySettings {
  theme?: ThemeType;
  password?: string;
}

// Interface pour la souscription
interface Subscription {
  plan: SubscriptionPlan;
  employeeLimit: number;
  managerLimit: number;
  renewalDate?: Date;
}

// Interface pour le document Company
export interface ICompany {
  name: string;
  logoUrl?: string;
  subscription: Subscription;
  contactEmail?: string;
  contactPhone?: string;
  settings?: CompanySettings;
  createdAt?: Date;
  updatedAt?: Date;
}

// Interface pour le document Company avec les méthodes de Mongoose
export interface CompanyDocument extends ICompany, Document {}

// Définition du schéma des paramètres
const settingsSchema = new Schema<CompanySettings>(
  {
    theme: {
      type: String,
      enum: Object.values(ThemeType),
    },
    password: {
      type: String,
    },
  },
  { _id: false }
);

// Définition du schéma de souscription
const subscriptionSchema = new Schema<Subscription>(
  {
    plan: {
      type: String,
      enum: Object.values(SubscriptionPlan),
      required: [true, "Le plan d'abonnement est requis"],
    },
    employeeLimit: {
      type: Number,
      required: [true, "La limite d'employés est requise"],
    },
    managerLimit: {
      type: Number,
      required: [true, "La limite de managers est requise"],
    },
    renewalDate: {
      type: Date,
      required: function (this: any) {
        return this.plan !== SubscriptionPlan.FREE;
      },
    },
  },
  { _id: false }
);

// Définition du schéma principal Company
const companySchema = new Schema<CompanyDocument>(
  {
    name: {
      type: String,
      required: [true, "Le nom de l'entreprise est requis"],
      trim: true,
    },
    logoUrl: {
      type: String,
    },
    subscription: {
      type: subscriptionSchema,
      required: [true, "Les informations d'abonnement sont requises"],
    },
    contactEmail: {
      type: String,
    },
    contactPhone: {
      type: String,
    },
    settings: {
      type: settingsSchema,
    },
  },
  {
    timestamps: true,
  }
);

// Création du modèle
export const CompanyModel: Model<CompanyDocument> =
  mongoose.model<CompanyDocument>("Company", companySchema);

export default CompanyModel;
