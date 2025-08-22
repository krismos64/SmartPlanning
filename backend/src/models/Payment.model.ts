import mongoose, { Document, Schema } from "mongoose";

// Status des paiements
export type PaymentStatus = 
  | "pending"
  | "succeeded" 
  | "failed"
  | "canceled"
  | "refunded"
  | "partially_refunded";

// Types de paiements
export type PaymentType = 
  | "subscription"
  | "setup"
  | "invoice"
  | "one_time";

// Interface définissant la structure d'un paiement
export interface IPayment extends Document {
  companyId: mongoose.Types.ObjectId;
  subscriptionId?: mongoose.Types.ObjectId;
  stripePaymentIntentId: string;
  stripeCustomerId: string;
  amount: number; // Montant en centimes
  currency: string;
  status: PaymentStatus;
  type: PaymentType;
  description?: string;
  receiptUrl?: string;
  failureReason?: string;
  refundedAmount?: number; // Montant remboursé en centimes
  metadata?: Record<string, any>;
  stripeCreatedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Schéma Mongoose pour les paiements
const paymentSchema = new Schema<IPayment>(
  {
    companyId: {
      type: Schema.Types.ObjectId,
      ref: "Company",
      required: [true, "L'ID de l'entreprise est requis"],
      index: true,
    },
    subscriptionId: {
      type: Schema.Types.ObjectId,
      ref: "Subscription",
      index: true,
    },
    stripePaymentIntentId: {
      type: String,
      required: [true, "L'ID PaymentIntent Stripe est requis"],
      unique: true,
      index: true,
    },
    stripeCustomerId: {
      type: String,
      required: [true, "L'ID client Stripe est requis"],
      index: true,
    },
    amount: {
      type: Number,
      required: [true, "Le montant est requis"],
      min: [0, "Le montant doit être positif"],
    },
    currency: {
      type: String,
      required: [true, "La devise est requise"],
      default: "eur",
      lowercase: true,
    },
    status: {
      type: String,
      enum: [
        "pending",
        "succeeded", 
        "failed",
        "canceled",
        "refunded",
        "partially_refunded"
      ],
      required: [true, "Le statut est requis"],
      default: "pending",
    },
    type: {
      type: String,
      enum: ["subscription", "setup", "invoice", "one_time"],
      required: [true, "Le type de paiement est requis"],
      default: "subscription",
    },
    description: {
      type: String,
      trim: true,
    },
    receiptUrl: {
      type: String,
    },
    failureReason: {
      type: String,
      trim: true,
    },
    refundedAmount: {
      type: Number,
      default: 0,
      min: [0, "Le montant remboursé doit être positif"],
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
    stripeCreatedAt: {
      type: Date,
      required: [true, "La date de création Stripe est requise"],
    },
  },
  {
    timestamps: true,
    collection: "payments",
  }
);

// Index composés pour optimiser les requêtes
paymentSchema.index({ companyId: 1, status: 1 });
paymentSchema.index({ companyId: 1, createdAt: -1 });
paymentSchema.index({ stripeCustomerId: 1, createdAt: -1 });
paymentSchema.index({ subscriptionId: 1, createdAt: -1 });

// Méthodes d'instance utiles
paymentSchema.methods.isSuccessful = function(): boolean {
  return this.status === "succeeded";
};

paymentSchema.methods.isFailed = function(): boolean {
  return this.status === "failed" || this.status === "canceled";
};

paymentSchema.methods.isRefunded = function(): boolean {
  return this.status === "refunded" || this.status === "partially_refunded";
};

paymentSchema.methods.getAmountInEuros = function(): number {
  return this.amount / 100;
};

paymentSchema.methods.getRefundedAmountInEuros = function(): number {
  return (this.refundedAmount || 0) / 100;
};

// Méthodes statiques pour les requêtes
paymentSchema.statics.findByCompany = function(companyId: string) {
  return this.find({ companyId }).sort({ createdAt: -1 });
};

paymentSchema.statics.findSuccessfulByCompany = function(companyId: string) {
  return this.find({ 
    companyId, 
    status: "succeeded" 
  }).sort({ createdAt: -1 });
};

paymentSchema.statics.getTotalRevenue = async function(companyId?: string) {
  const match = companyId ? { companyId, status: "succeeded" } : { status: "succeeded" };
  
  const result = await this.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        totalAmount: { $sum: "$amount" },
        refundedAmount: { $sum: "$refundedAmount" },
        count: { $sum: 1 }
      }
    }
  ]);

  return result[0] || { totalAmount: 0, refundedAmount: 0, count: 0 };
};

// Interface pour les méthodes statiques
interface IPaymentModel extends mongoose.Model<IPayment> {
  findByCompany(companyId: string): Promise<IPayment[]>;
  findSuccessfulByCompany(companyId: string): Promise<IPayment[]>;
  getTotalRevenue(companyId?: string): Promise<{
    totalAmount: number;
    refundedAmount: number;
    count: number;
  }>;
}

// Middleware pre-save pour validation
paymentSchema.pre("save", function(next) {
  // Validation du montant remboursé
  if (this.refundedAmount && this.refundedAmount > this.amount) {
    return next(new Error("Le montant remboursé ne peut pas être supérieur au montant initial"));
  }
  
  // Mise à jour automatique du statut si montant entièrement remboursé
  if (this.refundedAmount === this.amount && this.refundedAmount > 0) {
    this.status = "refunded";
  } else if (this.refundedAmount && this.refundedAmount > 0 && this.refundedAmount < this.amount) {
    this.status = "partially_refunded";
  }
  
  next();
});

// Modèle Mongoose créé à partir du schéma
export const Payment = mongoose.model<IPayment, IPaymentModel>("Payment", paymentSchema);

export default Payment;