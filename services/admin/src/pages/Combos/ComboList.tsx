import { useState, useEffect } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { SearchAddBar } from "@/components/ui/SearchAddBar";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { ComboTable, ComboFormDialog } from "@/components/combos";
import { useComboManager } from "@/hooks/useComboManager";
import type {
  ComboWithItems,
  CreateComboRequest,
} from "@/types/ComboType/comboType";
import { Package, Search, X } from "lucide-react";

export const ComboList = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedCombo, setSelectedCombo] = useState<ComboWithItems | null>(
    null,
  );
  const [filteredCombos, setFilteredCombos] = useState<ComboWithItems[]>([]);

  const {
    combos,
    loading,
    saving,
    confirmDialog,
    loadData,
    handleCreateCombo,
    handleUpdateCombo,
    handleDeleteCombo,
    closeConfirmDialog,
  } = useComboManager();

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filter combos based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredCombos(combos);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = combos.filter(
        (combo) =>
          combo.name.toLowerCase().includes(query) ||
          combo.description.toLowerCase().includes(query) ||
          combo.items?.some((item) => item.name.toLowerCase().includes(query)),
      );
      setFilteredCombos(filtered);
    }
  }, [combos, searchQuery]);

  const handleOpenCreateDialog = () => {
    setSelectedCombo(null);
    setDialogOpen(true);
  };

  const handleOpenEditDialog = (combo: ComboWithItems) => {
    setSelectedCombo(combo);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedCombo(null);
  };

  const handleSubmit = async (
    comboRequest: CreateComboRequest,
    items: Array<{ id?: string; name: string; quantity: number }>,
  ) => {
    if (selectedCombo) {
      return await handleUpdateCombo(selectedCombo.id, comboRequest, items);
    } else {
      return await handleCreateCombo(comboRequest, items);
    }
  };

  const handleDelete = (combo: ComboWithItems) => {
    handleDeleteCombo(combo.id, combo.name);
  };

  if (loading) {
    return <LoadingSpinner message="Loading combos..." />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Combo Management"
        description="Manage your cinema combo packages and offerings"
      />

      {/* Search and Actions Bar */}
      <SearchAddBar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        placeholder="Search by combo name, description, or item..."
        totalCount={combos.length}
        filteredCount={filteredCombos.length}
        icon={<Package className="w-4 h-4" />}
        label="combos"
        buttonText="Add Combo"
        onAddClick={handleOpenCreateDialog}
      />

      {/* Combo Table */}
      {searchQuery.trim() && filteredCombos.length === 0 && !loading ? (
        <div className="flex flex-col items-center justify-center py-12 text-center border border-border rounded-lg bg-card">
          <Search className="w-12 h-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">
            No combos found
          </h3>
          <p className="text-muted-foreground mb-4">
            No combos match your search for "{searchQuery}"
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
        <ComboTable
          combos={filteredCombos}
          isLoading={loading}
          onEdit={handleOpenEditDialog}
          onDelete={handleDelete}
        />
      )}

      {/* Combo Form Dialog */}
      <ComboFormDialog
        isOpen={dialogOpen}
        onClose={handleCloseDialog}
        onSubmit={handleSubmit}
        combo={selectedCombo}
        isLoading={saving}
      />

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={closeConfirmDialog}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        description={confirmDialog.description}
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
        loading={saving}
      />
    </div>
  );
};
