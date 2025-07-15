import React from 'react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 bg-red-500 text-white text-center py-2 px-4 z-50">
      <div className="flex items-center justify-center space-x-2">
        <span className="text-sm">📱</span>
        <span className="text-sm font-medium">You're offline - Changes will sync when connection returns</span>
      </div>
    </div>
  );
};

export default OfflineIndicator;