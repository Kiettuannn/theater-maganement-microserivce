import { useState, useCallback } from "react";
import {
  getAllCustomers,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  type CustomerRequest,
} from "@/services/customerService";
import { useNotificationStore } from "@/stores";
import { useConfirmDialog } from "./useConfirmDialog";
import type { CustomerProfile } from "@/types/CustomerType/CustomerProfile";

export function useCustomerManager() {
  const [customers, setCustomers] = useState<CustomerProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const { confirmDialog, showConfirmDialog, closeConfirmDialog } =
    useConfirmDialog();

  const addNotification = useNotificationStore(
    (state) => state.addNotification
  );

  // Load all customers
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const customersData = await getAllCustomers();
      setCustomers(customersData);
    } catch (error: any) {
      addNotification({
        type: "error",
        title: "Error",
        message: error?.response?.data?.message || "Failed to load customers",
      });
    } finally {
      setLoading(false);
    }
  }, [addNotification]);

  // Create new customer
  const handleCreateCustomer = useCallback(
    async (request: CustomerRequest): Promise<boolean> => {
      try {
        setSaving(true);
        const newCustomer = await createCustomer(request);
        setCustomers((prev) => [...prev, newCustomer]);
        addNotification({
          type: "success",
          title: "Success",
          message: `Customer "${request.firstName} ${request.lastName}" created successfully`,
        });
        return true;
      } catch (error: any) {
        addNotification({
          type: "error",
          title: "Error",
          message: error?.response?.data?.message || "Failed to create customer",
        });
        return false;
      } finally {
        setSaving(false);
      }
    },
    [addNotification]
  );

  // Update customer
  const handleUpdateCustomer = useCallback(
    async (customerId: string, request: Partial<CustomerRequest>): Promise<boolean> => {
      try {
        setSaving(true);
        const updatedCustomer = await updateCustomer(customerId, request);
        setCustomers((prev) =>
          prev.map((c) => (c.customerId === customerId ? updatedCustomer : c))
        );
        addNotification({
          type: "success",
          title: "Success",
          message: "Customer updated successfully",
        });
        return true;
      } catch (error: any) {
        addNotification({
          type: "error",
          title: "Error",
          message: error?.response?.data?.message || "Failed to update customer",
        });
        return false;
      } finally {
        setSaving(false);
      }
    },
    [addNotification]
  );

  // Delete customer
  const handleDeleteCustomer = useCallback(
    async (customerId: string, customerName: string): Promise<void> => {
      showConfirmDialog({
        title: "Delete Customer",
        description: `Are you sure you want to delete customer "${customerName}"? This action cannot be undone.`,
        confirmText: "Delete",
        variant: "destructive",
        onConfirm: async () => {
          try {
            setSaving(true);
            await deleteCustomer(customerId);
            setCustomers((prev) => prev.filter((c) => c.customerId !== customerId));
            addNotification({
              type: "success",
              title: "Success",
              message: "Customer deleted successfully",
            });
            closeConfirmDialog();
          } catch (error: any) {
            addNotification({
              type: "error",
              title: "Error",
              message:
                error?.response?.data?.message || "Failed to delete customer",
            });
          } finally {
            setSaving(false);
          }
        },
      });
    },
    [showConfirmDialog, closeConfirmDialog, addNotification]
  );

  return {
    customers,
    loading,
    saving,
    confirmDialog,
    loadData,
    handleCreateCustomer,
    handleUpdateCustomer,
    handleDeleteCustomer,
    closeConfirmDialog: closeConfirmDialog,
  };
}
