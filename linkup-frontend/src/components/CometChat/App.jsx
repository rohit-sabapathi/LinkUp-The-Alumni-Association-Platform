import React, { useState, useEffect } from 'react';

// Check if we can load the CometChat component
let CometChatBuilderApp = null;
try {
  CometChatBuilderApp = React.lazy(() => import('./CometChatBuilderApp'));
} catch (error) {
  console.warn('Failed to load CometChatBuilderApp:', error);
}

const CometChatApp = () => {
  const [isChatEnabled, setIsChatEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    // Check if CometChat is properly configured
    const checkCometChatConfig = () => {
      try {
        // Check if required components and environment variables are available
        const isCometChatAvailable = !!CometChatBuilderApp;
        const envVars = [
          import.meta.env.VITE_COMETCHAT_APP_ID,
          import.meta.env.VITE_COMETCHAT_AUTH_KEY,
          import.meta.env.VITE_COMETCHAT_REGION
        ];
        
        const isConfigured = isCometChatAvailable && envVars.every(val => val && val.length > 0);
        setIsChatEnabled(isConfigured);
      } catch (error) {
        console.warn('CometChat configuration check failed:', error);
        setIsChatEnabled(false);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkCometChatConfig();
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-pulse text-slate-400">Loading chat...</div>
      </div>
    );
  }

  if (!isChatEnabled) {
    return (
      <div className="flex justify-center items-center h-full bg-slate-800/50 rounded-lg p-6">
        <div className="text-slate-400 text-center">
          <p className="mb-2">Chat functionality is currently disabled</p>
          <p className="text-sm">Missing or incomplete CometChat configuration</p>
        </div>
      </div>
    );
  }

  // Only render the actual CometChat component if it's properly configured
  return (
    <React.Suspense fallback={
      <div className="flex justify-center items-center h-full">
        <div className="animate-pulse text-slate-400">Loading chat...</div>
      </div>
    }>
      {CometChatBuilderApp ? <CometChatBuilderApp /> : (
        <div className="flex justify-center items-center h-full bg-slate-800/50 rounded-lg p-6">
          <div className="text-slate-400 text-center">
            <p className="mb-2">Chat component not available</p>
            <p className="text-sm">Contact administrator</p>
          </div>
        </div>
      )}
    </React.Suspense>
  );
};

export default CometChatApp; 