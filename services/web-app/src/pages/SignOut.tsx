import { FC, useEffect } from "react";
import { Button, Result } from "antd";
import { useNavigate } from "react-router-dom";
import { logOut } from "../services/auth";
import "../styles/App.css";

const SignOut: FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    logOut();
  }, []);

  return (
    <div className="page-container">
      <Result
        status="success"
        title="Signed out"
        subTitle="You have been signed out of your account."
        extra={
          <Button type="primary" onClick={() => navigate("/")}>
            Go to Home
          </Button>
        }
      />
    </div>
  );
};

export default SignOut;
