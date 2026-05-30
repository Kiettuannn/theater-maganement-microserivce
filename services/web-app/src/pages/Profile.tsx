import { FC } from "react";
import { Card, Row, Col, Typography, Descriptions, Empty, Button } from "antd";
import { useNavigate } from "react-router-dom";
import {
  selectCinemaId,
  selectPermissions,
  selectUserId,
  useAuthStore,
} from "../stores";
import "../styles/App.css";

const { Title, Text } = Typography;

const Profile: FC = () => {
  const navigate = useNavigate();
  const userId = useAuthStore(selectUserId);
  const cinemaId = useAuthStore(selectCinemaId);
  const permissions = useAuthStore(selectPermissions);
  const hasProfile = Boolean(userId || cinemaId || permissions.length);

  return (
    <div className="page-container">
      <Row gutter={[24, 24]} style={{ marginBottom: "32px" }}>
        <Col xs={24}>
          <Title level={1} style={{ color: "#0052A3", marginBottom: "0" }}>
            Profile
          </Title>
          <Text type="secondary">Manage your personal information</Text>
        </Col>
      </Row>

      <Card>
        {hasProfile ? (
          <Descriptions bordered column={1} size="middle">
            <Descriptions.Item label="User ID">
              {userId ?? "Not set"}
            </Descriptions.Item>
            <Descriptions.Item label="Cinema ID">
              {cinemaId ?? "Not set"}
            </Descriptions.Item>
            <Descriptions.Item label="Permissions">
              {permissions.length ? permissions.join(", ") : "Not set"}
            </Descriptions.Item>
          </Descriptions>
        ) : (
          <Empty
            description="No profile data available"
            children={
              <Button type="primary" onClick={() => navigate("/")}>
                Browse Movies
              </Button>
            }
          />
        )}
      </Card>
    </div>
  );
};

export default Profile;
