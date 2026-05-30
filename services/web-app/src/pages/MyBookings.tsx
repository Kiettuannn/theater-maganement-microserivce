import { FC, useState, useEffect } from 'react';
import { Table, Card, Empty, Button, Row, Col, Space, Typography, Badge } from 'antd';
import { EyeOutlined, DeleteOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import '../styles/App.css';

const { Title, Text } = Typography;

interface BookingRecord {
  orderId: string;
  movieTitle: string;
  cinema: string;
  date: string;
  time: string;
  seats: string;
  totalPrice: number;
  status: 'confirmed' | 'cancelled';
  paymentDate: string;
}

const MyBookings: FC = () => {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<BookingRecord[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = () => {
    setLoading(true);
    try {
      const allBookings: BookingRecord[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('booking-ORD-')) {
          const data = JSON.parse(localStorage.getItem(key) || '{}');
          allBookings.push({
            orderId: data.orderId,
            movieTitle: data.movieTitle || 'Unknown Movie',
            cinema: data.cinemaId || 'Unknown Cinema',
            date: data.date,
            time: data.showtimeId ? 'See Details' : 'TBA',
            seats: data.selectedSeats.sort().join(', '),
            totalPrice: data.totalPrice,
            status: 'confirmed',
            paymentDate: data.paymentDate,
          });
        }
      }
      setBookings(allBookings.reverse());
    } catch (error) {
      console.error('Error loading bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = (orderId: string) => {
    const key = `booking-${orderId}`;
    const booking = JSON.parse(localStorage.getItem(key) || '{}');
    booking.status = 'cancelled';
    localStorage.setItem(key, JSON.stringify(booking));
    loadBookings();
  };

  const columns: ColumnsType<BookingRecord> = [
    {
      title: 'Order ID',
      dataIndex: 'orderId',
      key: 'orderId',
      render: (text) => <span style={{ fontWeight: 600, color: '#0052A3' }}>{text}</span>,
    },
    {
      title: 'Movie',
      dataIndex: 'movieTitle',
      key: 'movieTitle',
      responsive: ['md'],
    },
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      render: (text) => dayjs(text).format('DD/MM/YYYY'),
      sorter: (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    },
    {
      title: 'Seats',
      dataIndex: 'seats',
      key: 'seats',
      responsive: ['lg'],
    },
    {
      title: 'Price',
      dataIndex: 'totalPrice',
      key: 'totalPrice',
      render: (price) => <span>{price.toLocaleString()} VND</span>,
      sorter: (a, b) => a.totalPrice - b.totalPrice,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Badge
          status={status === 'confirmed' ? 'success' : 'error'}
          text={status === 'confirmed' ? 'Confirmed' : 'Cancelled'}
        />
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            type="primary"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/confirmation/${record.orderId}`)}
          >
            View
          </Button>
          {record.status === 'confirmed' && (
            <Button
              danger
              size="small"
              icon={<DeleteOutlined />}
              onClick={() => handleCancel(record.orderId)}
            >
              Cancel
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div className="page-container">
      <Row gutter={[24, 24]} style={{ marginBottom: '32px' }}>
        <Col xs={24}>
          <Title level={1} style={{ color: '#0052A3', marginBottom: '0' }}>
            My Bookings
          </Title>
          <Text type="secondary">View and manage your movie tickets</Text>
        </Col>
      </Row>

      <Card>
        {bookings.length > 0 ? (
          <Table
            columns={columns}
            dataSource={bookings}
            loading={loading}
            rowKey="orderId"
            pagination={{
              pageSize: 10,
              showTotal: (total) => `Total ${total} bookings`,
            }}
            responsive
          />
        ) : (
          <Empty
            description="No bookings yet"
            children={
              <Button type="primary" onClick={() => navigate('/')}>
                Browse Movies
              </Button>
            }
          />
        )}
      </Card>
    </div>
  );
};

export default MyBookings;
