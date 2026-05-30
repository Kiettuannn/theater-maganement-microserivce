import { FC } from 'react';
import { Typography, Button, Row, Col } from 'antd';
import MovieGrid from '../components/MovieGrid';
import { getComingSoonMovies } from '../lib/mock-data';
import '../styles/App.css';

const { Title, Paragraph } = Typography;

const ComingSoon: FC = () => {
  const comingSoonMovies = getComingSoonMovies();

  return (
    <div className="page-container">
      <Row gutter={[24, 24]} style={{ marginBottom: '40px' }}>
        <Col xs={24}>
          <Title level={1} style={{ color: '#0052A3', marginBottom: '0' }}>
            Coming Soon
          </Title>
          <Paragraph style={{ color: '#666', marginTop: '8px' }}>
            Exciting movies coming to your nearest cinema
          </Paragraph>
        </Col>
      </Row>

      {comingSoonMovies.length > 0 ? (
        <MovieGrid movies={comingSoonMovies} />
      ) : (
        <Row gutter={[24, 24]} style={{ textAlign: 'center', marginTop: '60px' }}>
          <Col xs={24}>
            <Title level={3} style={{ color: '#1F2937' }}>
              No coming soon movies available at the moment
            </Title>
            <Button type="primary" size="large" href="/">
              Back to Now Showing
            </Button>
          </Col>
        </Row>
      )}
    </div>
  );
};

export default ComingSoon;
