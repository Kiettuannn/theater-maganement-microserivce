import { useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ArrowLeft, Plus, Trash2, Edit } from "lucide-react";
import {
  deleteEquipment,
  type Equipment,
  type EquipmentCategory,
} from "@/services/equipmentService";
import { useNotificationStore } from "@/stores";
import { useConfirmDialog } from "@/hooks/useConfirmDialog";
import EquipmentModal from "./EquipmentModal";

interface Room {
  id: string;
  name: string;
}

interface EquipmentListDetailProps {
  room: Room;
  equipment: Equipment[];
  categories: EquipmentCategory[];
  loading: boolean;
  error: string | null;
  onBack: () => void;
  onEquipmentUpdated: () => Promise<void>;
}

export default function EquipmentListDetail({
  room,
  equipment,
  categories,
  loading,
  error,
  onBack,
  onEquipmentUpdated,
}: EquipmentListDetailProps) {
  const [showModal, setShowModal] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(null);
  const { confirmDialog, showConfirmDialog, closeConfirmDialog } = useConfirmDialog();
  const addNotification = useNotificationStore((state) => state.addNotification);

  const handleCreate = () => {
    setEditingEquipment(null);
    setShowModal(true);
  };

  const handleEdit = (eq: Equipment) => {
    setEditingEquipment(eq);
    setShowModal(true);
  };

  const handleDelete = (eq: Equipment) => {
    showConfirmDialog({
      title: "Delete Equipment",
      description: `Are you sure you want to delete "${eq.name}"? This action cannot be undone.`,
      variant: "destructive",
      confirmText: "Delete",
      onConfirm: async () => {
        try {
          await deleteEquipment(eq.id);
          addNotification({
            type: "success",
            title: "Success",
            message: "Equipment deleted successfully.",
          });
          await onEquipmentUpdated();
          closeConfirmDialog();
        } catch (err: any) {
          addNotification({
            type: "error",
            title: "Error",
            message: err.response?.data?.message || "Failed to delete equipment.",
          });
          closeConfirmDialog();
        }
      },
    });
  };

  const getCategoryName = (categoryId: string) => {
    return categories.find((c) => c.id === categoryId)?.name || "Unknown";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300";
      case "MAINTENANCE":
        return "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300";
      case "BROKEN":
        return "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300";
      default:
        return "bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-300";
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Equipment Management"
        description={`Managing equipment for ${room.name}`}
      />

      <div className="flex items-center gap-4">
        <Button
          onClick={onBack}
          variant="ghost"
          className="text-blue-600 hover:text-blue-800"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Rooms
        </Button>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex justify-between items-center mb-6">
          <div></div>
          <Button
            onClick={handleCreate}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Equipment
          </Button>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-8">Loading...</div>
        ) : equipment.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No equipment found. Add one to get started.
          </div>
        ) : (
          <div className="rounded-lg border border-border bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50 border-b border-border">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Name</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Category</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Serial Number</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Status</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Purchase Date</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {equipment.map((eq) => (
                    <tr key={eq.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4 text-foreground font-medium">{eq.name}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-medium">
                          {getCategoryName(eq.categoryId)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">{eq.serialNumber || "-"}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(eq.status)}`}>
                          {eq.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        {eq.purchaseDate
                          ? new Date(eq.purchaseDate).toLocaleDateString()
                          : "-"}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            onClick={() => handleEdit(eq)}
                            variant="outline"
                            size="sm"
                            className="gap-2"
                          >
                            <Edit className="h-3.5 w-3.5" />
                            Edit
                          </Button>
                          <Button
                            onClick={() => handleDelete(eq)}
                            variant="destructive"
                            size="sm"
                            className="gap-2"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {showModal && (
        <EquipmentModal
          room={room}
          equipment={editingEquipment}
          categories={categories}
          onClose={() => setShowModal(false)}
          onSave={onEquipmentUpdated}
        />
      )}

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={closeConfirmDialog}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        description={confirmDialog.description}
        confirmText={confirmDialog.confirmText}
        variant={confirmDialog.variant}
      />
    </div>
  );
}
