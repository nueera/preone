"use client"

import { Toaster as Sonner, ToasterProps } from "sonner"

/**
 * PreOne Sonner Toaster — Toast notifications across all portals.
 * Uses Sonner (not shadcn use-toast) for all toast notifications.
 * Usage: toast.success('Done!'), toast.error('Failed'), toast.info('Info')
 */
const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      className="toaster group"
      position="top-right"
      toastOptions={{
        classNames: {
          toast: "rounded-xl border bg-white text-foreground shadow-lg dark:bg-gray-900 dark:text-gray-100",
          title: "font-semibold text-sm",
          description: "text-xs text-muted-foreground",
          success: "border-l-4 border-l-emerald-500",
          error: "border-l-4 border-l-red-500",
          warning: "border-l-4 border-l-amber-500",
          info: "border-l-4 border-l-blue-500",
        },
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }
