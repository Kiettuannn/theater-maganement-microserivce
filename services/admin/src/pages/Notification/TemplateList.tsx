import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { SearchAddBar } from "@/components/ui/SearchAddBar";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useNotificationStore } from "@/stores";
import { useConfirmDialog } from "@/hooks/useConfirmDialog";
import {
  getAllTemplates,
  deleteTemplate,
} from "@/services/notificationTemplateService";
import type { NotificationTemplate } from "@/services/notificationTemplateService";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Pencil, Trash2 } from "lucide-react";
import { ROUTES } from "@/constants/routes";
import { PageHeader } from "@/components/ui/PageHeader";

export const TemplateList = () => {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<NotificationTemplate[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<
    NotificationTemplate[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const addNotification = useNotificationStore(
    (state) => state.addNotification,
  );
  const {
    confirmDialog,
    showConfirmDialog,
    closeConfirmDialog,
    setLoading: setDialogLoading,
  } = useConfirmDialog();

  useEffect(() => {
    loadTemplates();
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredTemplates(templates);
    } else {
      const filtered = templates.filter((template) => {
        const query = searchQuery.toLowerCase();
        return (
          template.titleTemplate.toLowerCase().includes(query) ||
          template.templateCode.toLowerCase().includes(query) ||
          template.contentTemplate.toLowerCase().includes(query)
        );
      });
      setFilteredTemplates(filtered);
    }
  }, [templates, searchQuery]);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const data = await getAllTemplates();
      console.log("Fetched templates:", data);
      setTemplates(data);
    } catch (error: any) {
      addNotification({
        type: "error",
        title: "Error",
        message: error?.response?.data?.message || "Failed to load templates",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    navigate(ROUTES.NOTIFICATIONS_TEMPLATE_ADD);
  };

  const handleEdit = (template: NotificationTemplate) => {
    navigate(ROUTES.NOTIFICATIONS_TEMPLATE_EDIT.replace(":id", template.id));
  };

  const handleDelete = (template: NotificationTemplate) => {
    showConfirmDialog({
      title: "Delete Template",
      description: `Are you sure you want to delete template "${template.titleTemplate}"? This action cannot be undone.`,
      confirmText: "Delete",
      variant: "destructive",
      onConfirm: async () => {
        try {
          setDialogLoading(true);
          await deleteTemplate(template.id);
          setTemplates((prev) => prev.filter((t) => t.id !== template.id));
          addNotification({
            type: "success",
            title: "Success",
            message: "Template deleted successfully",
          });
          closeConfirmDialog();
        } catch (error: any) {
          setDialogLoading(false);
          addNotification({
            type: "error",
            title: "Error",
            message:
              error?.response?.data?.message || "Failed to delete template",
          });
        }
      },
    });
  };

  if (loading) {
    return <LoadingSpinner message="Loading templates..." />;
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Notification Templates"
        description="Manage notification templates for various use cases"
      />
      <div className="space-y-4">
        <SearchAddBar
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onAddClick={handleCreate}
          buttonText="Add Template"
          placeholder="Search templates..."
          totalCount={templates.length}
          filteredCount={filteredTemplates.length}
          label="templates"
        />

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Title Template</TableHead>
                <TableHead>Content Preview</TableHead>
                <TableHead>Created At</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTemplates.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center text-muted-foreground"
                  >
                    No templates found
                  </TableCell>
                </TableRow>
              ) : (
                filteredTemplates.map((template) => (
                  <TableRow key={template.id}>
                    <TableCell className="font-medium">
                      {template.templateCode}
                    </TableCell>
                    <TableCell>{template.titleTemplate}</TableCell>
                    <TableCell className="max-w-xs truncate">
                      {template.contentTemplate.substring(0, 50)}...
                    </TableCell>
                    <TableCell>
                      {new Date(template.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(template)}
                          className="cursor-pointer"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(template)}
                          className="cursor-pointer"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <ConfirmDialog
          isOpen={confirmDialog.isOpen}
          onClose={closeConfirmDialog}
          onConfirm={confirmDialog.onConfirm}
          title={confirmDialog.title}
          description={confirmDialog.description}
          confirmText={confirmDialog.confirmText || "Confirm"}
          cancelText="Cancel"
          variant={confirmDialog.variant || "destructive"}
          loading={confirmDialog.loading}
        />
      </div>
    </div>
  );
};
