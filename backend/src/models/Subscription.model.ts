import mongoose, { Document, Schema } from "mongoose";

// Status possibles d'un abonnement Stripe
export type SubscriptionStatus = 
  | "incomplete" 
  | "incomplete_expired" 
  | "trialing" 
  | "active" 
  | "past_due" 
  | "canceled" 
  | "unpaid"
  | "paused";

// Plans disponibles dans SmartPlanning
export type SubscriptionPlan = "free" | "standard" | "premium" | "enterprise";

// Interface définissant la structure d'un abonnement
export interface ISubscription extends Document {
  companyId: mongoose.Types.ObjectId;
  stripeCustomerId: string;
  stripeSubscriptionId?: string;
  stripePriceId?: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  currentPeriodStart?: Date;
  currentPeriodEnd?: Date;
  cancelAtPeriodEnd: boolean;
  canceledAt?: Date;
  trialStart?: Date;
  trialEnd?: Date;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

// Schéma Mongoose pour les abonnements
const subscriptionSchema = new Schema<ISubscription>(
  {
    companyId: {
      type: Schema.Types.ObjectId,
      ref: "Company",
      required: [true, "L'ID de l'entreprise est requis"],
      index: true,
    },
    stripeCustomerId: {
      type: String,
      required: [true, "L'ID client Stripe est requis"],
      unique: true,
      index: true,
    },
    stripeSubscriptionId: {
      type: String,
      unique: true,
      sparse: true, // Permet null/undefined
      index: true,
    },
    stripePriceId: {
      type: String,
      index: true,
    },
    plan: {
      type: String,
      enum: ["free", "standard", "premium", "enterprise"],
      required: [true, "Le plan est requis"],
      default: "free",
    },
    status: {
      type: String,
      enum: [
        "incomplete",
        "incomplete_expired", 
        "trialing",
        "active",
        "past_due",
        "canceled",
        "unpaid",
        "paused"
      ],
      required: [true, "Le statut est requis"],
      default: "active",
    },
    currentPeriodStart: {
      type: Date,
      index: true,
    },
    currentPeriodEnd: {
      type: Date,
      index: true,
    },
    cancelAtPeriodEnd: {
      type: Boolean,
      default: false,
    },
    canceledAt: {
      type: Date,
    },
    trialStart: {
      type: Date,
    },
    trialEnd: {
      type: Date,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
    collection: "subscriptions",
  }
);

// Index composé pour optimiser les requêtes
subscriptionSchema.index({ companyId: 1, status: 1 });
subscriptionSchema.index({ stripeCustomerId: 1, status: 1 });

// Méthodes d'instance utiles
subscriptionSchema.methods.isActive = function(): boolean {
  return this.status === "active" || this.status === "trialing";
};

subscriptionSchema.methods.isExpired = function(): boolean {
  if (!this.currentPeriodEnd) return false;
  return new Date() > this.currentPeriodEnd;
};

subscriptionSchema.methods.daysUntilRenewal = function(): number | null {
  if (!this.currentPeriodEnd) return null;
  const diff = this.currentPeriodEnd.getTime() - new Date().getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

// Middleware pre-save pour validation
subscriptionSchema.pre("save", function(next) {
  // Si plan gratuit, pas besoin de stripeSubscriptionId
  if (this.plan === "free") {
    this.stripeSubscriptionId = undefined;
    this.stripePriceId = undefined;
  }
  
  // Validation des dates de période
  if (this.currentPeriodStart && this.currentPeriodEnd) {
    if (this.currentPeriodStart >= this.currentPeriodEnd) {
      return next(new Error("La date de début doit être antérieure à la date de fin"));
    }
  }
  
  next();
});

// Modèle Mongoose créé à partir du schéma
export const Subscription = mongoose.model<ISubscription>("Subscription", subscriptionSchema);

export default Subscription;