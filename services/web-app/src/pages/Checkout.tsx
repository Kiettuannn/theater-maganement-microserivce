import { FC, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Form,
  Input,
  Button,
  Card,
  Row,
  Col,
  Select,
  Space,
  Radio,
  Divider,
  message,
  Typography,
  Empty,
} from 'antd';
import { useParams } from 'react-router-dom';
import { getMovieById, getCinemaById, getShowtimesByMovieId } from '../lib/mock-data';
import { useBooking } from '../hooks/useBooking';
import { getBookingSummary, confirmBooking, type BookingSummary } from '../services/booking';
import dayjs from 'dayjs';
import '../styles/App.css';
import { useEffect } from 'react';

const { Title, Text } = Typography;

const Checkout: FC = () => {
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const { booking, resetBooking } = useBooking();
  const [paymentMethod, setPaymentMethod] = useState<string>('credit-card');
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<BookingSummary | null>(null);
  const [timeLeft, setTimeLeft] = useState<string>('');

  useEffect(() => {
    if (bookingId) {
      getBookingSummary(bookingId)
        .then(setSummary)
        .catch(() => message.error("Failed to load booking details"));
    }
  }, [bookingId]);

  useEffect(() => {
    if (!summary?.expiresAt) return;

    const interval = setInterval(() => {
      const diff = dayjs(summary.expiresAt).diff(dayjs());
      if (diff <= 0) {
        clearInterval(interval);
        setTimeLeft("00:00");
        message.warning("Booking expired!");
        navigate('/');
      } else {
        const minutes = Math.floor(diff / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);
        setTimeLeft(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [summary, navigate]);

  if (!bookingId || !booking.movieId || !booking.movieTitle) {
    return (
      <div className="page-container">
        <Empty
          description="No booking found. Please start a new booking."
          children={
            <Button type="primary" onClick={() => navigate('/')}>
              Back to Home
            </Button>
          }
        />
      </div>
    );
  }

  const handleSubmit = async (values: any) => {
    setLoading(true);
    try {
      // Simulate payment processing
      await new Promise((resolve) => setTimeout(resolve, 2000));

      await confirmBooking(bookingId);

      // Save local details so Confirmation page can render movie/cinema info
      localStorage.setItem(`booking-${bookingId}`, JSON.stringify({
        ...booking,
        customerName: values.firstName + ' ' + values.lastName,
        customerEmail: values.email,
        customerPhone: values.phone,
        paymentMethod,
        paymentDate: new Date().toISOString(),
      }));

      message.success('Payment successful!');
      resetBooking();
      navigate(`/confirmation/${bookingId}`);
    } catch (error: any) {
      message.error(error.message || 'Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <Button
        type="text"
        onClick={() => navigate(-1)}
        style={{ marginBottom: '24px', color: '#0052A3' }}
      >
        ← Back
      </Button>

      <Row gutter={[32, 32]}>
        <Col xs={24} md={14}>
          <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Title level={3} style={{ color: '#0052A3', margin: 0 }}>
                Payment Details
              </Title>
              {timeLeft && (
                <div style={{ background: '#FFF1F0', border: '1px solid #FFA39E', padding: '4px 12px', borderRadius: '4px', color: '#CF1322', fontWeight: 'bold' }}>
                  Expires in: {timeLeft}
                </div>
              )}
            </div>
            <Divider />

            <Form form={form} layout="vertical" onFinish={handleSubmit}>
              <Form.Item
                label="First Name"
                name="firstName"
                rules={[{ required: true, message: 'Please enter first name' }]}
              >
                <Input size="large" placeholder="John" />
              </Form.Item>

              <Form.Item
                label="Last Name"
                name="lastName"
                rules={[{ required: true, message: 'Please enter last name' }]}
              >
                <Input size="large" placeholder="Doe" />
              </Form.Item>

              <Form.Item
                label="Email"
                name="email"
                rules={[
                  { required: true, message: 'Please enter email' },
                  { type: 'email', message: 'Invalid email format' },
                ]}
              >
                <Input size="large" placeholder="john@example.com" type="email" />
              </Form.Item>

              <Form.Item
                label="Phone Number"
                name="phone"
                rules={[{ required: true, message: 'Please enter phone number' }]}
              >
                <Input size="large" placeholder="+84 123 456 789" />
              </Form.Item>

              <Divider />

              <div style={{ marginBottom: '24px' }}>
                <Text strong style={{ fontSize: '16px' }}>
                  Payment Method
                </Text>
                <Radio.Group
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '12px' }}
                >
                  <Radio value="credit-card">Credit/Debit Card</Radio>
                  <Radio value="bank-transfer">Bank Transfer</Radio>
                  <Radio value="e-wallet">E-wallet (PayPal, GooglePay, etc.)</Radio>
                </Radio.Group>
              </div>

              {paymentMethod === 'credit-card' && (
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Form.Item
                    label="Card Number"
                    name="cardNumber"
                    rules={[
                      { required: true, message: 'Please enter card number' },
                      { len: 16, message: 'Card number must be 16 digits' },
                    ]}
                  >
                    <Input
                      size="large"
                      placeholder="1234 5678 9012 3456"
                      maxLength={16}
                    />
                  </Form.Item>

                  <Row gutter={[12, 12]}>
                    <Col xs={12}>
                      <Form.Item
                        label="Expiry Date"
                        name="expiry"
                        rules={[{ required: true, message: 'Please enter expiry date' }]}
                      >
                        <Input size="large" placeholder="MM/YY" maxLength={5} />
                      </Form.Item>
                    </Col>
                    <Col xs={12}>
                      <Form.Item
                        label="CVV"
                        name="cvv"
                        rules={[{ required: true, message: 'Please enter CVV' }]}
                      >
                        <Input
                          size="large"
                          placeholder="123"
                          maxLength={3}
                          type="password"
                        />
                      </Form.Item>
                    </Col>
                  </Row>
                </Space>
              )}

              <Button
                type="primary"
                size="large"
                block
                htmlType="submit"
                loading={loading}
                style={{ marginTop: '24px' }}
                disabled={!summary}
              >
                {loading ? 'Processing...' : `Pay ${(summary?.totalAmount || booking.totalPrice).toLocaleString()} VND`}
              </Button>
            </Form>
          </Card>
        </Col>

        <Col xs={24} md={10}>
          <Card title="Booking Summary" style={{ position: 'sticky', top: '20px' }}>
            <Space direction="vertical" style={{ width: '100%' }} size="large">
              <div>
                <Text type="secondary">Movie</Text>
                <div style={{ fontWeight: 600, marginTop: '4px' }}>{booking.movieTitle}</div>
              </div>

              <div>
                <Text type="secondary">Cinema</Text>
                <div style={{ fontWeight: 600, marginTop: '4px' }}>{booking.cinemaName}</div>
              </div>

              <div>
                <Text type="secondary">Date & Time</Text>
                <div style={{ fontWeight: 600, marginTop: '4px' }}>
                  {dayjs(booking.date).format('DD/MM/YYYY')} at {booking.showtimeTime}
                </div>
              </div>

              <div>
                <Text type="secondary">Seats</Text>
                <div style={{ fontWeight: 600, marginTop: '4px' }}>
                  {booking.selectedSeats.sort().join(', ')}
                </div>
              </div>

              <div>
                <Text type="secondary">Number of Seats</Text>
                <div style={{ fontWeight: 600, marginTop: '4px' }}>
                  {booking.selectedSeats.length}
                </div>
              </div>

              <Divider />

              <Row justify="space-between">
                <Text>Subtotal:</Text>
                <Text>{booking.totalPrice.toLocaleString()} VND</Text>
              </Row>

              <Row justify="space-between">
                <Text>Fee:</Text>
                <Text>0 VND</Text>
              </Row>

              <Divider />

              <Row justify="space-between" style={{ fontSize: '18px' }}>
                <Text strong>Total:</Text>
                <Text strong style={{ color: '#0052A3' }}>
                  {(summary?.totalAmount || booking.totalPrice).toLocaleString()} VND
                </Text>
              </Row>
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Checkout;
