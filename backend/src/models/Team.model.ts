import mongoose, { Document, Schema } from "mongoose";

// Interface pour le document Team
export interface ITeam extends Document {
  name: string;
  managerIds: mongoose.Types.ObjectId[];
  companyId: mongoose.Types.ObjectId;
}

// Définition du schéma principal Team
const teamSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    managerIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },
  },
  { timestamps: true }
);

// Création du modèle
export const TeamModel = mongoose.model<ITeam>("Team", teamSchema);

export default TeamModel;
