import { useEffect } from "react";
import { initSocket } from "../services/socket";
import useNotifications from "../context/useNotifications";

export const MeetNotificationListener = () => {
  const { addMeetingNotification, removeMeetingNotification } = useNotifications();

  useEffect(() => {
    // Get token from localStorage to send in socket auth
    const token = localStorage.getItem("token");
    if (!token) {
      console.warn("MeetNotificationListener: No token found in localStorage, socket may not authenticate");
      return;
    }

    console.log("MeetNotificationListener: Initializing socket with token");
    const socket = initSocket(token);

    socket.on("connect", () => {
      console.log("MeetNotificationListener: socket connected", socket.id);
    });

    socket.on("connect_error", (err) => {
      console.error("MeetNotificationListener: socket connect_error", err && err.message ? err.message : err);
    });

    socket.on("meet-started", (data) => {
      console.log("MeetNotificationListener: received meet-started event", data);
      console.log("Adding meeting notification with meetingId:", data.meetingId);
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
  }, [addMeetingNotification, removeMeetingNotification]);

  return null;
};
