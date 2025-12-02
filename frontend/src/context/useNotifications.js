import { useContext } from 'react';
import { NotificationContext } from './NotificationContextCore';

export default function useNotifications() {
  return useContext(NotificationContext);
}
