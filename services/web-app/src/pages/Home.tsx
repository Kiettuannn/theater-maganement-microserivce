import { FC } from 'react';
import { Typography, Button, Row, Col } from 'antd';
import MovieGrid from '../components/MovieGrid';
import { getNowShowingMovies } from '../lib/mock-data';
import '../styles/App.css';

const { Title, Paragraph } = Typography;

const Home: FC = () => {
  const nowShowingMovies = getNowShowingMovies();

  return (
    <div className="page-container">
      <Row gutter={[24, 24]} style={{ marginBottom: '40px' }}>
        <Col xs={24}>
          <Title level={1} style={{ color: '#0052A3', marginBottom: '0' }}>
            Now Showing
          </Title>
          <Paragraph style={{ color: '#666', marginTop: '8px' }}>
            Choose your favorite movie and book your tickets now
          </Paragraph>
        </Col>
      </Row>

      <MovieGrid movies={nowShowingMovies} />

      <Row gutter={[24, 24]} style={{ marginTop: '60px', textAlign: 'center' }}>
        <Col xs={24}>
          <Title level={3} style={{ color: '#1F2937' }}>
            Can't find what you're looking for?
          </Title>
          <Button type="primary" size="large" href="/coming-soon">
            Check Coming Soon Movies
          </Button>
        </Col>
      </Row>
    </div>
  );
};

export default Home;
