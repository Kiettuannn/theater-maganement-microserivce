import type { LucideIcon } from "lucide-react"

interface SelectOption {
  value: string
  label: string
}

interface SelectFieldProps {
  label: string
  icon?: LucideIcon
  isEditing: boolean
  value: string
  name: string
  options: SelectOption[]
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void
  displayValue?: string
}

export function SelectField({
  label,
  icon: Icon,
  isEditing,
  value,
  name,
  options,
  onChange,
  displayValue
}: SelectFieldProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
        {Icon && <Icon className="h-4 w-4" />}
        {label}
      </label>
      {isEditing ? (
        <select
          name={name}
          value={value}
          onChange={onChange}
          className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : (
        <div className="px-4 py-2 rounded-lg bg-muted text-foreground">
          {displayValue || value}
        </div>
      )}
    </div>
  )
}
