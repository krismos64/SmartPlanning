import mongoose, { Document, Model, Schema } from "mongoose";

// Définition du statut du planning généré
enum ScheduleStatus {
  DRAFT = "draft",
  APPROVED = "approved",
}

// Interface pour les données d'horaire
export interface ScheduleData {
  [day: string]: string[]; // ex: "lundi": ["09:00-12:00", "14:00-17:00"]
}

// Interface pour le document GeneratedSchedule
export interface IGeneratedSchedule {
  employeeId: mongoose.Types.ObjectId;
  scheduleData: ScheduleData;
  generatedBy: mongoose.Types.ObjectId | string; // UserId ou "AI"
  timestamp: Date;
  status: ScheduleStatus;
}

// Interface pour le document GeneratedSchedule avec les méthodes de Mongoose
export interface GeneratedScheduleDocument
  extends IGeneratedSchedule,
    Document {}

// Définition du schéma principal GeneratedSchedule
const generatedScheduleSchema = new Schema<GeneratedScheduleDocument>(
  {
    employeeId: {
      type: Schema.Types.ObjectId,
      ref: "Employee",
      required: [true, "L'identifiant de l'employé est requis"],
    },
    scheduleData: {
      type: Map,
      of: [String],
      required: [true, "Les données d'horaire sont requises"],
      validate: {
        validator: function (v: Map<string, string[]>) {
          return v && v.size > 0;
        },
        message: "Au moins un jour doit être défini dans les données d'horaire",
      },
    },
    generatedBy: {
      type: Schema.Types.Mixed,
      required: [true, "L'origine de la génération est requise"],
      validate: {
        validator: function (v: any) {
          return mongoose.Types.ObjectId.isValid(v) || v === "AI";
        },
        message:
          "Le champ generatedBy doit être un ID utilisateur valide ou 'AI'",
      },
    },
    timestamp: {
      type: Date,
      required: [true, "La date de génération est requise"],
      default: Date.now,
    },
    status: {
      type: String,
      enum: Object.values(ScheduleStatus),
      required: [true, "Le statut est requis"],
      default: ScheduleStatus.DRAFT,
    },
  },
  {
    timestamps: true,
  }
);

// Création du modèle
export const GeneratedScheduleModel: Model<GeneratedScheduleDocument> =
  mongoose.model<GeneratedScheduleDocument>(
    "GeneratedSchedule",
    generatedScheduleSchema
  );

export default GeneratedScheduleModel;
