import mongoose, { Document, Model, Schema } from "mongoose";

// Définition du statut de l'employé
enum EmployeeStatus {
  ACTIF = "actif",
  INACTIF = "inactif",
}

// Interface pour les préférences de l'employé
interface EmployeePreferences {
  preferredDays?: string[];
  preferredHours?: string[];
}

// Interface pour le document Employee
export interface IEmployee {
  userId?: mongoose.Types.ObjectId;
  companyId: mongoose.Types.ObjectId;
  teamId: mongoose.Types.ObjectId;
  firstName: string;
  lastName: string;
  photoUrl?: string;
  status: EmployeeStatus;
  contractHoursPerWeek: number;
  startDate?: Date;
  preferences?: EmployeePreferences;
  createdAt?: Date;
  updatedAt?: Date;
}

// Interface pour le document Employee avec les méthodes de Mongoose
export interface EmployeeDocument extends IEmployee, Document {}

// Définition du schéma des préférences
const preferencesSchema = new Schema<EmployeePreferences>(
  {
    preferredDays: {
      type: [String],
    },
    preferredHours: {
      type: [String],
    },
  },
  { _id: false }
);

// Définition du schéma principal Employee
const employeeSchema = new Schema<EmployeeDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    companyId: {
      type: Schema.Types.ObjectId,
      ref: "Company",
      required: [true, "L'identifiant de l'entreprise est requis"],
    },
    // Peut être null si l'employé n'est pas encore affecté à une équipe
    teamId: {
      type: Schema.Types.ObjectId,
      ref: "Team",
      default: null,
    },
    firstName: {
      type: String,
      required: [true, "Le prénom est requis"],
      trim: true,
    },
    lastName: {
      type: String,
      required: [true, "Le nom est requis"],
      trim: true,
    },
    photoUrl: {
      type: String,
    },
    status: {
      type: String,
      enum: Object.values(EmployeeStatus),
      required: true,
      default: EmployeeStatus.ACTIF,
    },
    contractHoursPerWeek: {
      type: Number,
      required: [
        true,
        "Le nombre d'heures contractuelles par semaine est requis",
      ],
    },
    startDate: {
      type: Date,
    },
    preferences: {
      type: preferencesSchema,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Création du modèle
export const EmployeeModel: Model<EmployeeDocument> =
  mongoose.model<EmployeeDocument>("Employee", employeeSchema);

export default EmployeeModel;
