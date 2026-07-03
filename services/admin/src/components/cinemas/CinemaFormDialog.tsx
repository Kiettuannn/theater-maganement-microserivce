import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  Cinema,
  CreateCinemaRequest,
} from "@/types/CinemaType/cinemaType";
import type { StaffProfile } from "@/types/StaffType/StaffProfile";
import { Building2, MapPin, Phone, User } from "lucide-react";
import { getAvailableManagers } from "@/services/staffService";

interface CinemaFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateCinemaRequest) => Promise<boolean>;
  cinema?: Cinema | null;
  isLoading?: boolean;
}

export function CinemaFormDialog({
  isOpen,
  onClose,
  onSubmit,
  cinema,
  isLoading,
}: CinemaFormDialogProps) {
  const [formData, setFormData] = useState<CreateCinemaRequest>({
    name: "",
    address: "",
    city: "",
    phoneNumber: "",
    managerId: undefined,
  });

  const [errors, setErrors] = useState<
    Partial<Record<keyof CreateCinemaRequest, string>>
  >({});
  const [availableManagers, setAvailableManagers] = useState<StaffProfile[]>(
    [],
  );
  const [loadingManagers, setLoadingManagers] = useState(false);

  // Load available managers
  useEffect(() => {
    const loadManagers = async () => {
      try {
        setLoadingManagers(true);
        const managers = await getAvailableManagers();

        // If editing and cinema has a manager, ensure current manager is in the list
        if (cinema?.managerId && cinema?.managerName) {
          const hasCurrentManager = managers.some(
            (m) => m.staffId === cinema.managerId,
          );
          if (!hasCurrentManager) {
            // Add current manager to the list
            const currentManager: StaffProfile = {
              staffId: cinema.managerId,
              firstName: cinema.managerName.split(" ")[0] || cinema.managerName,
              lastName: cinema.managerName.split(" ").slice(1).join(" ") || "",
              dob: cinema.managerDob || "",
              accountId: "",
              accountType: "",
              username: "",
              email: "",
              phoneNumber: "",
              address: "",
              gender: "MALE",
              cinemaId: cinema.id,
              jobTitle: "Manager",
              avatarUrl: null,
              roles: [],
            };
            setAvailableManagers([currentManager, ...managers]);
          } else {
            setAvailableManagers(managers);
          }
        } else {
          setAvailableManagers(managers);
        }
      } catch (error) {
        console.error("Failed to load managers:", error);
      } finally {
        setLoadingManagers(false);
      }
    };

    if (isOpen) {
      loadManagers();
    }
  }, [isOpen, cinema]);

  useEffect(() => {
    if (cinema) {
      setFormData({
        name: cinema.name,
        address: cinema.address,
        city: cinema.city,
        phoneNumber: cinema.phoneNumber,
        managerId: cinema.managerId || undefined,
      });
    } else {
      setFormData({
        name: "",
        address: "",
        city: "",
        phoneNumber: "",
        managerId: undefined,
      });
    }
    setErrors({});
  }, [cinema, isOpen]);

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof CreateCinemaRequest, string>> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Cinema name is required";
    }

    if (!formData.address.trim()) {
      newErrors.address = "Address is required";
    }

    if (!formData.city.trim()) {
      newErrors.city = "City is required";
    }

    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = "Phone number is required";
    } else if (!/^[\d\s\-\+\(\)]+$/.test(formData.phoneNumber)) {
      newErrors.phoneNumber = "Please enter a valid phone number";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const submitData = {
      ...formData,
      managerId: formData.managerId || "",
    };

    const success = await onSubmit(submitData);
    if (success) {
      onClose();
    }
  };

  const handleChange = (
    field: keyof CreateCinemaRequest,
    value: string | undefined,
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={cinema ? "Edit Cinema" : "Add New Cinema"}
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Cinema Name */}
        <div className="space-y-2">
          <Label htmlFor="name" className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            Cinema Name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => handleChange("name", e.target.value)}
            placeholder="e.g., CGV Vincom Center"
            aria-invalid={!!errors.name}
            disabled={isLoading}
          />
          {errors.name && (
            <p className="text-sm text-destructive">{errors.name}</p>
          )}
        </div>

        {/* Address */}
        <div className="space-y-2">
          <Label htmlFor="address" className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            Address <span className="text-destructive">*</span>
          </Label>
          <Input
            id="address"
            value={formData.address}
            onChange={(e) => handleChange("address", e.target.value)}
            placeholder="e.g., 191 Bà Triệu Street, Hai Bà Trưng District"
            aria-invalid={!!errors.address}
            disabled={isLoading}
          />
          {errors.address && (
            <p className="text-sm text-destructive">{errors.address}</p>
          )}
        </div>

        {/* City */}
        <div className="space-y-2">
          <Label htmlFor="city" className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            City <span className="text-destructive">*</span>
          </Label>
          <Input
            id="city"
            value={formData.city}
            onChange={(e) => handleChange("city", e.target.value)}
            placeholder="e.g., Hà Nội, Hồ Chí Minh"
            aria-invalid={!!errors.city}
            disabled={isLoading}
          />
          {errors.city && (
            <p className="text-sm text-destructive">{errors.city}</p>
          )}
        </div>

        {/* Phone Number */}
        <div className="space-y-2">
          <Label htmlFor="phoneNumber" className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-muted-foreground" />
            Phone Number <span className="text-destructive">*</span>
          </Label>
          <Input
            id="phoneNumber"
            value={formData.phoneNumber}
            onChange={(e) => handleChange("phoneNumber", e.target.value)}
            placeholder="e.g., 1900 6017"
            aria-invalid={!!errors.phoneNumber}
            disabled={isLoading}
          />
          {errors.phoneNumber && (
            <p className="text-sm text-destructive">{errors.phoneNumber}</p>
          )}
        </div>

        {/* Manager Name (Optional) */}
        <div className="space-y-2">
          <Label htmlFor="managerId" className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            Manager{" "}
            <span className="text-sm text-muted-foreground">(Optional)</span>
          </Label>
          <div className="flex gap-2">
            <Select
              value={formData.managerId || "__none__"}
              onValueChange={(value) =>
                handleChange(
                  "managerId",
                  (value === "__none__" ? undefined : value) as
                    | string
                    | undefined,
                )
              }
              disabled={isLoading || loadingManagers}
            >
              <SelectTrigger className="flex-1">
                <SelectValue
                  placeholder={
                    loadingManagers ? "Loading managers..." : "Select a manager"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">No manager assigned</SelectItem>
                {availableManagers.map((manager) => (
                  <SelectItem key={manager.staffId} value={manager.staffId}>
                    {manager.firstName} {manager.lastName}
                    {manager.dob && (
                      <span className="text-xs text-muted-foreground ml-2">
                        (DOB: {new Date(manager.dob).toLocaleDateString()})
                      </span>
                    )}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <p className="text-xs text-muted-foreground">
            Select a manager with manager role who is not currently managing any
            cinema
          </p>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-border">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <span className="animate-spin mr-2">⏳</span>
                {cinema ? "Updating..." : "Creating..."}
              </>
            ) : (
              <>{cinema ? "Update Cinema" : "Create Cinema"}</>
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
