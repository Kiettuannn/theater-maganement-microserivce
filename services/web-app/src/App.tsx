import { ConfigProvider } from "antd";
import theme from "./theme";
import { AppRoutes } from "./routes";
import NotificationsHost from "./components/NotificationsHost";
import "./styles/App.css";

function App() {
  return (
    <ConfigProvider theme={theme}>
      <NotificationsHost />
      <AppRoutes />
    </ConfigProvider>
  );
}

export default App;
