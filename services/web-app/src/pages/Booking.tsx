import { FC, useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Steps,
  Button,
  Card,
  Row,
  Col,
  Space,
  Empty,
  message,
  Divider,
  Typography,
  Segmented,
  Skeleton,
  Tag,
} from "antd";
import dayjs from "dayjs";
import {
  getMovieById,
  getShowtimesByMovieId,
  getCinemaById,
  type Cinema,
  type Showtime,
} from "../lib/mock-data";
import { useBooking } from "../hooks/useBooking";
import "../styles/App.css";

const { Title, Text } = Typography;

type DateTabOption = {
  date: string;
  label: string;
  subLabel: string;
  disabled: boolean;
};

type CinemaGroup = {
  cinema: Cinema;
  showtimes: Showtime[];
};

const DateTabs: FC<{
  options: DateTabOption[];
  value: string | null;
  onChange: (date: string) => void;
}> = ({ options, value, onChange }) => {
  const fallback =
    options.find((option) => !option.disabled)?.date || options[0]?.date;
  const activeValue = value || fallback || "";

  return (
    <div className="date-tabs">
      <Segmented
        value={activeValue}
        onChange={(next) => onChange(next as string)}
        options={options.map((option) => ({
          value: option.date,
          disabled: option.disabled,
          label: (
            <div className="date-tab">
              <span className="date-tab-main">{option.label}</span>
              <span className="date-tab-sub">{option.subLabel}</span>
            </div>
          ),
        }))}
      />
    </div>
  );
};

const ShowtimeButton: FC<{
  showtime: Showtime;
  selected: boolean;
  onSelect: (showtime: Showtime) => void;
}> = ({ showtime, selected, onSelect }) => {
  const isSoldOut = showtime.availableSeats <= 0;
  const seatLabel = isSoldOut
    ? "Sold out"
    : `${showtime.availableSeats} seats left`;
  const seatTone = isSoldOut
    ? "sold"
    : showtime.availableSeats <= 10
      ? "low"
      : "high";

  return (
    <Button
      block
      size="large"
      type={selected ? "primary" : "default"}
      className={`showtime-button ${selected ? "is-selected" : ""}`}
      disabled={isSoldOut}
      onClick={() => onSelect(showtime)}
    >
      <div className="showtime-button-content">
        <span className="showtime-time">{showtime.time}</span>
        <span className={`showtime-seats ${seatTone}`}>{seatLabel}</span>
      </div>
    </Button>
  );
};

const CinemaShowtimeGroup: FC<{
  cinema: Cinema;
  showtimes: Showtime[];
  selectedShowtimeId: string | null;
  onSelectShowtime: (showtime: Showtime) => void;
}> = ({ cinema, showtimes, selectedShowtimeId, onSelectShowtime }) => (
  <Card className="cinema-card">
    <div className="cinema-header">
      <div>
        <Text strong className="cinema-name">
          {cinema.name}
        </Text>
        <Text type="secondary" className="cinema-address">
          {cinema.address}
        </Text>
      </div>
      <Tag color="blue">{showtimes.length} showtimes</Tag>
    </div>
    <Row gutter={[12, 12]}>
      {showtimes.map((showtime) => (
        <Col xs={12} sm={8} md={6} key={showtime.id}>
          <ShowtimeButton
            showtime={showtime}
            selected={showtime.id === selectedShowtimeId}
            onSelect={onSelectShowtime}
          />
        </Col>
      ))}
    </Row>
  </Card>
);

const EmptyShowtimeState: FC<{
  suggestedDate?: string | null;
  onSelectDate?: (date: string) => void;
}> = ({ suggestedDate, onSelectDate }) => (
  <div className="empty-showtime">
    <Empty
      description="No showtimes available for this date."
      children={
        suggestedDate && onSelectDate ? (
          <Button type="primary" onClick={() => onSelectDate(suggestedDate)}>
            See showtimes on {dayjs(suggestedDate).format("MMM D")}
          </Button>
        ) : null
      }
    />
  </div>
);

const ShowtimeSkeleton: FC = () => (
  <Space direction="vertical" size="large" style={{ width: "100%" }}>
    {Array.from({ length: 2 }).map((_, index) => (
      <Card key={`skeleton-${index}`} className="cinema-card">
        <Skeleton active title={{ width: 220 }} paragraph={{ rows: 2 }} />
        <Row gutter={[12, 12]} style={{ marginTop: "12px" }}>
          {Array.from({ length: 4 }).map((__, buttonIndex) => (
            <Col
              xs={12}
              sm={8}
              md={6}
              key={`skeleton-btn-${index}-${buttonIndex}`}
            >
              <Skeleton.Button
                active
                block
                style={{ height: 64, borderRadius: 12 }}
              />
            </Col>
          ))}
        </Row>
      </Card>
    ))}
  </Space>
);

