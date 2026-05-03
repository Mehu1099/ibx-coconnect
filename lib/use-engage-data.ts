"use client";

import { useEffect, useMemo, useState } from "react";
import { PLANNER_QUESTIONS } from "./planner-questions";
import {
  getAgeDisplay,
  getDemographicGroup,
  getRoleDisplay,
  type DemographicGroup,
} from "./role-display";
import { supabase } from "./supabase-client";

// ── Types ──────────────────────────────────────────────────────────────────

export type ContributionType =
  | "sticky"
  | "concern"
  | "question_response"
  | "ai_proposal";

export interface Contribution {
  // Composite id (e.g. `sticky-<uuid>`) — guarantees uniqueness across
  // the four source tables when the feed renders them together.
  id: string;
  // The original row id, useful when the marker drop animation needs to
  // correlate the feed item with anything that still keys on the raw id.
  rawId: string;
  type: ContributionType;
  locationId: string;
  content: string;
  contributorRole: string;
  contributorAge: string;
  demographicGroup: DemographicGroup;
  isStakeholder: boolean;
  category?: string;
  echoCount?: number;
  imageUrl?: string;
  prompt?: string;
  title?: string;
  questionIndex?: number;
  // Resolved planner question text — only populated for question_response
  // contributions, sourced from PLANNER_QUESTIONS at fetch time so the
  // ExpandedView can render the Q + A pair without an extra lookup.
  question?: string;
  // Photo-relative %s for the marker drop animation in ExpandedView.
  // Only sticky + concern carry these.
  marker?: { x: number; y: number };
  createdAt: string;
  timeAgo: string;
}

export interface LocationCount {
  locationId: string;
  total: number;
  byType: Record<string, number>;
  // True for locations whose `total` is above the per-page average.
  hot: boolean;
}

interface SubmissionInfo {
  role: string | null;
  age_range: string | null;
  is_stakeholder: boolean;
  organization: string | null;
}

interface StickyRow {
  id: string;
  location_id: string;
  content: string | null;
  x_position: number;
  y_position: number;
  submission_id: string;
  created_at: string;
}
interface ConcernRow {
  id: string;
  location_id: string;
  category: string | null;
  description: string;
  x_position: number;
  y_position: number;
  echo_count: number | null;
  submission_id: string;
  created_at: string;
}
interface ResponseRow {
  id: string;
  location_id: string;
  question_index: number;
  response: string;
  submission_id: string;
  created_at: string;
}
interface ProposalRow {
  id: string;
  location_id: string;
  prompt: string;
  generated_image_url: string | null;
  submission_id: string;
  created_at: string;
}
interface SubmissionRow {
  id: string;
  role: string | null;
  age_range: string | null;
  is_stakeholder: boolean | null;
  organization: string | null;
}

const RECENTLY_ARRIVED_FLAG_MS = 3000;

// ── Time formatting ────────────────────────────────────────────────────────

