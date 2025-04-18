import mongoose, { Document, Model, Schema } from "mongoose";

// Définition du type pour l'historique de connexion
interface LoginRecord {
  ip: string;
  date: Date;
  status: string;
}

// Définition des rôles d'utilisateur
enum UserRole {
  ADMIN = "admin",
  DIRECTEUR = "directeur",
  MANAGER = "manager",
  EMPLOYE = "employé",
}

// Interface pour le document User
export interface IUser {
  email: string;
  password?: string;
  googleId?: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  photoUrl?: string;
  isActive: boolean;
  loginHistory: LoginRecord[];
  emailVerified: boolean;
  emailVerificationToken?: string;
  emailVerificationExpires?: Date;
  bio?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// Interface pour le document User avec les méthodes de Mongoose
export interface UserDocument extends IUser, Document {}

// Définition du schéma Mongoose
const loginHistorySchema = new Schema<LoginRecord>(
  {
    ip: { type: String, required: true },
    date: { type: Date, required: true, default: Date.now },
    status: { type: String, required: true },
  },
  { _id: false }
);

const userSchema = new Schema<UserDocument>(
  {
    email: {
      type: String,
      required: [true, "L'email est requis"],
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: function (this: UserDocument) {
        return this.googleId === undefined;
      },
    },
    googleId: {
      type: String,
    },
    role: {
      type: String,
      enum: Object.values(UserRole),
      required: [true, "Le rôle est requis"],
    },
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
    photoUrl: {
      type: String,
    },
    isActive: {
      type: Boolean,
      required: true,
      default: true,
    },
    loginHistory: {
      type: [loginHistorySchema],
      default: [],
    },
    emailVerified: {
      type: Boolean,
      required: true,
      default: false,
    },
    emailVerificationToken: {
      type: String,
    },
    emailVerificationExpires: {
      type: Date,
    },
    bio: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Ajout d'une méthode pre-save pour limiter l'historique de connexion à 10 éléments
userSchema.pre<UserDocument>("save", function (next) {
  // Si l'historique de connexion dépasse 10 éléments, on garde seulement les 10 derniers
  if (this.loginHistory.length > 10) {
    this.loginHistory = this.loginHistory.slice(-10);
  }
  next();
});

// Création du modèle
export const UserModel: Model<UserDocument> = mongoose.model<UserDocument>(
  "User",
  userSchema
);

export default UserModel;
