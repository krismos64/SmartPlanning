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

// Middleware de validation des références avant sauvegarde
teamSchema.pre<ITeam>("save", async function (next) {
  try {
    // Vérifier que la company existe
    if (this.companyId) {
      const Company = mongoose.model("Company");
      const company = await Company.findById(this.companyId);
      if (!company) {
        return next(new Error(`Company avec l'ID ${this.companyId} n'existe pas`));
      }
    }

    // Vérifier que tous les managers existent
    if (this.managerIds && this.managerIds.length > 0) {
      const User = mongoose.model("User");
      for (const managerId of this.managerIds) {
        const user = await User.findById(managerId);
        if (!user) {
          return next(new Error(`Manager avec l'ID ${managerId} n'existe pas`));
        }
      }
    }

    // Vérifier que tous les employés existent
    if (this.employeeIds && this.employeeIds.length > 0) {
      const Employee = mongoose.model("Employee");
      for (const employeeId of this.employeeIds) {
        const employee = await Employee.findById(employeeId);
        if (!employee) {
          return next(new Error(`Employee avec l'ID ${employeeId} n'existe pas`));
        }
      }
    }

    next();
  } catch (error) {
    next(error as Error);
  }
});

// Middleware de cascade pour la suppression d'une équipe
teamSchema.pre("deleteOne", { document: true, query: false }, async function (next) {
  try {
    const teamId = this._id;
    
    // Mettre à jour les Employee pour retirer le teamId
    const Employee = mongoose.model("Employee");
    await Employee.updateMany(
      { teamId },
      { $unset: { teamId: 1 } }
    );
    
    // Retirer le teamId des User.teamIds
    const User = mongoose.model("User");
    await User.updateMany(
      { teamIds: teamId },
      { $pull: { teamIds: teamId } }
    );
    
    // Supprimer les WeeklySchedule liés aux employés de cette équipe
    const employees = await Employee.find({ teamId });
    const employeeIds = employees.map(emp => emp._id);
    
    const WeeklySchedule = mongoose.model("WeeklySchedule");
    await WeeklySchedule.deleteMany({ employeeId: { $in: employeeIds } });
    
    // Supprimer les VacationRequest liés aux employés de cette équipe
    const VacationRequest = mongoose.model("VacationRequest");
    await VacationRequest.deleteMany({ employeeId: { $in: employeeIds } });
    
    // Supprimer les Task liées aux employés de cette équipe
    const Task = mongoose.model("Task");
    await Task.deleteMany({ employeeId: { $in: employeeIds } });
    
    // Supprimer les Incident liés aux employés de cette équipe
    const Incident = mongoose.model("Incident");
    await Incident.deleteMany({ employeeId: { $in: employeeIds } });
    
    console.log(`🗑️ Cascade suppression Team ${teamId} terminée`);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Middleware de cascade pour findOneAndDelete
teamSchema.pre("findOneAndDelete", async function (next) {
  try {
    const team = await this.model.findOne(this.getQuery());
    if (!team) return next();
    
    const teamId = team._id;
    
    // Même logique que deleteOne
    const Employee = mongoose.model("Employee");
    const employees = await Employee.find({ teamId });
    const employeeIds = employees.map(emp => emp._id);
    
    await Employee.updateMany(
      { teamId },
      { $unset: { teamId: 1 } }
    );
    
    const User = mongoose.model("User");
    await User.updateMany(
      { teamIds: teamId },
      { $pull: { teamIds: teamId } }
    );
    
    const WeeklySchedule = mongoose.model("WeeklySchedule");
    await WeeklySchedule.deleteMany({ employeeId: { $in: employeeIds } });
    
    const VacationRequest = mongoose.model("VacationRequest");
    await VacationRequest.deleteMany({ employeeId: { $in: employeeIds } });
    
    const Task = mongoose.model("Task");
    await Task.deleteMany({ employeeId: { $in: employeeIds } });
    
    const Incident = mongoose.model("Incident");
    await Incident.deleteMany({ employeeId: { $in: employeeIds } });
    
    console.log(`🗑️ Cascade suppression Team ${teamId} terminée`);
    next();
  } catch (error) {
    next(error as Error);
  }
});

export const TeamModel = mongoose.model<ITeam>("Team", teamSchema);
export default TeamModel;
