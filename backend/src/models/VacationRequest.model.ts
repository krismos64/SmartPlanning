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
    },
    endDate: {
      type: Date,
      required: [true, "La date de fin est requise"],
      validate: {
        validator: function (this: VacationRequestDocument) {
          return this.startDate <= this.endDate;
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
