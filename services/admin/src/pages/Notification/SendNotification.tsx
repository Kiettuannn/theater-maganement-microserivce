import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import type {
  NotificationRequest,
  RecipientType,
} from "@/types/NotificationType/Notification";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { X, FileText, ArrowLeft } from "lucide-react";
import {
  getAllTemplates,
  type NotificationTemplate,
} from "@/services/notificationTemplateService";
import { sendNotification } from "@/services/notificationService";
import { useNotificationStore } from "@/stores";
import { ROUTES } from "@/constants/routes";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/card";
import {
  categoryOptions,
  priorityOptions,
} from "@/constants/notificationConfig";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { getAllCustomers } from "@/services/customerService";
import { getAllStaffs } from "@/services/staffService";
import type { CustomerProfile } from "@/types/CustomerType/CustomerProfile";
import type { StaffProfile } from "@/types/StaffType/StaffProfile";

const RECIPIENT_TYPE_OPTIONS = [
  { value: "CUSTOMER", label: "Customer" },
  { value: "STAFF", label: "Staff" },
];

const CHANNEL_OPTIONS = [
  { value: "EMAIL", label: "Email" },
  { value: "IN_APP", label: "In-App" },
];

export const SendNotification = () => {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<NotificationTemplate[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const [selectedTemplate, setSelectedTemplate] =
    useState<NotificationTemplate | null>(null);
  const [sending, setSending] = useState(false);
  const addNotification = useNotificationStore(
    (state) => state.addNotification,
  );

  // States for users/staffs list
  const [customers, setCustomers] = useState<CustomerProfile[]>([]);
  const [staffs, setStaffs] = useState<StaffProfile[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [openCombobox, setOpenCombobox] = useState(false);

  const [formData, setFormData] = useState<NotificationRequest>({
    templateCode: "",
    recipientIds: [], // Changed to array for multi-select
    recipientType: "CUSTOMER",
    category: "BOOKING",
    channels: ["EMAIL", "IN_APP"],
    metadata: {},
    priority: "HIGH",
  });

  const [metadataFields, setMetadataFields] = useState<Record<string, string>>(
    {},
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load templates from database
  useEffect(() => {
    const loadTemplates = async () => {
      try {
        setLoadingTemplates(true);
        const data = await getAllTemplates();
        setTemplates(data);

        // Set first template as default if available
        if (data.length > 0) {
          setFormData((prev) => ({
            ...prev,
            templateCode: data[0].templateCode,
            // Keep the default priority (HIGH) instead of overwriting with template priority
          }));
          setSelectedTemplate(data[0]);
          extractTemplateVariables(data[0]);
        }
      } catch (error: any) {
        addNotification({
          type: "error",
          title: "Error",
          message: error?.response?.data?.message || "Failed to load templates",
        });
      } finally {
        setLoadingTemplates(false);
      }
    };

    loadTemplates();
  }, [addNotification]);

  // Extract variables from template (e.g., {{customerName}}, {{movieName}})
  const extractTemplateVariables = (template: NotificationTemplate) => {
    const combined = `${template.titleTemplate} ${template.contentTemplate}`;
    const regex = /\{\{(\w+)\}\}/g;
    const variables = new Set<string>();
    let match;

    while ((match = regex.exec(combined)) !== null) {
      variables.add(match[1]);
    }

    // Initialize metadata fields with empty values
    const fields: Record<string, string> = {};
    variables.forEach((variable) => {
      fields[variable] = metadataFields[variable] || "";
    });
    setMetadataFields(fields);
  };

  // Load users based on recipient type
  useEffect(() => {
    const loadUsers = async () => {
      try {
        setLoadingUsers(true);
        if (formData.recipientType === "CUSTOMER") {
          const data = await getAllCustomers();
          setCustomers(data);
          setStaffs([]); // Clear staff list
        } else if (formData.recipientType === "STAFF") {
          const data = await getAllStaffs();
          setStaffs(data);
          setCustomers([]); // Clear customer list
        }
      } catch (error: any) {
        addNotification({
          type: "error",
          title: "Error",
          message: error?.response?.data?.message || "Failed to load users",
        });
      } finally {
        setLoadingUsers(false);
      }
    };

    loadUsers();
  }, [formData.recipientType, addNotification]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = e.target;

    // If template is changed, update selected template only (keep user's priority selection)
    if (name === "templateCode") {
      const template = templates.find((t) => t.templateCode === value);
      setSelectedTemplate(template || null);
      if (template) {
        extractTemplateVariables(template);
      }
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    } else if (name === "recipientType") {
      // Clear recipientIds when changing recipientType
      setFormData((prev) => ({
        ...prev,
        recipientType: value as RecipientType,
        recipientIds: [],
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const toggleChannel = (channel: string) => {
    setFormData((prev) => ({
      ...prev,
      channels: prev.channels.includes(channel)
        ? prev.channels.filter((c) => c !== channel)
        : [...prev.channels, channel],
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.templateCode.trim()) {
      newErrors.templateCode = "Template is required";
    }

    if (!formData.recipientIds || formData.recipientIds.length === 0) {
      newErrors.recipientIds = "At least one recipient is required";
    }

    if (formData.recipientIds && formData.recipientIds.length > 1000) {
      newErrors.recipientIds =
        "Cannot send to more than 1000 recipients at once";
    }

    if (formData.channels.length === 0) {
      newErrors.channels = "At least one channel must be selected";
    }

    // Validate metadata fields - check if required fields are filled
    Object.keys(metadataFields).forEach((key) => {
      if (!metadataFields[key]?.trim()) {
        newErrors[`metadata_${key}`] = `${key} is required`;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    // Convert metadata fields to JSON object
    const metadata = { ...metadataFields };

    // Prepare request payload
    const requestPayload = {
      ...formData,
      metadata,
    };

    console.log("Sending notification with payload:", requestPayload);

    try {
      setSending(true);
      const results = await sendNotification(requestPayload);

      const count = results.length;
      addNotification({
        type: "success",
        title: "Success",
        message: `Notification${count > 1 ? "s" : ""} sent successfully to ${count} recipient${count > 1 ? "s" : ""}`,
      });

      navigate(ROUTES.NOTIFICATIONS_LIST);
    } catch (error: any) {
      addNotification({
        type: "error",
        title: "Error",
        message:
          error?.response?.data?.message || "Failed to send notification",
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Send Notification"
        description="Create and send a new notification"
      />

      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            {/* Template Code */}
            <div className="space-y-2">
              <Label htmlFor="templateCode">
                Template <span className="text-destructive">*</span>
              </Label>
              <select
                id="templateCode"
                name="templateCode"
                value={formData.templateCode}
                onChange={handleChange}
                disabled={loadingTemplates || templates.length === 0}
                className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 ${
                  errors.templateCode ? "border-destructive" : ""
                }`}
              >
                {loadingTemplates ? (
                  <option>Loading templates...</option>
                ) : templates.length === 0 ? (
                  <option>No templates available</option>
                ) : (
                  templates.map((template) => (
                    <option key={template.id} value={template.templateCode}>
                      {template.templateCode}
                    </option>
                  ))
                )}
              </select>
              {errors.templateCode && (
                <p className="text-sm text-destructive">
                  {errors.templateCode}
                </p>
              )}
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {categoryOptions.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Recipient Type */}
            <div className="space-y-2">
              <Label htmlFor="recipientType">Recipient Type</Label>
              <select
                id="recipientType"
                name="recipientType"
                value={formData.recipientType}
                onChange={handleChange}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {RECIPIENT_TYPE_OPTIONS.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Recipients - Multi-select with Search */}
            <div className="space-y-2">
              <Label htmlFor="recipientIds">
                Recipients <span className="text-destructive">*</span>
                {formData.recipientIds.length > 0 && (
                  <span className="ml-2 text-xs text-muted-foreground">
                    ({formData.recipientIds.length} selected)
                  </span>
                )}
              </Label>

              <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
                <PopoverTrigger asChild>
                  <div
                    className={cn(
                      "flex min-h-10 w-full items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm cursor-pointer",
                      errors.recipientIds && "border-destructive",
                      loadingUsers && "opacity-50 cursor-not-allowed",
                    )}
                    onClick={(e) => {
                      // Prevent opening popover when clicking on X icon
                      const target = e.target as HTMLElement;
                      if (target.closest("svg")) {
                        e.preventDefault();
                        e.stopPropagation();
                        return;
                      }
                    }}
                  >
                    {/* Selected recipients badges inside input */}
                    <div className="flex flex-wrap gap-1.5 flex-1">
                      {formData.recipientIds.length > 0 ? (
                        formData.recipientIds.map((recipientId) => {
                          const user =
                            formData.recipientType === "CUSTOMER"
                              ? customers.find(
                                  (c) => c.accountId === recipientId,
                                )
                              : staffs.find((s) => s.accountId === recipientId);

                          return user ? (
                            <Badge
                              key={recipientId}
                              variant="secondary"
                              className="gap-1 h-6 px-2"
                            >
                              <span className="text-xs">{user.email}</span>
                              <X
                                className="w-3 h-3 cursor-pointer hover:text-destructive"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  e.preventDefault();
                                  setFormData((prev) => ({
                                    ...prev,
                                    recipientIds: prev.recipientIds.filter(
                                      (id) => id !== recipientId,
                                    ),
                                  }));
                                }}
                              />
                            </Badge>
                          ) : null;
                        })
                      ) : (
                        <span className="text-muted-foreground">
                          {loadingUsers
                            ? "Loading users..."
                            : formData.recipientType === "CUSTOMER"
                              ? "Select customers..."
                              : "Select staff..."}
                        </span>
                      )}
                    </div>
                    <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
                  </div>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" align="start">
                  <Command>
                    <CommandInput
                      placeholder={
                        formData.recipientType === "CUSTOMER"
                          ? "Search customer..."
                          : "Search staff..."
                      }
                    />
                    <CommandList>
                      <CommandEmpty>
                        No{" "}
                        {formData.recipientType === "CUSTOMER"
                          ? "customer"
                          : "staff"}{" "}
                        found.
                      </CommandEmpty>
                      <CommandGroup>
                        {formData.recipientType === "CUSTOMER"
                          ? customers.map((customer) => {
                              const isSelected = formData.recipientIds.includes(
                                customer.accountId,
                              );
                              return (
                                <CommandItem
                                  key={customer.accountId}
                                  value={`${customer.firstName} ${customer.lastName} ${customer.email}`}
                                  onSelect={() => {
                                    setFormData((prev) => ({
                                      ...prev,
                                      recipientIds: isSelected
                                        ? prev.recipientIds.filter(
                                            (id) => id !== customer.accountId,
                                          )
                                        : [
                                            ...prev.recipientIds,
                                            customer.accountId,
                                          ],
                                    }));
                                    if (errors.recipientIds) {
                                      setErrors((prev) => ({
                                        ...prev,
                                        recipientIds: "",
                                      }));
                                    }
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      isSelected ? "opacity-100" : "opacity-0",
                                    )}
                                  />
                                  {customer.firstName} {customer.lastName} (
                                  {customer.email})
                                </CommandItem>
                              );
                            })
                          : staffs.map((staff) => {
                              const isSelected = formData.recipientIds.includes(
                                staff.accountId,
                              );
                              return (
                                <CommandItem
                                  key={staff.accountId}
                                  value={`${staff.firstName} ${staff.lastName} ${staff.email}`}
                                  onSelect={() => {
                                    setFormData((prev) => ({
                                      ...prev,
                                      recipientIds: isSelected
                                        ? prev.recipientIds.filter(
                                            (id) => id !== staff.accountId,
                                          )
                                        : [
                                            ...prev.recipientIds,
                                            staff.accountId,
                                          ],
                                    }));
                                    if (errors.recipientIds) {
                                      setErrors((prev) => ({
                                        ...prev,
                                        recipientIds: "",
                                      }));
                                    }
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      isSelected ? "opacity-100" : "opacity-0",
                                    )}
                                  />
                                  {staff.firstName} {staff.lastName} (
                                  {staff.email})
                                </CommandItem>
                              );
                            })}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              {errors.recipientIds && (
                <p className="text-sm text-destructive">
                  {errors.recipientIds}
                </p>
              )}
            </div>

            {/* Priority */}
            <div className="space-y-2 col-span-2">
              <Label htmlFor="priority">Priority</Label>
              <select
                id="priority"
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {priorityOptions.map((priority) => (
                  <option key={priority.value} value={priority.value}>
                    {priority.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Channels */}
            <div className="space-y-2 col-span-2">
              <Label>
                Channels <span className="text-destructive">*</span>
              </Label>
              <div className="flex flex-wrap gap-2">
                {CHANNEL_OPTIONS.map((channel) => (
                  <Badge
                    key={channel.value}
                    variant={
                      formData.channels.includes(channel.value)
                        ? "default"
                        : "outline"
                    }
                    className="cursor-pointer"
                    onClick={() => toggleChannel(channel.value)}
                  >
                    {channel.label}
                    {formData.channels.includes(channel.value) && (
                      <X className="w-3 h-3 ml-1" />
                    )}
                  </Badge>
                ))}
              </div>
              {errors.channels && (
                <p className="text-sm text-destructive">{errors.channels}</p>
              )}
            </div>

            {/* Metadata Fields - Dynamic based on template variables */}
            {Object.keys(metadataFields).length > 0 && (
              <div className="space-y-4 col-span-2 p-4 border border-border rounded-lg bg-muted/10">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <FileText className="w-4 h-4" />
                  Template Variables
                  <span className="text-xs text-muted-foreground font-normal">
                    Fill in the values for the template placeholders
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {Object.keys(metadataFields).map((key) => (
                    <div key={key} className="space-y-2">
                      <Label htmlFor={`metadata_${key}`}>
                        {key} <span className="text-destructive">*</span>
                      </Label>
                      <input
                        type="text"
                        id={`metadata_${key}`}
                        value={metadataFields[key]}
                        onChange={(e) => {
                          setMetadataFields((prev) => ({
                            ...prev,
                            [key]: e.target.value,
                          }));
                          // Clear error when user starts typing
                          if (errors[`metadata_${key}`]) {
                            setErrors((prev) => ({
                              ...prev,
                              [`metadata_${key}`]: "",
                            }));
                          }
                        }}
                        placeholder={`Enter ${key}...`}
                        className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                          errors[`metadata_${key}`] ? "border-destructive" : ""
                        }`}
                      />
                      {errors[`metadata_${key}`] && (
                        <p className="text-sm text-destructive">
                          {errors[`metadata_${key}`]}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Template Preview */}
            {selectedTemplate && (
              <div className="space-y-3 col-span-2 p-4 border border-border rounded-lg bg-muted/30">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <FileText className="w-4 h-4" />
                  Template Preview
                </div>
                <div className="space-y-2">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">
                      Title Template:
                    </p>
                    <p className="text-sm bg-background p-2 rounded border border-border">
                      {selectedTemplate.titleTemplate}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">
                      Content Template:
                    </p>
                    <div
                      className="text-sm bg-background p-2 rounded border border-border min-h-[100px]"
                      dangerouslySetInnerHTML={{
                        __html: selectedTemplate.contentTemplate,
                      }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(ROUTES.NOTIFICATIONS_LIST)}
              className="cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button type="submit" disabled={sending} className="cursor-pointer">
              {sending ? "Sending..." : "Send Notification"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
