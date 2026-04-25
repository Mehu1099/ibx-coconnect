export type PlannerQuestion = {
  question: string;
  source: string;
};

const DEFAULT_SOURCE = "Urban Planner · NYC DOT";

export const PLANNER_QUESTIONS: Record<string, PlannerQuestion[]> = {
  "01": [
    { question: "Do you feel safe crossing this intersection during peak hours?", source: DEFAULT_SOURCE },
    { question: "What would make this intersection more inviting for pedestrians?", source: DEFAULT_SOURCE },
    { question: "Are there businesses missing here that would serve the community better?", source: DEFAULT_SOURCE },
    { question: "How do current traffic patterns affect your daily commute?", source: DEFAULT_SOURCE },
  ],
  "02": [
    { question: "What's the first impression you'd want a new visitor to have when exiting the station?", source: DEFAULT_SOURCE },
    { question: "How well does this transition zone serve people with mobility needs?", source: DEFAULT_SOURCE },
    { question: "What would help reduce congestion at peak transit times?", source: DEFAULT_SOURCE },
    { question: "Are there ways the IBX could complement the existing 2/5 service here?", source: DEFAULT_SOURCE },
  ],
  "03": [
    { question: "The Junction is one of Brooklyn's busiest hubs — what do you wish was different here?", source: DEFAULT_SOURCE },
    { question: "How could transit, retail, and pedestrian flow be better integrated?", source: DEFAULT_SOURCE },
    { question: "What public amenities are missing that would benefit daily users?", source: DEFAULT_SOURCE },
    { question: "Where do conflicts between different users (drivers, pedestrians, cyclists, transit riders) occur most?", source: DEFAULT_SOURCE },
  ],
  "04": [
    { question: "How do you currently use this pedestrianized space?", source: DEFAULT_SOURCE },
    { question: "What programming or features would make it a stronger community asset?", source: DEFAULT_SOURCE },
    { question: "Should this model be expanded to other streets in the neighborhood?", source: DEFAULT_SOURCE },
    { question: "What are the current limitations of the space as it exists?", source: DEFAULT_SOURCE },
  ],
  "05": [
    { question: "How does student housing density affect the surrounding residential character?", source: DEFAULT_SOURCE },
    { question: "What relationships exist (or could exist) between students and longtime residents?", source: DEFAULT_SOURCE },
    { question: "What infrastructure improvements would benefit both populations?", source: DEFAULT_SOURCE },
    { question: "How does the IBX station change the long-term identity of this area?", source: DEFAULT_SOURCE },
  ],
  "06": [
    { question: "What role should the campus play in the broader neighborhood identity?", source: DEFAULT_SOURCE },
    { question: "How could the campus edge become more permeable to non-students?", source: DEFAULT_SOURCE },
    { question: "What's missing from the streetscape between campus and community?", source: DEFAULT_SOURCE },
    { question: "How would IBX-driven foot traffic change the campus experience?", source: DEFAULT_SOURCE },
  ],
  "07": [
    { question: "How does the rail corridor currently impact this street?", source: DEFAULT_SOURCE },
    { question: "What opportunities does the IBX create for reclaiming space here?", source: DEFAULT_SOURCE },
    { question: "Are there safety concerns related to the current condition?", source: DEFAULT_SOURCE },
    { question: "What new uses could activate this underutilized area?", source: DEFAULT_SOURCE },
  ],
  "08": [
    { question: "What's the character of this street that you want preserved?", source: DEFAULT_SOURCE },
    { question: "How might increased transit access change this neighborhood?", source: DEFAULT_SOURCE },
    { question: "What concerns do you have about displacement or change?", source: DEFAULT_SOURCE },
    { question: "Where do you see opportunities for improvement without losing identity?", source: DEFAULT_SOURCE },
  ],
};
