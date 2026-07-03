import type { Cinema } from "@/types/CinemaType/cinemaType";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, MapPin, Phone, Building2, User } from "lucide-react";

interface CinemaTableProps {
  cinemas: Cinema[];
  isLoading?: boolean;
  onEdit: (cinema: Cinema) => void;
  onDelete: (cinema: Cinema) => void;
}

export function CinemaTable({
  cinemas,
  isLoading,
  onEdit,
  onDelete,
}: CinemaTableProps) {
  if (isLoading) {
    return (
      <div className="rounded-lg border border-border bg-card">
        <div className="p-8 text-center text-muted-foreground">
          Loading cinemas...
        </div>
      </div>
    );
  }

  if (cinemas.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card">
        <div className="p-8 text-center text-muted-foreground">
          No cinemas found
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted/50 border-b border-border">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
                Cinema Name
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
                Address
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
                City
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
                Phone
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
                Manager
              </th>
              <th className="px-6 py-4 text-center text-sm font-semibold text-foreground">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {cinemas.map((cinema) => (
              <tr
                key={cinema.id}
                className="hover:bg-muted/30 transition-colors"
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <div className="rounded-full bg-purple-100 dark:bg-purple-900/30 p-2">
                      <Building2 className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                    </div>
                    <span className="font-medium text-foreground">
                      {cinema.name}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-start gap-2 text-sm text-muted-foreground max-w-xs">
                    <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
                    <span className="line-clamp-2">{cinema.address}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-medium">
                    <MapPin className="h-3 w-3" />
                    {cinema.city}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    <span>{cinema.phoneNumber}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  {cinema.managerName ? (
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2 text-sm text-foreground">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span>{cinema.managerName}</span>
                      </div>
                      {cinema.managerDob && (
                        <span className="text-xs text-muted-foreground ml-6">
                          DOB: {new Date(cinema.managerDob).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground italic">
                      Not assigned
                    </span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => onEdit(cinema)}
                      title="Edit cinema"
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => onDelete(cinema)}
                      title="Delete cinema"
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
    </div>
  );
}
