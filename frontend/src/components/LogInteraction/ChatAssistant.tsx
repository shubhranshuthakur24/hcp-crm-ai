import React, { useState, useRef, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '../../store';
import { addChatMessage, updateInteraction, setTyping } from '../../store/interactionSlice';
import { Send, Globe, X, Sparkles } from 'lucide-react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';

const ChatAssistant: React.FC = () => {
  const [input, setInput] = useState('');
  const [toastMessage, setToastMessage] = useState('');
  const dispatch = useDispatch();
  const { chatHistory, isTyping, interaction } = useSelector((state: RootState) => state.app);
  const scrollRef = useRef<HTMLDivElement>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatHistory, isTyping]);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  const showToast = (message: string) => {
    setToastMessage(message);
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    toastTimerRef.current = setTimeout(() => {
      setToastMessage('');
    }, 3000);
  };

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
    } catch (_error: any) {
      showToast('Something went wrong. Please try again.');
    } finally {
      dispatch(setTyping(false));
    }
  };

  const dismissToast = () => {
    setToastMessage('');
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
      toastTimerRef.current = null;
    }
  };

  return (
    <div className="h-full flex flex-col relative">
      <div className="chat-header p-6 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="chat-avatar w-10 h-10 rounded-full bg-blue-600/20 flex items-center justify-center border border-blue-500/30">
            <Globe size={20} className="text-blue-400" />
          </div>
          <div>
            <h3 className="font-bold">AI Assistant</h3>
            <span className="chat-subtitle text-[10px] text-secondary uppercase tracking-widest font-bold">
              Log interaction via chat
            </span>
          </div>
        </div>
        <div className="chat-online-badge">Live</div>
      </div>

      <div ref={scrollRef} className="chat-body flex-1 overflow-y-auto p-6 flex flex-col gap-4 premium-scroll">
        <AnimatePresence>
          {chatHistory.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`chat-row flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`chat-bubble max-w-[85%] p-4 rounded-2xl ${msg.role === 'user'
                  ? 'chat-bubble-user bg-white text-black font-medium rounded-tr-none shadow-lg'
                  : 'chat-bubble-assistant bg-white/5 text-primary border border-white/10 rounded-tl-none'
                  }`}
              >
                {msg.role === 'assistant' && (
                  <div className="chat-bubble-label">
                    <Sparkles size={12} />
                    <span>Assistant</span>
                  </div>
                )}
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
              <div className="chat-typing bg-white/5 p-4 rounded-2xl rounded-tl-none flex gap-1">
                <span className="w-1.5 h-1.5 bg-white/50 rounded-full animate-bounce"></span>
                <span className="w-1.5 h-1.5 bg-white/50 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                <span className="w-1.5 h-1.5 bg-white/50 rounded-full animate-bounce [animation-delay:0.4s]"></span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="chat-toast chat-toast-error"
            role="status"
            aria-live="polite"
          >
            <div className="chat-toast-icon" aria-hidden>
              <X size={14} />
            </div>
            <div className="chat-toast-content">{toastMessage}</div>
            <button
              type="button"
              className="chat-toast-close"
              onClick={dismissToast}
              aria-label="Dismiss notification"
            >
              <X size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="chat-composer-wrap p-6">
        <div className="chat-composer flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Tell me what happened in your visit..."
            className="chat-input flex-1 bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:border-white/30 transition-all text-sm text-white"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isTyping}
            className="chat-send-btn px-6 py-3 bg-zinc-600 text-white rounded-xl hover:bg-zinc-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-bold text-sm"
          >
            <Send size={16} />
            {isTyping ? 'Sending...' : 'Send'}
          </button>
        </div>
        <div className="chat-composer-hint">
          Tip: mention doctor name, time, interaction type, and key outcomes.
        </div>
      </div>
    </div>
  );
};

export default ChatAssistant;
