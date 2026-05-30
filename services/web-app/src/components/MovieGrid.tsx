import { FC } from 'react';
import { Row, Col } from 'antd';
import MovieCard from './MovieCard';
import type { Movie } from '../lib/mock-data';

interface MovieGridProps {
  movies: Movie[];
  onMovieSelect?: (movie: Movie) => void;
}

const MovieGrid: FC<MovieGridProps> = ({ movies, onMovieSelect }) => {
  return (
    <Row gutter={[16, 16]}>
      {movies.map((movie) => (
        <Col key={movie.id} xs={24} sm={12} md={8} lg={6}>
          <MovieCard movie={movie} onSelect={onMovieSelect} />
        </Col>
      ))}
    </Row>
  );
};

export default MovieGrid;
