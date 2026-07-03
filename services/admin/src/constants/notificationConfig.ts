export const statusConfig = {
  SENT: {
    label: "Sent",
    value: "SENT",
    className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  },
  PENDING: {
    label: "Pending",
    value: "PENDING",
    className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  },
  FAILED: {
    label: "Failed",
    value: "FAILED",
    className: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  },
} as const;

export const priorityConfig = {
  URGENT: {
    label: "Urgent",
    value: "URGENT",
    className: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  },
  HIGH: {
    label: "High",
    value: "HIGH",
    className: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
  },
  NORMAL: {
    label: "Normal",
    value: "NORMAL",
    className: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  },
} as const;

export const categoryConfig = {
  BOOKING: { label: "Booking", value: "BOOKING" },
  SYSTEM: { label: "System", value: "SYSTEM" },
} as const;

// Export arrays for select options
export const statusOptions = Object.values(statusConfig).map((config) => ({
  label: config.label,
  value: config.value,
}));

export const priorityOptions = Object.values(priorityConfig).map((config) => ({
  label: config.label,
  value: config.value,
}));

export const categoryOptions = Object.values(categoryConfig).map((config) => ({
  label: config.label,
  value: config.value,
}));

// Type exports
export type NotificationStatus = keyof typeof statusConfig;
export type NotificationPriority = keyof typeof priorityConfig;
export type NotificationCategory = keyof typeof categoryConfig;
