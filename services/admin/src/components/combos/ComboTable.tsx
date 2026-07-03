import type { ComboWithItems } from "@/types/ComboType/comboType";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, Package, ImageIcon } from "lucide-react";

interface ComboTableProps {
  combos: ComboWithItems[];
  isLoading?: boolean;
  onEdit: (combo: ComboWithItems) => void;
  onDelete: (combo: ComboWithItems) => void;
}

export function ComboTable({
  combos,
  isLoading,
  onEdit,
  onDelete,
}: ComboTableProps) {
  if (isLoading) {
    return (
      <div className="rounded-lg border border-border bg-card">
        <div className="p-8 text-center text-muted-foreground">
          Loading combos...
        </div>
      </div>
    );
  }

  if (combos.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card">
        <div className="p-8 text-center text-muted-foreground">
          No combos found
        </div>
      </div>
    );
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted/50 border-b border-border">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
                Image
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
                Combo Name
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
                Description
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
                Price
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
                Items
              </th>
              <th className="px-6 py-4 text-center text-sm font-semibold text-foreground">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {combos.map((combo) => (
              <tr
                key={combo.id}
                className="hover:bg-muted/30 transition-colors"
              >
                <td className="px-6 py-4">
                  <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted flex items-center justify-center">
                    {combo.imageUrl ? (
                      <img
                        src={combo.imageUrl}
                        alt={combo.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <ImageIcon className="h-8 w-8 text-muted-foreground" />
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <div className="rounded-full bg-orange-100 dark:bg-orange-900/30 p-2">
                      <Package className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                    </div>
                    <span className="font-medium text-foreground">
                      {combo.name}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-muted-foreground line-clamp-2 max-w-xs">
                    {combo.description}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-green-600 dark:text-green-400">
                      {formatPrice(combo.price)}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  {combo.items && combo.items.length > 0 ? (
                    <div className="space-y-1">
                      {combo.items.map((item) => (
                        <div
                          key={item.id}
                          className="text-sm text-muted-foreground"
                        >
                          <span className="font-medium">{item.quantity}x</span>{" "}
                          {item.name}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground italic">
                      No items
                    </span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => onEdit(combo)}
                      title="Edit combo"
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => onDelete(combo)}
                      title="Delete combo"
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
