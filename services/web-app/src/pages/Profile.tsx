import { FC } from "react";
import { Card, Row, Col, Typography, Descriptions, Empty, Button } from "antd";
import { useNavigate } from "react-router-dom";
import { getAuthSession } from "../lib/auth";
import "../styles/App.css";

const { Title, Text } = Typography;

const Profile: FC = () => {
  const navigate = useNavigate();
  const session = getAuthSession();
  const user = session?.user;

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
        {user ? (
          <Descriptions bordered column={1} size="middle">
            <Descriptions.Item label="Name">
              {user.name ?? "Not set"}
            </Descriptions.Item>
            <Descriptions.Item label="Email">
              {user.email ?? "Not set"}
            </Descriptions.Item>
            <Descriptions.Item label="Phone">
              {user.phone ?? "Not set"}
            </Descriptions.Item>
            <Descriptions.Item label="User ID">
              {user.id ?? "Not set"}
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
