import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, CalendarClock, PenSquare, PlusCircle, Trash2, X } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Modal } from "@/components/ui/Modal";
import { useAuthStore } from "@/stores/useAuthStore";
import { useNotificationStore } from "@/stores/useNotificationStore";
import { getStaffsByCinemaWithRoleStaff } from "@/services/staffService";
import { workScheduleService } from "@/services/workScheduleService";
import type { ShiftTemplate, WorkScheduleResponse } from "@/services/workScheduleService";
import type { StaffProfile } from "@/types/StaffType/StaffProfile";
import { usePermissions } from "@/hooks/usePermissions";
import { PERMISSIONS } from "@/constants/permissions";

type StaffMember = {
  id: string;
  name: string;
  role?: string;
  cinemaId?: string | null;
};

type ShiftAssignment = {
  scheduleId: string;
  userId: string;
  userName?: string;
};

type ShiftSlot = {
  id: string;
  templateId: string;
  name: string;
  startTime: string;
  endTime: string;
  assignments: ShiftAssignment[];
};

type DaySchedule = {
  date: string;
  slots: ShiftSlot[];
};

type SlotSelector = { date: string; slotId: string } | null;

const toInputDate = (date: Date) => date.toISOString().slice(0, 10);

const startOfWeek = (date: Date) => {
  const clone = new Date(date);
  const day = clone.getDay();
  const diff = clone.getDate() - day + (day === 0 ? -6 : 1);
  clone.setDate(diff);
  return clone;
};

const buildWeekDates = (startDate: Date) => {
  const dates: string[] = [];
  for (let i = 0; i < 7; i += 1) {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + i);
    dates.push(toInputDate(d));
  }
  return dates;
};

const formatDayLabel = (dateStr: string) => {
  const date = new Date(`${dateStr}T00:00:00`);
  return {
    weekday: date.toLocaleDateString("en-US", { weekday: "short" }),
    day: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
  };
};

const formatTimeLabel = (time?: string) => {
  if (!time) return "--:--";
  return time.slice(0, 5);
};

const mapStaffProfileToMember = (staff: StaffProfile): StaffMember => {
  const fullName = [staff.firstName, staff.lastName].filter(Boolean).join(" ").trim();
  return {
    id: staff.staffId || staff.accountId,
    name: fullName || staff.username || staff.email,
    role: staff.jobTitle || undefined,
    cinemaId: staff.cinemaId,
  };
};

const buildScheduleFromApi = (
  dates: string[],
  templates: ShiftTemplate[],
  schedules: WorkScheduleResponse[]
): DaySchedule[] => {
  const templateMap = new Map(templates.map((t) => [t.id, t]));

  const schedulesByDate = new Map<string, WorkScheduleResponse[]>();
  schedules.forEach((item) => {
    const dateKey = typeof item.workDate === "string" ? item.workDate : toInputDate(new Date(item.workDate));
    const list = schedulesByDate.get(dateKey) ?? [];
    list.push(item);
    schedulesByDate.set(dateKey, list);
  });

  return dates.map((date) => {
    const daySchedules = schedulesByDate.get(date) ?? [];
    // Khi một ngày không có lịch làm nào, để trống phần slot
    if (!daySchedules.length) {
      return { date, slots: [] };
    }

    const slots = Array.from(
      daySchedules
        .reduce((map, sched) => {
          const existing = map.get(sched.shiftTypeId) ?? [];
          existing.push(sched);
          map.set(sched.shiftTypeId, existing);
          return map;
        }, new Map<string, WorkScheduleResponse[]>())
        .entries()
    )
      .map(([shiftTypeId, items]) => {
        const tpl = templateMap.get(shiftTypeId);
        const start = tpl?.startTime || items[0]?.shiftStart;
        const end = tpl?.endTime || items[0]?.shiftEnd;
        return {
          id: `${shiftTypeId}-${date}`,
          templateId: shiftTypeId,
          name: tpl?.name || items[0]?.shiftTypeName || "Shift",
          startTime: formatTimeLabel(start),
          endTime: formatTimeLabel(end),
          assignments: items.map((m) => ({
            scheduleId: m.id,
            userId: m.userId,
            userName: m.userName,
          })),
        };
      })
      .sort((a, b) => (a.startTime || "").localeCompare(b.startTime || ""));

    return { date, slots };
  });
};

