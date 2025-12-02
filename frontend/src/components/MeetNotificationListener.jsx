import { useEffect } from "react";
import { getSocket } from "../services/socket";
import useNotifications from "../context/useNotifications";

export const MeetNotificationListener = () => {
  const { addMeetingNotification, removeMeetingNotification } = useNotifications();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const socket = getSocket(token);

    socket.on("meet-started", (data) => {
      addMeetingNotification(data);
    });

    socket.on("meet-ended", ({ meetingId }) => {
      if (meetingId) {
        try {
          removeMeetingNotification(meetingId);
        } catch (e) {
          console.error("Error removing meeting notification:", e);
        }
      }
    });

    return () => {
      socket.off("meet-started");
      socket.off("meet-ended");
    };
  }, [addMeetingNotification]);

  return null;
};
