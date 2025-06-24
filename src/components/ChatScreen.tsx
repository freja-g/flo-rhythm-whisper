
import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { ChatMessage } from '../types';

const ChatScreen: React.FC = () => {
  const { user, chatMessages, setChatMessages, setCurrentScreen } = useApp();
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      message: inputMessage,
      isUser: true,
      timestamp: new Date().toISOString()
    };

    const updatedMessages = [...chatMessages, userMessage];
    setChatMessages(updatedMessages);
    setInputMessage('');
    setIsLoading(true);

    // Simulate AI response (in a real app, this would call GPT API)
    setTimeout(() => {
      const aiResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        message: generateAIResponse(inputMessage, user),
        isUser: false,
        timestamp: new Date().toISOString()
      };

      setChatMessages([...updatedMessages, aiResponse]);
      setIsLoading(false);
    }, 1500);
  };

  const generateAIResponse = (message: string, user: any): string => {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('period') || lowerMessage.includes('menstrual')) {
      return "Based on your cycle data, your period is coming soon. Make sure to stay hydrated and consider having a heating pad ready for any cramps. Is there anything specific about your period you'd like to know?";
    }
    
    if (lowerMessage.includes('pain') || lowerMessage.includes('cramp')) {
      return "Period pain is common but manageable. Try applying heat to your lower abdomen, gentle exercise like walking, and consider anti-inflammatory medication if needed. If pain is severe, please consult your healthcare provider.";
    }
    
    if (lowerMessage.includes('mood') || lowerMessage.includes('emotional')) {
      return "Hormonal changes during your cycle can definitely affect your mood. This is completely normal. Regular exercise, adequate sleep, and stress management techniques can help. Remember to be kind to yourself during this time.";
    }
    
    return "I'm here to help you with any questions about your menstrual health, symptoms, or general wellness. What would you like to know more about?";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-pink-400 to-purple-400 p-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setCurrentScreen('dashboard')}
            className="text-white text-xl"
          >
            ←
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-white">AI Chatbot</h1>
            <p className="text-white/90">Your personal health companion</p>
          </div>
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
            <span className="text-white text-lg">🤖</span>
          </div>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 p-6 space-y-4 overflow-y-auto">
        {chatMessages.length === 0 && (
          <div className="text-center py-8">
            <div className="text-6xl mb-4">🌸</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              Hello! How can I help you today?
            </h3>
            <p className="text-gray-600">
              Ask me anything about your menstrual health, symptoms, or wellness tips.
            </p>
          </div>
        )}

        {chatMessages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl ${
                message.isUser
                  ? 'bg-gradient-to-r from-pink-400 to-purple-400 text-white'
                  : 'bg-white text-gray-800 shadow-md'
              }`}
            >
              <p className="text-sm leading-relaxed">{message.message}</p>
              <p className={`text-xs mt-1 ${
                message.isUser ? 'text-white/70' : 'text-gray-500'
              }`}>
                {new Date(message.timestamp).toLocaleTimeString([], { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </p>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white text-gray-800 shadow-md px-4 py-3 rounded-2xl">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="bg-white border-t border-gray-200 p-4">
        <div className="flex space-x-3">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Type your message..."
            className="flex-1 p-3 border border-gray-200 rounded-full focus:ring-2 focus:ring-purple-400 focus:border-transparent"
            disabled={isLoading}
          />
          <button
            onClick={sendMessage}
            disabled={!inputMessage.trim() || isLoading}
            className="bg-gradient-to-r from-pink-400 to-purple-400 text-white p-3 rounded-full hover:shadow-lg transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:transform-none"
          >
            <span className="text-lg">→</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatScreen;
