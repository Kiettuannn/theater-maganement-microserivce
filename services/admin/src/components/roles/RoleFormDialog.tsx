import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Shield } from "lucide-react";
import type { Role, RoleRequest } from "@/services/roleService";
import { ROUTES } from "@/routes/routes";

interface RoleFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (request: RoleRequest) => Promise<boolean>;
  role?: Role | null;
  saving?: boolean;
}

export function RoleFormDialog({
  isOpen,
  onClose,
  onSubmit,
  role,
  saving = false,
}: RoleFormDialogProps) {
  const navigate = useNavigate();

  const [formData, setFormData] = useState<RoleRequest>({
    name: "",
    description: "",
    permissions: [],
  });

  useEffect(() => {
    if (role) {
      setFormData({
        name: role.name,
        description: role.description,
        permissions: role.permissions.map((p) => p.name),
      });
    } else {
      setFormData({
        name: "",
        description: "",
        permissions: [],
      });
    }
  }, [role, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await onSubmit({
      ...formData,
      // Keep existing permissions when updating
      permissions: role ? role.permissions.map((p) => p.name) : [],
    });
    if (success) {
      onClose();
    }
  };

  const handleManagePermissions = () => {
    onClose();
    navigate(ROUTES.PERMISSIONS);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={role ? "Edit Role" : "Create New Role"}
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Role Name <span className="text-red-500">*</span>
            </label>
            <Input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="e.g., MANAGER"
              required
              disabled={!!role || saving}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Role name must be unique and in UPPERCASE
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Description <span className="text-red-500">*</span>
            </label>
            <Input
              type="text"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="e.g., Manager Role"
              required
              disabled={saving}
            />
            <p className="text-xs text-muted-foreground mt-1">
              A brief description of this role's purpose
            </p>
          </div>
        </div>

        {/* Info Box for Permissions */}
        {role && (
          <div className="bg-muted/50 border rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Shield className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold mb-1">Manage Permissions</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  This role currently has {role.permissions.length}{" "}
                  permission(s). To modify permissions, use the dedicated
                  Permission Matrix page.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleManagePermissions}
                  className="gap-2"
                >
                  <Shield className="w-4 h-4" />
                  Go to Permission Matrix
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Info message for new roles */}
        {!role && (
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
            <p className="text-sm text-blue-600 dark:text-blue-400">
              <strong>Note:</strong> After creating this role, you can assign
              permissions through the Permission Matrix page.
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? "Saving..." : role ? "Update Role" : "Create Role"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
