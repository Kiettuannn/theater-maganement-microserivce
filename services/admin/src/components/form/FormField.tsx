import type { ReactNode } from "react"
import type { LucideIcon } from "lucide-react"

interface FormFieldProps {
  label: string
  icon?: LucideIcon
  isEditing: boolean
  value: string | number
  name?: string
  type?: "text" | "email" | "tel" | "date" | "number"
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
  placeholder?: string
  disabled?: boolean
  hint?: string
  children?: ReactNode
}

export function FormField({
  label,
  icon: Icon,
  isEditing,
  value,
  name,
  type = "text",
  onChange,
  placeholder,
  disabled = false,
  hint,
  children
}: FormFieldProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
        {Icon && <Icon className="h-4 w-4" />}
        {label}
      </label>
      {isEditing ? (
        children || (
          <input
            type={type}
            name={name}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            disabled={disabled}
            className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
          />
        )
      ) : (
        <div className={`px-4 py-2 rounded-lg ${disabled ? "bg-muted text-muted-foreground" : "bg-muted text-foreground"}`}>
          {value || "Not updated"}
          {hint && <span className="ml-2 text-xs">{hint}</span>}
        </div>
      )}
    </div>
  )
}
