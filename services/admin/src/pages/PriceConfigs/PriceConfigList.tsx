import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SearchAddBar } from "@/components/ui/SearchAddBar";
import { PageHeader } from "@/components/ui/PageHeader";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { PriceConfigFormDialog, DefaultSeatPrices } from "@/components/priceConfigs";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { usePriceConfigManager } from "@/hooks/usePriceConfigManager";
import type { PriceConfig, PriceConfigRequest } from "@/types/PriceConfigType/priceConfig";
import { Pencil, Trash2 } from "lucide-react";
import {
  getSeatTypeLabel,
  getDayTypeLabel,
  getTimeSlotLabel,
} from "@/constants/priceConfig";

export function PriceConfigList() {
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedPriceConfig, setSelectedPriceConfig] =
    useState<PriceConfig | null>(null);

  const {
    priceConfigs,
    seatTypes,
    loading,
    saving,
    confirmDialog,
    loadData,
    handleCreatePriceConfig,
    handleUpdatePriceConfig,
    openDeleteConfirmDialog,
    closeConfirmDialog,
  } = usePriceConfigManager();

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredPriceConfigs = priceConfigs.filter((pc) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      pc.seatTypeName.toLowerCase().includes(searchLower) ||
      pc.dayType.toLowerCase().includes(searchLower) ||
      pc.timeSlot.toLowerCase().includes(searchLower) ||
      pc.price.toString().includes(searchQuery)
    );
  });

  const handleOpenCreateDialog = () => {
    setSelectedPriceConfig(null);
    setDialogOpen(true);
  };

  const handleOpenEditDialog = (priceConfig: PriceConfig) => {
    setSelectedPriceConfig(priceConfig);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedPriceConfig(null);
  };

  const handleSubmit = async (
    priceConfigId: string | null,
    request: PriceConfigRequest
  ): Promise<boolean> => {
    if (priceConfigId) {
      return await handleUpdatePriceConfig(priceConfigId, request);
    } else {
      return await handleCreatePriceConfig(request);
    }
  };

  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  const getConfigDescription = (pc: PriceConfig): string => {
    return `${getSeatTypeLabel(pc.seatTypeName)} - ${getDayTypeLabel(
      pc.dayType
    )} - ${getTimeSlotLabel(pc.timeSlot)}`;
  };

  if (loading) {
    return <LoadingSpinner message="Loading price configurations..." />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Seat Price Management"
        description="Configure seat pricing based on type, day, and time"
      />

      {/* Default Seat Prices */}
      <DefaultSeatPrices seatTypes={seatTypes} onUpdate={loadData} />

      {/* Search and Actions Bar */}
      <SearchAddBar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        placeholder="Search price configurations..."
        totalCount={priceConfigs.length}
        filteredCount={filteredPriceConfigs.length}
        label="price configurations"
        buttonText="Add Price Config"
        onAddClick={handleOpenCreateDialog}
      />

      {/* Price Configs Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold">
                  Seat Type
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold">
                  Day Type
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold">
                  Time Slot
                </th>
                <th className="px-4 py-3 text-right text-sm font-semibold">
                  Price
                </th>
                <th className="px-4 py-3 text-center text-sm font-semibold w-32">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredPriceConfigs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                    {searchQuery
                      ? "No price configurations found matching your search"
                      : "No price configurations yet. Click 'Add Price Config' to create one."}
                  </td>
                </tr>
              ) : (
                filteredPriceConfigs.map((priceConfig) => (
                  <tr
                    key={priceConfig.id}
                    className="hover:bg-muted/30 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <span className="font-medium">
                        {getSeatTypeLabel(priceConfig.seatTypeName)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                        {getDayTypeLabel(priceConfig.dayType)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300">
                        {priceConfig.timeSlot}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="font-semibold text-green-600 dark:text-green-400">
                        {formatPrice(priceConfig.price)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenEditDialog(priceConfig)}
                          className="h-8 w-8 p-0"
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            openDeleteConfirmDialog(
                              priceConfig.id,
                              getConfigDescription(priceConfig)
                            )
                          }
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Form Dialog */}
      <PriceConfigFormDialog
        isOpen={dialogOpen}
        onClose={handleCloseDialog}
        onSubmit={handleSubmit}
        priceConfig={selectedPriceConfig}
        seatTypes={seatTypes}
        saving={saving}
      />

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={closeConfirmDialog}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        description={confirmDialog.description}
        variant="destructive"
      />
    </div>
  );
}