export function formatTimeAgo(dateString: string): string {
  const now = Date.now();
  const then = new Date(dateString).getTime();
  const diff = now - then;
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} d ago`;
  const weeks = Math.floor(days / 7);
  return `${weeks} w ago`;
}

// ── Fetch ──────────────────────────────────────────────────────────────────
// Pulls submitted contributions from all four source tables in parallel,
// then resolves each contribution's submission row to attach role / age /
// stakeholder. For question_responses we also resolve the question text
// out of PLANNER_QUESTIONS so the feed + ExpandedView can render Q + A.

async function fetchAllContributions(): Promise<Contribution[]> {
  const [stickiesResult, concernsResult, responsesResult, proposalsResult] =
    await Promise.all([
      supabase
        .from("annotations")
        .select(
          "id, location_id, content, x_position, y_position, submission_id, created_at",
        )
        .eq("type", "sticky")
        .not("submission_id", "is", null)
        .order("created_at", { ascending: false }),
      supabase
        .from("concerns")
        .select(
          "id, location_id, category, description, x_position, y_position, echo_count, submission_id, created_at",
        )
        .not("submission_id", "is", null)
        .order("created_at", { ascending: false }),
      supabase
        .from("question_responses")
        .select(
          "id, location_id, question_index, response, submission_id, created_at",
        )
        .not("submission_id", "is", null)
        .order("created_at", { ascending: false }),
      supabase
        .from("ai_proposals")
        .select(
          "id, location_id, prompt, generated_image_url, submission_id, created_at",
        )
        .not("submission_id", "is", null)
        .order("created_at", { ascending: false }),
    ]);

  const stickies = (stickiesResult.data ?? []) as StickyRow[];
  const concerns = (concernsResult.data ?? []) as ConcernRow[];
  const responses = (responsesResult.data ?? []) as ResponseRow[];
  const proposals = (proposalsResult.data ?? []) as ProposalRow[];

  const submissionIds = Array.from(
    new Set(
      [
        ...stickies.map((s) => s.submission_id),
        ...concerns.map((c) => c.submission_id),
        ...responses.map((r) => r.submission_id),
        ...proposals.map((p) => p.submission_id),
      ].filter((id): id is string => Boolean(id)),
    ),
  );

  const submissionMap = new Map<string, SubmissionInfo>();

  if (submissionIds.length > 0) {
    const { data: submissions } = await supabase
      .from("submissions")
      .select("id, role, age_range, is_stakeholder, organization")
      .in("id", submissionIds);

    ((submissions ?? []) as SubmissionRow[]).forEach((s) => {
      submissionMap.set(s.id, {
        role: s.role,
        age_range: s.age_range,
        is_stakeholder: s.is_stakeholder ?? false,
        organization: s.organization,
      });
    });
  }

  const all: Contribution[] = [];

  stickies.forEach((s) => {
    const sub = submissionMap.get(s.submission_id);
    all.push({
      id: `sticky-${s.id}`,
      rawId: s.id,
      type: "sticky",
      locationId: s.location_id,
      content: s.content ?? "",
      contributorRole: getRoleDisplay(sub?.role),
      contributorAge: getAgeDisplay(sub?.age_range),
      demographicGroup: getDemographicGroup(sub?.role, sub?.age_range),
      isStakeholder: sub?.is_stakeholder ?? false,
      marker: { x: s.x_position, y: s.y_position },
      createdAt: s.created_at,
      timeAgo: formatTimeAgo(s.created_at),
    });
  });

  concerns.forEach((c) => {
    const sub = submissionMap.get(c.submission_id);
    all.push({
      id: `concern-${c.id}`,
      rawId: c.id,
      type: "concern",
      locationId: c.location_id,
      content: c.description,
      category: c.category ?? undefined,
      echoCount: c.echo_count ?? 0,
      contributorRole: getRoleDisplay(sub?.role),
      contributorAge: getAgeDisplay(sub?.age_range),
      demographicGroup: getDemographicGroup(sub?.role, sub?.age_range),
      isStakeholder: sub?.is_stakeholder ?? false,
      marker: { x: c.x_position, y: c.y_position },
      createdAt: c.created_at,
      timeAgo: formatTimeAgo(c.created_at),
    });
  });

  responses.forEach((r) => {
    const sub = submissionMap.get(r.submission_id);
    const locationQuestions = PLANNER_QUESTIONS[r.location_id] ?? [];
    const questionText = locationQuestions[r.question_index]?.question ?? "";
    all.push({
      id: `response-${r.id}`,
      rawId: r.id,
      type: "question_response",
      locationId: r.location_id,
      content: r.response,
      questionIndex: r.question_index,
      question: questionText,
      contributorRole: getRoleDisplay(sub?.role),
      contributorAge: getAgeDisplay(sub?.age_range),
      demographicGroup: getDemographicGroup(sub?.role, sub?.age_range),
      isStakeholder: sub?.is_stakeholder ?? false,
      createdAt: r.created_at,
      timeAgo: formatTimeAgo(r.created_at),
    });
  });

  proposals.forEach((p) => {
    const sub = submissionMap.get(p.submission_id);
    all.push({
      id: `proposal-${p.id}`,
      rawId: p.id,
      type: "ai_proposal",
      locationId: p.location_id,
      content: p.prompt,
      prompt: p.prompt,
      imageUrl: p.generated_image_url ?? undefined,
      contributorRole: getRoleDisplay(sub?.role),
      contributorAge: getAgeDisplay(sub?.age_range),
      demographicGroup: getDemographicGroup(sub?.role, sub?.age_range),
      isStakeholder: sub?.is_stakeholder ?? false,
      createdAt: p.created_at,
      timeAgo: formatTimeAgo(p.created_at),
    });
  });

  all.sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  return all;
}

// ── Hook ───────────────────────────────────────────────────────────────────
// Initial fetch + 4-table realtime + cross-zone filter state. Theme state
// is kept here so Session 10B can wire selectedThemeId through without
// touching call sites.

export function useEngageData() {
  const [allContributions, setAllContributions] = useState<Contribution[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(
    null,
  );
  const [selectedTypes, setSelectedTypes] = useState<string[]>(["all"]);
  const [selectedThemeId, setSelectedThemeId] = useState<string | null>(null);
  const [recentlyArrivedIds, setRecentlyArrivedIds] = useState<Set<string>>(
    new Set(),
  );

  useEffect(() => {
    let mounted = true;

    async function load() {
      setIsLoading(true);
      try {
        const all = await fetchAllContributions();
        if (!mounted) return;
        setAllContributions(all);
      } catch (err) {
        console.error("[useEngageData] Failed to fetch:", err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    load();

    function flagRecentlyArrived(
      prev: Contribution[],
      next: Contribution[],
    ) {
      const prevIds = new Set(prev.map((c) => c.id));
      const newIds = next.filter((c) => !prevIds.has(c.id)).map((c) => c.id);
      if (newIds.length === 0) return;
      setRecentlyArrivedIds((curr) => {
        const merged = new Set(curr);
        newIds.forEach((id) => merged.add(id));
        return merged;
      });
      window.setTimeout(() => {
        setRecentlyArrivedIds((curr) => {
          const next2 = new Set(curr);
          newIds.forEach((id) => next2.delete(id));
          return next2;
        });
      }, RECENTLY_ARRIVED_FLAG_MS);
    }

    async function reload() {
      try {
        const next = await fetchAllContributions();
        if (!mounted) return;
        setAllContributions((prev) => {
          flagRecentlyArrived(prev, next);
          return next;
        });
      } catch (err) {
        console.error("[useEngageData] Realtime reload failed:", err);
      }
    }

    const channels = [
      supabase
        .channel("engage-annotations")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "annotations" },
          () => reload(),
        )
        .subscribe(),
      supabase
        .channel("engage-concerns")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "concerns" },
          () => reload(),
        )
        .subscribe(),
      supabase
        .channel("engage-responses")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "question_responses" },
          () => reload(),
        )
        .subscribe(),
      supabase
        .channel("engage-proposals")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "ai_proposals" },
          () => reload(),
        )
        .subscribe(),
    ];

    return () => {
      mounted = false;
      channels.forEach((ch) => supabase.removeChannel(ch));
    };
  }, []);

  // Per-location aggregates from the FULL list (not the filtered one)
  // so the map badges stay stable when the user drills in. `hot` flips
  // on for any location with above-average traffic.
  const locationCounts = useMemo<LocationCount[]>(() => {
    const counts: Record<string, LocationCount> = {};
    for (let i = 1; i <= 8; i++) {
      const locId = String(i).padStart(2, "0");
      counts[locId] = { locationId: locId, total: 0, byType: {}, hot: false };
    }
    allContributions.forEach((c) => {
      const bucket = counts[c.locationId];
      if (!bucket) return;
      bucket.total += 1;
      bucket.byType[c.type] = (bucket.byType[c.type] ?? 0) + 1;
    });
    const totals = Object.values(counts).map((c) => c.total);
    const sum = totals.reduce((s, n) => s + n, 0);
    const avg = totals.length > 0 ? sum / totals.length : 0;
    Object.values(counts).forEach((c) => {
      c.hot = c.total > avg;
    });
    return Object.values(counts);
  }, [allContributions]);

  const filteredContributions = useMemo(() => {
    return allContributions.filter((c) => {
      if (selectedLocationId && c.locationId !== selectedLocationId)
        return false;
      if (!selectedTypes.includes("all") && !selectedTypes.includes(c.type))
        return false;
      // Theme filtering hooks in here in 10B once the themes table lands.
      return true;
    });
  }, [allContributions, selectedLocationId, selectedTypes]);

  return {
    allContributions,
    filteredContributions,
    locationCounts,
    isLoading,
    selectedLocationId,
    setSelectedLocationId,
    selectedTypes,
    setSelectedTypes,
    selectedThemeId,
    setSelectedThemeId,
    recentlyArrivedIds,
  };
}
