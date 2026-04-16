import React, { useState, useRef, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '../../store';
import { addChatMessage, updateInteraction, setTyping } from '../../store/interactionSlice';
import { Send, Zap } from 'lucide-react';
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

      const { reply, updated_interaction, tool_calls } = response.data;
      
      dispatch(addChatMessage({ role: 'assistant', content: reply }));
      if (updated_interaction) {
        dispatch(updateInteraction(updated_interaction));
      }
      
      // Handle tool-call derived updates manually if tool_calls exist and interaction wasn't updated
      if (tool_calls && tool_calls.length > 0) {
        tool_calls.forEach((tc: any) => {
          if (tc.name === 'edit_interaction') {
            dispatch(updateInteraction({ [tc.args.field]: tc.args.value }));
          }
        });
      }
    } catch (error) {
      dispatch(addChatMessage({ role: 'assistant', content: 'Sorry, I encountered an error connecting to the backend. Please ensure the server is running.' }));
    } finally {
      dispatch(setTyping(false));
    }
  };

  return (
    <div className="h-full flex flex-col bg-white/5 backdrop-blur-md border-l border-white/10">
      <div className="p-6 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-accent-primary to-accent-secondary flex items-center justify-center">
            <Zap size={20} className="text-white" />
          </div>
          <div>
            <h3 className="font-bold">AI Assistant</h3>
            <span className="text-xs text-secondary flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
              Online - Gemma 2b-9it
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
              <div className={`max-w-[80%] p-4 rounded-2xl ${
                msg.role === 'user' 
                  ? 'bg-accent-primary text-black font-medium rounded-tr-none' 
                  : 'bg-white/10 text-primary border border-white/10 rounded-tl-none'
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
              <div className="bg-white/10 p-4 rounded-2xl rounded-tl-none flex gap-1">
                <span className="w-1.5 h-1.5 bg-white/50 rounded-full animate-bounce"></span>
                <span className="w-1.5 h-1.5 bg-white/50 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                <span className="w-1.5 h-1.5 bg-white/50 rounded-full animate-bounce [animation-delay:0.4s]"></span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="p-6">
        <div className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Tell me about your interaction..."
            className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-6 pr-14 focus:outline-none focus:border-accent-primary transition-all text-sm"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isTyping}
            className="absolute right-2 top-2 p-3 bg-accent-primary text-black rounded-xl hover:bg-cyan-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send size={18} />
          </button>
        </div>
        <p className="text-xs text-center mt-3 text-secondary uppercase tracking-tighter">
          Input fields on the left are driven by conversation.
        </p>
      </div>
    </div>
  );
};

export default ChatAssistant;
