"use client";

import { Suspense } from "react";
import { EngageView } from "@/components/engage/EngageView";
import { MobileBlock } from "@/components/engage/MobileBlock";

export default function EngagePage() {
  return (
    <>
      <Suspense
        fallback={
          <div style={{ minHeight: "100vh", background: "#F5F2EB" }} />
        }
      >
        <EngageView />
      </Suspense>
      <MobileBlock />
    </>
  );
}
