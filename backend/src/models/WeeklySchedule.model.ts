import mongoose, { Document, Schema } from "mongoose";

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
export interface IWeeklySchedule extends Document {
  employeeId: mongoose.Types.ObjectId;
  year: number;
  weekNumber: number;
  scheduleData: Record<string, string[]>;
  status: "approved" | "draft";
  updatedBy: mongoose.Types.ObjectId;
  notes?: string;
  dailyNotes?: Record<string, string>;
  dailyDates: Record<string, Date>;
  totalWeeklyMinutes: number;
  createdAt: Date;
  updatedAt: Date;
}

// Définition du schéma principal WeeklySchedule
const weeklyScheduleSchema = new Schema<IWeeklySchedule>(
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
      enum: ["approved", "draft"],
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
    dailyNotes: {
      type: Map,
      of: String,
    },
    dailyDates: {
      type: Map,
      of: Date,
      required: [true, "Les dates quotidiennes sont requises"],
      validate: {
        validator: function (v: Map<string, any>) {
          // Validation basique pour s'assurer que les valeurs sont soit des dates,
          // soit des chaînes pouvant être converties en dates
          if (!v || v.size === 0) return false;

          for (const [_, value] of v.entries()) {
            if (!(value instanceof Date)) {
              try {
                new Date(value);
              } catch (err) {
                return false;
              }
            }
          }
          return true;
        },
        message: "Les dates quotidiennes doivent être des dates valides",
      },
    },
    totalWeeklyMinutes: {
      type: Number,
      required: [true, "Le total des minutes hebdomadaires est requis"],
    },
  },
  {
    timestamps: true,
  }
);

// Middleware pour traiter les notes vides avant la sauvegarde
weeklyScheduleSchema.pre("findOneAndUpdate", function (next) {
  // @ts-ignore - Accès au contenu de la mise à jour
  const update = this.getUpdate() as any;

  // Si les notes quotidiennes sont présentes dans la mise à jour
  if (update && update.dailyNotes) {
    // S'assurer que les notes vides sont stockées comme des chaînes vides
    // et non comme undefined ou null pour éviter les problèmes de fusion
    Object.keys(update.dailyNotes).forEach((day) => {
      if (!update.dailyNotes[day]) {
        update.dailyNotes[day] = "";
      }
    });
  }

  next();
});

// Index pour améliorer les performances de recherche
weeklyScheduleSchema.index(
  { employeeId: 1, year: 1, weekNumber: 1 },
  { unique: true }
);

// Création du modèle
const WeeklyScheduleModel = mongoose.model<IWeeklySchedule>(
  "WeeklySchedule",
  weeklyScheduleSchema
);

export default WeeklyScheduleModel;
