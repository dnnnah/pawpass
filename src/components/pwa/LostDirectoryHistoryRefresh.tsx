"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { subscribeToLostDirectoryHistoryNavigation } from "@/lib/pwa/lostDirectoryHistory";

/** Next restores cached route segments on Back/Forward; refresh public alerts after history restoration. */
export function LostDirectoryHistoryRefresh() {
  const router = useRouter();

  useEffect(() => subscribeToLostDirectoryHistoryNavigation(
    window,
    () => window.location.pathname,
    () => router.refresh(),
  ), [router]);

  return null;
}
