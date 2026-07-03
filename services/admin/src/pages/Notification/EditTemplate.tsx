import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { RichTextEditor } from "@/components/ui/RichTextEditor";
import {
  getTemplateById,
  updateTemplate,
} from "@/services/notificationTemplateService";
import type {
  NotificationTemplateRequest,
  NotificationTemplate,
} from "@/services/notificationTemplateService";
import { useNotificationStore } from "@/stores";
import { ROUTES } from "@/constants/routes";
import { ArrowLeft } from "lucide-react";

export const EditTemplate = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [template, setTemplate] = useState<NotificationTemplate | null>(null);
  const addNotification = useNotificationStore(
    (state) => state.addNotification,
  );

  const [formData, setFormData] = useState<NotificationTemplateRequest>({
    templateCode: "",
    titleTemplate: "",
    contentTemplate: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!id) {
      navigate(ROUTES.NOTIFICATIONS_TEMPLATES);
      return;
    }

    const loadTemplate = async () => {
      try {
        setLoading(true);
        const data = await getTemplateById(id);
        setTemplate(data);
        setFormData({
          templateCode: data.templateCode,
          titleTemplate: data.titleTemplate,
          contentTemplate: data.contentTemplate,
        });
      } catch (error: any) {
        addNotification({
          type: "error",
          title: "Error",
          message: error?.response?.data?.message || "Failed to load template",
        });
        navigate(ROUTES.NOTIFICATIONS_TEMPLATES);
      } finally {
        setLoading(false);
      }
    };

    loadTemplate();
  }, [id, navigate, addNotification]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.templateCode.trim()) {
      newErrors.templateCode = "Template code is required";
    }

    if (!formData.titleTemplate.trim()) {
      newErrors.titleTemplate = "Title template is required";
    }

    if (!formData.contentTemplate.trim()) {
      newErrors.contentTemplate = "Content template is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm() || !id) {
      return;
    }

    try {
      setSubmitting(true);
      await updateTemplate(id, formData);

      addNotification({
        type: "success",
        title: "Success",
        message: "Template updated successfully",
      });

      navigate(ROUTES.NOTIFICATIONS_TEMPLATES);
    } catch (error: any) {
      addNotification({
        type: "error",
        title: "Error",
        message: error?.response?.data?.message || "Failed to update template",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading template..." />;
  }

  if (!template) {
    return null;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Edit Template"
        description={`Edit template: ${template.templateCode}`}
      />

      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            {/* Template Code */}
            <div className="space-y-2">
              <Label htmlFor="templateCode">
                Template Code <span className="text-destructive">*</span>
              </Label>
              <Input
                id="templateCode"
                name="templateCode"
                value={formData.templateCode}
                onChange={handleChange}
                placeholder="e.g., BOOKING_CONFIRMATION"
                className={errors.templateCode ? "border-destructive" : ""}
              />
              {errors.templateCode && (
                <p className="text-sm text-destructive">
                  {errors.templateCode}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Unique identifier for this template
              </p>
            </div>

            {/* Title Template */}
            <div className="space-y-2 col-span-2">
              <Label htmlFor="titleTemplate">
                Title Template <span className="text-destructive">*</span>
              </Label>
              <Input
                id="titleTemplate"
                name="titleTemplate"
                value={formData.titleTemplate}
                onChange={handleChange}
                placeholder="e.g., Booking Confirmation - {{bookingCode}}"
                className={errors.titleTemplate ? "border-destructive" : ""}
              />
              {errors.titleTemplate && (
                <p className="text-sm text-destructive">
                  {errors.titleTemplate}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Use {"{{"} variableName {"}"} for dynamic values
              </p>
            </div>

            {/* Content Template */}
            <div className="space-y-2 col-span-2">
              <RichTextEditor
                label="Content Template *"
                value={formData.contentTemplate}
                onChange={(content) => {
                  setFormData((prev) => ({
                    ...prev,
                    contentTemplate: content,
                  }));
                  if (errors.contentTemplate) {
                    setErrors((prev) => ({ ...prev, contentTemplate: "" }));
                  }
                }}
                height={400}
                showVariableButtons={true}
                error={errors.contentTemplate}
              />
              <p className="text-xs text-muted-foreground">
                Use {"{{"} variableName {"}"} for dynamic values. Click variable
                buttons to insert them.
              </p>
            </div>
          </div>

          {/* Preview Section */}
          <div className="space-y-3 p-4 border border-border rounded-lg bg-muted/30">
            <p className="text-sm font-medium text-foreground">Preview</p>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Title:</p>
                <p className="text-sm bg-background p-2 rounded border border-border">
                  {formData.titleTemplate || "Title will appear here..."}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Content:</p>
                <div
                  className="text-sm bg-background p-2 rounded border border-border min-h-[100px]"
                  dangerouslySetInnerHTML={{
                    __html:
                      formData.contentTemplate ||
                      "<p>Content will appear here...</p>",
                  }}
                />
              </div>
            </div>
          </div>

          {/* Metadata Info */}
          <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-900">
            <p className="text-sm text-blue-900 dark:text-blue-300">
              <strong>Note:</strong> Template created on{" "}
              {new Date(template.createdAt).toLocaleDateString()}
              {template.updatedAt !== template.createdAt && (
                <>
                  , last updated on{" "}
                  {new Date(template.updatedAt).toLocaleDateString()}
                </>
              )}
            </p>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(ROUTES.NOTIFICATIONS_TEMPLATES)}
              className="cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="cursor-pointer"
            >
              {submitting ? "Updating..." : "Update Template"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
