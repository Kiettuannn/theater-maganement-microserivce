import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ConfigProvider } from "antd";
import theme from "./theme";
import Header from "./components/Header";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import ComingSoon from "./pages/ComingSoon";
import MovieDetail from "./pages/MovieDetail";
import Booking from "./pages/Booking";
import Checkout from "./pages/Checkout";
import Confirmation from "./pages/Confirmation";
import MyBookings from "./pages/MyBookings";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import SignOut from "./pages/SignOut";
import "./styles/App.css";

function App() {
  return (
    <ConfigProvider theme={theme}>
      <Router>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            minHeight: "100vh",
          }}
        >
          <Header />
          <main style={{ flex: 1 }}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/coming-soon" element={<ComingSoon />} />
              <Route path="/movie/:id" element={<MovieDetail />} />
              <Route path="/booking/:movieId" element={<Booking />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/confirmation/:orderId" element={<Confirmation />} />
              <Route path="/my-bookings" element={<MyBookings />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/sign-out" element={<SignOut />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </ConfigProvider>
  );
}

export default App;
