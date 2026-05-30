import { FC } from "react";
import { Card, Badge, Rate, Tag } from "antd";
import { Link } from "react-router-dom";
import type { Movie } from "../lib/mock-data";
import "../styles/App.css";

interface MovieCardProps {
  movie: Movie;
  onSelect?: (movie: Movie) => void;
}

const MovieCard: FC<MovieCardProps> = ({ movie, onSelect }) => {
  const fallbackImage = "/images/placeholder.svg";

  const handleClick = () => {
    if (onSelect) {
      onSelect(movie);
    }
  };

  return (
    <Link to={`/movie/${movie.id}`} onClick={handleClick}>
      <Card
        hoverable
        className="movie-card"
        cover={
          <div style={{ position: "relative", overflow: "hidden" }}>
            <img
              alt={movie.title}
              src={movie.image}
              className="movie-image"
              onError={(e) => {
                const img = e.currentTarget as HTMLImageElement;
                img.onerror = null;
                img.src = fallbackImage;
              }}
            />
            <Badge
              count={
                movie.status === "coming-soon" ? (
                  <Tag color="blue">Coming Soon</Tag>
                ) : (
                  <Tag color="green">Now Showing</Tag>
                )
              }
              style={{ position: "absolute", top: "8px", right: "8px" }}
            />
          </div>
        }
        style={{ margin: "8px" }}
      >
        <Card.Meta
          title={
            <div
              style={{ fontWeight: 600, fontSize: "16px", color: "#0052A3" }}
            >
              {movie.title}
            </div>
          }
          description={
            <div>
              <div style={{ marginBottom: "8px" }}>
                <Rate
                  disabled
                  value={movie.rating / 2}
                  style={{ fontSize: "14px" }}
                />
                <span style={{ marginLeft: "8px", color: "#666" }}>
                  {movie.rating.toFixed(1)}
                </span>
              </div>
              <div style={{ marginBottom: "8px" }}>
                {movie.genre.map((g) => (
                  <Tag
                    key={g}
                    color="blue"
                    style={{ marginRight: "4px", marginBottom: "4px" }}
                  >
                    {g}
                  </Tag>
                ))}
              </div>
              <div style={{ color: "#666", fontSize: "14px" }}>
                Duration: {movie.duration} min
              </div>
            </div>
          }
        />
      </Card>
    </Link>
  );
};

export default MovieCard;
