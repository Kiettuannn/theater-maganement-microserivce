import { FC } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Row,
  Col,
  Button,
  Card,
  Descriptions,
  Rate,
  Tag,
  Image,
  Empty,
  Space,
} from "antd";
import { getMovieById } from "../lib/mock-data";
import "../styles/App.css";

const MovieDetail: FC = () => {
  const fallbackImage = "/images/placeholder.svg";
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const movie = id ? getMovieById(id) : null;

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
            src={movie.image}
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
            onClick={() => navigate(`/booking/${movie.id}`)}
            disabled={movie.status === "coming-soon"}
          >
            {movie.status === "coming-soon" ? "Coming Soon" : "Book Tickets"}
          </Button>
        </Col>

        <Col xs={24} sm={24} md={16}>
          <h1
            style={{ fontSize: "32px", color: "#0052A3", marginBottom: "16px" }}
          >
            {movie.title}
          </h1>

          <Space direction="vertical" size="large" style={{ width: "100%" }}>
            <div>
              <Rate
                disabled
                value={movie.rating / 2}
                style={{ fontSize: "18px" }}
              />
              <span
                style={{ marginLeft: "12px", fontSize: "16px", color: "#666" }}
              >
                {movie.rating.toFixed(1)}/10
              </span>
            </div>

            <div>
              {movie.genre.map((g) => (
                <Tag
                  key={g}
                  color="blue"
                  style={{ marginRight: "8px", marginBottom: "8px" }}
                >
                  {g}
                </Tag>
              ))}
            </div>

            <Descriptions
              column={1}
              items={[
                {
                  label: "Duration",
                  children: `${movie.duration} minutes`,
                },
                {
                  label: "Release Date",
                  children: new Date(movie.releaseDate).toLocaleDateString(
                    "en-US",
                    {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    },
                  ),
                },
                {
                  label: "Status",
                  children:
                    movie.status === "now-showing" ? (
                      <Tag color="green">Now Showing</Tag>
                    ) : (
                      <Tag color="blue">Coming Soon</Tag>
                    ),
                },
              ]}
            />

            <Card title="Synopsis">
              <p style={{ lineHeight: 1.6, color: "#666" }}>
                {movie.description}
              </p>
            </Card>
          </Space>
        </Col>
      </Row>
    </div>
  );
};

export default MovieDetail;
