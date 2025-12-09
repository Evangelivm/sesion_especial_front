import type React from "react"
import { Toaster } from "sonner"

export default function HistorialAtencionesLayout({
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
