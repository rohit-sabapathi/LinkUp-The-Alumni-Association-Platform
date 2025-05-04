import { useState, useEffect, useRef } from 'react';
import { notificationAPI } from '../../services/notificationApi';
import { toast } from 'react-hot-toast';
import { BellIcon } from '@heroicons/react/24/outline';
import { format } from 'date-fns';

const NotificationBell = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const dropdownRef = useRef(null);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // Poll every 30 seconds
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchNotifications = async (page = 1) => {
    try {
      setIsLoading(true);
      const response = await notificationAPI.getNotifications(page);
      
      if (response.data.error) {
        throw new Error(response.data.error);
      }

      const newNotifications = response.data.results || [];
      
      if (page === 1) {
        setNotifications(newNotifications);
      } else {
        setNotifications(prev => [...prev, ...newNotifications]);
      }
      
      setHasMore(!!response.data.next);
      setUnreadCount(newNotifications.filter(n => !n.is_read).length);
      setCurrentPage(page);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      toast.error('Failed to load notifications');
    } finally {
      setIsLoading(false);
    }
  };

  const loadMore = () => {
    if (!isLoading && hasMore) {
      fetchNotifications(currentPage + 1);
    }
  };

  const handleNotificationClick = async (notification) => {
    if (!notification.is_read) {
      try {
        await notificationAPI.markAsRead(notification.id);
        setNotifications(notifications.map(n => 
          n.id === notification.id ? { ...n, is_read: true } : n
        ));
        setUnreadCount(prev => Math.max(0, prev - 1));
      } catch (error) {
        console.error('Failed to mark notification as read:', error);
        toast.error('Failed to mark notification as read');
      }
    }

    // Check if this is a follow request based on the title
    if (notification.title === 'New Follow Request') {
      handleFollowRequest(notification);
    }
  };

  const handleFollowRequest = async (notification) => {
    const accept = window.confirm('Would you like to accept this follow request?');
    try {
      const action = accept ? 'accept' : 'decline';
      // Extract request ID from the notification message
      const requestId = notification.message.match(/Request ID: (\d+)/)?.[1];
      if (!requestId) {
        toast.error('Could not process follow request');
        return;
      }
      await notificationAPI.handleFollowRequest(requestId, action);
      toast.success(`Follow request ${action}ed`);
      // Remove the notification from the list
      setNotifications(notifications.filter(n => n.id !== notification.id));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      toast.error('Failed to handle follow request');
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-slate-300 hover:text-slate-100 focus:outline-none"
      >
        <BellIcon className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-500 rounded-full">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-slate-800 rounded-lg shadow-lg py-1 z-50">
          {notifications.length === 0 ? (
            <div className="px-4 py-2 text-slate-400 text-center">
              {isLoading ? 'Loading notifications...' : 'No notifications'}
            </div>
          ) : (
            <div className="max-h-96 overflow-y-auto">
              {notifications.map(notification => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`px-4 py-3 hover:bg-slate-700 cursor-pointer ${
                    !notification.is_read ? 'bg-slate-700/50' : ''
                  }`}
                >
                  <div className="flex items-start">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-200">
                        {notification.title}
                      </p>
                      <p className="text-sm text-slate-400">
                        {notification.message}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        {format(new Date(notification.created_at), 'MMM d, h:mm a')}
                      </p>
                    </div>
                    {!notification.is_read && (
                      <span className="h-2 w-2 bg-blue-500 rounded-full"></span>
                    )}
                  </div>
                </div>
              ))}
              {hasMore && (
                <button
                  onClick={loadMore}
                  className="w-full px-4 py-2 text-sm text-slate-400 hover:text-slate-300 hover:bg-slate-700/50"
                  disabled={isLoading}
                >
                  {isLoading ? 'Loading...' : 'Load more'}
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell; 