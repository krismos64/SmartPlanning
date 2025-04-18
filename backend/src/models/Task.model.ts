import mongoose, { Document, Model, Schema } from "mongoose";

// Définition du statut de la tâche
enum TaskStatus {
  PENDING = "pending",
  IN_PROGRESS = "inProgress",
  COMPLETED = "completed",
}

// Interface pour le document Task
export interface ITask {
  employeeId: mongoose.Types.ObjectId;
  title: string;
  dueDate?: Date;
  status?: TaskStatus;
  createdAt?: Date;
  updatedAt?: Date;
}

// Interface pour le document Task avec les méthodes de Mongoose
export interface TaskDocument extends ITask, Document {}

// Définition du schéma principal Task
const taskSchema = new Schema<TaskDocument>(
  {
    employeeId: {
      type: Schema.Types.ObjectId,
      ref: "Employee",
      required: [true, "L'identifiant de l'employé est requis"],
    },
    title: {
      type: String,
      required: [true, "Le titre de la tâche est requis"],
      trim: true,
    },
    dueDate: {
      type: Date,
    },
    status: {
      type: String,
      enum: Object.values(TaskStatus),
      default: TaskStatus.PENDING,
    },
  },
  {
    timestamps: true,
  }
);

// Index pour faciliter la recherche des tâches par employé
taskSchema.index({ employeeId: 1 });

// Création du modèle
export const TaskModel: Model<TaskDocument> = mongoose.model<TaskDocument>(
  "Task",
  taskSchema
);

export default TaskModel;
