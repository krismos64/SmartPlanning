import mongoose, { Document, Model, Schema } from "mongoose";

// Définition des types d'actions du chatbot
enum ChatbotActionType {
  PLANNING_GENERATION = "planning_generation",
  VACATION_REQUEST = "vacation_request",
  INFO_QUERY = "info_query",
}

// Interface pour le document ChatbotInteraction
export interface IChatbotInteraction {
  companyId: mongoose.Types.ObjectId;
  userId?: mongoose.Types.ObjectId;
  action: ChatbotActionType;
  input: string;
  output?: string;
  timestamp: Date;
}

// Interface pour le document ChatbotInteraction avec les méthodes de Mongoose
export interface ChatbotInteractionDocument
  extends IChatbotInteraction,
    Document {}

// Définition du schéma principal ChatbotInteraction
const chatbotInteractionSchema = new Schema<ChatbotInteractionDocument>(
  {
    companyId: {
      type: Schema.Types.ObjectId,
      ref: "Company",
      required: [true, "L'identifiant de l'entreprise est requis"],
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    action: {
      type: String,
      enum: Object.values(ChatbotActionType),
      required: [true, "Le type d'action est requis"],
    },
    input: {
      type: String,
      required: [true, "L'entrée utilisateur est requise"],
      trim: true,
    },
    output: {
      type: String,
      trim: true,
    },
    timestamp: {
      type: Date,
      required: true,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Index pour rechercher les interactions par entreprise et date
chatbotInteractionSchema.index({ companyId: 1, timestamp: -1 });

// Index supplémentaire pour les requêtes par utilisateur
chatbotInteractionSchema.index({ userId: 1, timestamp: -1 });

// Création du modèle
export const ChatbotInteractionModel: Model<ChatbotInteractionDocument> =
  mongoose.model<ChatbotInteractionDocument>(
    "ChatbotInteraction",
    chatbotInteractionSchema
  );

export default ChatbotInteractionModel;
