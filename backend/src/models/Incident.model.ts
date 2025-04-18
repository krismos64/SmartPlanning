import mongoose, { Document, Model, Schema } from "mongoose";

// Définition du type d'incident
enum IncidentType {
  RETARD = "retard",
  ABSENCE = "absence",
  OUBLI_BADGE = "oubli badge",
  LITIGE = "litige",
  AUTRE = "autre",
}

// Définition du statut de l'incident
enum IncidentStatus {
  RESOLVED = "resolved",
  PENDING = "pending",
  DISMISSED = "dismissed",
}

// Interface pour le document Incident
export interface IIncident {
  employeeId: mongoose.Types.ObjectId;
  type: IncidentType;
  description?: string;
  date: Date;
  status?: IncidentStatus;
  reportedBy: mongoose.Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

// Interface pour le document Incident avec les méthodes de Mongoose
export interface IncidentDocument extends IIncident, Document {}

// Définition du schéma principal Incident
const incidentSchema = new Schema<IncidentDocument>(
  {
    employeeId: {
      type: Schema.Types.ObjectId,
      ref: "Employee",
      required: [true, "L'identifiant de l'employé est requis"],
    },
    type: {
      type: String,
      enum: Object.values(IncidentType),
      required: [true, "Le type d'incident est requis"],
    },
    description: {
      type: String,
      trim: true,
    },
    date: {
      type: Date,
      required: [true, "La date de l'incident est requise"],
    },
    status: {
      type: String,
      enum: Object.values(IncidentStatus),
      default: IncidentStatus.PENDING,
    },
    reportedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [
        true,
        "L'identifiant de l'utilisateur ayant signalé l'incident est requis",
      ],
    },
  },
  {
    timestamps: true,
  }
);

// Index pour faciliter la recherche des incidents par employé
incidentSchema.index({ employeeId: 1 });

// Index supplémentaire pour la recherche des incidents par date
incidentSchema.index({ date: -1 });

// Création du modèle
export const IncidentModel: Model<IncidentDocument> =
  mongoose.model<IncidentDocument>("Incident", incidentSchema);

export default IncidentModel;
