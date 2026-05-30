import { ConfigProvider } from "antd";
import theme from "./theme";
import { AppRoutes } from "./routes";
import "./styles/App.css";

function App() {
  return (
    <ConfigProvider theme={theme}>
      <AppRoutes />
    </ConfigProvider>
  );
}

export default App;
