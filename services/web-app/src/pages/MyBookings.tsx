import { FC, useState, useEffect } from 'react';
import { Table, Card, Empty, Button, Row, Col, Space, Typography, Badge, message } from 'antd';
import { EyeOutlined, DeleteOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { useNotificationStore } from '../stores/useNotificationStore';
import { getMyBookings, getTicketsByBooking, cancelBooking, BookingListItem } from '../services/booking';
import { getMyInfo } from '../services/user';
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
  status: string;
  paymentDate: string;
}

const MyBookings: FC = () => {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<BookingRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalBookings, setTotalBookings] = useState(0);
  const pageSize = 10;
  const { setHasUnreadBooking } = useNotificationStore();

  useEffect(() => {
    setHasUnreadBooking(false);
    loadBookings(currentPage);
  }, [setHasUnreadBooking, currentPage]);

  const loadBookings = async (page: number) => {
    setLoading(true);
    try {
      const userInfo = await getMyInfo();
      if (!userInfo) {
        message.error("Please login to view your bookings");
        setLoading(false);
        return;
      }

      // Backend pages are 0-indexed
      const res = await getMyBookings(userInfo.id, page - 1, pageSize);
      setTotalBookings(res?.totalElements || 0);
      
      const allBookings: BookingRecord[] = await Promise.all(
        (res?.bookings || []).map(async (b: BookingListItem) => {
          let movieTitle = "TBA";
          let date = b.createdAt;
          let time = "TBA";
          let seats = "";
          
          if (b.status === 'CONFIRMED') {
            try {
              const tickets = await getTicketsByBooking(b.id);
              if (tickets && tickets.length > 0) {
                movieTitle = tickets[0].movieTitle || "TBA";
                date = tickets[0].showDate || b.createdAt;
                time = tickets[0].showTime || "TBA";
                seats = tickets.map((t: any) => t.seatName).filter(Boolean).join(', ');
              }
            } catch (err) {
              console.error("Failed to fetch tickets for booking", b.id, err);
            }
          }
          
          return {
            orderId: b.id,
            movieTitle,
            cinema: "Cinestar Sinh Viên",
            date,
            time,
            seats: seats || "N/A",
            totalPrice: b.totalAmount,
            status: b.status,
            paymentDate: b.createdAt
          };
        })
      );
      
      setBookings(allBookings);
    } catch (error) {
      console.error('Error loading bookings:', error);
      message.error("Failed to load bookings");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (orderId: string) => {
    try {
      await cancelBooking(orderId);
      message.success("Booking cancelled successfully");
      loadBookings();
    } catch (err) {
      message.error("Failed to cancel booking");
    }
  };

  const columns: ColumnsType<BookingRecord> = [
    {
      title: 'Order ID',
      dataIndex: 'orderId',
      key: 'orderId',
      render: (text) => <span style={{ fontWeight: 600, color: '#0052A3' }}>{text.substring(0, 8).toUpperCase()}</span>,
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
      render: (price, record) => (
        <span style={{ textDecoration: record.status !== 'CONFIRMED' ? 'line-through' : 'none', color: record.status !== 'CONFIRMED' ? '#999' : 'inherit' }}>
          {price.toLocaleString()} VND
        </span>
      ),
      sorter: (a, b) => a.totalPrice - b.totalPrice,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const isConfirmed = status === 'CONFIRMED';
        const isCancelled = status === 'CANCELLED' || status === 'FAILED';
        return (
          <Badge
            status={isConfirmed ? 'success' : isCancelled ? 'error' : 'warning'}
            text={status}
          />
        );
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          {record.status === 'CONFIRMED' && (
            <Button
              type="primary"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => navigate(`/confirmation/${record.orderId}`)}
            >
              View
            </Button>
          )}
          {(record.status === 'INITIATED' || record.status === 'PAYMENT_PENDING') && (
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
              current: currentPage,
              pageSize: pageSize,
              total: totalBookings,
              onChange: (page) => setCurrentPage(page),
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
