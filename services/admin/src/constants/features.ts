import {
  Film,
  Calendar,
  Theater,
  Ticket,
  Users,
  UserCog,
  Shield,
  Settings,
  Briefcase,
  Receipt,
  ShoppingBag,
  BarChart3,
  TicketCheck,
  DoorOpen,
  Wrench,
  CalendarClock,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface Feature {
  id: string;
  label: string;
  icon: LucideIcon;
  description: string;
  color: string;
  bgColor: string;
}

export const FEATURES: readonly Feature[] = [
  {
    id: "MOVIE",
    label: "Movies Management",
    icon: Film,
    description: "Manage movie information",
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
  },
  {
    id: "CINEMAS",
    label: "Cinemas Management",
    icon: Theater,
    description: "Manage cinemas and seats",
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
  },
  {
    id: "CUSTOMER",
    label: "Customers Management",
    icon: Users,
    description: "Manage customer information",
    color: "text-cyan-500",
    bgColor: "bg-cyan-500/10",
  },
  {
    id: "STAFF",
    label: "Staff Management",
    icon: UserCog,
    description: "Manage staff accounts",
    color: "text-pink-500",
    bgColor: "bg-pink-500/10",
  },
  {
    id: "SHOWTIME",
    label: "Showtimes Management",
    icon: Calendar,
    description: "Manage movie schedules",
    color: "text-green-500",
    bgColor: "bg-green-500/10",
  },
  {
    id: "BOOKING",
    label: "Bookings Management",
    icon: Briefcase,
    description: "Manage bookings and reservations",
    color: "text-amber-500",
    bgColor: "bg-amber-500/10",
  },
  {
    id: "TICKET_BOOKING",
    label: "Ticket Booking",
    icon: TicketCheck,
    description: "Book tickets for customers",
    color: "text-teal-500",
    bgColor: "bg-teal-500/10",
  },
  {
    id: "TICKET",
    label: "Tickets Management",
    icon: Ticket,
    description: "Manage sold tickets",
    color: "text-orange-500",
    bgColor: "bg-orange-500/10",
  },
  {
    id: "COMBO",
    label: "Combos Management",
    icon: ShoppingBag,
    description: "Manage food & drink combos",
    color: "text-indigo-500",
    bgColor: "bg-indigo-500/10",
  },
  {
    id: "INVOICE",
    label: "Invoices Management",
    icon: Receipt,
    description: "Manage payment invoices",
    color: "text-emerald-500",
    bgColor: "bg-emerald-500/10",
  },
  {
    id: "REPORT",
    label: "Reports",
    icon: BarChart3,
    description: "View reports and statistics",
    color: "text-violet-500",
    bgColor: "bg-violet-500/10",
  },
  {
    id: "ROOM",
    label: "Rooms Management",
    icon: DoorOpen,
    description: "Manage rooms and seating",
    color: "text-violet-500",
    bgColor: "bg-violet-500/10",
  },
  {
    id: "ROLE",
    label: "Roles Management",
    icon: Shield,
    description: "Manage roles and permissions",
    color: "text-red-500",
    bgColor: "bg-red-500/10",
  },
  {
    id: "SYSTEM",
    label: "System Configuration",
    icon: Settings,
    description: "Manage system settings",
    color: "text-gray-500",
    bgColor: "bg-gray-500/10",
  },
  {
    id: "EQUIPMENT",
    label: "Equipment Management",
    icon: Wrench,
    description: "Manage cinema equipment",
    color: "text-yellow-500",
    bgColor: "bg-yellow-500/10",
  },
  {
    id: "WORK_SCHEDULE",
    label: "Work Schedule Management",
    icon: CalendarClock,
    description: "Manage staff work schedules",
    color: "text-lime-500",
    bgColor: "bg-lime-500/10",
  },
] as const;

export interface Action {
  id: string;
  label: string;
  description: string;
}

export const ACTIONS: readonly Action[] = [
  { id: "CREATE", label: "Create", description: "Create new" },
  { id: "READ", label: "View", description: "View details" },
  { id: "UPDATE", label: "Edit", description: "Update" },
  { id: "DELETE", label: "Delete", description: "Delete" },
] as const;
