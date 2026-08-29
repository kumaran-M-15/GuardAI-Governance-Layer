import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { Send, Settings, Shield, User, Bot, AlertTriangle, Copy, Check } from 'lucide-react';

const API_URL = 'http://localhost:8000/api';

const CopyButton = ({ text }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1.5 px-2 py-1 mt-1 text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 rounded-md transition-all"
      title="Copy response"
    >
      {copied ? (
        <><Check size={14} className="text-green-400" /> Copied!</>
      ) : (
        <><Copy size={14} /> Copy</>
      )}
    </button>
  );
};

export default function SecureChat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [developerMode, setDeveloperMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = { 
      id: Date.now(), 
      role: 'user', 
      content: input, 
      maskedContent: null,
      detectedEntities: [] 
    };
    
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await axios.post(`${API_URL}/chat`, {
        prompt: userMessage.content,
        user_id: 'user_123'
      });
      
      const { masked_prompt, llm_response, detected_entities } = response.data;
      
      // Update the user message with the masked content and detected entities
      setMessages((prev) => prev.map(msg => 
        msg.id === userMessage.id 
          ? { ...msg, maskedContent: masked_prompt, detectedEntities: detected_entities }
          : msg
      ));
      
      // Add the AI response
      setMessages((prev) => [...prev, {
        id: Date.now() + 1,
        role: 'ai',
        content: llm_response
      }]);
      
    } catch (error) {
      console.error("Chat error:", error);
      setMessages((prev) => [...prev, {
        id: Date.now() + 1,
        role: 'ai',
        content: "Error: Could not reach the GuardAI server. Please ensure the backend is running.",
        isError: true
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full relative max-w-5xl mx-auto border-x border-slate-800 shadow-2xl">
      {/* Header */}
      <header className="h-16 flex items-center justify-between px-6 border-b border-slate-800 bg-slate-900/50 backdrop-blur-md z-10 sticky top-0">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Shield className="text-indigo-400" size={20} />
            Secure Chat
          </h2>
          <p className="text-xs text-slate-400">All messages are intercepted and anonymized before reaching the LLM</p>
        </div>
        
        {/* Developer Mode Toggle */}
        <div className="flex items-center gap-3 bg-slate-800/50 px-3 py-1.5 rounded-full border border-slate-700/50">
          <Settings size={14} className={developerMode ? "text-indigo-400" : "text-slate-400"} />
          <span className="text-sm font-medium text-slate-300">Developer Mode</span>
          <button 
            onClick={() => setDeveloperMode(!developerMode)}
            className={`w-10 h-5 rounded-full transition-colors relative ${developerMode ? 'bg-indigo-500' : 'bg-slate-600'}`}
          >
            <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${developerMode ? 'left-6' : 'left-1'}`} />
          </button>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-4">
            <Shield size={48} className="text-slate-700 opacity-50" />
            <p className="text-center max-w-sm">
              Start chatting. Any PII like names, emails, or phone numbers will be automatically masked by GuardAI.
            </p>
          </div>
        )}
        
        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-4 max-w-3xl ${msg.role === 'user' ? 'ml-auto flex-row-reverse' : ''}`}>
            {/* Avatar */}
            <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
              msg.role === 'user' ? 'bg-indigo-600' : 'bg-slate-700'
            }`}>
              {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
            </div>
            
            {/* Message Bubble & Actions */}
            <div className={`flex flex-col gap-1 ${msg.role === 'user' ? 'items-end' : 'items-start'} w-full`}>
              <div className={`px-4 py-3 rounded-2xl whitespace-pre-wrap leading-relaxed min-w-[200px] ${
                msg.role === 'user' 
                  ? 'bg-indigo-600 text-white rounded-tr-none' 
                  : msg.isError ? 'bg-red-900/50 border border-red-500/30 text-red-200 rounded-tl-none' : 'bg-slate-800 text-slate-200 rounded-tl-none border border-slate-700'
              }`}>
                {msg.content}
              </div>
              
              {/* Toolbar beneath AI message */}
              {msg.role === 'ai' && !msg.isError && (
                <CopyButton text={msg.content} />
              )}
              
              {/* Developer Mode Payload Badge */}
              {developerMode && msg.role === 'user' && msg.maskedContent && (
                <div className="mt-2 bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-slate-300 w-full max-w-md animate-in fade-in slide-in-from-top-2">
                  <div className="flex items-center gap-2 mb-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider">
                    <AlertTriangle size={14} />
                    Payload Sent to LLM
                  </div>
                  <div className="font-mono text-xs bg-slate-950 p-2 rounded-md whitespace-pre-wrap break-words">
                    {msg.maskedContent}
                  </div>
                  {msg.detectedEntities?.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {msg.detectedEntities.map(entity => (
                        <span key={entity} className="text-[10px] bg-red-500/20 text-red-300 px-2 py-0.5 rounded-full border border-red-500/30">
                          {entity}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex gap-4">
            <div className="shrink-0 w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center">
              <Bot size={16} />
            </div>
            <div className="bg-slate-800 rounded-2xl rounded-tl-none px-4 py-4 border border-slate-700 flex gap-1.5 items-center">
              <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-slate-900 border-t border-slate-800">
        <form onSubmit={handleSend} className="relative max-w-4xl mx-auto flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message (try including an email or phone number)..."
            className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl px-4 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}