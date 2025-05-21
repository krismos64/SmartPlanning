import mongoose, { Document, Model, Schema } from "mongoose";

// Définition du statut de la demande de congés
enum VacationRequestStatus {
  PENDING = "pending",
  APPROVED = "approved",
  REJECTED = "rejected",
}

// Interface pour le document VacationRequest
export interface IVacationRequest {
  employeeId: mongoose.Types.ObjectId;
  startDate: Date;
  endDate: Date;
  status: VacationRequestStatus;
  requestedBy: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
  reason?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// Interface pour le document VacationRequest avec les méthodes de Mongoose
export interface VacationRequestDocument extends IVacationRequest, Document {}

// Définition du schéma principal VacationRequest
const vacationRequestSchema = new Schema<VacationRequestDocument>(
  {
    employeeId: {
      type: Schema.Types.ObjectId,
      ref: "Employee",
      required: [true, "L'identifiant de l'employé est requis"],
    },
    startDate: {
      type: Date,
      required: [true, "La date de début est requise"],
      set: function (val: Date | string) {
        // Si la valeur est une chaîne, extraire seulement la partie YYYY-MM-DD
        if (typeof val === "string") {
          const dateStr = val.split("T")[0];
          const [year, month, day] = dateStr
            .split("-")
            .map((n) => parseInt(n, 10));
          return new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
        }
        // Si c'est déjà un objet Date, créer une nouvelle date à midi UTC
        if (val instanceof Date) {
          const year = val.getUTCFullYear();
          const month = val.getUTCMonth();
          const day = val.getUTCDate();
          return new Date(Date.UTC(year, month, day, 12, 0, 0));
        }
        return val;
      },
    },
    endDate: {
      type: Date,
      required: [true, "La date de fin est requise"],
      set: function (val: Date | string) {
        // Si la valeur est une chaîne, extraire seulement la partie YYYY-MM-DD
        if (typeof val === "string") {
          const dateStr = val.split("T")[0];
          const [year, month, day] = dateStr
            .split("-")
            .map((n) => parseInt(n, 10));
          return new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
        }
        // Si c'est déjà un objet Date, créer une nouvelle date à midi UTC
        if (val instanceof Date) {
          const year = val.getUTCFullYear();
          const month = val.getUTCMonth();
          const day = val.getUTCDate();
          return new Date(Date.UTC(year, month, day, 12, 0, 0));
        }
        return val;
      },
      validate: {
        validator: function (this: VacationRequestDocument) {
          // Convertir les deux dates en YYYY-MM-DD pour la comparaison
          const startStr = this.startDate.toISOString().split("T")[0];
          const endStr = this.endDate.toISOString().split("T")[0];
          return startStr <= endStr;
        },
        message:
          "La date de fin doit être postérieure ou égale à la date de début",
      },
    },
    status: {
      type: String,
      enum: Object.values(VacationRequestStatus),
      required: [true, "Le statut est requis"],
      default: VacationRequestStatus.PENDING,
    },
    requestedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [
        true,
        "L'identifiant de l'utilisateur ayant effectué la demande est requis",
      ],
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    reason: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Index pour faciliter la recherche des demandes par employé
vacationRequestSchema.index({ employeeId: 1, startDate: -1 });

// Création du modèle
export const VacationRequestModel: Model<VacationRequestDocument> =
  mongoose.model<VacationRequestDocument>(
    "VacationRequest",
    vacationRequestSchema
  );

export default VacationRequestModel;
