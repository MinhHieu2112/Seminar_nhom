export type AIFeedbackDto = {
  id: string;
  exercise_id: string;
  language_id: number;
  code_hash: string;
  feedback_level: number;
  content: string;
  token_consumed?: number | null;
  usage_count?: number | null;
  created_at?: string | null;
};

