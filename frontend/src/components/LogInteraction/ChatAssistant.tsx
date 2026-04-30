import React, { useState, useRef, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '../../store';
import { addChatMessage, updateInteraction, setTyping } from '../../store/interactionSlice';
import { Send, Zap, Globe } from 'lucide-react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';

const ChatAssistant: React.FC = () => {
  const [input, setInput] = useState('');
  const dispatch = useDispatch();
  const { chatHistory, isTyping, interaction } = useSelector((state: RootState) => state.app);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatHistory, isTyping]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg = input.trim();
    setInput('');
    dispatch(addChatMessage({ role: 'user', content: userMsg }));
    dispatch(setTyping(true));

    try {
      const response = await axios.post('http://localhost:8000/chat', {
        message: userMsg,
        thread_id: 'default-session',
        interaction_state: interaction
      });

      const { reply, updated_interaction } = response.data;

      dispatch(addChatMessage({ role: 'assistant', content: reply }));
      if (updated_interaction) {
        dispatch(updateInteraction(updated_interaction));
      }
    } catch (error) {
      dispatch(addChatMessage({ role: 'assistant', content: 'Sorry, I encountered an error connecting to the backend. Please ensure the server is running.' }));
    } finally {
      dispatch(setTyping(false));
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-6 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-600/20 flex items-center justify-center border border-blue-500/30">
            <Globe size={20} className="text-blue-400" />
          </div>
          <div>
            <h3 className="font-bold">AI Assistant</h3>
            <span className="text-[10px] text-secondary uppercase tracking-widest font-bold">
              Log interaction via chat
            </span>
          </div>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 premium-scroll">
        <AnimatePresence>
          {chatHistory.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[85%] p-4 rounded-2xl ${msg.role === 'user'
                ? 'bg-white text-black font-medium rounded-tr-none shadow-lg'
                : 'bg-white/5 text-primary border border-white/10 rounded-tl-none'
                }`}>
                {msg.content}
              </div>
            </motion.div>
          ))}
          {isTyping && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-start"
            >
              <div className="bg-white/5 p-4 rounded-2xl rounded-tl-none flex gap-1">
                <span className="w-1.5 h-1.5 bg-white/50 rounded-full animate-bounce"></span>
                <span className="w-1.5 h-1.5 bg-white/50 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                <span className="w-1.5 h-1.5 bg-white/50 rounded-full animate-bounce [animation-delay:0.4s]"></span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="p-6">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Describe interaction..."
            className="flex-1 bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:border-white/30 transition-all text-sm text-white"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isTyping}
            className="px-6 py-3 bg-zinc-600 text-white rounded-xl hover:bg-zinc-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-bold text-sm"
          >
            <Send size={16} /> Log
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatAssistant;
