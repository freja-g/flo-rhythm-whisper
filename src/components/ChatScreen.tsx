
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Button } from './ui/button';
import { ArrowLeft, Send } from 'lucide-react';

const ChatScreen: React.FC = () => {
  const { setCurrentScreen, chatMessages, setChatMessages, isOnline } = useApp();
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = async () => {
    if (!message.trim()) return;

    const userMessage = {
      id: Date.now().toString(),
      text: message,
      sender: 'user' as const,
      timestamp: new Date()
    };

    setChatMessages([...chatMessages, userMessage]);
    setMessage('');
    setIsLoading(true);

    try {
      let aiResponse;
      
      if (isOnline) {
        // Use ChatGPT API when online
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`
          },
          body: JSON.stringify({
            model: 'gpt-3.5-turbo',
            messages: [
              {
                role: 'system',
                content: 'You are a helpful AI assistant specializing in menstrual health and wellness. Provide supportive, informative responses.'
              },
              {
                role: 'user',
                content: message
              }
            ],
            max_tokens: 150
          })
        });

        const data = await response.json();
        aiResponse = data.choices[0].message.content;
      } else {
        // Offline fallback responses
        const offlineResponses = [
          "I'm here to help! While I'm offline, I can still provide some general support.",
          "Thank you for sharing. Remember to stay hydrated and listen to your body.",
          "That's a great question! When we're back online, I can provide more detailed information.",
          "I understand your concern. Please consult with a healthcare provider for personalized advice."
        ];
        aiResponse = offlineResponses[Math.floor(Math.random() * offlineResponses.length)];
      }

      const aiMessage = {
        id: (Date.now() + 1).toString(),
        text: aiResponse,
        sender: 'ai' as const,
        timestamp: new Date()
      };

      setChatMessages([...chatMessages, aiMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        text: "I'm sorry, I'm having trouble responding right now. Please try again later.",
        sender: 'ai' as const,
        timestamp: new Date()
      };
      setChatMessages([...chatMessages, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 p-4">
      <div className="max-w-md mx-auto h-screen flex flex-col">
        <div className="flex items-center mb-6">
          <Button 
            variant="ghost" 
            onClick={() => setCurrentScreen('dashboard')}
            className="mr-2"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">AI Chat</h1>
        </div>
        
        <div className="flex-1 bg-white rounded-lg shadow-lg p-4 mb-4 overflow-y-auto">
          {chatMessages.length === 0 ? (
            <p className="text-gray-500 text-center">Start a conversation with your AI assistant!</p>
          ) : (
            <div className="space-y-4">
              {chatMessages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-xs px-4 py-2 rounded-lg ${
                    msg.sender === 'user' 
                      ? 'bg-purple-500 text-white' 
                      : 'bg-gray-200 text-gray-800'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg">
                    Typing...
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Type your message..."
            className="flex-1 p-3 border rounded-lg"
            disabled={isLoading}
          />
          <Button onClick={sendMessage} disabled={isLoading || !message.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatScreen;
