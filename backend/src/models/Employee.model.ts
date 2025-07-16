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
 * Middleware de validation des références avant sauvegarde
 */
employeeSchema.pre<EmployeeDocument>("save", async function (next) {
  try {
    // Vérifier que la company existe
    if (this.companyId) {
      const Company = mongoose.model("Company");
      const company = await Company.findById(this.companyId);
      if (!company) {
        return next(new Error(`Company avec l'ID ${this.companyId} n'existe pas`));
      }
    }

    // Vérifier que le user existe si userId est défini
    if (this.userId) {
      const User = mongoose.model("User");
      const user = await User.findById(this.userId);
      if (!user) {
        return next(new Error(`User avec l'ID ${this.userId} n'existe pas`));
      }
    }

    // Vérifier que la team existe si teamId est défini
    if (this.teamId) {
      const Team = mongoose.model("Team");
      const team = await Team.findById(this.teamId);
      if (!team) {
        return next(new Error(`Team avec l'ID ${this.teamId} n'existe pas`));
      }
    }

    next();
  } catch (error) {
    next(error as Error);
  }
});

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
 * Middleware de synchronisation User ↔ Employee après sauvegarde
 */
employeeSchema.post<EmployeeDocument>("save", async function (doc, next) {
  try {
    // Si l'employee a un userId et un teamId, synchroniser avec User.teamIds
    if (doc.userId && doc.teamId) {
      const User = mongoose.model("User");
      await User.findByIdAndUpdate(
        doc.userId,
        { $addToSet: { teamIds: doc.teamId } },
        { new: true }
      );
    }

    // Si l'employee n'a plus de teamId, le retirer de User.teamIds
    if (doc.userId && !doc.teamId) {
      const User = mongoose.model("User");
      const user = await User.findById(doc.userId);
      if (user && user.teamIds) {
        // Récupérer toutes les teams de cet utilisateur via ses autres employés
        const Employee = mongoose.model("Employee");
        const employeeTeams = await Employee.find({ 
          userId: doc.userId, 
          teamId: { $exists: true, $ne: null } 
        }).distinct('teamId');
        
        // Mettre à jour les teamIds avec seulement les teams actuelles
        await User.findByIdAndUpdate(
          doc.userId,
          { $set: { teamIds: employeeTeams } },
          { new: true }
        );
      }
    }

    next();
  } catch (error) {
    next(error as Error);
  }
});

/**
 * Middleware de cascade pour la suppression d'un employé
 */
employeeSchema.pre("deleteOne", { document: true, query: false }, async function (next) {
  try {
    const employeeId = this._id;
    
    // Supprimer les WeeklySchedule liés à cet employé
    const WeeklySchedule = mongoose.model("WeeklySchedule");
    await WeeklySchedule.deleteMany({ employeeId });
    
    // Supprimer les VacationRequest liés à cet employé
    const VacationRequest = mongoose.model("VacationRequest");
    await VacationRequest.deleteMany({ employeeId });
    
    // Supprimer les Task liées à cet employé
    const Task = mongoose.model("Task");
    await Task.deleteMany({ employeeId });
    
    // Supprimer les Incident liés à cet employé
    const Incident = mongoose.model("Incident");
    await Incident.deleteMany({ employeeId });
    
    // Retirer cet employé des Team.employeeIds
    const Team = mongoose.model("Team");
    await Team.updateMany(
      { employeeIds: employeeId },
      { $pull: { employeeIds: employeeId } }
    );
    
    // Mettre à jour User.teamIds si nécessaire
    if (this.userId) {
      const User = mongoose.model("User");
      const Employee = mongoose.model("Employee");
      const remainingTeams = await Employee.find({ 
        userId: this.userId, 
        _id: { $ne: employeeId },
        teamId: { $exists: true, $ne: null } 
      }).distinct('teamId');
      
      await User.findByIdAndUpdate(
        this.userId,
        { $set: { teamIds: remainingTeams } },
        { new: true }
      );
    }
    
    console.log(`🗑️ Cascade suppression Employee ${employeeId} terminée`);
    next();
  } catch (error) {
    next(error as Error);
  }
});

/**
 * Création et export du modèle Employee
 */
const EmployeeModel = mongoose.model<EmployeeDocument, EmployeeModel>(
  "Employee",
  employeeSchema
);

export default EmployeeModel;
