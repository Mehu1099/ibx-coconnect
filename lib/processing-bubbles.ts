// Phrase pool for the speech bubbles that rise from the community
// figures during AI generation. Mixes generic urban-planning concerns
// (weighted heavily) with location-specific themes drawn from the
// planner-question context for each station area.

const GENERIC_BUBBLES = [
  "safer crosswalks",
  "more trees",
  "better lighting",
  "shaded benches",
  "wayfinding",
  "cleaner platforms",
  "community art",
  "late-night service",
  "fix the ramps",
  "bike lanes",
];

// Per-location flavor. Locations 01–02 cluster around the Junction
// (Brooklyn College / Flatbush + Nostrand). Beyond that we currently
// reuse the same Junction cues across locations 03–08 since the
// neighborhood is the focus of the demo; swap in real station-area
// language as we surface more sites.
const LOCATION_BUBBLES: Record<string, string[]> = {
  "01": [
    "Hillel Place gateway",
    "campus connection",
    "vendor space",
    "late-night safety",
    "student-friendly",
    "small business",
  ],
  "02": [
    "Hillel Place gateway",
    "campus connection",
    "vendor space",
    "late-night safety",
    "student-friendly",
    "small business",
  ],
  "03": [
    "Junction crossing",
    "transit access",
    "small business",
  ],
  "04": [
    "Hillel Place plaza",
    "Brooklyn College",
    "shaded seating",
  ],
  "05": [
    "Campus Road",
    "co-op housing",
    "student-friendly",
  ],
  "06": [
    "Brooklyn College",
    "campus connection",
    "wayfinding",
  ],
  "07": [
    "south of the IBX",
    "residential calm",
    "transit access",
  ],
  "08": [
    "Avenue I",
    "neighborhood feel",
    "shaded benches",
  ],
};

/**
 * Returns a mixed pool of bubble phrases for a location. The
 * location-specific phrases are appended twice so they appear roughly
 * 40% of the time relative to the 10 generic phrases.
 */
export function getBubblePhrases(locationId: string): string[] {
  const locationPhrases = LOCATION_BUBBLES[locationId] ?? [];
  return [...GENERIC_BUBBLES, ...locationPhrases, ...locationPhrases];
}
