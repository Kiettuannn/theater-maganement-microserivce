import LayoutDefault from "@/components/layout/LayoutDefault";
import PrivateRoute from "@/components/PrivateRoute";
import ProtectedRoute from "@/components/ProtectedRoute";
import { DashboardOverview } from "@/pages/Dashboard/Overview";
import { Login } from "@/pages/Login/Login";
import { Profile } from "@/pages/Profile/StaffProfile";
import { PermissionList } from "@/pages/Permissions";
import { RoleList } from "@/pages/Roles";
import { PriceConfigList } from "@/pages/PriceConfigs";
import { CreateMovie, EditMovie, MovieList } from "@/pages/Movies";
import {
  ShowtimeList,
  CreateShowtime,
  ShowtimeCalendarPage,
} from "@/pages/Showtimes";
import { TheaterList } from "@/pages/Cinemas";
import { RoomList, CreateRoom, EditRoom } from "@/pages/Rooms";
import { TicketList } from "@/pages/Tickets";
import { CustomerList } from "@/pages/Customers";
import { StaffList } from "@/pages/Staff";
import {
  NotificationList,
  SendNotification,
  ViewNotification,
  AddTemplate,
  EditTemplate,
  TemplateList,
  LogList,
} from "@/pages/Notification";
import { BookingList } from "@/pages/Bookings";
import { ComboList } from "@/pages/Combos";
import { InvoiceList } from "@/pages/Invoices";
import { ReportList } from "@/pages/Reports";
import { Forbidden } from "@/pages/Forbidden";
import { NotFound } from "@/pages/NotFound";
import { PERMISSIONS } from "@/constants/permissions";
import { ROUTES } from "@/constants/routes";
import { Navigate } from "react-router-dom";
import { TicketBookingPage } from "@/pages/TicketBooking/TickKetBookingPage";
import { WorkSchedulePage } from "@/pages/WorkSchedules/WorkSchedulePage";
import { ShiftTypesPage } from "@/pages/WorkSchedules/ShiftTypesPage";
import { EquipmentList } from "@/pages/Equipment/EquipmentList";
import { ReviewList } from "@/pages/Reviews";
import MediaLibrary from "@/pages/Medias/MediaLibrary";
import { ChatbotConfig } from "@/pages/ChatbotConfig";
import { ForgotPassword } from "@/pages/ForgotPassword";
import { BufferSettings } from "@/pages/Settings/BufferSettings";

