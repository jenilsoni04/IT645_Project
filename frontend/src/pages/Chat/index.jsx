import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import { Box, Typography } from '@mui/material';
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
    const newSocket = io('http://localhost:3000', {
      auth: { token },
      transports: ['websocket'],
    });

    newSocket.on('connect', () => {
      console.log('Socket connected');
    });

    newSocket.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    setSocket(newSocket);
    fetchUsers();

    return () => {
      newSocket.close();
    };
  }, []);

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
    <Box
      sx={{
        position: 'fixed',
        top: '64px',
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        bgcolor: '#ffffff',
      }}
    >
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
        <Box
          sx={{
            flex: 1,
            bgcolor: '#f5f5f5',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Typography
            variant="h6"
            sx={{ color: '#1565c0', fontWeight: 500 }}
          >
            Select a user to start chatting
          </Typography>
        </Box>
      )}
    </Box>
  );
}

export default Chat;
