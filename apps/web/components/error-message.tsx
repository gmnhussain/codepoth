"use client"

import Link from "next/link"

import { Button, buttonVariants } from "@workspace/ui/components/button"

import { useT } from "@/lib/labels-context"

/** The body of the error pages: what happened, try again, or go home. */
export function ErrorMessage({ onRetry }: { readonly onRetry: () => void }) {
  const t = useT(["error"])
  return (
    <div className="mx-auto flex max-w-xl flex-col items-start gap-5 px-4 py-24 sm:px-8">
      <h1 className="text-3xl font-semibold">{t("error.title")}</h1>
      <p className="leading-reading text-foreground/80">
        {t("error.description")}
      </p>
      <div className="flex flex-wrap gap-3">
        <Button onClick={onRetry}>{t("error.retry")}</Button>
        <Link href="/" className={buttonVariants({ variant: "outline" })}>
          {t("error.home")}
        </Link>
      </div>
    </div>
  )
}
