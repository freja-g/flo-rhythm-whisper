import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { articles } from '../data/articles';

const TipsScreen: React.FC = () => {
  const { setCurrentScreen } = useApp();
  const [expandedArticle, setExpandedArticle] = useState<string | null>(null);

  const toggleArticle = (articleId: string) => {
    setExpandedArticle(expandedArticle === articleId ? null : articleId);
  };

  const formatContent = (content: string) => {
    return content.split('\n').map((line, index) => {
      if (line.startsWith('**') && line.endsWith('**')) {
        return <h3 key={index} className="font-semibold text-lg mt-4 mb-2 text-gray-800">{line.slice(2, -2)}</h3>;
      }
      if (line.startsWith('*') && line.endsWith('*') && !line.startsWith('**')) {
        return <h4 key={index} className="font-medium text-base mt-3 mb-1 text-gray-700">{line.slice(1, -1)}</h4>;
      }
      if (line.startsWith('- ')) {
        return <li key={index} className="ml-4 mb-1 text-gray-600">{line.slice(2)}</li>;
      }
      if (line.trim() === '') {
        return <br key={index} />;
      }
      return <p key={index} className="mb-2 text-gray-600 leading-relaxed">{line}</p>;
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-pink-400 to-purple-400 p-4 sm:p-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setCurrentScreen('dashboard')}
            className="text-white text-xl"
          >
            ←
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white">Tips & Info</h1>
            <p className="text-sm sm:text-base text-white/90">Learn about your health</p>
          </div>
        </div>
      </div>

      {/* Articles */}
      <div className="p-4 sm:p-6 space-y-4 pb-24">
        {articles.map((article) => (
          <div key={article.id} className="bg-white rounded-2xl p-4 sm:p-6 shadow-lg hover:shadow-xl transition-shadow">
            <div className="flex items-start space-x-4">
              <div className="text-2xl sm:text-3xl">{article.image}</div>
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs font-medium">
                    {article.category}
                  </span>
                  <span className="text-gray-500 text-xs">{article.readTime}</span>
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-2">
                  {article.title}
                </h3>
                <p className="text-gray-600 text-xs sm:text-sm leading-relaxed">
                  {article.summary}
                </p>
                
                {expandedArticle === article.id && article.fullContent && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="text-sm">
                      {formatContent(article.fullContent)}
                    </div>
                  </div>
                )}
                
                <button 
                  onClick={() => toggleArticle(article.id)}
                  className="text-purple-600 font-medium text-xs sm:text-sm mt-3 hover:text-purple-800 transition-colors"
                >
                  {expandedArticle === article.id ? 'Show Less ↑' : 'Read More →'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-4">
        <div className="flex justify-around">
          <button 
            onClick={() => setCurrentScreen('dashboard')}
            className="flex flex-col items-center space-y-1"
          >
            <span className="text-gray-400 text-xl">🏠</span>
            <span className="text-xs text-gray-400">Home</span>
          </button>
          <button 
            onClick={() => setCurrentScreen('cycles')}
            className="flex flex-col items-center space-y-1"
          >
            <span className="text-gray-400 text-xl">📅</span>
            <span className="text-xs text-gray-400">Cycles</span>
          </button>
          <button 
            onClick={() => setCurrentScreen('symptoms')}
            className="flex flex-col items-center space-y-1"
          >
            <span className="text-gray-400 text-xl">📝</span>
            <span className="text-xs text-gray-400">Symptoms</span>
          </button>
          <button className="flex flex-col items-center space-y-1">
            <span className="text-purple-500 text-xl">💡</span>
            <span className="text-xs text-purple-500 font-medium">Tips</span>
          </button>
          <button 
            onClick={() => setCurrentScreen('profile')}
            className="flex flex-col items-center space-y-1"
          >
            <span className="text-gray-400 text-xl">👩</span>
            <span className="text-xs text-gray-400">Profile</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default TipsScreen;
