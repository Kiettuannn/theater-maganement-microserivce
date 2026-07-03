import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SearchAddBar } from "@/components/ui/SearchAddBar";
import { PageHeader } from "@/components/ui/PageHeader";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { RoleFormDialog } from "@/components/roles/RoleFormDialog";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useRoleManager } from "@/hooks/useRoleManager";
import { ROUTES } from "@/constants/routes";
import type { Role } from "@/services/roleService";
import { Plus, Pencil, Trash2, Shield, ShieldCheck } from "lucide-react";

export function RoleList() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);

  const {
    roles,
    loading,
    saving,
    confirmDialog,
    loadData,
    handleCreateRole,
    handleUpdateRole,
    handleDeleteRole,
    closeConfirmDialog,
  } = useRoleManager();

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredRoles = roles.filter(
    (role) =>
      role.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      role.description.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleOpenCreateDialog = () => {
    setSelectedRole(null);
    setDialogOpen(true);
  };

  const handleOpenEditDialog = (role: Role) => {
    setSelectedRole(role);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedRole(null);
  };

  const handleSubmit = async (request: any) => {
    if (selectedRole) {
      return await handleUpdateRole(selectedRole.name, request);
    } else {
      return await handleCreateRole(request);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Roles Management"
        description="Manage system roles and their permissions"
      />

      {/* Search and Actions Bar */}
      <SearchAddBar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        placeholder="Search roles..."
        totalCount={roles.length}
        filteredCount={filteredRoles.length}
        icon={<Shield className="w-4 h-4" />}
        label="roles"
        buttonText="Create Role"
        onAddClick={handleOpenCreateDialog}
      />
      <Button
        variant="outline"
        onClick={() => navigate(ROUTES.PERMISSIONS)}
        className="gap-2 mt-2"
      >
        <ShieldCheck className="w-4 h-4" />
        Permission Matrix
      </Button>

      {/* Roles Grid */}
      {loading ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12">
          <LoadingSpinner
            message="Loading roles..."
            size="lg"
            fullScreen={false}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRoles.map((role) => (
            <Card
              key={role.name}
              className="p-6 hover:shadow-lg transition-shadow"
            >
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Shield className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{role.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {role.description}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Permissions Count */}
                <div className="flex items-center gap-2 text-sm">
                  <div className="px-3 py-1 bg-muted rounded-full">
                    {role.permissions.length} permissions
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-2 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 gap-2"
                    onClick={() => handleOpenEditDialog(role)}
                  >
                    <Pencil className="w-3 h-3" />
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="flex-1 gap-2"
                    onClick={() =>
                      handleDeleteRole(role.name, role.description)
                    }
                  >
                    <Trash2 className="w-3 h-3" />
                    Delete
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {filteredRoles.length === 0 && (
        <Card className="p-12">
          <div className="flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
              <Shield className="w-8 h-8 text-muted-foreground" />
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-2">
                {searchQuery ? "No roles found" : "No roles yet"}
              </h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery
                  ? "Try adjusting your search query"
                  : "Create your first role to get started"}
              </p>
              {!searchQuery && (
                <Button onClick={handleOpenCreateDialog} className="gap-2">
                  <Plus className="w-4 h-4" />
                  Create First Role
                </Button>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Role Form Dialog */}
      <RoleFormDialog
        isOpen={dialogOpen}
        onClose={handleCloseDialog}
        onSubmit={handleSubmit}
        role={selectedRole}
        saving={saving}
      />

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={closeConfirmDialog}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        description={confirmDialog.description}
        confirmText={confirmDialog.confirmText || "Confirm"}
        cancelText="Cancel"
        variant={confirmDialog.variant || "destructive"}
      />
    </div>
  );
}
