
import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { ChatMessage } from '../types';

const ChatScreen: React.FC = () => {
  const { user, chatMessages, setChatMessages, setCurrentScreen, isOnline } = useApp();
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  useEffect(() => {
    // Check if API key is stored in localStorage
    const storedApiKey = localStorage.getItem('openai_api_key');
    if (storedApiKey) {
      setApiKey(storedApiKey);
    } else {
      setShowApiKeyInput(true);
    }
  }, []);

  const saveApiKey = () => {
    if (apiKey.trim()) {
      localStorage.setItem('openai_api_key', apiKey);
      setShowApiKeyInput(false);
    }
  };

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

    try {
      let aiResponse: string;

      if (isOnline && apiKey) {
        // Use ChatGPT API when online
        aiResponse = await getChatGPTResponse(inputMessage, updatedMessages);
      } else {
        // Use offline fallback responses
        aiResponse = generateOfflineResponse(inputMessage, user);
      }

      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        message: aiResponse,
        isUser: false,
        timestamp: new Date().toISOString()
      };

      setChatMessages([...updatedMessages, aiMessage]);
    } catch (error) {
      console.error('Error getting AI response:', error);
      
      // Fallback to offline response on error
      const fallbackResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        message: generateOfflineResponse(inputMessage, user),
        isUser: false,
        timestamp: new Date().toISOString()
      };

      setChatMessages([...updatedMessages, fallbackResponse]);
    } finally {
      setIsLoading(false);
    }
  };

  const getChatGPTResponse = async (message: string, messages: ChatMessage[]): Promise<string> => {
    const systemPrompt = `You are FloMentor, a helpful AI assistant specialized in menstrual health and wellness. 
    You provide supportive, accurate, and empathetic advice about periods, symptoms, cycle tracking, and general reproductive health. 
    Keep responses concise but informative. Always encourage users to consult healthcare providers for serious concerns.
    
    User details: ${user ? `Name: ${user.name}, Cycle Length: ${user.cycleLength} days, Period Length: ${user.periodLength} days` : 'No user data available'}`;

    const conversationMessages = [
      { role: 'system', content: systemPrompt },
      ...messages.slice(-5).map(msg => ({
        role: msg.isUser ? 'user' : 'assistant',
        content: msg.message
      })),
      { role: 'user', content: message }
    ];

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: conversationMessages,
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  };

  const generateOfflineResponse = (message: string, user: any): string => {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('period') || lowerMessage.includes('menstrual')) {
      return `Based on your cycle data (${user?.cycleLength || 28} day cycle), I can help you track your period. Remember to stay hydrated and consider having a heating pad ready for any cramps. Is there anything specific about your period you'd like to know?`;
    }
    
    if (lowerMessage.includes('pain') || lowerMessage.includes('cramp')) {
      return "Period pain is common but manageable. Try applying heat to your lower abdomen, gentle exercise like walking, and consider anti-inflammatory medication if needed. If pain is severe, please consult your healthcare provider.";
    }
    
    if (lowerMessage.includes('mood') || lowerMessage.includes('emotional')) {
      return "Hormonal changes during your cycle can definitely affect your mood. This is completely normal. Regular exercise, adequate sleep, and stress management techniques can help. Remember to be kind to yourself during this time.";
    }

    if (lowerMessage.includes('symptom')) {
      return "Common period symptoms include cramps, bloating, mood changes, and fatigue. Tracking these symptoms can help you understand your cycle better. Consider gentle exercise, proper nutrition, and adequate rest to manage symptoms.";
    }
    
    return "I'm here to help you with any questions about your menstrual health, symptoms, or general wellness. What would you like to know more about? (Note: I'm currently offline, so responses are limited)";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex flex-col">
      {/* API Key Input Modal */}
      {showApiKeyInput && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">OpenAI API Key Required</h3>
            <p className="text-sm text-gray-600 mb-4">
              To use ChatGPT features, please enter your OpenAI API key. The app will work offline with limited responses without it.
            </p>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter your OpenAI API key"
              className="w-full p-3 border border-gray-300 rounded-lg mb-4"
            />
            <div className="flex space-x-3">
              <button
                onClick={saveApiKey}
                className="flex-1 bg-purple-500 text-white p-2 rounded-lg hover:bg-purple-600"
              >
                Save Key
              </button>
              <button
                onClick={() => setShowApiKeyInput(false)}
                className="flex-1 bg-gray-300 text-gray-700 p-2 rounded-lg hover:bg-gray-400"
              >
                Skip
              </button>
            </div>
          </div>
        </div>
      )}

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
            <h1 className="text-2xl font-bold text-white">FloMentor AI</h1>
            <p className="text-white/90">
              {isOnline && apiKey ? 'ChatGPT Powered' : 'Offline Mode'} • Your health companion
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowApiKeyInput(true)}
              className="text-white/80 hover:text-white text-sm"
            >
              ⚙️
            </button>
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <span className="text-white text-lg">🤖</span>
            </div>
          </div>
        </div>
      </div>

      {/* Status Indicator */}
      {!isOnline && (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 p-3">
          <p className="text-yellow-800 text-sm">
            📱 You're offline - using local responses
          </p>
        </div>
      )}

      {/* Chat Messages */}
      <div className="flex-1 p-6 space-y-4 overflow-y-auto">
        {chatMessages.length === 0 && (
          <div className="text-center py-8">
            <div className="text-6xl mb-4">🌸</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              Hello! I'm your FloMentor AI
            </h3>
            <p className="text-gray-600">
              {isOnline && apiKey 
                ? "I'm powered by ChatGPT and ready to help with your menstrual health questions!"
                : "I'm in offline mode but can still help with basic menstrual health guidance."
              }
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
            placeholder="Ask me about your menstrual health..."
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
