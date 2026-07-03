import { useEffect, useMemo, useState } from "react";
import { PlusCircle, RefreshCw, Clock3, Pencil, Trash } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/stores/useAuthStore";
import { useNotificationStore } from "@/stores/useNotificationStore";
import { workScheduleService } from "@/services/workScheduleService";
import type { ShiftTemplate } from "@/services/workScheduleService";
import { Modal } from "@/components/ui/Modal";
import { cn } from "@/lib/utils";

type FormState = {
  name: string;
  startTime: string;
  endTime: string;
};

const emptyForm: FormState = {
  name: "",
  startTime: "08:00",
  endTime: "12:00",
};

export function ShiftTypesPage() {
  const cinemaId = useAuthStore((s) => s.cinemaId ?? "");
  const addNotification = useNotificationStore((s) => s.addNotification);

  const [templates, setTemplates] = useState<ShiftTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [workingId, setWorkingId] = useState<string | null>(null);

  const normalizeTime = (time?: string) => (time || "").slice(0, 5);

  const sortedTemplates = useMemo(
    () => [...templates]
      .filter((t) => !t.deleted)
      .sort((a, b) => normalizeTime(a.startTime).localeCompare(normalizeTime(b.startTime))),
    [templates]
  );

  const loadTemplates = async () => {
    if (!cinemaId) {
      setTemplates([]);
      addNotification({
        type: "error",
        title: "Cinema not found",
        message: "Please sign in again or verify your account details.",
        duration: 3500,
      });
      return;
    }
    setIsLoading(true);
    try {
      const data = await workScheduleService.getShiftTemplates(cinemaId);
      setTemplates(data ?? []);
    } catch (error) {
      console.error(error);
      addNotification({
        type: "error",
        title: "Unable to load shift types",
        message: "Please try again or check your connection.",
        duration: 4000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTemplates();
  }, [cinemaId]);

  const openCreateModal = () => {
    setEditingId(null);
    setForm(emptyForm);
    setIsModalOpen(true);
  };

  const openEditModal = (tpl: ShiftTemplate) => {
    setEditingId(tpl.id);
    setForm({
      name: tpl.name,
      startTime: normalizeTime(tpl.startTime),
      endTime: normalizeTime(tpl.endTime),
    });
    setIsModalOpen(true);
  };

  const submitForm = async () => {
    if (!cinemaId) {
      addNotification({
        type: "error",
        title: "Cinema not set",
        message: "Cannot save shift types without selecting a cinema.",
        duration: 3500,
      });
      return;
    }
    setIsSaving(true);
    try {
      if (editingId) {
        const updated = await workScheduleService.updateShiftTemplate(cinemaId, editingId, {
          name: form.name,
          startTime: form.startTime,
          endTime: form.endTime,
        });
        setTemplates((prev) => prev.map((t) => (t.id === editingId ? updated : t)));
        addNotification({
          type: "success",
          title: "Shift updated",
          message: "The shift type was updated successfully.",
          duration: 3000,
        });
      } else {
        const created = await workScheduleService.createShiftTemplate(cinemaId, {
          name: form.name,
          startTime: form.startTime,
          endTime: form.endTime,
        });
        setTemplates((prev) => [...prev, created]);
        addNotification({
          type: "success",
          title: "Shift created",
          message: "A new shift type was added.",
          duration: 3000,
        });
      }
      setIsModalOpen(false);
    } catch (error) {
      console.error(error);
      addNotification({
        type: "error",
        title: "Failed to save shift type",
        message: "Please verify the details and try again.",
        duration: 4000,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const deleteTemplate = async (tpl: ShiftTemplate) => {
    if (!cinemaId) {
      addNotification({
        type: "error",
        title: "Cinema not set",
        message: "Cannot delete shift types without selecting a cinema.",
        duration: 3000,
      });
      return;
    }
    setWorkingId(tpl.id);
    try {
      await workScheduleService.deleteShiftTemplate(cinemaId, tpl.id);
      setTemplates((prev) => prev.filter((t) => t.id !== tpl.id));
      addNotification({
        type: "success",
        title: "Shift deleted",
        message: tpl.name,
        duration: 2500,
      });
    } catch (error) {
      console.error(error);
      addNotification({
        type: "error",
        title: "Failed to delete shift",
        message: "Please try again later.",
        duration: 3500,
      });
    } finally {
      setWorkingId(null);
    }
  };

  const handleChange = (field: keyof FormState, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Shift Types"
        description="Manage shift definitions, time ranges, and activation status."
      />

      <Card>
        <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>Shift list</CardTitle>
            <CardDescription>Applied to cinema: {cinemaId || "Not set"}</CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" onClick={loadTemplates} disabled={isLoading || !cinemaId}>
              <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
              Reload
            </Button>
            <Button size="sm" onClick={openCreateModal} disabled={!cinemaId}>
              <PlusCircle className="h-4 w-4" />
              Add shift
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {!cinemaId ? (
            <p className="text-sm text-muted-foreground">
              Cannot show shifts because the cinema is not selected.
            </p>
          ) : isLoading ? (
            <p className="text-sm text-muted-foreground">Loading shift types...</p>
          ) : sortedTemplates.length === 0 ? (
            <p className="text-sm text-muted-foreground">No shift types yet. Add one to get started.</p>
          ) : (
            <div className="space-y-3">
              {sortedTemplates.map((tpl) => (
                <div
                  key={tpl.id}
                  className="flex flex-col gap-3 rounded-lg border p-3 md:flex-row md:items-center md:justify-between"
                >
                  <div className="flex items-center gap-3">
                    <Clock3 className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm font-semibold text-foreground">{tpl.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {normalizeTime(tpl.startTime)} - {normalizeTime(tpl.endTime)}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => openEditModal(tpl)}>
                      <Pencil className="h-4 w-4" />
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive"
                      onClick={() => deleteTemplate(tpl)}
                      disabled={workingId === tpl.id}
                    >
                      <Trash className="h-4 w-4" />
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingId ? "Edit shift type" : "Add shift type"}
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Shift name</Label>
            <Input
              id="name"
              value={form.name}
              onChange={(e) => handleChange("name", e.target.value)}
              placeholder="Example: Morning Shift"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="startTime">Start</Label>
              <Input
                id="startTime"
                type="time"
                value={form.startTime}
                onChange={(e) => handleChange("startTime", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endTime">End</Label>
              <Input
                id="endTime"
                type="time"
                value={form.endTime}
                onChange={(e) => handleChange("endTime", e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsModalOpen(false)} disabled={isSaving}>
              Cancel
            </Button>
            <Button onClick={submitForm} disabled={isSaving || !form.name}>
              {isSaving ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
