import mongoose, { Document, Model, Schema } from "mongoose";

// Définition du statut du planning généré
enum ScheduleStatus {
  DRAFT = "draft",
  APPROVED = "approved",
}

// Interface pour les données d'horaire d'une journée
export interface DayScheduleData {
  start?: string;
  end?: string;
  pause?: string;
  slots?: string[]; // Format: ["09:00-12:00", "14:00-17:00"]
}

// Interface pour les données d'horaire
export interface ScheduleData {
  [day: string]: DayScheduleData; // ex: "lundi": { slots: ["09:00-12:00", "14:00-17:00"] }
}

// Interface pour le document GeneratedSchedule
export interface IGeneratedSchedule {
  employeeId: mongoose.Types.ObjectId;
  scheduleData: ScheduleData;
  generatedBy: mongoose.Types.ObjectId | string; // UserId ou "AI"
  timestamp: Date;
  status: ScheduleStatus;
  weekNumber?: number; // Numéro de semaine (1-53)
  year?: number; // Année du planning
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
      of: {
        start: { type: String, required: false },
        end: { type: String, required: false },
        pause: { type: String, required: false },
        slots: { type: [String], required: false },
      },
      required: [true, "Les données d'horaire sont requises"],
      validate: {
        validator: function (v: Map<string, DayScheduleData>) {
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
          return mongoose.Types.ObjectId.isValid(v) || v === "AI" || v === "AUTO_GENERATE";
        },
        message:
          "Le champ generatedBy doit être un ID utilisateur valide, 'AI' ou 'AUTO_GENERATE'",
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
    weekNumber: {
      type: Number,
      required: false,
      min: [1, "Le numéro de semaine doit être compris entre 1 et 53"],
      max: [53, "Le numéro de semaine doit être compris entre 1 et 53"],
    },
    year: {
      type: Number,
      required: false,
      min: [2020, "L'année doit être supérieure ou égale à 2020"],
      max: [2030, "L'année doit être inférieure ou égale à 2030"],
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
