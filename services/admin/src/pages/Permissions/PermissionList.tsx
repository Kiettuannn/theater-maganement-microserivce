import { useState, useEffect, Fragment } from "react";
import { Card } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { PageHeader } from "@/components/ui/PageHeader";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import {
  SearchBar,
  PermissionStats,
  RoleHeaderCell,
  FeatureHeaderCell,
  PermissionCheckbox,
  FeaturePermissionToggle,
  EmptyRolesState,
} from "@/components/permissions";
import { usePermissionManager } from "@/hooks/usePermissionManager";
import { cn } from "@/utils/cn";
import { FEATURES, ACTIONS } from "@/constants/features";

export function PermissionList() {
  const [searchQuery, setSearchQuery] = useState("");

  const {
    permissions,
    roles,
    loading,
    syncing,
    updatingCell,
    confirmDialog,
    loadData,
    handleSyncPermissions,
    roleHasPermission,
    handleToggleAllForRole,
    handleTogglePermission,
    closeConfirmDialog,
  } = usePermissionManager();

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filter features based on search query
  const filteredFeatures = FEATURES.filter((feature) =>
    feature.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Clear search
  const handleClearSearch = () => {
    setSearchQuery("");
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Role Permissions"
        description="Configure access permissions for each role"
      />

      {/* Search and Actions Bar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          onClear={handleClearSearch}
          placeholder="Search features..."
        />

        <PermissionStats
          rolesCount={roles.length}
          permissionsCount={permissions.length}
          onSync={handleSyncPermissions}
          isSyncing={syncing}
        />
      </div>

      <Card className="overflow-hidden">
        {loading ? (
          <div className="p-12">
            <LoadingSpinner
              message="Loading permissions..."
              size="lg"
              fullScreen={false}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-muted/50">
                  <th className="sticky left-0 z-20 bg-muted/50 border-r border-b border-border p-3 text-left font-semibold text-sm min-w-[200px]">
                    Features
                  </th>
                  {roles.map((role) => (
                    <RoleHeaderCell key={role.name} role={role} />
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredFeatures.map((feature) => {
                  return (
                    <Fragment key={feature.id}>
                      {/* Feature Header Row */}
                      <tr className="bg-accent/30">
                        <FeatureHeaderCell
                          label={feature.label}
                          icon={feature.icon}
                          iconColor={feature.color}
                          iconBgColor={feature.bgColor}
                        />
                        {/* Bulk action buttons for each feature/role */}
                        {roles.map((role) => {
                          // Check if all permissions for this feature are enabled
                          const featurePermissions = ACTIONS.map(
                            (action) => `${feature.id}_${action.id}`
                          );
                          const allEnabled = featurePermissions.every((perm) =>
                            roleHasPermission(role, perm)
                          );
                          const bulkCellKey = `bulk-${role.name}-${feature.id}`;
                          const isUpdating = updatingCell === bulkCellKey;

                          return (
                            <td
                              key={`${feature.id}-${role.name}-header`}
                              className="border-b border-border p-2 text-center bg-accent/10"
                            >
                              <FeaturePermissionToggle
                                allEnabled={allEnabled}
                                isUpdating={isUpdating}
                                onToggle={(enable) =>
                                  handleToggleAllForRole(
                                    role,
                                    enable,
                                    feature.id
                                  )
                                }
                              />
                            </td>
                          );
                        })}
                      </tr>
                      {/* Action Rows */}
                      {ACTIONS.map((action, idx) => {
                        const permissionName = `${feature.id}_${action.id}`;
                        return (
                          <tr
                            key={`${feature.id}-${action.id}`}
                            className={cn(
                              "hover:bg-accent/20 transition-colors",
                              idx === ACTIONS.length - 1 && "border-b-2"
                            )}
                          >
                            <td className="sticky left-0 z-10 bg-background border-r border-b border-border p-3 text-sm">
                              <div className="pl-8">{action.label}</div>
                            </td>
                            {roles.map((role) => {
                              const isChecked = roleHasPermission(
                                role,
                                permissionName
                              );
                              const cellKey = `${role.name}-${permissionName}`;
                              const isUpdating = updatingCell === cellKey;

                              return (
                                <td
                                  key={role.name}
                                  className="border-b border-border p-3 text-center"
                                >
                                  <PermissionCheckbox
                                    checked={isChecked}
                                    disabled={isUpdating}
                                    onChange={() =>
                                      handleTogglePermission(
                                        role,
                                        permissionName,
                                        isChecked
                                      )
                                    }
                                  />
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {roles.length === 0 && !loading && <EmptyRolesState />}

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
