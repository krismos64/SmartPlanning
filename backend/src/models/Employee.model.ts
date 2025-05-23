/**
 * Modèle Employee pour SmartPlanning
 *
 * Ce modèle représente un employé dans le système avec ses informations
 * de base, son rattachement à une entreprise et une équipe, ainsi que
 * ses préférences d'horaires et de jours de travail.
 */
import mongoose, { Document, Model, Schema, Types } from "mongoose";

/**
 * Enum représentant les statuts possibles d'un employé
 */
export enum EmployeeStatus {
  ACTIF = "actif",
  INACTIF = "inactif",
}

/**
 * Interface pour les préférences de l'employé
 */
export interface EmployeePreferences {
  preferredDays?: string[];
  preferredHours?: string[];
}

/**
 * Interface principale pour le document Employee
 */
export interface IEmployee {
  userId?: Types.ObjectId;
  companyId: Types.ObjectId;
  teamId: Types.ObjectId | null;
  firstName: string;
  lastName: string;
  email?: string;
  photoUrl?: string;
  status: EmployeeStatus;
  contractHoursPerWeek: number;
  startDate?: Date;
  preferences?: EmployeePreferences;
  createdAt?: Date;
  updatedAt?: Date;
  role?: string;
}

/**
 * Interface étendue pour le document Employee avec les méthodes de Mongoose
 */
export interface EmployeeDocument extends IEmployee, Document {}

/**
 * Interface pour le modèle Employee avec ses méthodes statiques
 */
export interface EmployeeModel extends Model<EmployeeDocument> {
  /**
   * Trouve tous les employés appartenant à une équipe spécifique
   * @param teamId - L'identifiant de l'équipe
   * @returns Une promesse contenant la liste des employés de l'équipe
   */
  findByTeamId(teamId: Types.ObjectId): Promise<EmployeeDocument[]>;

  /**
   * Trouve tous les employés appartenant à une entreprise spécifique
   * @param companyId - L'identifiant de l'entreprise
   * @returns Une promesse contenant la liste des employés de l'entreprise
   */
  findByCompanyId(companyId: Types.ObjectId): Promise<EmployeeDocument[]>;
}

/**
 * Schéma pour les préférences de l'employé
 */
const preferencesSchema = new Schema<EmployeePreferences>(
  {
    preferredDays: {
      type: [String],
      validate: {
        validator: function (days: string[]): boolean {
          const validDays = [
            "lundi",
            "mardi",
            "mercredi",
            "jeudi",
            "vendredi",
            "samedi",
            "dimanche",
          ];
          return (
            !days || days.every((day) => validDays.includes(day.toLowerCase()))
          );
        },
        message:
          "Les jours préférés doivent être des jours valides de la semaine",
      },
    },
    preferredHours: {
      type: [String],
      validate: {
        validator: function (hours: string[]): boolean {
          // Format attendu: "HH:MM-HH:MM" (ex: "09:00-17:00")
          const timeRangeRegex =
            /^([01]\d|2[0-3]):([0-5]\d)-([01]\d|2[0-3]):([0-5]\d)$/;
          return !hours || hours.every((hour) => timeRangeRegex.test(hour));
        },
        message: "Les heures préférées doivent être au format HH:MM-HH:MM",
      },
    },
  },
  { _id: false }
);

/**
 * Schéma principal pour le modèle Employee
 */
const employeeSchema = new Schema<EmployeeDocument, EmployeeModel>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    companyId: {
      type: Schema.Types.ObjectId,
      ref: "Company",
      required: [true, "L'identifiant de l'entreprise est requis"],
      index: true,
    },
    teamId: {
      type: Schema.Types.ObjectId,
      ref: "Team",
      default: null,
      validate: {
        validator: function (v: Types.ObjectId | null): boolean {
          return v === null || Types.ObjectId.isValid(v);
        },
        message: "L'identifiant d'équipe doit être un ObjectId valide ou null",
      },
      index: true,
    },
    firstName: {
      type: String,
      required: [true, "Le prénom est requis"],
      trim: true,
      minlength: [2, "Le prénom doit comporter au moins 2 caractères"],
      maxlength: [50, "Le prénom ne peut pas dépasser 50 caractères"],
    },
    lastName: {
      type: String,
      required: [true, "Le nom est requis"],
      trim: true,
      minlength: [2, "Le nom doit comporter au moins 2 caractères"],
      maxlength: [50, "Le nom ne peut pas dépasser 50 caractères"],
    },
    email: { type: String, required: false },
    photoUrl: {
      type: String,
      validate: {
        validator: function (v: string | undefined): boolean {
          if (!v) return true;
          // Validation simple d'URL
          try {
            new URL(v);
            return true;
          } catch (err) {
            return false;
          }
        },
        message: "L'URL de la photo n'est pas valide",
      },
    },
    status: {
      type: String,
      enum: {
        values: Object.values(EmployeeStatus),
        message: "Le statut doit être 'actif' ou 'inactif'",
      },
      required: true,
      default: EmployeeStatus.ACTIF,
      index: true,
    },
    role: {
      type: String,
      enum: ["employee", "manager", "directeur"],
      default: "employee",
    },
    contractHoursPerWeek: {
      type: Number,
      required: [
        true,
        "Le nombre d'heures contractuelles par semaine est requis",
      ],
      min: [0, "Le nombre d'heures ne peut pas être négatif"],
      max: [
        168,
        "Le nombre d'heures ne peut pas dépasser 168 (nombre d'heures dans une semaine)",
      ],
    },
    startDate: {
      type: Date,
      validate: {
        validator: function (v: Date | undefined): boolean {
          if (!v) return true;
          return v instanceof Date && !isNaN(v.getTime());
        },
        message: "La date de début doit être une date valide",
      },
    },
    preferences: {
      type: preferencesSchema,
      default: {},
    },
  },
  {
    timestamps: true,
    // Ajoute des index pour les requêtes courantes
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

/**
 * Ajoute le champ virtuel fullName
 */
employeeSchema
  .virtual("fullName")
  .get(function (this: EmployeeDocument): string {
    return `${this.firstName} ${this.lastName}`;
  });

/**
 * Méthode statique pour trouver des employés par identifiant d'équipe
 */
employeeSchema.statics.findByTeamId = function (
  teamId: Types.ObjectId
): Promise<EmployeeDocument[]> {
  return this.find({ teamId }).exec();
};

/**
 * Méthode statique pour trouver des employés par identifiant d'entreprise
 */
employeeSchema.statics.findByCompanyId = function (
  companyId: Types.ObjectId
): Promise<EmployeeDocument[]> {
  return this.find({ companyId }).exec();
};

/**
 * Pré-traitement avant la sauvegarde pour normaliser certaines données
 */
employeeSchema.pre<EmployeeDocument>("save", function (next) {
  // Normaliser le prénom et le nom (première lettre en majuscule, reste en minuscule)
  if (this.isModified("firstName")) {
    this.firstName =
      this.firstName.charAt(0).toUpperCase() +
      this.firstName.slice(1).toLowerCase();
  }

  if (this.isModified("lastName")) {
    this.lastName = this.lastName.toUpperCase();
  }

  next();
});

/**
 * Création et export du modèle Employee
 */
const EmployeeModel = mongoose.model<EmployeeDocument, EmployeeModel>(
  "Employee",
  employeeSchema
);

export default EmployeeModel;
