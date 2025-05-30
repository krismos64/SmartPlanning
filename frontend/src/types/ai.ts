/**
 * Types pour le système IA conversationnel de génération de plannings
 */

export interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export interface ConversationResponse {
  message: string;
  questions?: string[];
  suggestions?: string[];
  needsMoreInfo: boolean;
  readyToGenerate: boolean;
  conversationHistory: ConversationMessage[];
}

export interface AIGenerationRequest {
  teamId: string;
  year: number;
  weekNumber: number;
  constraints: string[];
  notes?: string;
}

export interface EnhancedAIGenerationRequest extends AIGenerationRequest {
  conversationSummary?: string;
  additionalRequirements?: string;
}

export interface ConversationRequest {
  teamId: string;
  year: number;
  weekNumber: number;
  message: string;
  conversationHistory?: ConversationMessage[];
}

export interface GeneratedScheduleData {
  [day: string]: { [employeeName: string]: string[] };
}

export interface AIGenerationResponse {
  teamId: string;
  teamName: string;
  weekNumber: number;
  year: number;
  employeesCount: number;
  totalContractHours?: number;
  generatedSchedules: Array<{
    id: string;
    employeeId: string;
    status: string;
    timestamp: Date;
  }>;
  rawScheduleData: GeneratedScheduleData;
  enhanced?: boolean;
}

export interface AIGenerationMode {
  type: "quick" | "assisted";
  label: string;
  description: string;
  icon: string;
}

export interface TeamInfo {
  name: string;
  employeeCount: number;
  week: string;
}
