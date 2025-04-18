import mongoose, { Document, Model, Schema } from "mongoose";

// Interface pour le document ChatbotSettings
export interface IChatbotSettings {
  companyId: mongoose.Types.ObjectId;
  enabled: boolean;
  monthlyQueriesLimit: number;
  monthlySchedulesLimit: number;
  resetDate: Date;
}

// Interface pour le document ChatbotSettings avec les méthodes de Mongoose
export interface ChatbotSettingsDocument extends IChatbotSettings, Document {}

// Définition du schéma principal ChatbotSettings
const chatbotSettingsSchema = new Schema<ChatbotSettingsDocument>(
  {
    companyId: {
      type: Schema.Types.ObjectId,
      ref: "Company",
      required: [true, "L'identifiant de l'entreprise est requis"],
      unique: true,
    },
    enabled: {
      type: Boolean,
      required: true,
      default: true,
    },
    monthlyQueriesLimit: {
      type: Number,
      required: [true, "La limite mensuelle de requêtes est requise"],
      min: [0, "La limite mensuelle de requêtes doit être un nombre positif"],
    },
    monthlySchedulesLimit: {
      type: Number,
      required: [true, "La limite mensuelle de plannings générés est requise"],
      min: [
        0,
        "La limite mensuelle de plannings générés doit être un nombre positif",
      ],
    },
    resetDate: {
      type: Date,
      required: [true, "La date de réinitialisation des compteurs est requise"],
    },
  },
  {
    timestamps: true,
  }
);

// Index unique sur companyId pour garantir un seul document par entreprise
chatbotSettingsSchema.index({ companyId: 1 }, { unique: true });

// Création du modèle
export const ChatbotSettingsModel: Model<ChatbotSettingsDocument> =
  mongoose.model<ChatbotSettingsDocument>(
    "ChatbotSettings",
    chatbotSettingsSchema
  );

export default ChatbotSettingsModel;
