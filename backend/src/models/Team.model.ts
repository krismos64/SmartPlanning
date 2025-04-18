import mongoose, { Document, Model, Schema } from "mongoose";

// Interface pour le document Team
export interface ITeam {
  companyId: mongoose.Types.ObjectId;
  name: string;
  managerIds: mongoose.Types.ObjectId[];
  employeeIds: mongoose.Types.ObjectId[];
  description?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// Interface pour le document Team avec les méthodes de Mongoose
export interface TeamDocument extends ITeam, Document {}

// Définition du schéma principal Team
const teamSchema = new Schema<TeamDocument>(
  {
    companyId: {
      type: Schema.Types.ObjectId,
      ref: "Company",
      required: [true, "L'identifiant de l'entreprise est requis"],
    },
    name: {
      type: String,
      required: [true, "Le nom de l'équipe est requis"],
      trim: true,
    },
    managerIds: {
      type: [Schema.Types.ObjectId],
      ref: "User",
      required: [true, "Au moins un manager est requis"],
      validate: {
        validator: function (v: mongoose.Types.ObjectId[]) {
          return Array.isArray(v) && v.length >= 1;
        },
        message: "Au moins un manager doit être assigné à l'équipe",
      },
    },
    employeeIds: {
      type: [Schema.Types.ObjectId],
      ref: "Employee",
      required: [true, "La liste des employés est requise"],
      default: [],
    },
    description: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Création du modèle
export const TeamModel: Model<TeamDocument> = mongoose.model<TeamDocument>(
  "Team",
  teamSchema
);

export default TeamModel;
