import { FC } from "react";
import { Card, Badge, Tag } from "antd";
import { Link } from "react-router-dom";
import type { MovieSimple } from "../services/movie";
import "../styles/App.css";

interface MovieCardProps {
  movie: MovieSimple;
  onSelect?: (movie: MovieSimple) => void;
}

const MovieCard: FC<MovieCardProps> = ({ movie, onSelect }) => {
  const fallbackImage = "/images/placeholder.svg";

  return (
    <Link to={`/movie/${movie.id}`} onClick={() => onSelect?.(movie)}>
      <Card
        hoverable
        className="movie-card"
        cover={
          <div style={{ position: "relative", overflow: "hidden" }}>
            <img
              alt={movie.title}
              src={movie.posterUrl}
              className="movie-image"
              onError={(e) => {
                const img = e.currentTarget as HTMLImageElement;
                img.onerror = null;
                img.src = fallbackImage;
              }}
            />
            <Badge
              count={
                movie.status === "coming_soon" ? (
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
            <div style={{ fontWeight: 600, fontSize: "16px", color: "#0052A3" }}>
              {movie.title}
            </div>
          }
          description={
            <div>
              <div style={{ marginBottom: "8px" }}>
                {movie.genres.map((g) => (
                  <Tag key={g.id} color="blue" style={{ marginRight: "4px", marginBottom: "4px" }}>
                    {g.name}
                  </Tag>
                ))}
              </div>
              <div style={{ color: "#666", fontSize: "14px" }}>
                Duration: {movie.durationMinutes} min
              </div>
            </div>
          }
        />
      </Card>
    </Link>
  );
};

export default MovieCard;
