import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import type { ComboWithItems, CreateComboRequest } from "@/types/ComboType/comboType";
import { Package, FileText, ImageIcon, Plus, Trash2, Hash } from "lucide-react";

interface ComboFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (
    combo: CreateComboRequest,
    items: Array<{ id?: string; name: string; quantity: number }>
  ) => Promise<boolean>;
  combo?: ComboWithItems | null;
  isLoading?: boolean;
}

interface ComboItemForm {
  id?: string;
  name: string;
  quantity: number;
}

export function ComboFormDialog({
  isOpen,
  onClose,
  onSubmit,
  combo,
  isLoading,
}: ComboFormDialogProps) {
  const [formData, setFormData] = useState<CreateComboRequest>({
    name: "",
    description: "",
    price: 0,
    imageUrl: "",
  });

  const [items, setItems] = useState<ComboItemForm[]>([
    { name: "", quantity: 1 }
  ]);

  const [errors, setErrors] = useState<{
    combo?: Partial<Record<keyof CreateComboRequest, string>>;
    items?: Record<number, Partial<Record<keyof ComboItemForm, string>>>;
  }>({});

  useEffect(() => {
    if (combo) {
      setFormData({
        name: combo.name,
        description: combo.description,
        price: combo.price,
        imageUrl: combo.imageUrl || "",
      });
      
      if (combo.items && combo.items.length > 0) {
        setItems(combo.items.map(item => ({
          id: item.id,
          name: item.name,
          quantity: item.quantity,
        })));
      } else {
        setItems([{ name: "", quantity: 1 }]);
      }
    } else {
      setFormData({
        name: "",
        description: "",
        price: 0,
        imageUrl: "",
      });
      setItems([{ name: "", quantity: 1 }]);
    }
    setErrors({});
  }, [combo, isOpen]);

  const validateForm = (): boolean => {
    const newErrors: typeof errors = { combo: {}, items: {} };
    let hasError = false;

    // Validate combo fields
    if (!formData.name.trim()) {
      newErrors.combo!.name = "Combo name is required";
      hasError = true;
    }

    if (!formData.description.trim()) {
      newErrors.combo!.description = "Description is required";
      hasError = true;
    }

    if (formData.price <= 0) {
      newErrors.combo!.price = "Price must be greater than 0";
      hasError = true;
    }

    // Validate items
    items.forEach((item, index) => {
      if (!item.name.trim()) {
        if (!newErrors.items![index]) newErrors.items![index] = {};
        newErrors.items![index].name = "Item name is required";
        hasError = true;
      }

      if (item.quantity <= 0) {
        if (!newErrors.items![index]) newErrors.items![index] = {};
        newErrors.items![index].quantity = "Quantity must be greater than 0";
        hasError = true;
      }
    });

    if (items.length === 0) {
      hasError = true;
    }

    setErrors(newErrors);
    return !hasError;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const success = await onSubmit(formData, items);
    if (success) {
      onClose();
    }
  };

  const handleComboChange = (field: keyof CreateComboRequest, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors.combo?.[field]) {
      setErrors((prev) => ({
        ...prev,
        combo: { ...prev.combo, [field]: undefined }
      }));
    }
  };

  const handleItemChange = (index: number, field: keyof ComboItemForm, value: string | number) => {
    setItems((prev) => {
      const newItems = [...prev];
      newItems[index] = { ...newItems[index], [field]: value };
      return newItems;
    });
    
    if (errors.items?.[index]?.[field]) {
      setErrors((prev) => ({
        ...prev,
        items: {
          ...prev.items,
          [index]: {
            ...prev.items?.[index],
            [field]: undefined
          }
        }
      }));
    }
  };

  const handleAddItem = () => {
    setItems((prev) => [...prev, { name: "", quantity: 1 }]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length > 1) {
      setItems((prev) => prev.filter((_, i) => i !== index));
      
      // Remove errors for this item
      setErrors((prev) => {
        const newItemErrors = { ...prev.items };
        delete newItemErrors[index];
        
        // Re-index errors
        const reindexed: typeof prev.items = {};
        Object.keys(newItemErrors).forEach((key) => {
          const oldIndex = parseInt(key);
          const newIndex = oldIndex > index ? oldIndex - 1 : oldIndex;
          reindexed[newIndex] = newItemErrors[oldIndex];
        });
        
        return { ...prev, items: reindexed };
      });
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={combo ? "Edit Combo" : "Add New Combo"}
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="flex flex-col h-full max-h-[calc(90vh-8rem)]">
        <div className="flex-1 overflow-y-auto overflow-x-hidden space-y-4 pr-2">
          {/* Combo Information Section */}
          <div className="space-y-3 border-b border-border pb-4">
          <h3 className="text-lg font-semibold text-foreground">Combo Information</h3>
          
          {/* Combo Name */}
          <div className="space-y-1.5">
            <Label htmlFor="name" className="flex items-center gap-2">
              <Package className="h-4 w-4 text-muted-foreground" />
              Combo Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleComboChange("name", e.target.value)}
              placeholder="e.g., Family Combo, Couple Combo"
              aria-invalid={!!errors.combo?.name}
              disabled={isLoading}
            />
            {errors.combo?.name && (
              <p className="text-sm text-destructive">{errors.combo.name}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="description" className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              Description <span className="text-destructive">*</span>
            </Label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleComboChange("description", e.target.value)}
              placeholder="Describe your combo..."
              rows={2}
              aria-invalid={!!errors.combo?.description}
              disabled={isLoading}
              className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-0 focus-visible:border-ring disabled:cursor-not-allowed disabled:opacity-50 transition-[color,box-shadow,ring]"
            />
            {errors.combo?.description && (
              <p className="text-sm text-destructive">{errors.combo.description}</p>
            )}
          </div>

          {/* Price */}
          <div className="space-y-1.5">
            <Label htmlFor="price" className="flex items-center gap-2">
              Price (VND) <span className="text-destructive">*</span>
            </Label>
            <Input
              id="price"
              type="number"
              min="0"
              step="1000"
              value={formData.price}
              onChange={(e) => handleComboChange("price", parseFloat(e.target.value) || 0)}
              placeholder="e.g., 150000"
              aria-invalid={!!errors.combo?.price}
              disabled={isLoading}
            />
            {errors.combo?.price && (
              <p className="text-sm text-destructive">{errors.combo.price}</p>
            )}
          </div>

          {/* Image URL */}
          <div className="space-y-1.5">
            <Label htmlFor="imageUrl" className="flex items-center gap-2">
              <ImageIcon className="h-4 w-4 text-muted-foreground" />
              Image URL <span className="text-sm text-muted-foreground">(Optional)</span>
            </Label>
            <Input
              id="imageUrl"
              type="url"
              value={formData.imageUrl}
              onChange={(e) => handleComboChange("imageUrl", e.target.value)}
              placeholder="https://example.com/combo-image.jpg"
              disabled={isLoading}
            />
            {formData.imageUrl && (
              <div className="mt-3">
                <p className="text-sm text-muted-foreground mb-2">Preview:</p>
                <div className="relative inline-block">
                  <img 
                    src={formData.imageUrl} 
                    alt="Combo preview" 
                    className="h-32 w-32 object-cover rounded-lg border border-border"
                    onError={(e) => {
                      e.currentTarget.src = 'https://via.placeholder.com/128?text=Invalid+URL';
                    }}
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                    onClick={() => handleComboChange("imageUrl", "")}
                    disabled={isLoading}
                  >
                    ×
                  </Button>
                </div>
              </div>
            )}
          </div>
          </div>

          {/* Combo Items Section */}
          <div className="space-y-3 pb-2">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-foreground">Combo Items</h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddItem}
                className="gap-2"
                disabled={isLoading}
              >
                <Plus className="h-4 w-4" />
                Add Item
              </Button>
            </div>

          <div className="space-y-2">
            {items.map((item, index) => (
              <div
                key={index}
                className="flex gap-3 p-3 rounded-lg border border-border bg-muted/30"
              >
                <div className="flex-1 space-y-1.5">
                  <Label htmlFor={`item-name-${index}`} className="text-sm">
                    Item Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id={`item-name-${index}`}
                    value={item.name}
                    onChange={(e) => handleItemChange(index, "name", e.target.value)}
                    placeholder="e.g., Popcorn, Drink"
                    aria-invalid={!!errors.items?.[index]?.name}
                    disabled={isLoading}
                  />
                  {errors.items?.[index]?.name && (
                    <p className="text-sm text-destructive">{errors.items[index].name}</p>
                  )}
                </div>

                <div className="w-32 space-y-1.5">
                  <Label htmlFor={`item-quantity-${index}`} className="text-sm flex items-center gap-1">
                    <Hash className="h-3 w-3" />
                    Quantity <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id={`item-quantity-${index}`}
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => handleItemChange(index, "quantity", parseInt(e.target.value) || 1)}
                    aria-invalid={!!errors.items?.[index]?.quantity}
                    disabled={isLoading}
                  />
                  {errors.items?.[index]?.quantity && (
                    <p className="text-sm text-destructive">{errors.items[index].quantity}</p>
                  )}
                </div>

                <div className="flex items-end">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveItem(index)}
                    disabled={items.length === 1 || isLoading}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {items.length === 0 && (
            <p className="text-sm text-destructive text-center py-4">
              At least one item is required
            </p>
          )}
        </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-border mt-auto flex-shrink-0">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Saving..." : combo ? "Update Combo" : "Create Combo"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
