import React, { useState, useEffect, useRef } from 'react';
import { format, isToday, isYesterday } from 'date-fns';
import { Paperclip, Send } from 'lucide-react';
import api from '../utils/api';
import MessageBubble from './MessageBubble';

function ChatArea({ selectedUser, currentUser, socket }) {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const getId = (val) => {
    if (!val) return null;
    if (typeof val === 'string') return val;
    if (typeof val === 'object') return val._id || val.id || null;
    return null;
  };

  useEffect(() => {
    if (!selectedUser?._id || !currentUser?._id) return;
    fetchMessages();
  }, [selectedUser?._id, currentUser?._id]);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/messages/${selectedUser._id}`);
      const data = res.data || [];
      data.sort(
        (a, b) =>
          new Date(a.createdAt).getTime() -
          new Date(b.createdAt).getTime()
      );
      setMessages(data);
    } catch (err) {
      console.error('Error fetching messages:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!socket || !selectedUser || !currentUser) return;

    const handleNewMessage = (message) => {
      if (!message.sender || !message.receiver) return;

      const senderId = getId(message.sender);
      const receiverId = getId(message.receiver);
      if (!senderId || !receiverId) return;

      const isThisChat =
        (senderId === selectedUser._id &&
          receiverId === currentUser._id) ||
        (senderId === currentUser._id &&
          receiverId === selectedUser._id);

      if (!isThisChat) return;

      setMessages((prev) => {
        if (prev.some((m) => m._id === message._id)) return prev;
        return [...prev, message];
      });
    };

    socket.on('newMessage', handleNewMessage);
    return () => {
      socket.off('newMessage', handleNewMessage);
    };
  }, [socket, selectedUser, currentUser]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!selectedUser) return;

    const file = fileInputRef.current?.files[0];
    if (!inputMessage.trim() && !file) return;

    // Check if socket is connected
    if (!socket || !socket.connected) {
      console.error('Socket not connected. Cannot send message.');
      alert('Connection lost. Please refresh the page.');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('receiverId', selectedUser._id);

      if (file) {
        // Validate file before sending
        if (file.size > 10 * 1024 * 1024) {
          alert('File size exceeds 10MB limit');
          return;
        }
        
        formData.append('file', file);
        formData.append('type', 'file');
        if (inputMessage.trim() && !inputMessage.includes(file.name)) {
          formData.append('content', inputMessage.trim());
        }
      } else {
        formData.append('content', inputMessage.trim());
        formData.append('type', 'text');
      }

      const res = await api.post('/messages', formData, {
        headers: { 
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (file) {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            console.log(`Upload progress: ${percentCompleted}%`);
          }
        },
      });

      const savedMessage = res.data;

      // Emit to socket for real-time delivery
      if (socket && socket.connected) {
        socket.emit('sendMessage', { savedMessage });
      }

      setMessages((prev) =>
        prev.some((m) => m._id === savedMessage._id)
          ? prev
          : [...prev, savedMessage]
      );

      setInputMessage('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      console.error('Error sending message:', err);
      console.error('Error response:', err.response?.data);
      
      let errorMsg = 'Failed to send message';
      
      if (err.response?.data?.message) {
        errorMsg = err.response.data.message;
      } else if (err.message) {
        errorMsg = err.message;
      }
      
      // Show user-friendly error message
      if (errorMsg.includes('not configured') || errorMsg.includes('not available')) {
        alert('File upload service is not configured. Please contact support or try sending a text message.');
      } else if (errorMsg.includes('upload failed') || errorMsg.includes('upload')) {
        alert(`File upload failed: ${errorMsg}. Please check your file and try again.`);
      } else {
        alert(`Error: ${errorMsg}. Please try again.`);
      }
    }
  };

  const formatDateHeader = (date) => {
    const d = new Date(date);
    if (isToday(d)) return 'Today';
    if (isYesterday(d)) return 'Yesterday';
    return format(d, 'dd MMM yyyy');
  };

  const sorted = [...messages].sort(
    (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
  );

  const groupedMessages = sorted.reduce((groups, message) => {
    const key = format(new Date(message.createdAt), 'yyyy-MM-dd');
    if (!groups[key]) groups[key] = [];
    groups[key].push(message);
    return groups;
  }, {});

  if (!selectedUser) {
    return (
      <div className="flex-1 bg-gray-100 flex items-center justify-center">
        <p>Select a user to start chatting</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-blue-50">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-2 bg-white border-b border-gray-200">
        <div className="w-10 h-10 rounded-full bg-blue-700 text-white flex items-center justify-center font-semibold">
          {selectedUser.name?.charAt(0).toUpperCase()}
        </div>
        <h3 className="text-base font-semibold text-gray-900">
          {selectedUser.name}
        </h3>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-2 py-2">
        {loading ? (
          <div className="h-full flex items-center justify-center">
            <div className="w-6 h-6 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : sorted.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <p className="text-sm text-gray-500">No messages yet. Say hi</p>
          </div>
        ) : (
          <>
            {Object.entries(groupedMessages).map(([dateKey, msgs]) => (
              <div key={dateKey} className="my-4">
                <div className="relative flex items-center my-3">
                  <div className="flex-grow border-t border-gray-300"></div>
                  <span className="px-3 py-1 text-xs font-medium text-blue-700 bg-white border border-blue-700 rounded-full">
                    {formatDateHeader(dateKey)}
                  </span>
                  <div className="flex-grow border-t border-gray-300"></div>
                </div>

                {msgs.map((message) => {
                  const senderId = getId(message.sender);
                  const isOwnMessage = senderId === currentUser._id;

                  return (
                    <div key={message._id + '-wrapper'}>
                      <MessageBubble
                        message={message}
                        isOwnMessage={isOwnMessage}
                      />
                    </div>
                  );
                })}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input Area */}
      <form
        onSubmit={handleSendMessage}
        className="flex items-center gap-2 px-3 py-2 bg-white border-t border-gray-200"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif"
          className="hidden"
          onChange={(e) => {
            if (e.target.files[0]) {
              const fileName = e.target.files[0].name;
              if (!inputMessage) {
                setInputMessage(fileName);
              }
              // Validate file size (10MB limit)
              if (e.target.files[0].size > 10 * 1024 * 1024) {
                alert('File size exceeds 10MB limit');
                e.target.value = '';
                setInputMessage('');
                return;
              }
            }
          }}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="p-2 text-gray-600 hover:text-blue-600 transition-colors"
        >
          <Paperclip className="w-5 h-5" />
        </button>

        <input
          type="text"
          placeholder="Type a message"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />

        <button
          type="submit"
          disabled={!inputMessage.trim() && !fileInputRef.current?.files[0]}
          className="p-2 text-blue-700 hover:text-blue-800 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          <Send className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
}

export default ChatArea;
