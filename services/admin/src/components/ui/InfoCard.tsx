import type { ReactNode } from "react"

interface InfoCardProps {
  title: string
  children: ReactNode
  className?: string
}

interface InfoCardItemProps {
  label: string
  value: string | number | ReactNode
  valueClassName?: string
}

export function InfoCard({ title, children, className = "" }: InfoCardProps) {
  return (
    <div className={`bg-card rounded-lg border border-border p-6 ${className}`}>
      <h2 className="text-xl font-semibold text-foreground mb-4">{title}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {children}
      </div>
    </div>
  )
}

export function InfoCardItem({ label, value, valueClassName = "" }: InfoCardItemProps) {
  return (
    <div className="p-4 rounded-lg bg-muted/50">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className={`text-foreground font-medium mt-1 ${valueClassName}`}>
        {value}
      </p>
    </div>
  )
}
