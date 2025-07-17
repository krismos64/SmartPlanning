export interface PlanningConstraints {
  teamId: string;
  weekNumber: number;
  year: number;
  employees: EmployeeConstraint[];
  companyConstraints: CompanyConstraints;
  preferences: PlanningPreferences;
}

export interface EmployeeConstraint {
  id: string;
  name: string;
  email: string;
  restDay?: string;
  weeklyHours?: number;
  preferredHours?: string[];
  exceptions?: EmployeeException[];
  allowSplitShifts?: boolean;
}

export interface EmployeeException {
  date: string;
  reason: string;
  type: 'unavailable' | 'reduced' | 'training' | 'sick' | 'vacation';
}

export interface CompanyConstraints {
  openingDays: string[];
  openingHours: OpeningHour[];
  minStaffSimultaneously?: number;
  roleConstraints?: RoleConstraint[];
}

export interface OpeningHour {
  day: string;
  hours: string[];
}

export interface RoleConstraint {
  role: string;
  requiredAt: string[];
}

export interface PlanningPreferences {
  favorSplit?: boolean;
  favorUniformity?: boolean;
  balanceWorkload?: boolean;
  prioritizeEmployeePreferences?: boolean;
}

export interface GeneratedSchedule {
  employeeId: string;
  employeeName: string;
  day: string;
  slots: TimeSlot[];
  totalHours: number;
}

export interface TimeSlot {
  start: string;
  end: string;
  duration: number;
}

import React from 'react';

export interface PlanningWizardStep {
  id: number;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  isCompleted: boolean;
  isActive: boolean;
}

export interface AIGenerationResponse {
  success: boolean;
  schedule: GeneratedSchedule[];
  message?: string;
  error?: string;
  processingTime?: number;
}