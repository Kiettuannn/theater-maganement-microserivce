import { FC } from 'react';
import { Typography, Button, Row, Col, Spin, Alert } from 'antd';
import MovieGrid from '../components/MovieGrid';
import { useComingSoonMovies } from '../hooks/useMovies';
import '../styles/App.css';

const { Title, Paragraph } = Typography;

const ComingSoon: FC = () => {
  const { movies, loading, error } = useComingSoonMovies();

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

      {loading && <Spin size="large" style={{ display: 'block', textAlign: 'center', marginTop: '60px' }} />}
      {error && <Alert type="error" message={error} style={{ marginBottom: '24px' }} />}
      {!loading && movies.length > 0 && <MovieGrid movies={movies} />}
      {!loading && !error && movies.length === 0 && (
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
