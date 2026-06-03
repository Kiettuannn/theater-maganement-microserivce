import { useEffect, useRef } from "react";
import { notification } from "antd";
import {
  selectNotifications,
  useNotificationStore,
} from "../stores/useNotificationStore";

const NotificationsHost = () => {
  const notifications = useNotificationStore(selectNotifications);
  const shownIdsRef = useRef(new Set<string>());

  useEffect(() => {
    notifications.forEach((item) => {
      if (shownIdsRef.current.has(item.id)) {
        return;
      }

      shownIdsRef.current.add(item.id);

      notification[item.type]({
        key: item.id,
        message: item.title,
        description: item.message,
        placement: "topRight",
        duration: item.duration === 0 ? 0 : (item.duration ?? 5000) / 1000,
      });
    });
  }, [notifications]);

  return null;
};

export default NotificationsHost;
