import React, { useState, useEffect, useRef } from 'react';
import './index.css';
import './App.css';

function App() {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef(null);
  const inputRef = useRef(null);

  // Sample questions for better UX
  const sampleQuestions = [
    "What are the best thriller movies?",
    "Recommend some comedy movies",
    "Tell me about action movies from 2020",
    "What are the highest rated movies?"
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!query.trim() || isLoading) return;

    const userMsg = { 
      sender: 'user', 
      text: query, 
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    
    setMessages((prev) => [...prev, userMsg]);
    setQuery('');
    setIsLoading(true);
    setIsTyping(true);

    try {
      const res = await fetch('http://localhost:3001/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });

      if (!res.ok) {
        throw new Error('Failed to get response');
      }

      const data = await res.json();
      
      // Simulate typing delay for better UX
      setTimeout(() => {
        const botMsg = { 
          sender: 'bot', 
          text: data.answer || 'Sorry, I could not find an answer to your question.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages((prev) => [...prev, botMsg]);
        setIsTyping(false);
        setIsLoading(false);
      }, 1000);

    } catch (error) {
      console.error('Error:', error);
      const errorMsg = { 
        sender: 'bot', 
        text: 'Sorry, I encountered an error. Please try again later.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isError: true
      };
      setMessages((prev) => [...prev, errorMsg]);
      setIsTyping(false);
      setIsLoading(false);
    }
  };

  const handleSampleQuestion = (question) => {
    setQuery(question);
    inputRef.current?.focus();
  };

  const clearChat = () => {
    setMessages([]);
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  return (
    <div className="h-screen w-screen flex flex-col bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-white/20 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl flex items-center justify-center">
                <span className="text-white text-xl">🎬</span>
              </div>
              <div>
                <h1 className="text-xl font-bold gradient-text">Movie Q&A Chatbot</h1>
                <p className="text-sm text-gray-500">Ask me anything about movies</p>
              </div>
            </div>
            
            {messages.length > 0 && (
              <button
                onClick={clearChat}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors duration-200"
              >
                Clear Chat
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col max-w-7xl mx-auto w-full">
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6">
          {messages.length === 0 ? (
            /* Welcome Screen */
            <div className="h-full flex flex-col items-center justify-center space-y-8">
              <div className="text-center space-y-4">
                <div className="w-20 h-20 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <span className="text-white text-4xl">🎬</span>
                </div>
                <h2 className="text-3xl font-bold text-gray-800">Welcome to Movie Q&A</h2>
                <p className="text-lg text-gray-600 max-w-md">
                  Ask me anything about movies! I can help you discover great films, get recommendations, and answer your movie-related questions.
                </p>
              </div>
              
              <div className="w-full max-w-2xl space-y-4">
                <h3 className="text-lg font-semibold text-gray-700 text-center">Try asking:</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {sampleQuestions.map((question, index) => (
                    <button
                      key={index}
                      onClick={() => handleSampleQuestion(question)}
                      className="p-4 bg-white/60 backdrop-blur-sm border border-white/40 rounded-xl hover:bg-white/80 hover:shadow-md transition-all duration-200 text-left group"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                          <span className="text-white text-sm">💭</span>
                        </div>
                        <span className="text-gray-700 group-hover:text-gray-900 transition-colors">
                          {question}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* Chat Messages */
            <div className="space-y-6 pb-4">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} message-fade-in`}
                >
                  <div className={`flex items-start space-x-3 max-w-[85%] lg:max-w-[70%] ${msg.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                    {/* Avatar */}
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      msg.sender === 'user' 
                        ? 'bg-gradient-to-r from-purple-600 to-blue-600' 
                        : 'bg-gradient-to-r from-emerald-500 to-teal-500'
                    }`}>
                      <span className="text-white text-sm">
                        {msg.sender === 'user' ? '👤' : '🤖'}
                      </span>
                    </div>
                    
                    {/* Message Bubble */}
                    <div className={`relative px-4 py-3 rounded-2xl shadow-sm ${
                      msg.sender === 'user'
                        ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-br-md'
                        : msg.isError
                        ? 'bg-red-50 text-red-800 border border-red-200 rounded-bl-md'
                        : 'bg-white text-gray-800 border border-gray-200 rounded-bl-md'
                    }`}>
                      <div className="whitespace-pre-wrap break-words text-sm sm:text-base leading-relaxed">
                        {msg.text}
                      </div>
                      <div className={`text-xs mt-2 ${
                        msg.sender === 'user' 
                          ? 'text-purple-100' 
                          : 'text-gray-500'
                      }`}>
                        {msg.timestamp}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Typing Indicator */}
              {isTyping && (
                <div className="flex justify-start message-fade-in">
                  <div className="flex items-start space-x-3 max-w-[85%] lg:max-w-[70%]">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-sm">🤖</span>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full pulse-animation"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full pulse-animation" style={{animationDelay: '0.2s'}}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full pulse-animation" style={{animationDelay: '0.4s'}}></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={chatEndRef} />
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="bg-white/80 backdrop-blur-md border-t border-white/20 px-4 sm:px-6 lg:px-8 py-4">
          <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
            <div className="flex items-end space-x-4">
              <div className="flex-1 relative">
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Ask me anything about movies..."
                  disabled={isLoading}
                  className="w-full px-4 py-3 pr-12 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-800 placeholder-gray-500 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => setQuery('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
              
              <button
                type="submit"
                disabled={!query.trim() || isLoading}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-xl hover:from-purple-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed btn-hover-effect shadow-lg"
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Sending</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <span>Send</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  </div>
                )}
              </button>
            </div>
            
            <div className="mt-2 text-xs text-gray-500 text-center">
              Press Enter to send • Ask about movies, genres, recommendations, and more
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default App;
