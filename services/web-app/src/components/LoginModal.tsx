import { FC, useState } from "react";
import { Button, DatePicker, Form, Input, Modal, Typography, message } from "antd";
import dayjs, { Dayjs } from "dayjs";
import { login, register } from "../services/auth";

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

interface RegisterFormValues {
  username: string;
  password: string;
  email: string;
  firstname?: string;
  lastname?: string;
  city?: string;
  dob?: Dayjs;
}

const LoginModal: FC<LoginModalProps> = ({ open, onClose, onSuccess }) => {
  const [form] = Form.useForm<LoginFormValues | RegisterFormValues>();
  const [submitting, setSubmitting] = useState(false);
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();

  const handleLogin = async (values: LoginFormValues) => {
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

  const handleRegister = async (values: RegisterFormValues) => {
    setSubmitting(true);
    try {
      await register({
        username: values.username,
        password: values.password,
        email: values.email,
        firstname: values.firstname?.trim() || undefined,
        lastname: values.lastname?.trim() || undefined,
        city: values.city?.trim() || undefined,
        dob: values.dob ? values.dob.format("YYYY-MM-DD") : undefined,
      });
      messageApi.success("Registration successful");
      form.resetFields();
      setIsRegisterMode(false);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Register failed";
      messageApi.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleFinish = async (values: LoginFormValues | RegisterFormValues) => {
    if (isRegisterMode) {
      await handleRegister(values as RegisterFormValues);
      return;
    }

    await handleLogin(values as LoginFormValues);
  };

  const handleClose = () => {
    form.resetFields();
    setIsRegisterMode(false);
    onClose();
  };

  const handleSwitchMode = (nextIsRegisterMode: boolean) => {
    form.resetFields();
    setIsRegisterMode(nextIsRegisterMode);
  };

  return (
    <>
      {contextHolder}
      <Modal
        open={open}
        title={isRegisterMode ? "Register" : "Sign In"}
        onCancel={handleClose}
        footer={null}
        destroyOnClose
      >
        <Paragraph type="secondary" style={{ marginBottom: 24 }}>
          {isRegisterMode
            ? "Create a new account to continue."
            : "Use your account credentials to continue."}
        </Paragraph>
        <Form form={form} layout="vertical" onFinish={handleFinish}>
          <Form.Item
            name="username"
            label="Username"
            rules={[
              { required: true, message: "Please enter your username" },
              { min: 3, message: "Username must be at least 3 characters" },
            ]}
          >
            <Input autoComplete="username" placeholder="Username" />
          </Form.Item>
          <Form.Item
            name="password"
            label="Password"
            rules={[
              { required: true, message: "Please enter your password" },
              { min: 8, message: "Password must be at least 8 characters" },
            ]}
          >
            <Input.Password
              autoComplete={isRegisterMode ? "new-password" : "current-password"}
              placeholder="Password"
            />
          </Form.Item>
          {isRegisterMode && (
            <>
              <Form.Item
                name="email"
                label="Email"
                rules={[
                  { required: true, message: "Please enter your email" },
                  { type: "email", message: "Please enter a valid email" },
                ]}
              >
                <Input autoComplete="email" placeholder="Email" />
              </Form.Item>
              <Form.Item name="firstname" label="First Name">
                <Input autoComplete="given-name" placeholder="First Name" />
              </Form.Item>
              <Form.Item name="lastname" label="Last Name">
                <Input autoComplete="family-name" placeholder="Last Name" />
              </Form.Item>
              <Form.Item name="city" label="City">
                <Input autoComplete="address-level2" placeholder="City" />
              </Form.Item>
              <Form.Item
                name="dob"
                label="Date of Birth"
                rules={[
                  {
                    validator: async (_, value: Dayjs | undefined) => {
                      if (!value) {
                        return Promise.resolve();
                      }

                      const age = dayjs().diff(value, "year");
                      if (age < 15) {
                        return Promise.reject(
                          new Error("Age must be at least 15")
                        );
                      }

                      return Promise.resolve();
                    },
                  },
                ]}
              >
                <DatePicker
                  style={{ width: "100%" }}
                  format="YYYY-MM-DD"
                  placeholder="YYYY-MM-DD"
                />
              </Form.Item>
            </>
          )}
          <Button type="primary" htmlType="submit" block loading={submitting}>
            {isRegisterMode ? "Register" : "Sign In"}
          </Button>
          <div style={{ marginTop: 16, textAlign: "center" }}>
            {isRegisterMode ? (
              <Typography.Text type="secondary">
                Already have an account?{" "}
                <Button
                  type="link"
                  onClick={() => handleSwitchMode(false)}
                  style={{ padding: 0 }}
                >
                  Sign in
                </Button>
              </Typography.Text>
            ) : (
              <Typography.Text type="secondary">
                Don't have an account?{" "}
                <Button
                  type="link"
                  onClick={() => handleSwitchMode(true)}
                  style={{ padding: 0 }}
                >
                  Register
                </Button>
              </Typography.Text>
            )}
          </div>
        </Form>
      </Modal>
    </>
  );
};

export default LoginModal;
