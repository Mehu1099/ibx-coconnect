// Z-INDEX HIERARCHY (location detail page)
//
//   PASSIVE chrome (visible UI, not the focus of interaction):
//      5  — sketch overlay (inactive — pointer-events: none)
//     10  — base photo, planner question rail, AI proposals rail
//     15  — top nav, concerns banner, location title
//     18  — on-photo sticky / concern markers (resting)
//     20  — sketch canvas overlay when active (captures pointer over the photo)
//     22  — markers in hover / selected resting state
//     25  — submit-contributions pill
//     30  — floating tool toolbar (must always be reachable)
//     35  — sketch tool's secondary toolbar
//     40  — personal-canvas hint pill
//
//   ACTIVE INTERACTION (always above passive):
//     55  — popover (hover preview, marker echo button)
//     60  — composer (sticky / concern creation card, selected sticky edit card)
//     70  — toast
//     80  — modal backdrop
//     85  — modal content
//
//   TUTORIAL (above modals so it can dim them too):
//     90  — backdrop
//    110  — spotlight (UI lifted above backdrop while highlighted)
//    120  — tutorial card
//
//     95  — leaving overlay (back-to-neighborhood fade-out)
//
//   KEY INVARIANTS:
//   • floating_toolbar (30) > sketch_active (20) → toolbar reachable while sketching
//   • floating_toolbar (30) > submit_pill (25) → submit pill never swallows toolbar clicks
//   • markers.sticky_note (18) > location_title (15) → markers visible when placed near top
//   • active_interaction.* > passive.* → composers/popovers always visible

export const Z_INDEX = {
  // Static UI surfaces — visible but not the focus of interaction.
  passive: {
    sketch_inactive: 5,
    planner_questions: 10,
    ai_proposals: 10,
    active_concerns_banner: 15,
    location_title: 15,
    sketch_active: 20,
    submit_pill: 25,
    floating_toolbar: 30,
    sketch_toolbar: 35,
    personal_canvas_hint: 40,
  },
  // On-photo markers. Resting markers sit between the rails and the
  // sketch overlay; hovered/selected lift one notch above sketch_active
  // so a selected sticky's edit affordances remain visible while the
  // sketch tool is engaged.
  markers: {
    sticky_note: 18,
    sticky_note_selected: 22,
    concern: 18,
    concern_hovered: 22,
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
