import React, { useEffect, useState } from 'react';
import { JitsiMeeting as JitsiMeetSDK } from '@jitsi/react-sdk';
import { Spinner } from '../ui/Spinner';

const JitsiMeeting = ({ roomName, displayName, onApiReady, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [apiObj, setApiObj] = useState(null);
  const [roomPassword] = useState('LinkupSecureRoom');

  const handleApiReady = (api) => {
    setApiObj(api);
    setLoading(false);
    
    if (onApiReady) {
      onApiReady(api);
    }

    // Add event listeners
    api.addEventListener('videoConferenceLeft', () => {
      if (onClose) {
        onClose();
      }
    });
    
    api.addEventListener('participantRoleChanged', (event) => {
      if (event.role === 'moderator') {
        // Set password for the room
        api.executeCommand('password', roomPassword);
      }
    });
    
    // Handle connection failures
    api.addEventListener('connectionFailed', (error) => {
      console.error('Connection failed:', error);
      // Only close if it's not a membersOnly error, which we'll handle differently
      if (error?.error !== 'conference.connectionError.membersOnly') {
      if (onClose) {
        onClose();
      }
      } else {
        // For membersOnly errors, use the password
        api.executeCommand('password', roomPassword);
      }
    });

    api.addEventListener('passwordRequired', () => {
      // Automatically enter the password when requested
      api.executeCommand('password', roomPassword);
    });

    // Prevent the external auth window from causing issues
    api.addEventListener('readyToClose', (e) => {
      // Don't close if it's just the auth dialog
      if (e && e.detail && e.detail.authenticationRequired) {
        e.preventDefault();
        console.log('Preventing close due to auth dialog');
      }
    });

    // Handle login button clicks
    const loginButton = document.querySelector('.login-button');
    if (loginButton) {
      loginButton.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        // Instead of following the login flow, use the password
        api.executeCommand('password', roomPassword);
      });
    }
  };

  useEffect(() => {
    return () => {
      // Clean up
      if (apiObj) {
        apiObj.dispose();
      }
    };
  }, [apiObj]);

  return (
    <div className="relative min-h-[600px] rounded-lg overflow-hidden shadow-lg">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900 z-10">
          <Spinner size="large" text="Loading video meeting..." />
        </div>
      )}
      
      <JitsiMeetSDK
        domain="meet.jit.si"
        roomName={roomName}
        jwt={null}
        configOverwrite={{
          startWithAudioMuted: true,
          disableDeepLinking: true,
          prejoinPageEnabled: false,
          enableClosePage: false,
          disableThirdPartyRequests: true,
          analytics: {
            disabled: true
          },
          testing: {
            disableE2EE: true
          },
          p2p: {
            enabled: true
          },
          // Configure room settings
          conference: {
            enableLayerSuspension: true,
            membersOnly: false,
            enableLobbyChat: true,
            requireDisplayName: true,
            enableNoAudioDetection: true,
            enableNoisyMicDetection: true
          },
          // Security settings
          security: {
            enableLobby: false, // Disable lobby to prevent authentication issues
            lockRoomGuestEnabled: false,
            roomPasswordEnabled: true // Enable password protection
          },
          // Login configuration
          loginEnabled: false
        }}
        interfaceConfigOverwrite={{
          TOOLBAR_BUTTONS: [
            'microphone', 'camera', 'closedcaptions', 'desktop', 'fullscreen',
            'fodeviceselection', 'hangup', 'profile', 'chat', 'recording',
            'livestreaming', 'etherpad', 'sharedvideo', 'settings', 'raisehand',
            'videoquality', 'filmstrip', 'feedback', 'stats', 'tileview',
            'videobackgroundblur', 'download', 'help', 'mute-everyone',
            'security'
          ],
          SHOW_JITSI_WATERMARK: false,
          SHOW_WATERMARK_FOR_GUESTS: false,
          DISABLE_JOIN_LEAVE_NOTIFICATIONS: true,
          HIDE_INVITE_MORE_HEADER: true,
          MOBILE_APP_PROMO: false,
          ENFORCE_NOTIFICATION_AUTO_DISMISS_TIMEOUT: 5000,
          TILE_VIEW_MAX_COLUMNS: 5,
          HIDE_LOBBY_BUTTON_IF_ALONE: true
        }}
        userInfo={{
          displayName: displayName,
          email: '', // Can be added if needed
          role: 'moderator' // Give all users moderator role to avoid authentication issues
        }}
        onApiReady={handleApiReady}
        getIFrameRef={(iframeRef) => { iframeRef.style.height = '600px'; }}
      />
    </div>
  );
};

export default JitsiMeeting; 