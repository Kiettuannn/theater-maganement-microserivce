import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import PublicLayout from "./layouts/PublicLayout";
import AuthenticatedLayout from "./layouts/AuthenticatedLayout";
import PrivateRoute from "../components/PrivateRoute";
import Home from "../pages/Home";
import ComingSoon from "../pages/ComingSoon";
import MovieDetail from "../pages/MovieDetail";
import Booking from "../pages/Booking";
import Checkout from "../pages/Checkout";
import Confirmation from "../pages/Confirmation";
import MyBookings from "../pages/MyBookings";
import Profile from "../pages/Profile";
import Settings from "../pages/Settings";
import SignOut from "../pages/SignOut";

const AppRoutes = () => (
  <Router>
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/coming-soon" element={<ComingSoon />} />
        <Route path="/movie/:id" element={<MovieDetail />} />
        <Route path="/booking/:movieId" element={<Booking />} />
        <Route path="/checkout/:bookingId" element={<Checkout />} />
        <Route path="/confirmation/:bookingId" element={<Confirmation />} />
      </Route>
      <Route element={<PrivateRoute layout={AuthenticatedLayout} />}>
        <Route path="/my-bookings" element={<MyBookings />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/sign-out" element={<SignOut />} />
      </Route>
    </Routes>
  </Router>
);

export default AppRoutes;
