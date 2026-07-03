import { Button } from "@/components/ui/button";
import { Pencil, Trash2, Mail, Phone, Briefcase, Shield } from "lucide-react";
import type { StaffProfile } from "@/types/StaffType/StaffProfile";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StaffTableProps {
  staffs: StaffProfile[];
  isLoading?: boolean;
  onEdit?: (staff: StaffProfile) => void;
  onDelete?: (staff: StaffProfile) => void;
  updatingCell?: string;
}

export function StaffTable({
  staffs,
  isLoading = false,
  onEdit,
  onDelete,
  updatingCell,
}: StaffTableProps) {
  if (isLoading) {
    return (
      <Card>
        <div className="p-8 flex items-center justify-center">
          <div className="text-center text-muted-foreground">
            Loading staffs...
          </div>
        </div>
      </Card>
    );
  }

  if (staffs.length === 0) {
    return (
      <Card>
        <div className="p-12 flex items-center justify-center">
          <div className="text-center text-muted-foreground">
            No staffs found
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-muted/50 border-b border-border">
              <th className="text-left font-semibold text-sm p-3 min-w-[200px]">
                Name
              </th>
              <th className="text-left font-semibold text-sm p-3 min-w-[180px]">
                Position
              </th>
              <th className="text-left font-semibold text-sm p-3 min-w-[150px]">
                Role(s)
              </th>
              <th className="text-left font-semibold text-sm p-3 min-w-[200px]">
                Email
              </th>
              <th className="text-left font-semibold text-sm p-3 min-w-[140px]">
                Phone
              </th>
              <th className="text-left font-semibold text-sm p-3 min-w-[120px]">
                Date of Birth
              </th>

              <th className="text-left font-semibold text-sm p-3 min-w-[100px]">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {staffs.map((staff, index) => (
              <tr
                key={staff.staffId}
                className={cn(
                  "border-b border-border hover:bg-accent/50 transition-colors",
                  index === staffs.length - 1 && "border-b-0"
                )}
              >
                {/* Name */}
                <td className="p-3">
                  <div className="space-y-1">
                    <p className="font-medium text-foreground">
                      {staff.firstName} {staff.lastName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {staff.username}
                    </p>
                  </div>
                </td>

                {/* Position */}
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-foreground">
                      {staff.jobTitle}
                    </span>
                  </div>
                </td>

                {/* Roles */}
                <td className="p-3">
                  <div className="flex flex-wrap gap-1">
                    {staff.roles && staff.roles.length > 0 ? (
                      staff.roles.map((role) => (
                        <span
                          key={role.name}
                          className={cn(
                            "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
                            role.name === "ADMIN" &&
                              "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
                            role.name === "MANAGER" &&
                              "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
                            role.name === "STAFF" &&
                              "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                          )}
                        >
                          <Shield className="w-3 h-3" />
                          {role.name}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        No roles
                      </span>
                    )}
                  </div>
                </td>

                {/* Email */}
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-foreground">
                      {staff.email}
                    </span>
                  </div>
                </td>

                {/* Phone */}
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-foreground">
                      {staff.phoneNumber}
                    </span>
                  </div>
                </td>

                {/* DOB */}
                <td className="p-3">
                  <span className="text-sm text-foreground">
                    {new Date(staff.dob).toLocaleDateString("vi-VN")}
                  </span>
                </td>

                {/* Actions */}
                <td className="p-3">
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => onEdit?.(staff)}
                      disabled={updatingCell !== undefined}
                      title="Edit staff"
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => onDelete?.(staff)}
                      disabled={updatingCell !== undefined}
                      title="Delete staff"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
