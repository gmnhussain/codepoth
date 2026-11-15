"use client"

import { useSyncExternalStore } from "react"

const APPLE_PLATFORM = /Mac|iPhone|iPad|iPod/

function subscribe() {
  // The platform never changes while the page is open.
  return () => undefined
}

const getSnapshot = () => APPLE_PLATFORM.test(navigator.userAgent)
const getServerSnapshot = () => false

/**
 * Whether the reader is on an Apple device, where the search shortcut is
 * ⌘K rather than Ctrl K. False on the server and during hydration.
 */
export function useIsApple(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
