import AllRoute from "./components/AllRoute";
import { NotificationContainer } from "./components/ui/notification";
import { LoadingOverlay } from "./components/ui/loading";
import { ChatbotWidget } from "./components/ChatbotWidget";

function App() {
  return (
    <>
      <AllRoute />
      <NotificationContainer />
      <LoadingOverlay />
      <ChatbotWidget />
    </>
  );
}

export default App;
