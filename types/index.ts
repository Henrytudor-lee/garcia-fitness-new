// User types
export interface User {
  id: number;
  email: string;
  name: string;
  avatar?: string;
  role?: string;
  favor_exer_ids?: number[];
  worked_exer_ids?: number[];
}

// Session types
export interface Session {
  id: number;
  user_id: number;
  start_time: string;
  end_time?: string;
  is_done?: boolean;
  status?: string;
  notes?: string;
}

// Exercise types
export interface Exercise {
  id: number;
  session_id: number;
  sequence: number;
  reps: number;
  weight: number;
  weight_unit: string;
  create_time: string;
  update_time?: string;
  notes?: string;
  exercise_id: number;
  name: string;
  user_id: number;
}

// Exercise Library types
export interface ExerciseModel {
  id: number;
  name: string;
  image_name: string;
  video_file?: string;
  equipment_id: number;
  body_part_id: number;
  exercise_type: string;
  is_favorite?: boolean;
}

// Equipment
export interface Equipment {
  id: number;
  name: string;
}

// Muscle group
export interface Muscle {
  id: number;
  name: string;
  icon?: string;
}

// Stats types
export interface ExerciseHistoryRecord {
  weight: number;
  reps: number;
  create_time: string;
}

export interface ExerciseStats {
  exercise_id: number;
  name: string;
  records: ExerciseHistoryRecord[];
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  token?: string;
}
