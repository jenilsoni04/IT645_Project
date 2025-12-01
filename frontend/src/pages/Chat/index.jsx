import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import UserList from '../../components/UserList';
import ChatArea from '../../components/ChatArea';
import api from '../../utils/api';

function Chat({ user, setUser }) {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [socket, setSocket] = useState(null);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [usersError, setUsersError] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('No token found for socket connection');
      return;
    }

    const newSocket = io('http://localhost:3000', {
      auth: { token },
      query: { token }, // Also send in query for compatibility
      transports: ['websocket', 'polling'], // Allow fallback to polling for Chrome
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
      timeout: 20000,
    });

    newSocket.on('connect', () => {
      console.log('Socket connected:', newSocket.id);
      // Join with user ID after connection
      const userId = user?._id || JSON.parse(localStorage.getItem('user') || '{}')?._id;
      if (userId) {
        console.log('Joining socket with userId:', userId);
        newSocket.emit('join', userId);
      }
    });

    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      if (error.message.includes('Authentication')) {
        console.error('Socket authentication failed. Please log in again.');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        window.location.href = '/login';
      }
    });

    newSocket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      if (reason === 'io server disconnect') {
        // Server disconnected, reconnect manually
        newSocket.connect();
      }
    });

    newSocket.on('error', (error) => {
      console.error('Socket error:', error);
    });

    setSocket(newSocket);
    fetchUsers();

    return () => {
      if (newSocket.connected) {
        newSocket.disconnect();
      }
      newSocket.close();
    };
  }, [user?._id]);

  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);
      setUsersError(null);

      const res = await api.get('/connect/connections');
      const raw = res.data;

      const usersArray = Array.isArray(raw)
        ? raw
        : Array.isArray(raw?.connections)
        ? raw.connections
        : Array.isArray(raw?.data)
        ? raw.data
        : [];

      if (!Array.isArray(usersArray)) {
        throw new Error('Invalid users response from server');
      }

      setUsers(usersArray);
    } catch (error) {
      console.error('Error fetching users:', error);
      if (error.response) {
        if (error.response.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setUser(null);
          window.location.href = '/login';
        } else {
          setUsersError(
            `Error: ${
              error.response.data?.message || 'Failed to fetch users'
            }`
          );
        }
      } else if (error.request) {
        setUsersError(
          'Cannot connect to server. Please check if the backend is running.'
        );
      } else {
        setUsersError(`Error: ${error.message}`);
      }
      setUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleSelectUser = (u) => {
    setSelectedUser(u);
  };

  return (
    <div className="fixed top-16 left-0 right-0 bottom-0 flex bg-white">
      <UserList
        users={users}
        selectedUser={selectedUser}
        onSelectUser={handleSelectUser}
        loading={loadingUsers}
        error={usersError}
      />

      {selectedUser ? (
        <ChatArea
          selectedUser={selectedUser}
          currentUser={user}
          socket={socket}
        />
      ) : (
        <div className="flex-1 bg-gray-100 flex items-center justify-center">
          <h6 className="text-blue-700 font-medium text-lg">
            Select a user to start chatting
          </h6>
        </div>
      )}
    </div>
  );
}

export default Chat;
