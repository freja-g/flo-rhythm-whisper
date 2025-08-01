import React from 'react';
import { Button } from './button';

interface NotificationPopupProps {
  title: string;
  message: string;
  onSnooze: () => void;
  onDismiss: () => void;
  isVisible: boolean;
}

export const NotificationPopup: React.FC<NotificationPopupProps> = ({
  title,
  message,
  onSnooze,
  onDismiss,
  isVisible
}) => {
  if (!isVisible) return null;

  return (
    <div className="fixed top-4 right-4 bg-white border border-pink-200 rounded-lg shadow-lg p-4 max-w-sm z-50 animate-in slide-in-from-right duration-300">
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          <span className="text-2xl">🌸</span>
        </div>
        <div className="flex-1">
          <h4 className="font-semibold text-pink-800">{title}</h4>
          <p className="text-sm text-gray-600 mt-1">{message}</p>
        </div>
        <button
          onClick={onDismiss}
          className="flex-shrink-0 text-gray-400 hover:text-gray-600"
        >
          ✕
        </button>
      </div>
      <div className="flex space-x-2 mt-3">
        <Button
          onClick={onSnooze}
          variant="outline"
          size="sm"
          className="flex-1"
        >
          Snooze 24h
        </Button>
        <Button
          onClick={onDismiss}
          size="sm"
          className="flex-1"
        >
          Got it
        </Button>
      </div>
    </div>
  );
};