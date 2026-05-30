import { FC } from "react";
import {
  Card,
  Row,
  Col,
  Typography,
  Form,
  Switch,
  Select,
  Button,
  message,
} from "antd";
import "../styles/App.css";

const { Title, Text } = Typography;

const Settings: FC = () => {
  const [messageApi, contextHolder] = message.useMessage();

  const handleSave = () => {
    messageApi.success("Settings saved");
  };

  return (
    <div className="page-container">
      {contextHolder}
      <Row gutter={[24, 24]} style={{ marginBottom: "32px" }}>
        <Col xs={24}>
          <Title level={1} style={{ color: "#0052A3", marginBottom: "0" }}>
            Settings
          </Title>
          <Text type="secondary">Adjust notifications and preferences</Text>
        </Col>
      </Row>

      <Card>
        <Form
          layout="vertical"
          initialValues={{
            language: "en",
            emailUpdates: true,
            smsUpdates: false,
            bookingReminders: true,
          }}
          onFinish={handleSave}
        >
          <Row gutter={[24, 24]}>
            <Col xs={24} md={12}>
              <Form.Item label="Language" name="language">
                <Select
                  options={[
                    { label: "English", value: "en" },
                    { label: "Vietnamese", value: "vi" },
                  ]}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="Timezone" name="timezone">
                <Select
                  placeholder="Select timezone"
                  options={[
                    {
                      label: "Asia/Ho_Chi_Minh (GMT+7)",
                      value: "Asia/Ho_Chi_Minh",
                    },
                    { label: "Asia/Ha_Noi (GMT+7)", value: "Asia/Ha_Noi" },
                  ]}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[24, 12]}>
            <Col xs={24} md={12}>
              <Form.Item
                label="Email updates"
                name="emailUpdates"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                label="SMS updates"
                name="smsUpdates"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                label="Booking reminders"
                name="bookingReminders"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
            </Col>
          </Row>

          <Button type="primary" htmlType="submit">
            Save changes
          </Button>
        </Form>
      </Card>
    </div>
  );
};

export default Settings;
