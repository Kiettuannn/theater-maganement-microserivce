import { FC, useEffect, useRef, useState } from "react";
import { Button, DatePicker, Form, Input, Modal, Typography } from "antd";
import dayjs, { Dayjs } from "dayjs";
import { checkUsernameAvailable, login, register } from "../services/auth";
import { useNotificationStore } from "../stores/useNotificationStore";

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

type UsernameCheckStatus =
  | "idle"
  | "checking"
  | "available"
  | "exists"
  | "error";

const LoginModal: FC<LoginModalProps> = ({ open, onClose, onSuccess }) => {
  const [form] = Form.useForm<LoginFormValues | RegisterFormValues>();
  const [submitting, setSubmitting] = useState(false);
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [usernameCheckStatus, setUsernameCheckStatus] =
    useState<UsernameCheckStatus>("idle");
  const [usernameCheckMessage, setUsernameCheckMessage] = useState<
    string | null
  >(null);
  const addNotification = useNotificationStore(
    (state) => state.addNotification,
  );
  const usernameValue = Form.useWatch("username", form);
  const checkTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastCheckedRef = useRef<string>("");

  const STATUS_MAP: Record<
    UsernameCheckStatus,
    "validating" | "error" | "success" | "warning" | undefined
  > = {
    idle: undefined,
    checking: "validating",
    exists: "error",
    available: "success",
    error: "warning",
  };

  const usernameValidateStatus = isRegisterMode
    ? STATUS_MAP[usernameCheckStatus]
    : undefined;
  const usernameHelp = isRegisterMode
    ? (usernameCheckMessage ?? undefined)
    : undefined;

  const resetUsernameCheck = () => {
    setUsernameCheckStatus("idle");
    setUsernameCheckMessage(null);
  };

  useEffect(() => {
    if (checkTimeoutRef.current) {
      clearTimeout(checkTimeoutRef.current);
      checkTimeoutRef.current = null;
    }

    if (!isRegisterMode) {
      resetUsernameCheck();
      lastCheckedRef.current = "";
      return;
    }

    const username =
      typeof usernameValue === "string" ? usernameValue.trim() : "";

    if (username.length < 3) {
      resetUsernameCheck();
      lastCheckedRef.current = username;
      return;
    }

    setUsernameCheckStatus("checking");
    setUsernameCheckMessage("Checking username...");

    checkTimeoutRef.current = setTimeout(() => {
      const currentUsername = username;
      lastCheckedRef.current = currentUsername;

      checkUsernameAvailable(currentUsername)
        .then((result) => {
          if (lastCheckedRef.current !== currentUsername) {
            return;
          }

          if (!result.available) {
            setUsernameCheckStatus("exists");
            setUsernameCheckMessage("Username already exists");
          } else {
            setUsernameCheckStatus("available");
            setUsernameCheckMessage("Username is available");
          }
        })
        .catch(() => {
          if (lastCheckedRef.current !== currentUsername) {
            return;
          }

          setUsernameCheckStatus("error");
          setUsernameCheckMessage("Could not verify username");
        });
    }, 400);

    return () => {
      if (checkTimeoutRef.current) {
        clearTimeout(checkTimeoutRef.current);
      }
    };
  }, [isRegisterMode, usernameValue]);

  const handleLogin = async (values: LoginFormValues) => {
    setSubmitting(true);
    try {
      await login(values.username, values.password);
      addNotification({
        type: "success",
        title: "Signed in",
        message: "Signed in successfully",
      });
      form.resetFields();
      onSuccess();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Login failed";
      addNotification({
        type: "error",
        title: "Login failed",
        message: errorMessage,
      });
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
      addNotification({
        type: "success",
        title: "Registration",
        message: "Registration successful",
      });
      form.resetFields();
      setIsRegisterMode(false);
      resetUsernameCheck();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Register failed";
      addNotification({
        type: "error",
        title: "Register failed",
        message: errorMessage,
      });
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
    resetUsernameCheck();
    onClose();
  };

  const handleSwitchMode = (nextIsRegisterMode: boolean) => {
    form.resetFields();
    setIsRegisterMode(nextIsRegisterMode);
    resetUsernameCheck();
  };

  return (
    <>
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
            validateStatus={usernameValidateStatus}
            help={usernameHelp}
            hasFeedback={isRegisterMode}
            rules={[
              { required: true, message: "Please enter your username" },
              { min: 3, message: "Username must be at least 3 characters" },
              {
                validator: async (_, value) => {
                  if (!isRegisterMode) {
                    return Promise.resolve();
                  }

                  const normalized =
                    typeof value === "string" ? value.trim() : "";

                  if (normalized.length < 3) {
                    return Promise.resolve();
                  }

                  if (usernameCheckStatus === "exists") {
                    return Promise.reject(new Error("Username already exists"));
                  }

                  return Promise.resolve();
                },
              },
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
              autoComplete={
                isRegisterMode ? "new-password" : "current-password"
              }
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
                          new Error("Age must be at least 15"),
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
