import mongoose, { Document, Model, Schema } from "mongoose";

// Interface pour le document Event
export interface IEvent {
  companyId: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  date: Date;
  location?: string;
  participants?: mongoose.Types.ObjectId[];
  createdBy: mongoose.Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

// Interface pour le document Event avec les méthodes de Mongoose
export interface EventDocument extends IEvent, Document {}

// Définition du schéma principal Event
const eventSchema = new Schema<EventDocument>(
  {
    companyId: {
      type: Schema.Types.ObjectId,
      ref: "Company",
      required: [true, "L'identifiant de l'entreprise est requis"],
    },
    title: {
      type: String,
      required: [true, "Le titre de l'événement est requis"],
      trim: true,
      validate: {
        validator: function (v: string) {
          return v.length > 0;
        },
        message: "Le titre ne peut pas être vide",
      },
    },
    description: {
      type: String,
      trim: true,
    },
    date: {
      type: Date,
      required: [true, "La date de l'événement est requise"],
    },
    location: {
      type: String,
      trim: true,
    },
    participants: {
      type: [Schema.Types.ObjectId],
      ref: "Employee",
      default: [],
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [
        true,
        "L'identifiant de l'utilisateur ayant créé l'événement est requis",
      ],
    },
  },
  {
    timestamps: true,
  }
);

// Index pour faciliter la recherche des événements par entreprise et date
eventSchema.index({ companyId: 1, date: 1 });

// Création du modèle
export const EventModel: Model<EventDocument> = mongoose.model<EventDocument>(
  "Event",
  eventSchema
);

export default EventModel;
