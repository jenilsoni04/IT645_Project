import { createContext } from 'react';

const defaultContext = {
  meetingNotifications: {},
  addMeetingNotification: () => {},
  removeMeetingNotification: () => {},
  clearAllNotifications: () => {},
};

export const NotificationContext = createContext(defaultContext);

export default NotificationContext;
