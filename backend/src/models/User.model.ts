import bcrypt from "bcrypt";
import mongoose, { Document, Model, Schema } from "mongoose";

// Définition du type pour l'historique de connexion
export type LoginHistoryItem = {
  timestamp: Date;
  ip?: string;
  userAgent?: string;
  success: boolean;
};

// Type pour les rôles utilisateur
export type UserRole = "admin" | "directeur" | "manager" | "employee";

// Interface pour les données Google OAuth
export interface GoogleProfile {
  id: string;
  email: string;
  name: string;
}

// Type pour les préférences utilisateur
export type UserPreferences = {
  theme?: "light" | "dark" | "system";
  notifications?: boolean;
  lang?: string;
};

// Définition de l'interface pour un utilisateur
export interface IUser {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: UserRole;
  status: "active" | "inactive";
  isEmailVerified: boolean;
  verificationToken?: string;
  resetPasswordToken?: string;
  resetPasswordExpire?: Date;
  loginHistory?: LoginHistoryItem[];
  preferences?: UserPreferences;
  companyId?: mongoose.Types.ObjectId;
  teamIds?: mongoose.Types.ObjectId[];
  createdAt?: Date;
  updatedAt?: Date;
  lastLogin?: Date;
  google?: GoogleProfile;
  photoUrl?: string;
  bio?: string;
  phone?: string;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

// Interface pour les documents Mongoose
export interface UserDocument extends IUser, Document {}

// Interface pour les modèles Mongoose
export interface UserModel extends Model<UserDocument> {
  findByEmail(email: string): Promise<UserDocument>;
}

// Schéma pour le profil Google
const googleSchema = new Schema(
  {
    id: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
  },
  { _id: false }
);

// Définition du schéma Mongoose
const userSchema = new Schema<UserDocument>(
  {
    firstName: {
      type: String,
      required: [true, "Le prénom est requis"],
      trim: true,
    },
    lastName: {
      type: String,
      required: [true, "Le nom est requis"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "L'adresse email est requise"],
      unique: true,
      trim: true,
      lowercase: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Adresse email invalide",
      ],
    },
    password: {
      type: String,
      required: function (this: UserDocument) {
        // Le mot de passe n'est pas obligatoire pour les connexions via Google
        // ou pour les nouveaux employés qui n'ont pas encore créé leur mot de passe
        return !this.google && !this.resetPasswordToken;
      },
      minlength: [6, "Le mot de passe doit contenir au moins 6 caractères"],
      select: false, // Ne retourne pas le mot de passe par défaut dans les requêtes
    },
    role: {
      type: String,
      enum: ["admin", "directeur", "manager", "employee"],
      default: "employee",
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    verificationToken: {
      type: String,
    },
    resetPasswordToken: {
      type: String,
    },
    resetPasswordExpire: {
      type: Date,
    },
    loginHistory: [
      {
        timestamp: {
          type: Date,
          default: Date.now,
        },
        ip: {
          type: String,
        },
        userAgent: {
          type: String,
        },
        success: {
          type: Boolean,
          required: true,
        },
      },
    ],
    preferences: {
      theme: {
        type: String,
        enum: ["light", "dark", "system"],
        default: "system",
      },
      notifications: {
        type: Boolean,
        default: true,
      },
      lang: {
        type: String,
      },
    },
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
    },
    teamIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Team",
      },
    ],
    photoUrl: {
      type: String,
      trim: true,
    },
    lastLogin: {
      type: Date,
    },
    google: {
      type: googleSchema,
      required: false,
    },
    bio: {
      type: String,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index pour améliorer les performances
userSchema.index({ email: 1 });
userSchema.index({ "google.id": 1 }); // Index pour les recherches par ID Google

// Méthode statique pour trouver un utilisateur par email
userSchema.static("findByEmail", function (email: string) {
  return this.findOne({ email });
});

// Middleware pré-sauvegarde pour hacher le mot de passe
userSchema.pre<UserDocument>("save", async function (next) {
  // Seulement si le mot de passe est modifié (ou nouveau)
  if (!this.isModified("password") || !this.password) return next();

  try {
    // Génération d'un sel
    const salt = await bcrypt.genSalt(10);
    // Hachage du mot de passe avec le sel
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Middleware de validation des références avant sauvegarde
userSchema.pre<UserDocument>("save", async function (next) {
  try {
    // Vérifier que la company existe si companyId est défini
    if (this.companyId) {
      const Company = mongoose.model("Company");
      const company = await Company.findById(this.companyId);
      if (!company) {
        return next(new Error(`Company avec l'ID ${this.companyId} n'existe pas`));
      }
    }

    // Vérifier que les teams existent si teamIds est défini
    if (this.teamIds && this.teamIds.length > 0) {
      const Team = mongoose.model("Team");
      for (const teamId of this.teamIds) {
        const team = await Team.findById(teamId);
        if (!team) {
          return next(new Error(`Team avec l'ID ${teamId} n'existe pas`));
        }
      }
    }

    next();
  } catch (error) {
    next(error as Error);
  }
});

// Middleware de cascade pour la suppression d'un utilisateur
userSchema.pre("deleteOne", { document: true, query: false }, async function (next) {
  try {
    const userId = this._id;
    
    // Supprimer les Employee liés
    const Employee = mongoose.model("Employee");
    await Employee.deleteMany({ userId });
    
    // Supprimer les VacationRequest où l'utilisateur est requestedBy ou updatedBy
    const VacationRequest = mongoose.model("VacationRequest");
    await VacationRequest.deleteMany({ 
      $or: [
        { requestedBy: userId },
        { updatedBy: userId }
      ]
    });
    
    // Supprimer les WeeklySchedule où l'utilisateur est updatedBy
    const WeeklySchedule = mongoose.model("WeeklySchedule");
    await WeeklySchedule.deleteMany({ updatedBy: userId });
    
    // Retirer l'utilisateur des Team.managerIds
    const Team = mongoose.model("Team");
    await Team.updateMany(
      { managerIds: userId },
      { $pull: { managerIds: userId } }
    );
    
    // Supprimer les Task liées via Employee
    const Task = mongoose.model("Task");
    const employees = await Employee.find({ userId });
    const employeeIds = employees.map(emp => emp._id);
    await Task.deleteMany({ employeeId: { $in: employeeIds } });
    
    // Supprimer les Incident liés via Employee
    const Incident = mongoose.model("Incident");
    await Incident.deleteMany({ employeeId: { $in: employeeIds } });
    
    console.log(`🗑️ Cascade suppression User ${userId} terminée`);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Middleware de cascade pour findOneAndDelete
userSchema.pre("findOneAndDelete", async function (next) {
  try {
    const user = await this.model.findOne(this.getQuery());
    if (!user) return next();
    
    const userId = user._id;
    
    // Même logique que deleteOne
    const Employee = mongoose.model("Employee");
    await Employee.deleteMany({ userId });
    
    const VacationRequest = mongoose.model("VacationRequest");
    await VacationRequest.deleteMany({ 
      $or: [
        { requestedBy: userId },
        { updatedBy: userId }
      ]
    });
    
    const WeeklySchedule = mongoose.model("WeeklySchedule");
    await WeeklySchedule.deleteMany({ updatedBy: userId });
    
    const Team = mongoose.model("Team");
    await Team.updateMany(
      { managerIds: userId },
      { $pull: { managerIds: userId } }
    );
    
    const employees = await Employee.find({ userId });
    const employeeIds = employees.map(emp => emp._id);
    
    const Task = mongoose.model("Task");
    await Task.deleteMany({ employeeId: { $in: employeeIds } });
    
    const Incident = mongoose.model("Incident");
    await Incident.deleteMany({ employeeId: { $in: employeeIds } });
    
    console.log(`🗑️ Cascade suppression User ${userId} terminée`);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Méthode pour comparer le mot de passe
userSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  try {
    // Si l'utilisateur n'a pas de mot de passe (OAuth)
    if (!this.password) return false;

    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error("Erreur lors de la comparaison du mot de passe");
  }
};

// Création du modèle
export const User = mongoose.model<UserDocument, UserModel>("User", userSchema);

export default User;
