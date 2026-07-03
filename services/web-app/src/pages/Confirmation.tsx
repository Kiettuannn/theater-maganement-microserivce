import { FC, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Card,
  Row,
  Col,
  Button,
  Space,
  Divider,
  QRCode,
  Empty,
  Alert,
  Typography,
} from "antd";
import {
  CheckCircleOutlined,
  PrinterOutlined,
  DownloadOutlined,
} from "@ant-design/icons";
import {
  getMovieById,
  getCinemaById,
  getShowtimesByMovieId,
} from "../lib/mock-data";
import { getTicketsByBooking, type Ticket } from "../services/booking";
import dayjs from "dayjs";
import "../styles/App.css";

const { Title, Text } = Typography;

interface BookingData {
  movieId: string;
  cinemaId: string;
  showtimeId: string;
  selectedSeats: string[];
  totalPrice: number;
  date: string;
  orderId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  paymentMethod: string;
  paymentDate: string;
  movieTitle?: string;
  cinemaName?: string;
  showtimeTime?: string;
}

const Confirmation: FC = () => {
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();
  const [booking, setBooking] = useState<BookingData | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);

  useEffect(() => {
    console.log("=== CONFIRMATION MOUNT ===", { bookingId });
    if (bookingId) {
      const saved = localStorage.getItem(`booking-${bookingId}`);
      if (saved) {
        setBooking(JSON.parse(saved));
      }

      getTicketsByBooking(bookingId)
        .then((res) => {
          console.log("=== TICKETS FETCHED ===", res);
          setTickets(res);
        })
        .catch((err) => console.error("Failed to fetch tickets", err));
    }
  }, [bookingId]);

  if (!booking) {
    return (
      <div className="page-container">
        <Empty
          description="Booking not found"
          children={
            <Button type="primary" onClick={() => navigate("/")}>
              Back to Home
            </Button>
          }
        />
      </div>
    );
  }

  const firstTicket = tickets.length > 0 ? tickets[0] : null;

  const movie = getMovieById(booking.movieId);
  const cinema = getCinemaById(booking.cinemaId);
  const showtimes = getShowtimesByMovieId(booking.movieId);
  const showtime = showtimes.find((s) => s.id === booking.showtimeId);

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    const element = document.getElementById("ticket-content");
    if (element) {
      const printContents = element.innerHTML;
      const win = window.open("", "", "height=500,width=800");
      if (win) {
        win.document.write("<html><head><title>Ticket</title></head><body>");
        win.document.write(printContents);
        win.document.write("</body></html>");
        win.document.close();
        win.print();
      }
    }
  };

  return (
    <div className="page-container">
      <Row gutter={[32, 32]} justify="center">
        <Col xs={24} md={18} lg={14}>
          <div id="ticket-content">
            <Card style={{ textAlign: "center" }}>
              <Space
                direction="vertical"
                style={{ width: "100%" }}
                size="large"
              >
                <div>
                  <CheckCircleOutlined
                    style={{
                      fontSize: "48px",
                      color: "#10B981",
                      marginBottom: "16px",
                    }}
                  />
                  <Title level={2} style={{ color: "#0052A3", margin: "0" }}>
                    Booking Confirmed!
                  </Title>
                  <Text type="secondary" style={{ fontSize: "16px" }}>
                    Your tickets have been successfully booked
                  </Text>
                </div>

                <Alert
                  message="A confirmation email has been sent to your email address"
                  type="success"
                  showIcon
                />

                <Card
                  style={{ backgroundColor: "#E6F2FF", borderColor: "#0052A3" }}
                >
                  <Row gutter={[16, 16]}>
                    <Col xs={24}>
                      <Text type="secondary">Booking ID</Text>
                      <Title level={4} style={{ margin: "0" }}>
                        {bookingId}
                      </Title>
                    </Col>

                    <Col xs={24}>
                      <QRCode
                        value={JSON.stringify({
                          bookingId: bookingId,
                          movie: firstTicket?.movieTitle,
                          date: firstTicket?.showDate,
                          seats:
                            tickets.length > 0
                              ? tickets.map((t) => t.seatName).join(", ")
                              : booking.selectedSeats,
                        })}
                        style={{ margin: "0 auto" }}
                      />
                    </Col>
                  </Row>
                </Card>

                <Divider />

                <div style={{ textAlign: "left" }}>
                  <Title level={4} style={{ color: "#0052A3" }}>
                    Ticket Details
                  </Title>

                  <Space direction="vertical" style={{ width: "100%" }}>
                    <Row>
                      <Col xs={24}>
                        <Text type="secondary">Movie</Text>
                        <div
                          style={{
                            fontWeight: 600,
                            fontSize: "18px",
                            marginTop: "4px",
                          }}
                        >
                          {firstTicket?.movieTitle || booking.movieTitle}
                        </div>
                      </Col>
                      <Col xs={12}>
                        <Text type="secondary">Cinema</Text>
                        <div style={{ fontWeight: 600, marginTop: "4px" }}>
                          Cinestar Sinh Viên
                        </div>
                      </Col>
                      <Col xs={12}>
                        <Text type="secondary">Room</Text>
                        <div style={{ fontWeight: 600, marginTop: "4px" }}>
                          {firstTicket?.roomName || booking.cinemaName || "Standard"}
                        </div>
                      </Col>
                      <Col xs={12}>
                        <Text type="secondary">Date</Text>
                        <div style={{ fontWeight: 600, marginTop: "4px" }}>
                          {dayjs(firstTicket?.showDate || booking.date).format(
                            "DD/MM/YYYY",
                          )}
                        </div>
                      </Col>
                      <Col xs={12}>
                        <Text type="secondary">Time</Text>
                        <div style={{ fontWeight: 600, marginTop: "4px" }}>
                          {firstTicket?.showTime || booking.showtimeTime}
                        </div>
                      </Col>
                    </Row>

                    <Row>
                      <Col xs={12}>
                        <Text type="secondary">Seats</Text>
                        <div style={{ fontWeight: 600, marginTop: "4px" }}>
                          {tickets.length > 0
                            ? tickets.map((t) => t.seatName).join(", ")
                            : booking.selectedSeats.join(", ")}
                        </div>
                      </Col>
                      <Col xs={12}>
                        <Text type="secondary">Number of Seats</Text>
                        <div style={{ fontWeight: 600, marginTop: "4px" }}>
                          {booking.selectedSeats.length}
                        </div>
                      </Col>
                    </Row>

                    {tickets.length > 0 && (
                      <Row>
                        <Col xs={24}>
                          <Text type="secondary">Ticket Codes</Text>
                          <div
                            style={{
                              fontWeight: 600,
                              marginTop: "4px",
                              display: "flex",
                              gap: "8px",
                              flexWrap: "wrap",
                            }}
                          >
                            {tickets.map((t) => (
                              <span
                                key={t.id}
                                style={{
                                  background: "#f0f2f5",
                                  padding: "2px 8px",
                                  borderRadius: "4px",
                                  border: "1px solid #d9d9d9",
                                }}
                              >
                                {t.ticketCode}
                              </span>
                            ))}
                          </div>
                        </Col>
                      </Row>
                    )}
                  </Space>
                </div>

                <Divider />

                <div style={{ textAlign: "left" }}>
                  <Title level={4} style={{ color: "#0052A3" }}>
                    Customer Information
                  </Title>

                  <Space direction="vertical" style={{ width: "100%" }}>
                    <Row>
                      <Col xs={12}>
                        <Text type="secondary">Name</Text>
                        <div style={{ fontWeight: 600, marginTop: "4px" }}>
                          {booking.customerName}
                        </div>
                      </Col>
                      <Col xs={12}>
                        <Text type="secondary">Email</Text>
                        <div style={{ fontWeight: 600, marginTop: "4px" }}>
                          {booking.customerEmail}
                        </div>
                      </Col>
                    </Row>

                    <Row>
                      <Col xs={12}>
                        <Text type="secondary">Phone</Text>
                        <div style={{ fontWeight: 600, marginTop: "4px" }}>
                          {booking.customerPhone}
                        </div>
                      </Col>
                      <Col xs={12}>
                        <Text type="secondary">Payment Method</Text>
                        <div style={{ fontWeight: 600, marginTop: "4px" }}>
                          {booking.paymentMethod.toUpperCase()}
                        </div>
                      </Col>
                    </Row>
                  </Space>
                </div>

                <Divider />

                <Row>
                  <Col xs={24}>
                    <Text type="secondary">Total Amount</Text>
                    <Title
                      level={3}
                      style={{
                        color: "#0052A3",
                        marginTop: "8px",
                        marginBottom: "0",
                      }}
                    >
                      {booking.totalPrice.toLocaleString()} VND
                    </Title>
                  </Col>
                </Row>

                <Divider />

                <Space style={{ width: "100%", justifyContent: "center" }} wrap>
                  <Button
                    type="primary"
                    size="large"
                    icon={<PrinterOutlined />}
                    onClick={handlePrint}
                  >
                    Print Ticket
                  </Button>
                  <Button
                    size="large"
                    icon={<DownloadOutlined />}
                    onClick={handleDownload}
                  >
                    Download Ticket
                  </Button>
                </Space>

                <Space style={{ width: "100%", justifyContent: "center" }} wrap>
                  <Button
                    type="primary"
                    size="large"
                    onClick={() => navigate("/")}
                  >
                    Back to Home
                  </Button>
                  <Button size="large" onClick={() => navigate("/my-bookings")}>
                    View My Bookings
                  </Button>
                </Space>
              </Space>
            </Card>
          </div>
        </Col>
      </Row>
    </div>
  );
};

export default Confirmation;
