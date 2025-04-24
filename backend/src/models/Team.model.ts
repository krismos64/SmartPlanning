import mongoose, { Document, Schema } from "mongoose";

export interface ITeam extends Document {
  name: string;
  managerIds: mongoose.Types.ObjectId[];
  employeeIds: mongoose.Types.ObjectId[];
  companyId: mongoose.Types.ObjectId;
}

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
    employeeIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Employee",
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

export const TeamModel = mongoose.model<ITeam>("Team", teamSchema);
export default TeamModel;
