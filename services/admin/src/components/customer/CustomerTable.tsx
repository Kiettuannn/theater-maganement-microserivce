import { Button } from "@/components/ui/button";
import { Pencil, Trash2, Mail, Phone, Award } from "lucide-react";
import type { CustomerProfile } from "@/types/CustomerType/CustomerProfile";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface CustomerTableProps {
  customers: CustomerProfile[];
  isLoading?: boolean;
  onEdit?: (customer: CustomerProfile) => void;
  onDelete?: (customer: CustomerProfile) => void;
  updatingCell?: string;
}

export function CustomerTable({
  customers,
  isLoading = false,
  onEdit,
  onDelete,
  updatingCell,
}: CustomerTableProps) {
  if (isLoading) {
    return (
      <Card>
        <div className="p-8 flex items-center justify-center">
          <div className="text-center text-muted-foreground">
            Loading customers...
          </div>
        </div>
      </Card>
    );
  }

  if (customers.length === 0) {
    return (
      <Card>
        <div className="p-12 flex items-center justify-center">
          <div className="text-center text-muted-foreground">
            No customers found
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
                Gender
              </th>
              <th className="text-left font-semibold text-sm p-3 min-w-[120px]">
                Loyalty Points
              </th>
              <th className="text-left font-semibold text-sm p-3 min-w-[100px]">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {customers.map((customer, index) => (
              <tr
                key={customer.customerId}
                className={cn(
                  "border-b border-border hover:bg-accent/50 transition-colors",
                  index === customers.length - 1 && "border-b-0"
                )}
              >
                {/* Name */}
                <td className="p-3">
                  <div className="space-y-1">
                    <p className="font-medium text-foreground">
                      {customer.firstName} {customer.lastName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {customer.username}
                    </p>
                  </div>
                </td>

                {/* Email */}
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-foreground">
                      {customer.email}
                    </span>
                  </div>
                </td>

                {/* Phone */}
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-foreground">
                      {customer.phoneNumber}
                    </span>
                  </div>
                </td>

                {/* DOB */}
                <td className="p-3">
                  <span className="text-sm text-foreground">
                    {new Date(customer.dob).toLocaleDateString("vi-VN")}
                  </span>
                </td>

                {/* Gender */}
                <td className="p-3">
                  <span className="text-sm text-foreground">
                    {customer.gender}
                  </span>
                </td>

                {/* Loyalty Points */}
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-amber-500" />
                    <span className="text-sm font-medium text-foreground">
                      {customer.loyaltyPoints?.toLocaleString() || 0}
                    </span>
                  </div>
                </td>

                {/* Actions */}
                <td className="p-3">
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => onEdit?.(customer)}
                      disabled={updatingCell !== undefined}
                      title="Edit customer"
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => onDelete?.(customer)}
                      disabled={updatingCell !== undefined}
                      title="Delete customer"
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
