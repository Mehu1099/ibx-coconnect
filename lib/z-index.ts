// Shared z-index hierarchy for the location detail page. Centralised so
// the layering between the planner rail, AI proposals panel, on-photo
// markers, and active interaction dialogs (concern composer, sticky
// composer, marker popovers) stays coherent.
//
// Key invariant: active_interaction.composer > markers.* > passive.*
// — a dialog the user just opened must always sit above the passive
// rails behind it, otherwise click-near-the-right-edge composers get
// occluded by the question rail.

export const Z_INDEX = {
  // Static UI surfaces — visible but not the focus of interaction.
  passive: {
    sketch_inactive: 5,
    planner_questions: 10,
    ai_proposals: 10,
    active_concerns_banner: 15,
    location_title: 15,
    floating_toolbar: 20,
  },
  // On-photo markers + the active sketch canvas. Above passive rails so
  // hover popovers and dialogs remain visible.
  markers: {
    sketch: 28,
    sticky_note: 30,
    sticky_note_selected: 35,
    concern: 32,
    concern_hovered: 35,
  },
  // Anything the user just opened: always above markers + passive rails.
  active_interaction: {
    popover: 55,
    composer: 60,
    toast: 70,
    modal_backdrop: 80,
    modal_content: 85,
  },
  // First-visit tutorial sits above modals so it can dim them too.
  tutorial: {
    backdrop: 90,
    spotlight: 110,
    message: 120,
  },
  leaving_overlay: 95,
} as const;
