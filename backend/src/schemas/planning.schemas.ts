import { z } from 'zod';

export const employeeExceptionSchema = z.object({
  date: z.string().min(1, 'Date is required'),
  reason: z.string().min(1, 'Reason is required'),
  type: z.enum(['unavailable', 'reduced', 'training', 'sick', 'vacation'])
});

export const employeeConstraintSchema = z.object({
  id: z.string().min(1, 'Employee ID is required'),
  name: z.string().min(1, 'Employee name is required'),
  email: z.string().email('Valid email is required'),
  restDay: z.enum(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']).optional(),
  weeklyHours: z.number().min(10, 'Minimum 10 hours per week').max(60, 'Maximum 60 hours per week').optional(),
  preferredHours: z.array(z.string()).optional(),
  exceptions: z.array(employeeExceptionSchema).optional(),
  allowSplitShifts: z.boolean().optional()
});

export const openingHourSchema = z.object({
  day: z.enum(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']),
  hours: z.array(z.string())
});

export const roleConstraintSchema = z.object({
  role: z.string().min(1, 'Role is required'),
  requiredAt: z.array(z.string())
});

export const companyConstraintsSchema = z.object({
  openingDays: z.array(z.enum(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'])),
  openingHours: z.array(openingHourSchema),
  minStaffSimultaneously: z.number().min(1, 'Minimum 1 staff member required').optional(),
  roleConstraints: z.array(roleConstraintSchema).optional(),
  // Nouvelles contraintes d'horaires
  dailyOpeningTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)').optional(),
  dailyClosingTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)').optional(),
  maxHoursPerDay: z.number().min(4, 'Minimum 4 hours per day').max(12, 'Maximum 12 hours per day').optional(),
  minHoursPerDay: z.number().min(1, 'Minimum 1 hour per day').max(12, 'Maximum 12 hours per day').optional(),
  lunchBreakDuration: z.number().min(30, 'Minimum 30 minutes break').max(120, 'Maximum 120 minutes break').optional(),
  mandatoryLunchBreak: z.boolean().optional()
});

export const planningPreferencesSchema = z.object({
  favorSplit: z.boolean().optional(),
  favorUniformity: z.boolean().optional(),
  balanceWorkload: z.boolean().optional(),
  prioritizeEmployeePreferences: z.boolean().optional()
});

export const planningConstraintsSchema = z.object({
  teamId: z.string().min(1, 'Team ID is required'),
  weekNumber: z.number().min(1, 'Week number must be at least 1').max(53, 'Week number cannot exceed 53'),
  year: z.number().min(2024, 'Year must be at least 2024').max(2030, 'Year cannot exceed 2030'),
  employees: z.array(employeeConstraintSchema).min(1, 'At least one employee is required'),
  companyConstraints: companyConstraintsSchema,
  preferences: planningPreferencesSchema
});

export type PlanningConstraints = z.infer<typeof planningConstraintsSchema>;
export type EmployeeConstraint = z.infer<typeof employeeConstraintSchema>;
export type CompanyConstraints = z.infer<typeof companyConstraintsSchema>;
export type PlanningPreferences = z.infer<typeof planningPreferencesSchema>;