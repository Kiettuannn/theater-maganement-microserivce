import { cn } from "@/utils/cn";

interface PermissionCheckboxProps {
  checked: boolean;
  disabled: boolean;
  onChange: () => void;
}

export function PermissionCheckbox({
  checked,
  disabled,
  onChange,
}: PermissionCheckboxProps) {
  return (
    <div className="flex justify-center">
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={onChange}
        className={cn(
          "h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer transition-all",
          disabled && "opacity-50 cursor-not-allowed animate-pulse"
        )}
      />
    </div>
  );
}
