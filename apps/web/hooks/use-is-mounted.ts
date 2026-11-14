"use client"

import { useSyncExternalStore } from "react"

function subscribe(): () => void {
  return () => undefined
}

/**
 * False on the server and during hydration, true afterwards. Lets a client
 * island show browser-only state without a hydration mismatch
 * (docs/development/performance.md#rendering).
 */
export function useIsMounted(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  )
}
