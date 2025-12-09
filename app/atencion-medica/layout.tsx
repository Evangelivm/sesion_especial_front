import type React from "react"
import { Toaster } from "sonner"

export default function AtencionMedicaLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      {children}
      <Toaster position="top-center" richColors closeButton />
    </>
  )
}
