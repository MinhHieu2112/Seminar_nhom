
import React, { useState } from 'react';
import { MessageSquare, X, Send, Loader2 } from 'lucide-react';
import { getDesignAdvice } from '../../geminiService';

const AIAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [history, setHistory] = useState<{ role: 'user' | 'ai', content: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async () => {
    if (!message.trim()) return;
    
    const userMsg = message;
    setMessage('');
    setHistory(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsLoading(true);

    const aiResponse = await getDesignAdvice(userMsg);
    setHistory(prev => [...prev, { role: 'ai', content: aiResponse }]);
    setIsLoading(false);
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-8 right-8 bg-black text-white p-4 rounded-full shadow-2xl hover:scale-110 transition-transform z-40"
      >
        <MessageSquare size={24} />
      </button>

      {isOpen && (
        <div className="fixed bottom-24 right-8 w-80 md:w-96 h-[500px] bg-white rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden border border-gray-100">
          <div className="bg-black p-4 text-white flex justify-between items-center">
            <div>
              <h3 className="font-bold text-sm">LuxDecor AI Designer</h3>
              <p className="text-[10px] text-gray-400">Tư vấn không gian sống 24/7</p>
            </div>
            <button onClick={() => setIsOpen(false)}><X size={20} /></button>
          </div>

          <div className="flex-grow overflow-y-auto p-4 space-y-4 bg-gray-50">
            {history.length === 0 && (
              <div className="text-center py-8">
                <div className="bg-gray-200 w-12 h-12 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <MessageSquare className="text-gray-400" />
                </div>
                <p className="text-xs text-gray-500">Chào bạn! Tôi có thể giúp gì cho việc thiết kế ngôi nhà của bạn?</p>
              </div>
            )}
            {history.map((chat, idx) => (
              <div key={idx} className={`flex ${chat.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${chat.role === 'user' ? 'bg-black text-white rounded-tr-none' : 'bg-white border border-gray-100 rounded-tl-none'}`}>
                  {chat.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-100 p-3 rounded-2xl rounded-tl-none">
                  <Loader2 className="animate-spin text-gray-400" size={16} />
                </div>
              </div>
            )}
          </div>

          <div className="p-4 bg-white border-t border-gray-100 flex items-center space-x-2">
            <input 
              type="text" 
              placeholder="Nhập câu hỏi..." 
              className="flex-grow bg-gray-100 border-none rounded-full px-4 py-2 text-sm focus:ring-1 focus:ring-black"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            />
            <button 
              onClick={handleSend}
              disabled={isLoading}
              className="bg-black text-white p-2 rounded-full disabled:opacity-50"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default AIAssistant;
