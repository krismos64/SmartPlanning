import mongoose, { Document, Schema } from "mongoose";

// Type pour les plans d'abonnement
export type CompanyPlan = "free" | "standard" | "premium" | "enterprise";

// Interface définissant la structure d'une entreprise
export interface ICompany extends Document {
  name: string;
  logoUrl?: string;
  address?: string;
  postalCode?: string;
  city?: string;
  size?: number;
  plan: CompanyPlan;
  createdAt: Date;
  updatedAt: Date;
}

// Schéma Mongoose pour les entreprises
const companySchema = new Schema<ICompany>(
  {
    name: {
      type: String,
      required: [true, "Le nom de l'entreprise est requis"],
      trim: true,
      unique: true, // Garantir l'unicité du nom d'entreprise
    },
    logoUrl: {
      type: String,
      default: null,
    },
    address: {
      type: String,
      trim: true,
    },
    postalCode: {
      type: String,
      trim: true,
      validate: {
        validator: function(v: string) {
          return !v || /^\d{5}$/.test(v);
        },
        message: "Le code postal doit contenir 5 chiffres"
      }
    },
    city: {
      type: String,
      trim: true,
    },
    size: {
      type: Number,
      min: [1, "La taille de l'entreprise doit être au moins 1"],
      max: [10000, "La taille de l'entreprise ne peut pas dépasser 10000"],
    },
    plan: {
      type: String,
      enum: ["free", "standard", "premium", "enterprise"],
      default: "free",
    },
  },
  {
    timestamps: true, // Ajoute automatiquement createdAt et updatedAt
  }
);

// Création d'un index sur le nom pour optimiser les recherches
companySchema.index({ name: 1 });

// Middleware de cascade pour la suppression d'une entreprise
companySchema.pre("deleteOne", { document: true, query: false }, async function (next) {
  try {
    const companyId = this._id;
    
    // Supprimer tous les User liés à cette entreprise
    const User = mongoose.model("User");
    await User.deleteMany({ companyId });
    
    // Supprimer tous les Employee liés à cette entreprise
    const Employee = mongoose.model("Employee");
    await Employee.deleteMany({ companyId });
    
    // Supprimer toutes les Team liées à cette entreprise
    const Team = mongoose.model("Team");
    await Team.deleteMany({ companyId });
    
    // Supprimer tous les WeeklySchedule liés via Employee
    const employees = await Employee.find({ companyId });
    const employeeIds = employees.map(emp => emp._id);
    
    const WeeklySchedule = mongoose.model("WeeklySchedule");
    await WeeklySchedule.deleteMany({ employeeId: { $in: employeeIds } });
    
    // Supprimer toutes les VacationRequest liées via Employee
    const VacationRequest = mongoose.model("VacationRequest");
    await VacationRequest.deleteMany({ employeeId: { $in: employeeIds } });
    
    // Supprimer toutes les Task liées via Employee
    const Task = mongoose.model("Task");
    await Task.deleteMany({ employeeId: { $in: employeeIds } });
    
    // Supprimer tous les Incident liés via Employee
    const Incident = mongoose.model("Incident");
    await Incident.deleteMany({ employeeId: { $in: employeeIds } });
    
    // Supprimer les ChatbotSettings liés à cette entreprise
    const ChatbotSettings = mongoose.model("ChatbotSettings");
    await ChatbotSettings.deleteMany({ companyId });
    
    // Supprimer les abonnements Stripe liés à cette entreprise
    const Subscription = mongoose.model("Subscription");
    await Subscription.deleteMany({ companyId });
    
    // Supprimer les paiements liés à cette entreprise
    const Payment = mongoose.model("Payment");
    await Payment.deleteMany({ companyId });
    
    console.log(`🗑️ Cascade suppression Company ${companyId} terminée`);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Middleware de cascade pour findOneAndDelete
companySchema.pre("findOneAndDelete", async function (next) {
  try {
    const company = await this.model.findOne(this.getQuery());
    if (!company) return next();
    
    const companyId = company._id;
    
    // Même logique que deleteOne
    const User = mongoose.model("User");
    await User.deleteMany({ companyId });
    
    const Employee = mongoose.model("Employee");
    const employees = await Employee.find({ companyId });
    const employeeIds = employees.map(emp => emp._id);
    await Employee.deleteMany({ companyId });
    
    const Team = mongoose.model("Team");
    await Team.deleteMany({ companyId });
    
    const WeeklySchedule = mongoose.model("WeeklySchedule");
    await WeeklySchedule.deleteMany({ employeeId: { $in: employeeIds } });
    
    const VacationRequest = mongoose.model("VacationRequest");
    await VacationRequest.deleteMany({ employeeId: { $in: employeeIds } });
    
    const Task = mongoose.model("Task");
    await Task.deleteMany({ employeeId: { $in: employeeIds } });
    
    const Incident = mongoose.model("Incident");
    await Incident.deleteMany({ employeeId: { $in: employeeIds } });
    
    const ChatbotSettings = mongoose.model("ChatbotSettings");
    await ChatbotSettings.deleteMany({ companyId });
    
    // Supprimer les abonnements Stripe liés à cette entreprise
    const Subscription = mongoose.model("Subscription");
    await Subscription.deleteMany({ companyId });
    
    // Supprimer les paiements liés à cette entreprise
    const Payment = mongoose.model("Payment");
    await Payment.deleteMany({ companyId });
    
    console.log(`🗑️ Cascade suppression Company ${companyId} terminée`);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Modèle Mongoose créé à partir du schéma
export const Company = mongoose.model<ICompany>("Company", companySchema);

export default Company;
