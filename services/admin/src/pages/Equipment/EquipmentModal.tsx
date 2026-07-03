import { useState } from "react";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { useNotificationStore } from "@/stores";
import {
  createEquipment,
  updateEquipment,
  type Equipment,
  type EquipmentCategory,
  type CreateEquipmentRequest,
  type UpdateEquipmentRequest,
} from "@/services/equipmentService";

interface Room {
  id: string;
  name: string;
}

interface EquipmentModalProps {
  room: Room;
  equipment: Equipment | null;
  categories: EquipmentCategory[];
  onClose: () => void;
  onSave: () => Promise<void>;
}

export default function EquipmentModal({
  room,
  equipment,
  categories,
  onClose,
  onSave,
}: EquipmentModalProps) {
  const addNotification = useNotificationStore((state) => state.addNotification);
  const [formData, setFormData] = useState<
    CreateEquipmentRequest | UpdateEquipmentRequest
  >(
    equipment
      ? {
          name: equipment.name,
          categoryId: equipment.categoryId,
          roomId: equipment.roomId,
          serialNumber: equipment.serialNumber,
          status: equipment.status,
          purchaseDate: equipment.purchaseDate,
        }
      : {
          name: "",
          categoryId: "",
          roomId: room.id,
          serialNumber: "",
          status: "ACTIVE",
          purchaseDate: "",
        }
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);

      if (!formData.serialNumber || !formData.serialNumber.trim()) {
        setError("Serial number is required");
        setLoading(false);
        return;
      }

      if (!formData.purchaseDate) {
        setError("Purchase date is required");
        setLoading(false);
        return;
      }

      const purchase = new Date(formData.purchaseDate);
      const today = new Date();

      if (Number.isNaN(purchase.getTime())) {
        setError("Purchase date is invalid");
        setLoading(false);
        return;
      }

      if (purchase > today) {
        setError("Purchase date cannot be in the future");
        setLoading(false);
        return;
      }

      if (equipment) {
        await updateEquipment(equipment.id, formData as UpdateEquipmentRequest);
        addNotification({
          type: "success",
          title: "Success",
          message: "Equipment updated successfully.",
        });
      } else {
        await createEquipment(formData as CreateEquipmentRequest);
        addNotification({
          type: "success",
          title: "Success",
          message: "Equipment added successfully.",
        });
      }

      await onSave();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to save equipment");
      console.error("Error saving equipment:", err);
    } finally {
      setLoading(false);
    }
  };

  const equipmentStatuses = ["ACTIVE", "MAINTENANCE", "BROKEN"];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full">
        <div className="flex justify-between items-center p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold">
              {equipment ? "Edit Equipment" : "Add New Equipment"}
            </h2>
            <p className="text-sm text-gray-500 mt-1">Room: {room.name}</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Equipment Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category *
                </label>
                <select
                  name="categoryId"
                  value={formData.categoryId}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status *
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {equipmentStatuses.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Serial Number *
                </label>
                <input
                  type="text"
                  name="serialNumber"
                  value={formData.serialNumber}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Purchase Date *
                </label>
                <input
                  type="date"
                  name="purchaseDate"
                  value={formData.purchaseDate || ""}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
            <Button
              type="button"
              onClick={onClose}
              variant="outline"
              className="px-4 py-2"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2"
            >
              {loading ? "Saving..." : "Save Equipment"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
