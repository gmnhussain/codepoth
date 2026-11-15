"use client"

import { useSyncExternalStore } from "react"

import { localDay } from "@/lib/progress/days"

function subscribe(): () => void {
  // The day is read on each render; nothing to listen to.
  return () => undefined
}

/**
 * The reader's local date (`YYYY-MM-DD`) as React state, read on the
 * client; "" on the server and during hydration. A string, so React sees
 * the same snapshot all day.
 */
export function useToday(): string {
  return useSyncExternalStore(
    subscribe,
    () => localDay(new Date()),
    () => ""
  )
}
