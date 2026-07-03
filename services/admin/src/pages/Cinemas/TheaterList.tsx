import { useState, useEffect } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { SearchAddBar } from "@/components/ui/SearchAddBar";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { CinemaTable, CinemaFormDialog } from "@/components/cinemas";
import { useCinemaManager } from "@/hooks/useCinemaManager";
import type {
  Cinema,
  CreateCinemaRequest,
} from "@/types/CinemaType/cinemaType";
import { Theater, Search, X } from "lucide-react";

export function TheaterList() {
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedCinema, setSelectedCinema] = useState<Cinema | null>(null);
  const [filteredCinemas, setFilteredCinemas] = useState<Cinema[]>([]);

  const {
    cinemas,
    loading,
    saving,
    confirmDialog,
    loadData,
    handleCreateCinema,
    handleUpdateCinema,
    handleDeleteCinema,
    closeConfirmDialog,
  } = useCinemaManager();

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filter cinemas based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredCinemas(cinemas);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = cinemas.filter(
        (cinema) =>
          cinema.name.toLowerCase().includes(query) ||
          cinema.address.toLowerCase().includes(query) ||
          cinema.city.toLowerCase().includes(query),
      );
      setFilteredCinemas(filtered);
    }
  }, [cinemas, searchQuery]);

  const handleOpenCreateDialog = () => {
    setSelectedCinema(null);
    setDialogOpen(true);
  };

  const handleOpenEditDialog = (cinema: Cinema) => {
    setSelectedCinema(cinema);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedCinema(null);
  };

  const handleSubmit = async (request: CreateCinemaRequest) => {
    if (selectedCinema) {
      return await handleUpdateCinema(selectedCinema.id, request);
    } else {
      return await handleCreateCinema(request);
    }
  };

  const handleDelete = (cinema: Cinema) => {
    handleDeleteCinema(cinema.id, cinema.name);
  };

  if (loading) {
    return <LoadingSpinner message="Loading cinemas..." />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cinemas Management"
        description="Manage your cinema locations and information"
      />

      {/* Search and Actions Bar */}
      <SearchAddBar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        placeholder="Search by cinema name, address, or city..."
        totalCount={cinemas.length}
        filteredCount={filteredCinemas.length}
        icon={<Theater className="w-4 h-4" />}
        label="cinemas"
        buttonText="Add Cinema"
        onAddClick={handleOpenCreateDialog}
      />

      {/* Cinema Table */}
      {searchQuery.trim() && filteredCinemas.length === 0 && !loading ? (
        <div className="flex flex-col items-center justify-center py-12 text-center border border-border rounded-lg bg-card">
          <Search className="w-12 h-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">
            No cinemas found
          </h3>
          <p className="text-muted-foreground mb-4">
            No cinemas match your search for "{searchQuery}"
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
        <CinemaTable
          cinemas={filteredCinemas}
          isLoading={loading}
          onEdit={handleOpenEditDialog}
          onDelete={handleDelete}
        />
      )}

      {/* Cinema Form Dialog */}
      <CinemaFormDialog
        isOpen={dialogOpen}
        onClose={handleCloseDialog}
        onSubmit={handleSubmit}
        cinema={selectedCinema}
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
}
