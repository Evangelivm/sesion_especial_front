"use client"

import { useRef, useEffect } from "react"
import { cn } from "@/lib/utils"
import gsap from "gsap"
import type { LucideIcon } from "lucide-react"

interface RadialMenuOptionProps {
  id: string
  icon: LucideIcon
  isActive: boolean
  position: { x: number; y: number }
  onClick: () => void
  index: number
  total: number
}

export function RadialMenuOption({ id, icon: Icon, isActive, position, onClick, index, total }: RadialMenuOptionProps) {
  const optionRef = useRef<HTMLDivElement>(null)

  // Calculate position in the circle
  const angle = index * (360 / total) * (Math.PI / 180)
  const radius = 100
  const x = Math.cos(angle) * radius
  const y = Math.sin(angle) * radius

  // Animation when active state changes
  useEffect(() => {
    if (!optionRef.current) return

    if (isActive) {
      gsap.to(optionRef.current, {
        scale: 1.25,
        backgroundColor: "rgba(51, 65, 85, 0.9)",
        boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.2)",
        duration: 0.3,
        ease: "back.out(1.7)",
      })
    } else {
      gsap.to(optionRef.current, {
        scale: 1,
        backgroundColor: "rgba(30, 41, 59, 0.8)",
        boxShadow: "none",
        duration: 0.3,
        ease: "power2.out",
      })
    }
  }, [isActive])

  return (
    <div
      ref={optionRef}
      className={cn("absolute w-16 h-16 rounded-full flex items-center justify-center cursor-pointer")}
      style={{
        transform: `translate(${x}px, ${y}px)`,
      }}
      onClick={onClick}
    >
      <Icon className={cn("w-6 h-6", isActive ? "text-white" : "text-slate-300")} />
    </div>
  )
}
