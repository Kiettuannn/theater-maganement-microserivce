import { FC } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Row,
  Col,
  Button,
  Card,
  Descriptions,
  Tag,
  Image,
  Empty,
  Space,
  Spin,
} from "antd";
import { useState } from "react";
import { selectIsAuthenticated, useAuthStore } from "../stores";
import LoginModal from "../components/LoginModal";
import { useMovieDetail } from "../hooks/useMovies";
import "../styles/App.css";

const MovieDetail: FC = () => {
  const fallbackImage = "/images/placeholder.svg";
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { movie, loading } = useMovieDetail(id);
  const [loginOpen, setLoginOpen] = useState(false);
  const isSignedIn = useAuthStore(selectIsAuthenticated);

  const handleLoginSuccess = () => {
    setLoginOpen(false);
    navigate(`/booking/${movie?.id}`);
  };

  if (loading) {
    return (
      <div className="page-container">
        <Spin size="large" style={{ display: "block", textAlign: "center", marginTop: "60px" }} />
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="page-container">
        <Empty
          description="Movie not found"
          style={{ marginTop: "60px" }}
          children={
            <Button type="primary" onClick={() => navigate("/")}>
              Back to Home
            </Button>
          }
        />
      </div>
    );
  }

  const isComingSoon = movie.status === "coming_soon";

  return (
    <div className="page-container">
      <Button
        type="text"
        onClick={() => navigate(-1)}
        style={{ marginBottom: "24px", color: "#0052A3" }}
      >
        ← Back
      </Button>

      <Row gutter={[32, 32]}>
        <Col xs={24} sm={24} md={8}>
          <Image
            src={movie.posterUrl}
            alt={movie.title}
            preview={true}
            style={{ borderRadius: "8px", width: "100%" }}
            onError={(e) => {
              const img = e.currentTarget as HTMLImageElement;
              img.onerror = null;
              img.src = fallbackImage;
            }}
          />
          <Button
            type="primary"
            size="large"
            block
            style={{ marginTop: "24px" }}
            onClick={() => {
              if (isSignedIn) {
                navigate(`/booking/${movie.id}`);
              } else {
                setLoginOpen(true);
              }
            }}
            disabled={isComingSoon}
          >
            {isComingSoon ? "Coming Soon" : "Book Tickets"}
          </Button>
        </Col>

        <Col xs={24} sm={24} md={16}>
          <h1 style={{ fontSize: "32px", color: "#0052A3", marginBottom: "16px" }}>
            {movie.title}
          </h1>

          <Space direction="vertical" size="large" style={{ width: "100%" }}>
            <div>
              {movie.genres.map((g) => (
                <Tag key={g.id} color="blue" style={{ marginRight: "8px", marginBottom: "8px" }}>
                  {g.name}
                </Tag>
              ))}
            </div>

            <Descriptions
              column={1}
              items={[
                { label: "Duration", children: `${movie.durationMinutes} minutes` },
                {
                  label: "Release Date",
                  children: new Date(movie.releaseDate).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  }),
                },
                ...(movie.director ? [{ label: "Director", children: movie.director }] : []),
                ...(movie.castMembers ? [{ label: "Cast", children: movie.castMembers }] : []),
                ...(movie.ageRating ? [{ label: "Age Rating", children: `${movie.ageRating.code} — ${movie.ageRating.description}` }] : []),
                {
                  label: "Status",
                  children: isComingSoon ? (
                    <Tag color="blue">Coming Soon</Tag>
                  ) : (
                    <Tag color="green">Now Showing</Tag>
                  ),
                },
              ]}
            />

            <Card title="Synopsis">
              <p style={{ lineHeight: 1.6, color: "#666" }}>{movie.description}</p>
            </Card>
          </Space>
        </Col>
      </Row>

      <LoginModal
        open={loginOpen}
        onClose={() => setLoginOpen(false)}
        onSuccess={handleLoginSuccess}
      />
    </div>
  );
};

export default MovieDetail;