const Booking: FC = () => {
  const { movieId } = useParams<{ movieId: string }>();
  const navigate = useNavigate();
  const { booking, updateBooking } = useBooking();
  const [current, setCurrent] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const movie = useMemo(
    () => (movieId ? getMovieById(movieId) : null),
    [movieId],
  );
  const showtimes = useMemo(
    () => (movieId ? getShowtimesByMovieId(movieId) : []),
    [movieId],
  );

  if (!movie) {
    return (
      <div className="page-container">
        <Empty
          description="Movie not found"
          children={
            <Button type="primary" onClick={() => navigate("/")}>
              Back to Home
            </Button>
          }
        />
      </div>
    );
  }

  if (movie.status === "coming-soon") {
    return (
      <div className="page-container">
        <Empty
          description="This movie is coming soon"
          children={
            <Button
              type="primary"
              onClick={() => navigate(`/movie/${movie.id}`)}
            >
              Back to Movie Details
            </Button>
          }
        />
      </div>
    );
  }

  const selectedShowtime = showtimes.find((s) => s.id === booking.showtimeId);
  const selectedCinema = booking.cinemaId
    ? getCinemaById(booking.cinemaId)
    : null;

  const availableDates = useMemo(() => {
    const uniqueDates = new Set(showtimes.map((s) => s.date));
    return Array.from(uniqueDates).sort(
      (a, b) => dayjs(a).valueOf() - dayjs(b).valueOf(),
    );
  }, [showtimes]);

  const availableDateKey = availableDates.join("|");
  const baseDate = availableDates[0] || dayjs().format("YYYY-MM-DD");

  const dateOptions = useMemo(() => {
    const base = dayjs(baseDate);
    const availableSet = new Set(availableDates);

    return Array.from({ length: 7 }).map((_, index) => {
      const date = base.add(index, "day");
      const dateValue = date.format("YYYY-MM-DD");
      const diff = date.diff(base, "day");
      const label =
        diff === 0 ? "Today" : diff === 1 ? "Tomorrow" : date.format("ddd");

      return {
        date: dateValue,
        label,
        subLabel: date.format("MMM D"),
        disabled: !availableSet.has(dateValue),
      };
    });
  }, [availableDateKey, baseDate, availableDates]);

  const showtimesForDate = useMemo(() => {
    if (!booking.date) {
      return [];
    }
    return showtimes.filter((showtime) => showtime.date === booking.date);
  }, [booking.date, showtimes]);

  const sortedShowtimesForDate = useMemo(
    () => showtimesForDate.slice().sort((a, b) => a.time.localeCompare(b.time)),
    [showtimesForDate],
  );

  const cinemaGroups = useMemo<CinemaGroup[]>(() => {
    const grouped = new Map<string, Showtime[]>();
    sortedShowtimesForDate.forEach((showtime) => {
      if (!grouped.has(showtime.cinemaId)) {
        grouped.set(showtime.cinemaId, []);
      }
      grouped.get(showtime.cinemaId)?.push(showtime);
    });

    return Array.from(grouped.entries())
      .map(([cinemaId, times]) => {
        const cinema = getCinemaById(cinemaId);
        if (!cinema) {
          return null;
        }
        return {
          cinema,
          showtimes: times,
        };
      })
      .filter((group): group is CinemaGroup => Boolean(group));
  }, [sortedShowtimesForDate]);

  useEffect(() => {
    if (!availableDates.length) {
      if (booking.date || booking.showtimeId || booking.cinemaId) {
        updateBooking({
          date: null,
          cinemaId: null,
          showtimeId: null,
          selectedSeats: [],
          totalPrice: 0,
        });
      }
      return;
    }

    if (!booking.date || !availableDates.includes(booking.date)) {
      updateBooking({
        date: availableDates[0],
        cinemaId: null,
        showtimeId: null,
        selectedSeats: [],
        totalPrice: 0,
      });
    }
  }, [
    availableDateKey,
    booking.cinemaId,
    booking.date,
    booking.showtimeId,
    availableDates,
    updateBooking,
  ]);

  useEffect(() => {
    if (!booking.date) {
      return;
    }

    if (!sortedShowtimesForDate.length) {
      if (booking.showtimeId || booking.cinemaId) {
        updateBooking({
          showtimeId: null,
          cinemaId: null,
          selectedSeats: [],
          totalPrice: 0,
        });
      }
      return;
    }

    const selectedStillValid = sortedShowtimesForDate.some(
      (showtime) => showtime.id === booking.showtimeId,
    );

    if (!selectedStillValid) {
      const nextShowtime =
        sortedShowtimesForDate.find(
          (showtime) => showtime.availableSeats > 0,
        ) || sortedShowtimesForDate[0];

      updateBooking({
        showtimeId: nextShowtime.id,
        cinemaId: nextShowtime.cinemaId,
        selectedSeats: [],
        totalPrice: 0,
      });
    }
  }, [
    booking.cinemaId,
    booking.date,
    booking.showtimeId,
    sortedShowtimesForDate,
    updateBooking,
  ]);

  useEffect(() => {
    setIsLoading(true);
    const timer = window.setTimeout(() => setIsLoading(false), 450);
    return () => window.clearTimeout(timer);
  }, [booking.date, movieId]);

  const handleNext = () => {
    if (current === 0) {
      if (!booking.cinemaId || !booking.date || !booking.showtimeId) {
        message.error("Please select cinema, date, and showtime");
        return;
      }
    } else if (current === 1) {
      if (booking.selectedSeats.length === 0) {
        message.error("Please select at least one seat");
        return;
      }
    }
    setCurrent(current + 1);
  };

  const handlePrev = () => {
    setCurrent(current - 1);
  };

  const handleCheckout = () => {
    updateBooking({ movieId: movie.id });
    navigate("/checkout");
  };

  const handleDateChange = (date: string) => {
    updateBooking({
      date,
      cinemaId: null,
      showtimeId: null,
      selectedSeats: [],
      totalPrice: 0,
    });
  };

  const handleShowtimeSelect = (showtime: Showtime) => {
    updateBooking({
      date: showtime.date,
      cinemaId: showtime.cinemaId,
      showtimeId: showtime.id,
      selectedSeats: [],
      totalPrice: 0,
    });
  };

  const suggestedDate =
    availableDates.find((date) => date !== booking.date) || null;

  const renderStep0 = () => (
    <div className="steps-container booking-step">
      <Row gutter={[24, 24]}>
        <Col xs={24} lg={16}>
          <Space direction="vertical" size="large" style={{ width: "100%" }}>
            <div>
              <Text strong className="booking-section-title">
                Choose a date
              </Text>
              <DateTabs
                options={dateOptions}
                value={booking.date}
                onChange={handleDateChange}
              />
            </div>

            <div>
              <div className="booking-section-header">
                <Text strong className="booking-section-title">
                  Showtimes
                </Text>
                <Text type="secondary">
                  Pick a cinema and time to continue.
                </Text>
              </div>

              {isLoading ? (
                <ShowtimeSkeleton />
              ) : cinemaGroups.length === 0 ? (
                <EmptyShowtimeState
                  suggestedDate={suggestedDate}
                  onSelectDate={suggestedDate ? handleDateChange : undefined}
                />
              ) : (
                <Space
                  direction="vertical"
                  size="large"
                  style={{ width: "100%" }}
                >
                  {cinemaGroups.map((group) => (
                    <CinemaShowtimeGroup
                      key={group.cinema.id}
                      cinema={group.cinema}
                      showtimes={group.showtimes}
                      selectedShowtimeId={booking.showtimeId}
                      onSelectShowtime={handleShowtimeSelect}
                    />
                  ))}
                </Space>
              )}
            </div>
          </Space>
        </Col>
        <Col xs={24} lg={8}>
          <div className="booking-summary">
            <Card className="booking-summary-card">
              <Text strong className="booking-summary-title">
                Booking Summary
              </Text>
              <Divider />
              {selectedCinema && selectedShowtime ? (
                <Space
                  direction="vertical"
                  size="middle"
                  style={{ width: "100%" }}
                >
                  <div>
                    <Text type="secondary">Cinema</Text>
                    <div className="booking-summary-value">
                      {selectedCinema.name}
                    </div>
                  </div>
                  <div>
                    <Text type="secondary">Date</Text>
                    <div className="booking-summary-value">
                      {dayjs(booking.date).format("DD/MM/YYYY")}
                    </div>
                  </div>
                  <div>
                    <Text type="secondary">Showtime</Text>
                    <div className="booking-summary-value">
                      {selectedShowtime.time}
                    </div>
                  </div>
                  <div>
                    <Text type="secondary">Price</Text>
                    <div className="booking-summary-price">
                      {selectedShowtime.price.toLocaleString()} VND
                    </div>
                  </div>
                </Space>
              ) : (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description="Select a showtime to continue"
                />
              )}
            </Card>
          </div>
        </Col>
      </Row>
    </div>
  );

  const renderStep1 = () => (
    <div className="steps-container">
      <Title level={4}>Select Your Seats</Title>
      <Text type="secondary">Click on available seats to select them</Text>

      <div style={{ marginTop: "24px" }}>
        <div
          style={{ textAlign: "center", marginBottom: "24px", fontWeight: 600 }}
        >
          SCREEN
        </div>

        <div className="seat-grid">
          {Array.from({ length: 60 }).map((_, i) => {
            const row = String.fromCharCode(65 + Math.floor(i / 10));
            const number = (i % 10) + 1;
            const seatId = `${row}${number}`;
            const isSelected = booking.selectedSeats.includes(seatId);
            const isBooked = Math.random() > 0.7;

            return (
              <div
                key={seatId}
                className={`seat ${isBooked ? "booked" : isSelected ? "selected" : "available"}`}
                onClick={() => {
                  if (!isBooked) {
                    const newSeats = isSelected
                      ? booking.selectedSeats.filter((s) => s !== seatId)
                      : [...booking.selectedSeats, seatId];
                    const newPrice =
                      newSeats.length * (selectedShowtime?.price || 120000);
                    updateBooking({
                      selectedSeats: newSeats,
                      totalPrice: newPrice,
                    });
                  }
                }}
              >
                {number}
              </div>
            );
          })}
        </div>

        <Row gutter={[16, 16]} style={{ marginTop: "24px" }}>
          <Col xs={8}>
            <div style={{ fontSize: "12px" }}>
              <span className="seat available" style={{ marginRight: "8px" }}>
                A
              </span>
              Available
            </div>
          </Col>
          <Col xs={8}>
            <div style={{ fontSize: "12px" }}>
              <span className="seat selected" style={{ marginRight: "8px" }}>
                A
              </span>
              Selected
            </div>
          </Col>
          <Col xs={8}>
            <div style={{ fontSize: "12px" }}>
              <span className="seat booked" style={{ marginRight: "8px" }}>
                A
              </span>
              Booked
            </div>
          </Col>
        </Row>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="steps-container">
      <Title level={4}>Booking Summary</Title>

      <Card>
        <Row gutter={[16, 16]}>
          <Col xs={24}>
            <Text strong>Movie:</Text>
            <div style={{ marginTop: "4px" }}>{movie.title}</div>
          </Col>
          <Col xs={12}>
            <Text strong>Cinema:</Text>
            <div style={{ marginTop: "4px" }}>{selectedCinema?.name}</div>
          </Col>
          <Col xs={12}>
            <Text strong>Date:</Text>
            <div style={{ marginTop: "4px" }}>
              {dayjs(booking.date).format("DD/MM/YYYY")}
            </div>
          </Col>
          <Col xs={12}>
            <Text strong>Showtime:</Text>
            <div style={{ marginTop: "4px" }}>{selectedShowtime?.time}</div>
          </Col>
          <Col xs={12}>
            <Text strong>Seats:</Text>
            <div style={{ marginTop: "4px" }}>
              {booking.selectedSeats.sort().join(", ")}
            </div>
          </Col>
        </Row>

        <Divider />

        <Row>
          <Col xs={24}>
            <Text strong style={{ fontSize: "18px" }}>
              Total Price:
            </Text>
            <div
              style={{ fontSize: "24px", color: "#0052A3", fontWeight: "bold" }}
            >
              {booking.totalPrice.toLocaleString()} VND
            </div>
          </Col>
        </Row>
      </Card>
    </div>
  );

  const steps = [
    { title: "Cinema & Showtime", content: renderStep0() },
    { title: "Select Seats", content: renderStep1() },
    { title: "Confirm Booking", content: renderStep2() },
  ];

  return (
    <div className="page-container booking-page">
      <Button
        type="text"
        onClick={() => navigate(-1)}
        style={{ marginBottom: "24px", color: "#0052A3" }}
      >
        ← Back
      </Button>

      <Card className="booking-shell">
        <div className="booking-header">
          <div>
            <Title level={2} className="booking-title">
              Book Tickets for {movie.title}
            </Title>
            <Text type="secondary">
              Pick a date and jump into a showtime instantly.
            </Text>
          </div>
          <div className="booking-steps">
            <Steps current={current} items={steps} />
          </div>
        </div>

        <div>{steps[current].content}</div>

        <Row
          gutter={[16, 16]}
          style={{ marginTop: "32px", justifyContent: "center" }}
        >
          {current > 0 && (
            <Col xs={12} sm={4}>
              <Button block onClick={handlePrev}>
                Previous
              </Button>
            </Col>
          )}
          {current < steps.length - 1 && (
            <Col xs={12} sm={4}>
              <Button type="primary" block onClick={handleNext}>
                Next
              </Button>
            </Col>
          )}
          {current === steps.length - 1 && (
            <Col xs={12} sm={4}>
              <Button
                type="primary"
                block
                size="large"
                onClick={handleCheckout}
              >
                Proceed to Payment
              </Button>
            </Col>
          )}
        </Row>
      </Card>
    </div>
  );
};

export default Booking;
