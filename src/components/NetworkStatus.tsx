
import React from 'react';
import { useApp } from '../context/AppContext';

const NetworkStatus: React.FC = () => {
  const { isOnline } = useApp();

  if (isOnline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 bg-red-500 text-white text-center py-2 text-sm z-50">
      <span className="inline-flex items-center">
        <span className="w-2 h-2 bg-white rounded-full mr-2"></span>
        You're offline. Some features may be limited.
      </span>
    </div>
  );
};

export default NetworkStatus;
