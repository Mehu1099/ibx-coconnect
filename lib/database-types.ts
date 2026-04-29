// Row shapes for the Supabase tables we read/write. Keep in sync with
// the schema in the dashboard — adding a column means updating the
// corresponding interface here.

export interface DatabaseAnnotation {
  id: string;
  location_id: string;
  type: "sticky" | "sketch" | "concern";
  x_position: number;
  y_position: number;
  content: string | null;
  user_id: string | null;
  anonymous_session_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface DatabaseConcern {
  id: string;
  location_id: string;
  x_position: number;
  y_position: number;
  description: string;
  category: string | null;
  echo_count: number;
  user_id: string | null;
  anonymous_session_id: string | null;
  created_at: string;
}

export interface DatabaseQuestionResponse {
  id: string;
  location_id: string;
  question_index: number;
  response: string;
  user_id: string | null;
  anonymous_session_id: string | null;
  created_at: string;
}

export interface DatabaseAIProposal {
  id: string;
  location_id: string;
  prompt: string;
  generated_image_url: string | null;
  storage_path: string | null;
  replicate_prediction_id: string | null;
  generation_status: "pending" | "processing" | "succeeded" | "failed";
  error_message: string | null;
  user_id: string | null;
  anonymous_session_id: string | null;
  submission_id: string | null;
  created_at: string;
}

export interface DatabaseUserProfile {
  id: string;
  display_name: string | null;
  role: "resident" | "stakeholder" | "planner" | "admin";
  organization: string | null;
  created_at: string;
}

// Sketches are stored as vector strokes — no raster image. Each stroke
// is a polyline of (x, y) percentages of the photo container, which
// keeps them in sync with the same coordinate system used by sticky
// notes and concern markers.
export interface SketchPoint {
  x: number;
  y: number;
}

export interface SketchStroke {
  color: string;
  width: number;
  points: SketchPoint[];
}

export interface DatabaseSketch {
  id: string;
  location_id: string;
  strokes: SketchStroke[];
  preview_image_url: string | null;
  user_id: string | null;
  anonymous_session_id: string | null;
  submission_id: string | null;
  created_at: string;
}
