import { FC, useState } from "react";
import { Button, Form, Input, Modal, Typography, message } from "antd";
import { login } from "../services/auth";

const { Paragraph } = Typography;

interface LoginModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface LoginFormValues {
  username: string;
  password: string;
}

const LoginModal: FC<LoginModalProps> = ({ open, onClose, onSuccess }) => {
  const [form] = Form.useForm<LoginFormValues>();
  const [submitting, setSubmitting] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();

  const handleFinish = async (values: LoginFormValues) => {
    setSubmitting(true);
    try {
      await login(values.username, values.password);
      messageApi.success("Signed in successfully");
      form.resetFields();
      onSuccess();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Login failed";
      messageApi.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    form.resetFields();
    onClose();
  };

  return (
    <>
      {contextHolder}
      <Modal
        open={open}
        title="Sign In"
        onCancel={handleClose}
        footer={null}
        destroyOnClose
      >
        <Paragraph type="secondary" style={{ marginBottom: 24 }}>
          Use your account credentials to continue.
        </Paragraph>
        <Form form={form} layout="vertical" onFinish={handleFinish}>
          <Form.Item
            name="username"
            label="Username"
            rules={[{ required: true, message: "Please enter your username" }]}
          >
            <Input autoComplete="username" placeholder="Username" />
          </Form.Item>
          <Form.Item
            name="password"
            label="Password"
            rules={[{ required: true, message: "Please enter your password" }]}
          >
            <Input.Password
              autoComplete="current-password"
              placeholder="Password"
            />
          </Form.Item>
          <Button type="primary" htmlType="submit" block loading={submitting}>
            Sign In
          </Button>
        </Form>
      </Modal>
    </>
  );
};

export default LoginModal;
