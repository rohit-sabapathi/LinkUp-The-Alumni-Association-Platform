import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { chatAPI } from '../../services/chatApi';
import { useAuth } from '../../contexts/AuthContext';
import { format } from 'date-fns';
import { PaperAirplaneIcon, PhotoIcon } from '@heroicons/react/24/solid';
import { toast } from 'react-hot-toast';

const ChatRoom = ({ roomId, onNewMessage }) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [room, setRoom] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isWebSocketConnected, setIsWebSocketConnected] = useState(false);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const fileInputRef = useRef(null);
  const socketRef = useRef(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!roomId || isNaN(roomId)) {
      navigate('/messages');
      return;
    }
    fetchRoom();
    fetchMessages();
    connectWebSocket();

    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [roomId]);

  const connectWebSocket = () => {
    try {
      const token = localStorage.getItem('token');

      if (!token) {
        console.error('No access token found in localStorage');
        toast.error('Authentication required');
        return;
      }

      // Close existing connection if any
      if (socketRef.current) {
        console.log('Closing existing WebSocket connection');
        socketRef.current.close();
      }

      const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsHost = 'localhost:8000';
      const cleanToken = token.replace('Bearer ', ''); // Remove Bearer prefix if present
      const wsUrl = `${wsProtocol}//${wsHost}/ws/chat/${roomId}/?token=${encodeURIComponent(cleanToken)}`;

      console.log('WebSocket Configuration:', {
        protocol: wsProtocol,
        host: wsHost,
        roomId,
        tokenLength: cleanToken.length,
        fullUrl: wsUrl
      });

      const ws = new WebSocket(wsUrl);
      console.log('WebSocket State:', ws.readyState);

      let reconnectAttempts = 0;
      const maxReconnectAttempts = 5;

      ws.onopen = () => {
        console.log('WebSocket connection established successfully');
        console.log('WebSocket State after open:', ws.readyState);
        setIsWebSocketConnected(true);
        reconnectAttempts = 0;
        
        // Send a test message to verify connection
        try {
          const testMessage = {
            type: 'connection_test',
            message: { content: 'Connection test' }
          };
          console.log('Sending test message:', testMessage);
          ws.send(JSON.stringify(testMessage));
          console.log('Connection test message sent');
        } catch (error) {
          console.error('Error sending test message:', error);
        }
      };

      ws.onmessage = (event) => {
        console.log('Raw WebSocket message received:', event.data);
        try {
          const data = JSON.parse(event.data);
          console.log('Parsed WebSocket message:', data);
          
          if (data.type === 'connection_test_response') {
            console.log('Connection test successful');
            return;
          }
          if (data.type === 'error') {
            console.error('Server error:', data.message);
            toast.error(data.message);
            if (data.message.includes('authentication') || data.message.includes('token')) {
              console.log('Authentication error detected, closing connection');
              setIsWebSocketConnected(false);
              ws.close();
            }
            return;
          }
          if (data.message) {
            const newMessage = data.message;
            console.log('Processing new message:', newMessage);
            setMessages(prevMessages => {
              const exists = prevMessages.some(msg => msg.id === newMessage.id);
              if (!exists) {
                return [...prevMessages, newMessage].sort(
                  (a, b) => new Date(a.created_at) - new Date(b.created_at)
                );
              }
              return prevMessages;
            });
            if (onNewMessage) {
              onNewMessage(roomId, newMessage);
            }
          }
        } catch (error) {
          console.error('Error processing WebSocket message:', error);
          console.error('Raw message that caused error:', event.data);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        console.error('WebSocket State on error:', ws.readyState);
        console.error('WebSocket Error Details:', {
          type: error.type,
          eventPhase: error.eventPhase,
          timeStamp: error.timeStamp,
          isTrusted: error.isTrusted
        });
        setIsWebSocketConnected(false);
        toast.error('WebSocket connection error');
      };

      ws.onclose = (event) => {
        console.log('WebSocket closed:', {
          code: event.code,
          reason: event.reason,
          wasClean: event.wasClean,
          readyState: ws.readyState
        });
        setIsWebSocketConnected(false);

        // Only attempt reconnection if we have a valid token
        if (localStorage.getItem('token') && reconnectAttempts < maxReconnectAttempts) {
          const backoffTime = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);
          console.log(`Attempting to reconnect in ${backoffTime/1000} seconds...`);
          
          setTimeout(() => {
            if (socketRef.current === ws) {
              console.log(`Reconnection attempt ${reconnectAttempts + 1}/${maxReconnectAttempts}`);
              reconnectAttempts++;
              connectWebSocket();
            }
          }, backoffTime);
        } else {
          console.log('Max reconnection attempts reached or no valid token');
          toast.error('Chat connection lost. Please refresh the page.');
        }
      };

      socketRef.current = ws;
    } catch (error) {
      console.error('Error in connectWebSocket:', error);
      console.error('Error stack:', error.stack);
      toast.error('Failed to establish WebSocket connection');
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() && !selectedFile) return;

    try {
      setSending(true);
      const messageData = {
        content: newMessage.trim(),
      };

      if (selectedFile) {
        const reader = new FileReader();
        reader.onload = async () => {
          messageData.file_data = reader.result.split(',')[1];
          messageData.file_type = selectedFile.type;
          messageData.file_name = selectedFile.name;
          await sendMessageData(messageData);
        };
        reader.readAsDataURL(selectedFile);
      } else {
        await sendMessageData(messageData);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      toast.error('Failed to send message');
    }
  };

  const sendMessageData = async (messageData) => {
    try {
      if (isWebSocketConnected && socketRef.current?.readyState === WebSocket.OPEN) {
        console.log('Sending message through WebSocket:', messageData);
        socketRef.current.send(JSON.stringify({
          type: 'chat_message',
          message: {
            content: messageData.content,
            file_data: messageData.file_data,
            file_type: messageData.file_type,
            file_name: messageData.file_name
          }
        }));
        
        // Clear the input fields immediately
        setNewMessage('');
        setSelectedFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } else {
        console.log('WebSocket not connected, falling back to REST API');
        const response = await chatAPI.sendMessage(roomId, messageData);
        setMessages(prev => [...prev, response.data]);
        setNewMessage('');
        setSelectedFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        if (onNewMessage) {
          onNewMessage(roomId, response.data);
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView();
    }
  }, [messages]);

  const fetchRoom = async () => {
    try {
      if (!roomId || isNaN(roomId)) {
        throw new Error('Invalid room ID');
      }
      const response = await chatAPI.getChatRoom(roomId);
      setRoom(response.data);
    } catch (error) {
      console.error('Failed to fetch room:', error);
      navigate('/messages');
    }
  };

  const fetchMessages = async (loadMore = false) => {
    try {
      if (!roomId || isNaN(roomId)) {
        throw new Error('Invalid room ID');
      }
      setLoading(true);
      const response = await chatAPI.getMessages(roomId, loadMore ? page + 1 : 1);
      const { results, next } = response.data;
      
      if (loadMore) {
        setMessages(prev => [...results.reverse(), ...prev]);
        setPage(prev => prev + 1);
      } else {
        setMessages(results.reverse());
        setPage(1);
      }
      
      setHasMore(!!next);
      setError(null);

      // Mark messages as read
      await chatAPI.markAsRead(roomId);
    } catch (error) {
      console.error('Failed to fetch messages:', error);
      if (error.response?.status === 403 || error.message === 'Invalid room ID') {
        navigate('/messages');
      }
      setError('Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  const handleScroll = () => {
    const container = messagesContainerRef.current;
    if (container.scrollTop === 0 && hasMore && !loading) {
      fetchMessages(true);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error('File size should be less than 5MB');
        return;
      }
      setSelectedFile(file);
    }
  };

  const renderMessage = (message, index, messages) => {
    const isOwnMessage = message.sender.id === user.id;
    
    // Date grouping logic
    const messageDate = new Date(message.created_at);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    let showDateHeader = false;
    let dateHeader = '';
    
    if (index === 0 || !isSameDay(messageDate, new Date(messages[index - 1].created_at))) {
      showDateHeader = true;
      if (isSameDay(messageDate, today)) {
        dateHeader = 'Today';
      } else if (isSameDay(messageDate, yesterday)) {
        dateHeader = 'Yesterday';
      } else if (messageDate.getFullYear() === today.getFullYear()) {
        dateHeader = format(messageDate, 'MMMM d');
      } else {
        dateHeader = format(messageDate, 'MMMM d, yyyy');
      }
    }

    return (
      <div key={message.id}>
        {showDateHeader && (
          <div className="flex justify-center my-4">
            <div className="bg-slate-700 text-slate-200 text-xs px-3 py-1 rounded-full">
              {dateHeader}
            </div>
          </div>
        )}
        <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-4`}>
          <div
            className={`max-w-[70%] rounded-lg px-4 py-2 ${
              isOwnMessage
                ? 'bg-blue-600 text-white'
                : 'bg-slate-700 text-slate-200'
            }`}
          >
            {message.file_type && message.file_type.startsWith('image/') ? (
              <img 
                src={`data:${message.file_type};base64,${message.file_data}`}
                alt="Shared image"
                className="max-w-full rounded-lg mb-2"
              />
            ) : message.file_type && message.file_type.startsWith('video/') ? (
              <video 
                controls 
                className="max-w-full rounded-lg mb-2"
              >
                <source src={`data:${message.file_type};base64,${message.file_data}`} type={message.file_type} />
                Your browser does not support the video tag.
              </video>
            ) : null}
            {message.content && <p className="text-sm">{message.content}</p>}
            <p className="text-xs mt-1 opacity-75">
              {format(messageDate, 'h:mm a')}
            </p>
          </div>
        </div>
      </div>
    );
  };

  // Helper function to check if two dates are the same day
  const isSameDay = (date1, date2) => {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  };

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center text-red-500">
        {error}
      </div>
    );
  }

  const otherUser = room?.other_user;

  return (
    <>
      {/* Chat Header */}
      {otherUser && (
        <div className="p-4 border-b border-slate-700 flex items-center space-x-3">
          {otherUser.profile_picture ? (
            <img
              src={otherUser.profile_picture}
              alt={otherUser.full_name}
              className="h-8 w-8 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-slate-600 flex items-center justify-center text-white">
              {otherUser.first_name[0].toUpperCase()}
            </div>
          )}
          <div>
            <h3 className="text-lg font-medium text-slate-200">
              {otherUser.full_name}
            </h3>
            <p className="text-sm text-slate-400">{otherUser.email}</p>
          </div>
        </div>
      )}

      {/* Messages Container */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4"
        onScroll={handleScroll}
      >
        {loading && !messages.length ? (
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <>
            {messages.map((message, index) => renderMessage(message, index, messages))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Message Input */}
      <form onSubmit={sendMessage} className="p-4 border-t border-slate-700">
        <div className="flex space-x-4">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 bg-slate-700 text-slate-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept="image/*,video/*"
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="bg-slate-700 text-slate-200 rounded-lg px-4 py-2 hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <PhotoIcon className="h-5 w-5" />
          </button>
          <button
            type="submit"
            disabled={(!newMessage.trim() && !selectedFile) || sending}
            className="bg-blue-600 text-white rounded-lg px-4 py-2 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {sending ? (
              <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
            ) : (
              <PaperAirplaneIcon className="h-5 w-5" />
            )}
          </button>
        </div>
        {selectedFile && (
          <div className="mt-2 text-sm text-slate-400">
            Selected file: {selectedFile.name}
            <button
              onClick={() => {
                setSelectedFile(null);
                if (fileInputRef.current) {
                  fileInputRef.current.value = '';
                }
              }}
              className="ml-2 text-red-500 hover:text-red-400"
            >
              Remove
            </button>
          </div>
        )}
      </form>
    </>
  );
};

export default ChatRoom; 