import { Shield } from "lucide-react";
import type { Role } from "@/services/roleService";

interface RoleHeaderCellProps {
  role: Role;
}

export function RoleHeaderCell({ role }: RoleHeaderCellProps) {
  return (
    <th className="border-b border-border p-3 text-center font-semibold text-sm min-w-[150px]">
      <div className="flex flex-col items-center gap-1">
        <Shield className="h-4 w-4 text-primary" />
        <span>{role.name || role.description}</span>
      </div>
    </th>
  );
}