export const routes = [
  {
    path: ROUTES.LOGIN,
    element: <Login />,
  },
  {
    path: ROUTES.FORGOT_PASSWORD,
    element: <ForgotPassword />,
  },
  {
    path: `${ROUTES.FORBIDDEN}`,
    element: <Forbidden />,
  },
  {
    path: ROUTES.HOME,
    element: <PrivateRoute />,
    children: [
      {
        index: true,
        element: <Navigate to={ROUTES.DASHBOARD} replace />,
      },
      {
        element: <LayoutDefault />,
        children: [
          {
            path: `${ROUTES.DASHBOARD}`,
            element: <DashboardOverview />,
          },
          {
            path: `${ROUTES.SETTINGS_PROFILE}`,
            element: <Profile />,
          },
          {
            path: `${ROUTES.SETTINGS_BUFFER}`,
            element: <BufferSettings />,
          },
          {
            path: `${ROUTES.MOVIES}`,
            element: (
              <ProtectedRoute requiredPermissions={[PERMISSIONS.MOVIE_READ]} />
            ),
            children: [
              {
                index: true,
                element: <MovieList />,
              },
              {
                path: "create",
                element: (
                  <ProtectedRoute
                    requiredPermissions={[PERMISSIONS.MOVIE_CREATE]}
                  />
                ),
                children: [
                  {
                    index: true,
                    element: <CreateMovie />,
                  },
                ],
              },
              {
                path: "edit/:id",
                element: (
                  <ProtectedRoute
                    requiredPermissions={[PERMISSIONS.MOVIE_UPDATE]}
                  />
                ),
                children: [
                  {
                    index: true,
                    element: <EditMovie />,
                  },
                ],
              },
            ],
          },
          {
            path: `${ROUTES.SHOWTIMES}`,
            element: (
              <ProtectedRoute
                requiredPermissions={[PERMISSIONS.SHOWTIME_READ]}
              />
            ),
            children: [
              {
                index: true,
                element: <ShowtimeCalendarPage />,
              },
              {
                path: "create",
                element: (
                  <ProtectedRoute
                    requiredPermissions={[PERMISSIONS.SHOWTIME_CREATE]}
                  />
                ),
                children: [
                  {
                    index: true,
                    element: <CreateShowtime />,
                  },
                ],
              },
            ],
          },
          {
            path: `${ROUTES.CINEMAS}`,
            element: (
              <ProtectedRoute
                requiredPermissions={[PERMISSIONS.CINEMAS_READ]}
              />
            ),
            children: [
              {
                index: true,
                element: <TheaterList />,
              },
            ],
          },
          {
            path: `${ROUTES.ROOMS}`,
            element: (
              <ProtectedRoute requiredPermissions={[PERMISSIONS.ROOM_READ]} />
            ),
            children: [
              {
                index: true,
                element: <RoomList />,
              },
              {
                path: "create",
                element: (
                  <ProtectedRoute
                    requiredPermissions={[PERMISSIONS.ROOM_CREATE]}
                  />
                ),
                children: [
                  {
                    index: true,
                    element: <CreateRoom />,
                  },
                ],
              },
              {
                path: "edit/:id",
                element: (
                  <ProtectedRoute
                    requiredPermissions={[PERMISSIONS.ROOM_UPDATE]}
                  />
                ),
                children: [
                  {
                    index: true,
                    element: <EditRoom />,
                  },
                ],
              },
            ],
          },
          {
            path: `${ROUTES.TICKETS}`,
            element: (
              <ProtectedRoute requiredPermissions={[PERMISSIONS.TICKET_READ]} />
            ),
            children: [
              {
                index: true,
                element: <TicketList />,
              },
            ],
          },
          {
            path: `${ROUTES.EQUIPMENT}`,
            element: (
              <ProtectedRoute
                requiredPermissions={[PERMISSIONS.EQUIPMENT_READ]}
              />
            ),
            children: [
              {
                index: true,
                element: <EquipmentList />,
              },
            ],
          },
          {
            path: `${ROUTES.ROLES}`,
            element: (
              <ProtectedRoute requiredPermissions={[PERMISSIONS.ROLE_READ]} />
            ),
            children: [
              {
                index: true,
                element: <RoleList />,
              },
            ],
          },
          {
            path: `${ROUTES.PERMISSIONS}`,
            element: (
              <ProtectedRoute
                requiredPermissions={[PERMISSIONS.PERMISSION_READ]}
              />
            ),
            children: [
              {
                index: true,
                element: <PermissionList />,
              },
            ],
          },
          {
            path: `${ROUTES.SEAT_PRICES}`,
            element: <PriceConfigList />,
          },
          {
            path: `${ROUTES.CUSTOMERS}`,
            element: (
              <ProtectedRoute
                requiredPermissions={[PERMISSIONS.CUSTOMER_READ]}
              />
            ),
            children: [
              {
                index: true,
                element: <CustomerList />,
              },
            ],
          },
          {
            path: `${ROUTES.STAFF}`,
            element: (
              <ProtectedRoute requiredPermissions={[PERMISSIONS.STAFF_READ]} />
            ),
            children: [
              {
                index: true,
                element: <StaffList />,
              },
            ],
          },
          {
            path: `${ROUTES.WORK_SCHEDULES}`,
            element: (
              <ProtectedRoute
                requiredPermissions={[PERMISSIONS.WORK_SCHEDULE_READ]}
              />
            ),
            children: [
              {
                index: true,
                element: <WorkSchedulePage />,
              },
            ],
          },
          {
            path: `${ROUTES.SHIFT_TYPES}`,
            element: (
              <ProtectedRoute
                requiredPermissions={[PERMISSIONS.WORK_SCHEDULE_READ]}
              />
            ),
            children: [
              {
                index: true,
                element: <ShiftTypesPage />,
              },
            ],
          },
          {
            path: `${ROUTES.BOOKINGS}`,
            element: (
              <ProtectedRoute
                requiredPermissions={[PERMISSIONS.BOOKING_READ]}
              />
            ),
            children: [
              {
                index: true,
                element: <BookingList />,
              },
            ],
          },
          {
            path: `${ROUTES.NOTIFICATIONS}`,
            element: (
              <ProtectedRoute requiredPermissions={[PERMISSIONS.STAFF_READ]} />
            ),
            children: [
              {
                index: true,
                element: <Navigate to={ROUTES.NOTIFICATIONS_LIST} replace />,
              },
              {
                path: "list",
                element: <NotificationList />,
              },
              {
                path: "templates",
                element: <TemplateList />,
              },
              {
                path: "logs",
                element: <LogList />,
              },
              {
                path: "send",
                element: <SendNotification />,
              },
              {
                path: "view/:id",
                element: <ViewNotification />,
              },
              {
                path: "templates/add",
                element: <AddTemplate />,
              },
              {
                path: "templates/edit/:id",
                element: <EditTemplate />,
              },
            ],
          },
          {
            path: `${ROUTES.COMBOS}`,
            element: (
              <ProtectedRoute requiredPermissions={[PERMISSIONS.COMBO_READ]} />
            ),
            children: [
              {
                index: true,
                element: <ComboList />,
              },
            ],
          },
          {
            path: `${ROUTES.INVOICES}`,
            element: (
              <ProtectedRoute
                requiredPermissions={[PERMISSIONS.INVOICE_READ]}
              />
            ),
            children: [
              {
                index: true,
                element: <InvoiceList />,
              },
            ],
          },
          {
            path: `${ROUTES.REPORTS}`,
            element: (
              <ProtectedRoute requiredPermissions={[PERMISSIONS.REPORT_READ]} />
            ),
            children: [
              {
                index: true,
                element: <ReportList />,
              },
            ],
          },
          {
            path: `${ROUTES.TICKET_BOOKING}`,
            element: (
              <ProtectedRoute
                requiredPermissions={[PERMISSIONS.TICKET_BOOKING_READ]}
              />
            ),
            children: [
              {
                index: true,
                element: <TicketBookingPage />,
              },
            ],
          },
          {
            path: `${ROUTES.REVIEWS}`,
            element: (
              <ProtectedRoute requiredPermissions={[PERMISSIONS.REVIEW_READ]} />
            ),
            children: [
              {
                index: true,
                element: <ReviewList />,
              },
            ],
          },
          {
            path: `${ROUTES.MEDIA}`,
            element: <MediaLibrary />,
          },
          {
            path: `${ROUTES.CHATBOT_CONFIG}`,
            element: <ChatbotConfig />,
          },
        ],
      },
    ],
  },
  {
    path: "*",
    element: <NotFound />,
  },
];

// Re-export ROUTES from constants for backward compatibility
export { ROUTES };
