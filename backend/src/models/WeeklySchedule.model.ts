import mongoose, { Document, Model, Schema } from "mongoose";

// Définition du statut du planning hebdomadaire
enum ScheduleStatus {
  DRAFT = "draft",
  APPROVED = "approved",
}

// Interface pour les données d'horaire
export interface ScheduleData {
  [day: string]: string[]; // ex: "lundi": ["09:00-12:00", "14:00-17:00"]
}

// Interface pour le document WeeklySchedule
export interface IWeeklySchedule {
  employeeId: mongoose.Types.ObjectId;
  year: number;
  weekNumber: number;
  scheduleData: ScheduleData;
  status: ScheduleStatus;
  updatedBy: mongoose.Types.ObjectId;
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// Interface pour le document WeeklySchedule avec les méthodes de Mongoose
export interface WeeklyScheduleDocument extends IWeeklySchedule, Document {}

// Définition du schéma principal WeeklySchedule
const weeklyScheduleSchema = new Schema<WeeklyScheduleDocument>(
  {
    employeeId: {
      type: Schema.Types.ObjectId,
      ref: "Employee",
      required: [true, "L'identifiant de l'employé est requis"],
    },
    year: {
      type: Number,
      required: [true, "L'année est requise"],
      min: [2000, "L'année doit être valide"],
    },
    weekNumber: {
      type: Number,
      required: [true, "Le numéro de semaine est requis"],
      min: [1, "Le numéro de semaine doit être au minimum 1"],
      max: [53, "Le numéro de semaine doit être au maximum 53"],
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
    status: {
      type: String,
      enum: Object.values(ScheduleStatus),
      required: [true, "Le statut est requis"],
      default: ScheduleStatus.DRAFT,
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [
        true,
        "L'identifiant de l'utilisateur qui a mis à jour le planning est requis",
      ],
    },
    notes: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Index pour améliorer les performances de recherche
weeklyScheduleSchema.index(
  { employeeId: 1, year: 1, weekNumber: 1 },
  { unique: true }
);

// Création du modèle
export const WeeklyScheduleModel: Model<WeeklyScheduleDocument> =
  mongoose.model<WeeklyScheduleDocument>(
    "WeeklySchedule",
    weeklyScheduleSchema
  );

export default WeeklyScheduleModel;