export function WorkSchedulePage() {
  const [weekStart, setWeekStart] = useState<Date>(startOfWeek(new Date()));
  const [schedule, setSchedule] = useState<DaySchedule[]>([]);
  const [shiftTemplates, setShiftTemplates] = useState<ShiftTemplate[]>([]);
  const [staffPool, setStaffPool] = useState<StaffMember[]>([]);
  const [selector, setSelector] = useState<SlotSelector>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createForm, setCreateForm] = useState<{ date: string; shiftTypeId: string; userIds: string[] }>({
    date: toInputDate(new Date()),
    shiftTypeId: "",
    userIds: [],
  });
  const [editContext, setEditContext] = useState<{ date: string; shiftTypeId: string; shiftName: string } | null>(null);
  const [editForm, setEditForm] = useState<{ date: string; shiftTypeId: string }>({
    date: toInputDate(new Date()),
    shiftTypeId: "",
  });
  const [editStaffIds, setEditStaffIds] = useState<string[]>([]);
  const [editStaffInitialIds, setEditStaffInitialIds] = useState<string[]>([]);
  const [deleteContext, setDeleteContext] = useState<{ date: string; shiftTypeId: string; shiftName: string } | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdatingShift, setIsUpdatingShift] = useState(false);
  const [isDeletingShift, setIsDeletingShift] = useState(false);

  const weekDates = useMemo(() => buildWeekDates(weekStart), [weekStart]);
  const authCinemaId = useAuthStore((state) => state.cinemaId ?? "");
  const cinemaId = authCinemaId;
  const addNotification = useNotificationStore((state) => state.addNotification);
  const { hasPermission } = usePermissions();
  const canCreateSchedule = hasPermission(PERMISSIONS.WORK_SCHEDULE_CREATE);
  const canUpdateSchedule = hasPermission(PERMISSIONS.WORK_SCHEDULE_CREATE);
  const canDeleteSchedule = hasPermission(PERMISSIONS.WORK_SCHEDULE_DELETE);

  const refreshWeekData = useCallback(
    async (startDate: Date) => {
      if (!cinemaId) {
        setStaffPool([]);
        setSchedule([]);
        return;
      }

      const dates = buildWeekDates(startDate);
      setIsLoading(true);

      try {
        const staffPromise = getStaffsByCinemaWithRoleStaff(cinemaId).catch(() => [] as StaffProfile[]);
        const [templatesData, scheduleData, staffData] = await Promise.all([
          workScheduleService.getShiftTemplates(cinemaId),
          workScheduleService.getSchedules(cinemaId, dates[0], dates[6]),
          staffPromise,
        ]);

        const filteredStaff = (staffData ?? [])
          .map(mapStaffProfileToMember)
          .filter((member) => member.cinemaId === cinemaId);

        const templates = (templatesData ?? []).filter((t) => !t.deleted);
        const schedules = scheduleData ?? [];

        setStaffPool(filteredStaff);
        setShiftTemplates(templates);
        setCreateForm((prev) => ({
          ...prev,
          shiftTypeId: prev.shiftTypeId || templates[0]?.id || "",
          date: prev.date || dates[0],
        }));
        setSchedule(buildScheduleFromApi(dates, templates, schedules));
      } catch (error) {
        console.error(error);
        addNotification({
          type: "error",
          title: "Unable to load schedules",
          message: "Please try again or check the server connection.",
          duration: 4500,
        });
      } finally {
        setIsLoading(false);
      }
    },
    [addNotification, cinemaId]
  );

  useEffect(() => {
    refreshWeekData(weekStart);
  }, [refreshWeekData, weekStart]);

  const staffMap = useMemo(() => {
    const map = new Map<string, StaffMember>();
    staffPool.forEach((s) => map.set(s.id, s));
    return map;
  }, [staffPool]);

  const totalShifts = schedule.reduce((acc, day) => acc + day.slots.length, 0);
  const totalAssignments = schedule.reduce(
    (acc, day) => acc + day.slots.reduce((s, slot) => s + slot.assignments.length, 0),
    0
  );
  const isPublished = totalAssignments > 0;

  const moveWeek = (direction: "prev" | "next") => {
    const delta = direction === "prev" ? -7 : 7;
    const nextStart = new Date(weekStart);
    nextStart.setDate(weekStart.getDate() + delta);
    setWeekStart(nextStart);
    setSelector(null);
  };

  const selectedSlotInfo = useMemo(() => {
    if (!selector) return null;
    const day = schedule.find((d) => d.date === selector.date);
    if (!day) return null;
    const slot = day.slots.find((s) => s.id === selector.slotId);
    if (!slot) return null;
    return { day, slot };
  }, [schedule, selector]);

  // Keep track of staff selection when editing a slot (no API calls until save)
  useEffect(() => {
    if (selector && selectedSlotInfo) {
      const current = selectedSlotInfo.slot.assignments.map((a) => a.userId);
      setEditStaffIds(current);
      setEditStaffInitialIds(current);
    } else {
      setEditStaffIds([]);
      setEditStaffInitialIds([]);
    }
  }, [selector, selectedSlotInfo]);

  const toggleStaffSelection = (staffId: string) => {
    setEditStaffIds((prev) => {
      const exists = prev.includes(staffId);
      return exists ? prev.filter((id) => id !== staffId) : [...prev, staffId];
    });
  };

  const openCreateDialog = () => {
    if (!canCreateSchedule) return;
    setCreateForm({
      date: weekDates[0] ?? toInputDate(new Date()),
      shiftTypeId: shiftTemplates[0]?.id ?? "",
      userIds: [],
    });
    setCreateModalOpen(true);
  };

  const toggleCreateStaff = (staffId: string) => {
    setCreateForm((prev) => {
      const exists = prev.userIds.includes(staffId);
      return {
        ...prev,
        userIds: exists ? prev.userIds.filter((id) => id !== staffId) : [...prev.userIds, staffId],
      };
    });
  };

  const handleCreateSchedule = async () => {
    if (!canCreateSchedule) return;
    if (!createForm.shiftTypeId || !createForm.date || createForm.userIds.length === 0) {
      addNotification({
        type: "error",
        title: "Lack of information",
        message: "Please choose a date, shift, and at least one staff member.",
        duration: 4000,
      });
      return;
    }
    setIsCreating(true);

    if (!cinemaId) {
      addNotification({
        type: "error",
        title: "Cinema not set",
        message: "Cannot create a schedule without selecting a cinema.",
        duration: 3500,
      });
      setIsCreating(false);
      return;
    }
    try {
      await workScheduleService.createSchedules(cinemaId, {
        userIds: createForm.userIds,
        shiftTypeId: createForm.shiftTypeId,
        workDate: createForm.date,
      });
      addNotification({
        type: "success",
        title: "Schedule created",
        message: "The schedule has been updated.",
        duration: 3500,
      });
      setCreateModalOpen(false);
      refreshWeekData(weekStart);
    } catch (error) {
      console.error(error);
      addNotification({
        type: "error",
        title: "Failed to create schedule",
        message: "Please check your data and try again.",
        duration: 4500,
      });
    } finally {
      setIsCreating(false);
    }
  };

  const openEditDialog = (date: string, shiftTypeId: string, shiftName: string, slotId: string) => {
    if (!canUpdateSchedule) return;
    setEditContext({ date, shiftTypeId, shiftName });
    setEditForm({ date, shiftTypeId });
    setSelector({ date, slotId });
  };

  const handleUpdateShift = async () => {
    if (!canUpdateSchedule) return;
    if (!editContext || !selectedSlotInfo) return;

    const payload: { shiftTypeId?: string; workDate?: string } = {};
    if (editForm.shiftTypeId !== editContext.shiftTypeId) {
      payload.shiftTypeId = editForm.shiftTypeId;
    }
    if (editForm.date !== editContext.date) {
      payload.workDate = editForm.date;
    }

    const initialStaffIds = editStaffInitialIds;
    const currentStaffIds = editStaffIds;
    const toAdd = currentStaffIds.filter((id) => !initialStaffIds.includes(id));
    const toRemove = initialStaffIds.filter((id) => !currentStaffIds.includes(id));

    if (!payload.shiftTypeId && !payload.workDate && toAdd.length === 0 && toRemove.length === 0) {
      setSelector(null);
      setEditContext(null);
      return;
    }
    setIsUpdatingShift(true);

    if (!cinemaId) {
      addNotification({
        type: "error",
        title: "Cinema not set",
        message: "Cannot update a shift without a cinema ID.",
        duration: 3500,
      });
      setIsUpdatingShift(false);
      return;
    }
    try {
      if (payload.shiftTypeId || payload.workDate) {
        await workScheduleService.updateShiftInstance(
          cinemaId,
          editContext.shiftTypeId,
          editContext.date,
          payload
        );
      }

      for (const userId of toRemove) {
        const assignment = selectedSlotInfo.slot.assignments.find((a) => a.userId === userId);
        if (assignment) {
          await workScheduleService.deleteSchedule(cinemaId, assignment.scheduleId);
        }
      }

      if (toAdd.length > 0) {
        await workScheduleService.createSchedules(cinemaId, {
          userIds: toAdd,
          shiftTypeId: editForm.shiftTypeId,
          workDate: editForm.date,
        });
      }

      addNotification({
        type: "success",
        title: "Changes saved",
        message: "Shift and staff updates have been applied.",
        duration: 3500,
      });
      setEditContext(null);
      setSelector(null);
      refreshWeekData(weekStart);
    } catch (error) {
      console.error(error);
      addNotification({
        type: "error",
        title: "Update failed",
        message: "Please check the data and try again.",
        duration: 4500,
      });
    } finally {
      setIsUpdatingShift(false);
    }
  };

  const handleDeleteShift = async () => {
    if (!canDeleteSchedule) return;
    if (!deleteContext) return;
    setIsDeletingShift(true);

    if (!cinemaId) {
      addNotification({
        type: "error",
        title: "Cinema not set",
        message: "Cannot delete a shift without a cinema ID.",
        duration: 3500,
      });
      setIsDeletingShift(false);
      return;
    }
    try {
      await workScheduleService.deleteShiftInstance(
        cinemaId,
        deleteContext.shiftTypeId,
        deleteContext.date
      );
      addNotification({
        type: "success",
        title: "Shift deleted",
        message: "The shift and related assignments were deleted.",
        duration: 3500,
      });
      setDeleteContext(null);
      refreshWeekData(weekStart);
    } catch (error) {
      console.error(error);
      addNotification({
        type: "error",
        title: "Delete failed",
        message: "Please try again or check your connection.",
        duration: 4500,
      });
    } finally {
      setIsDeletingShift(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Work Schedule Management"
        description="7-day weekly view with shifts and staff assignments."
      />

      <Card>
        <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>Current week</CardTitle>
            <CardDescription>
              {formatDayLabel(weekDates[0]).day} - {formatDayLabel(weekDates[6]).day}
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-3">
              <Button variant="outline" size="sm" onClick={() => moveWeek("prev")}>
                <ArrowLeft className="h-4 w-4" />
                Previous week
              </Button>
              <Button variant="outline" size="sm" onClick={() => moveWeek("next")}>
                Next week
                <ArrowRight className="h-4 w-4" />
              </Button>
            <div className="hidden md:flex items-center gap-3 text-sm text-muted-foreground">
              <CalendarClock className="h-4 w-4 text-primary" />
              <span>
                {totalShifts} shifts / {totalAssignments} assignments
              </span>
            </div>
            {canCreateSchedule && (
              <Button
                size="sm"
                className="gap-2"
                onClick={openCreateDialog}
                disabled={isLoading || !cinemaId || !shiftTemplates.length}
              >
                <PlusCircle className="h-4 w-4" />
                Create schedule
              </Button>
            )}
            <Button variant="outline" size="sm" disabled={isLoading} onClick={() => refreshWeekData(weekStart)}>
              {isLoading ? "Loading data..." : "Reload data"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            {!cinemaId && (
              <div className="py-6 text-center text-sm text-muted-foreground">
                Cannot load schedules because the cinema ID is missing.
              </div>
            )}
            {isLoading && (
              <div className="py-6 text-center text-sm text-muted-foreground">Loading data...</div>
            )}
            {!isLoading && !schedule.length && (
              <div className="py-6 text-center text-sm text-muted-foreground">No schedules found.</div>
            )}
            {schedule.length > 0 && (
              <div className="grid min-w-[980px] grid-cols-7 gap-3">
                {schedule.map((day) => {
                  const label = formatDayLabel(day.date);
                  const dayStaffCount = day.slots.reduce((acc, s) => acc + s.assignments.length, 0);
                  return (
                    <div
                      key={day.date}
                      className={cn(
                        "rounded-xl border p-3 space-y-3 transition-colors",
                        isPublished ? "bg-muted/40" : "bg-amber-50 border-amber-200"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs uppercase text-muted-foreground">{label.weekday}</p>
                          <p className="text-sm font-semibold text-foreground">{label.day}</p>
                        </div>
                        <span className="rounded-full bg-primary/10 px-2 py-1 text-[11px] font-medium text-primary">
                          {dayStaffCount} staff
                        </span>
                      </div>

                      <div className="space-y-2">
                        {day.slots.map((slot) => {
                          return (
                            <div
                              key={slot.id}
                              className={cn(
                                "relative w-full text-left rounded-lg border bg-background p-3 shadow-sm",
                                !canUpdateSchedule && "cursor-default"
                              )}
                            >
                              {(canUpdateSchedule || canDeleteSchedule) && (
                                <div className="-mr-1 -mt-1 mb-1 flex justify-end gap-1">
                                  {canUpdateSchedule && (
                                    <button
                                      className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        openEditDialog(day.date, slot.templateId, slot.name, slot.id);
                                      }}
                                      title="Edit shift & staff"
                                    >
                                      <PenSquare className="h-4 w-4" />
                                    </button>
                                  )}
                                  {canDeleteSchedule && (
                                    <button
                                      className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-destructive"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setDeleteContext({ date: day.date, shiftTypeId: slot.templateId, shiftName: slot.name });
                                      }}
                                      title="Delete shift"
                                      disabled={slot.assignments.length === 0}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  )}
                                </div>
                              )}
                              <div className="space-y-0.5">
                                <p className="text-sm font-semibold text-foreground leading-tight">{slot.name}</p>
                                <p className="text-xs text-muted-foreground whitespace-nowrap leading-tight">
                                  {slot.startTime} - {slot.endTime}
                                </p>
                              </div>
                              <div className="mt-2 flex flex-wrap gap-2">
                                {slot.assignments.map((assignment) => {
                                  const staff = staffMap.get(assignment.userId);
                                  return (
                                    <span
                                      key={assignment.scheduleId}
                                      className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
                                    >
                                      {assignment.userName || staff?.name || assignment.userId}
                                      {canUpdateSchedule && (
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            openEditDialog(day.date, slot.templateId, slot.name, slot.id);
                                          }}
                                          className="text-primary/70 hover:text-primary focus:outline-none"
                                          title="Edit shift & staff"
                                        >
                                          <X className="h-3 w-3" />
                                        </button>
                                      )}
                                    </span>
                                  );
                                })}
                                {slot.assignments.length === 0 && (
                                  <span className="text-[11px] text-muted-foreground">
                                    Use the edit icon to add staff to this shift.
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Modal isOpen={createModalOpen} onClose={() => setCreateModalOpen(false)} title="Create schedule" maxWidth="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm font-medium text-foreground">
              Work date
              <input
                type="date"
                min={toInputDate(new Date())}
                value={createForm.date}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, date: e.target.value }))}
                className="rounded-md border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm font-medium text-foreground">
              Shift
              <select
                value={createForm.shiftTypeId}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, shiftTypeId: e.target.value }))}
                className="rounded-md border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
              >
                {shiftTemplates.map((tpl) => (
                  <option key={tpl.id} value={tpl.id}>
                    {tpl.name} ({formatTimeLabel(tpl.startTime)} - {formatTimeLabel(tpl.endTime)})
                  </option>
                ))}
                {!shiftTemplates.length && <option value="">No shifts available</option>}
              </select>
            </label>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-semibold text-foreground">Staff on shift</p>
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
              {staffPool.length === 0 && (
                <p className="col-span-2 text-sm text-muted-foreground">No staff available.</p>
              )}
              {staffPool.map((staff) => {
                const checked = createForm.userIds.includes(staff.id);
                return (
                  <label
                    key={staff.id}
                    className={cn(
                      "flex items-center gap-3 rounded-lg border bg-muted/40 px-3 py-2 cursor-pointer",
                      checked && "border-primary bg-primary/10"
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleCreateStaff(staff.id)}
                      className="h-4 w-4 accent-primary"
                    />
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-foreground">{staff.name}</span>
                      <span className="text-xs text-muted-foreground">{staff.role || "Staff"}</span>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateSchedule} disabled={isCreating}>
              {isCreating ? "Saving..." : "Create schedule"}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={Boolean(deleteContext)}
        onClose={() => setDeleteContext(null)}
        title="Delete shift"
        maxWidth="sm"
      >
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete shift{" "}
            <span className="font-semibold text-foreground">{deleteContext?.shiftName}</span> on{" "}
            {deleteContext ? formatDayLabel(deleteContext.date).day : ""}? All staff in this shift will be removed.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeleteContext(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteShift} disabled={isDeletingShift}>
              {isDeletingShift ? "Deleting..." : "Delete shift"}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={Boolean(selector && selectedSlotInfo && editContext)}
        onClose={() => {
          setSelector(null);
          setEditContext(null);
        }}
        title={
          selectedSlotInfo
            ? `Edit ${selectedSlotInfo.slot.name} - ${formatDayLabel(
                selectedSlotInfo.day.date
              ).day}`
            : undefined
        }
        maxWidth="lg"
      >
        <div className="space-y-5">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm font-medium text-foreground">
              Work date
              <input
                type="date"
                value={editForm.date}
                min={toInputDate(new Date())}
                onChange={(e) => setEditForm((prev) => ({ ...prev, date: e.target.value }))}
                className="rounded-md border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm font-medium text-foreground">
              Shift
              <select
                value={editForm.shiftTypeId}
                onChange={(e) => setEditForm((prev) => ({ ...prev, shiftTypeId: e.target.value }))}
                className="rounded-md border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
              >
                {shiftTemplates.map((tpl) => (
                  <option key={tpl.id} value={tpl.id}>
                    {tpl.name} ({formatTimeLabel(tpl.startTime)} - {formatTimeLabel(tpl.endTime)})
                  </option>
                ))}
                {!shiftTemplates.length && <option value="">No shifts available</option>}
              </select>
            </label>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-semibold text-foreground">Staff in this shift</p>
            <div className="grid grid-cols-2 gap-3">
            {staffPool.length === 0 && (
              <p className="col-span-2 text-sm text-muted-foreground">No staff available.</p>
            )}
            {staffPool.map((staff) => {
              const checked = editStaffIds.includes(staff.id);
              return (
                <label
                  key={staff.id}
                  className={cn(
                    "flex items-center gap-3 rounded-lg border bg-muted/40 px-3 py-2 cursor-pointer",
                    checked && "border-primary bg-primary/10"
                  )}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    disabled={isUpdatingShift}
                    onChange={() => toggleStaffSelection(staff.id)}
                    className="h-4 w-4 accent-primary"
                  />
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-foreground">{staff.name}</span>
                    <span className="text-xs text-muted-foreground">{staff.role || "Staff"}</span>
                  </div>
                </label>
              );
            })}
          </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setSelector(null);
                setEditContext(null);
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleUpdateShift} disabled={isUpdatingShift}>
              {isUpdatingShift ? "Saving..." : "Save changes"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
