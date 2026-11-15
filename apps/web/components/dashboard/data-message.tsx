"use client"

import type { ReactNode } from "react"
import { createContext, useContext, useEffect, useRef, useState } from "react"
import { XIcon } from "lucide-react"

import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"

import { useT } from "@/lib/labels-context"

type DataMessage = {
  /** Shows a result in the status bubble (replacing any earlier one). */
  readonly show: (text: string) => void
  /** Moves focus to the element with this id once it is in the page. */
  readonly focusLater: (id: string) => void
}

const DataMessageContext = createContext<DataMessage>({
  show: () => undefined,
  focusLater: () => undefined,
})

/** The Dashboard's result messages and focus requests (export, import, clear). */
export function useDataMessage(): DataMessage {
  return useContext(DataMessageContext)
}

/**
 * Holds the Dashboard's last result message ("…ইমপোর্ট হয়েছে", "সব
 * তথ্য … মুছে ফেলা হয়েছে", an import error) and shows it in a status bubble
 * fixed at the bottom of the screen, so a message never moves the page. It
 * outlives the views that raise it: the empty state's import link is gone
 * once the import has worked. Focus requests wait for their target to be
 * rendered (after clearing, the empty state's heading).
 */
export function DataMessageProvider({
  children,
}: {
  readonly children: ReactNode
}) {
  const t = useT(["dashboard"])
  const [text, setText] = useState("")
  const pendingFocus = useRef<string | undefined>(undefined)

  // After every commit: a requested focus target may just have appeared.
  useEffect(() => {
    const id = pendingFocus.current
    if (id === undefined) return
    const target = document.getElementById(id)
    if (target === null) return
    pendingFocus.current = undefined
    target.focus()
  })

  const value: DataMessage = {
    show: setText,
    focusLater: (id) => {
      pendingFocus.current = id
    },
  }

  return (
    <DataMessageContext value={value}>
      {children}
      {/* The announcement: always in the page, so a new text is read. */}
      <p role="status" className="sr-only">
        {text}
      </p>
      {/* The bubble's layout box sits just below the screen and is lifted
          into view by its own height with a transform, so a longer or
          shorter message, or the bubble appearing, never moves a layout
          box (no layout shift). Hidden with visibility, not moved. */}
      <div className="pointer-events-none fixed inset-x-4 top-full z-40 flex justify-center">
        <div
          className={cn(
            "flex max-w-xl -translate-y-[calc(100%+1rem)] items-start gap-2 rounded-2xl border bg-card py-2 ps-4 pe-2 shadow-lg",
            text === "" ? "invisible" : "pointer-events-auto"
          )}
        >
          <p className="flex-1 py-2 text-sm leading-relaxed">{text}</p>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => {
              setText("")
            }}
          >
            <XIcon aria-hidden="true" />
            <span className="sr-only">{t("dashboard.closeMessage")}</span>
          </Button>
        </div>
      </div>
    </DataMessageContext>
  )
}
