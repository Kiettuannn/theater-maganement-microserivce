import {
  Film,
  Calendar,
  Ticket,
  LayoutDashboard,
  Briefcase,
  TicketCheck,
  ShoppingBag,
  Receipt,
  BarChart3,
  DoorOpen,
  CalendarClock,
  Wrench,
  MessageSquare,
  Image,
  Bell,
  FileText,
  History,
} from "lucide-react";
import { ROUTES } from "@/constants/routes";
import { PERMISSIONS } from "@/constants/permissions";
import type { PermissionType } from "@/constants/permissions";
import type { LucideIcon } from "lucide-react";

export interface MenuItem {
  id: string;
  label: string;
  icon: LucideIcon;
  path?: string;
  children?: MenuItem[];
  requiredPermissions?: PermissionType[];
}

export const MENU_ITEMS: MenuItem[] = [
  {
    id: "overview",
    label: "Dashboard",
    icon: LayoutDashboard,
    path: ROUTES.DASHBOARD,
  },
  {
    id: "movies",
    label: "Movies",
    icon: Film,
    path: ROUTES.MOVIES,
    requiredPermissions: [PERMISSIONS.MOVIE_READ],
  },
  {
    id: "rooms",
    label: "Rooms",
    icon: DoorOpen,
    path: ROUTES.ROOMS,
    requiredPermissions: [PERMISSIONS.ROOM_READ],
  },
  {
    id: "notifications",
    label: "Notifications",
    icon: Bell,
    requiredPermissions: [PERMISSIONS.STAFF_READ],
    children: [
      {
        id: "notifications-list",
        label: "Notifications",
        icon: Bell,
        path: ROUTES.NOTIFICATIONS_LIST,
        requiredPermissions: [PERMISSIONS.STAFF_READ],
      },
      {
        id: "notifications-templates",
        label: "Templates",
        icon: FileText,
        path: ROUTES.NOTIFICATIONS_TEMPLATES,
        requiredPermissions: [PERMISSIONS.STAFF_READ],
      },
      {
        id: "notifications-logs",
        label: "Logs",
        icon: History,
        path: ROUTES.NOTIFICATIONS_LOGS,
        requiredPermissions: [PERMISSIONS.STAFF_READ],
      },
    ],
  },
  {
    id: "showtimes",
    label: "Showtimes",
    icon: Calendar,
    path: ROUTES.SHOWTIMES,
    requiredPermissions: [PERMISSIONS.SHOWTIME_READ],
  },
  {
    id: "bookings",
    label: "Bookings",
    icon: Briefcase,
    path: ROUTES.BOOKINGS,
    requiredPermissions: [PERMISSIONS.BOOKING_READ],
  },
  {
    id: "ticket-booking",
    label: "Ticket Booking",
    icon: TicketCheck,
    path: ROUTES.TICKET_BOOKING,
    requiredPermissions: [PERMISSIONS.TICKET_BOOKING_READ],
  },
  {
    id: "combos",
    label: "Combos",
    icon: ShoppingBag,
    path: ROUTES.COMBOS,
    requiredPermissions: [PERMISSIONS.COMBO_READ],
  },
  {
    id: "invoices",
    label: "Invoices",
    icon: Receipt,
    path: ROUTES.INVOICES,
    requiredPermissions: [PERMISSIONS.INVOICE_READ],
  },
  {
    id: "reports",
    label: "Reports",
    icon: BarChart3,
    path: ROUTES.REPORTS,
    requiredPermissions: [PERMISSIONS.REPORT_READ],
  },
  {
    id: "media",
    label: "Media Library",
    icon: Image,
    path: ROUTES.MEDIA,
  },
  {
    id: "chatbot-config",
    label: "Chatbot Config",
    icon: MessageSquare,
    path: ROUTES.CHATBOT_CONFIG,
  },
];
