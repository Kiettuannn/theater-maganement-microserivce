import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { SearchAddBar } from "@/components/ui/SearchAddBar";
import { PageHeader } from "@/components/ui/PageHeader";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { StaffTable, StaffFormDialog } from "@/components/staff";
import { useStaffManager } from "@/hooks/useStaffManager";
import type { StaffProfile } from "@/types/StaffType/StaffProfile";
import type { StaffRequest } from "@/services/staffService";
import { Search, X, Users } from "lucide-react";

export const StaffList = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<StaffProfile | null>(null);
  const [filteredStaffs, setFilteredStaffs] = useState<StaffProfile[]>([]);

  const {
    staffs,
    loading,
    saving,
    confirmDialog,
    loadData,
    handleCreateStaff,
    handleUpdateStaff,
    handleDeleteStaff,
    closeConfirmDialog,
  } = useStaffManager();

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filter staffs based on search query (client-side filtering)
  useEffect(() => {
    // Safety check: ensure staffs is an array
    if (!Array.isArray(staffs)) {
      setFilteredStaffs([]);
      return;
    }

    if (!searchQuery.trim()) {
      setFilteredStaffs(staffs);
    } else {
      const filtered = staffs.filter((staff) => {
        try {
          // Safety check: ensure staff object exists
          if (!staff) return false;

          const firstName = (staff.firstName || "").toLowerCase();
          const lastName = (staff.lastName || "").toLowerCase();
          const fullName = `${firstName} ${lastName}`.trim();
          const query = searchQuery.toLowerCase();

          return (
            firstName.includes(query) ||
            lastName.includes(query) ||
            fullName.includes(query)
          );
        } catch (error) {
          console.error("Error filtering staff:", staff, error);
          return false;
        }
      });
      setFilteredStaffs(filtered);
    }
  }, [staffs, searchQuery]);

  const handleOpenCreateDialog = () => {
    setSelectedStaff(null);
    setDialogOpen(true);
  };

  const handleOpenEditDialog = (staff: StaffProfile) => {
    setSelectedStaff(staff);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedStaff(null);
  };

  const handleSubmit = async (request: StaffRequest) => {
    if (selectedStaff) {
      return await handleUpdateStaff(selectedStaff.staffId, request);
    } else {
      return await handleCreateStaff(request);
    }
  };

  const handleDelete = (staff: StaffProfile) => {
    handleDeleteStaff(staff.staffId, `${staff.firstName} ${staff.lastName}`);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Staff Management"
        description="Manage your cinema staff members"
      />

      {/* Search and Actions Bar */}
      <SearchAddBar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        placeholder="Search by staff name (first name or last name)..."
        totalCount={staffs.length}
        filteredCount={filteredStaffs.length}
        icon={<Users className="w-4 h-4" />}
        label="staffs"
        buttonText="Add Staff"
        onAddClick={handleOpenCreateDialog}
      />

      {/* Staff Table */}
      {loading ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12">
          <LoadingSpinner
            message="Loading staffs..."
            size="lg"
            fullScreen={false}
          />
        </div>
      ) : searchQuery.trim() && filteredStaffs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Search className="w-12 h-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">
            No staff found
          </h3>
          <p className="text-muted-foreground mb-4">
            No staff members match your search for "{searchQuery}"
          </p>
          <Button
            variant="outline"
            onClick={() => setSearchQuery("")}
            className="gap-2"
          >
            <X className="w-4 h-4" />
            Clear search
          </Button>
        </div>
      ) : (
        <StaffTable
          staffs={filteredStaffs}
          isLoading={loading}
          onEdit={handleOpenEditDialog}
          onDelete={handleDelete}
          updatingCell={saving ? "updating" : undefined}
        />
      )}

      {/* Staff Form Dialog */}
      <StaffFormDialog
        isOpen={dialogOpen}
        onClose={handleCloseDialog}
        onSubmit={handleSubmit}
        staff={selectedStaff}
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
};
