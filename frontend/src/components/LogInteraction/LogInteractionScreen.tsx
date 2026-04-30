import React from 'react';
import StructuredForm from './StructuredForm';
import ChatAssistant from './ChatAssistant';
import { motion } from 'framer-motion';

const LogInteractionScreen: React.FC = () => {
  return (
    <div className="flex w-full h-full bg-bg-dark overflow-hidden p-6 gap-6">
      {/* Left Card: Form (2/3 width) */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
        className="flex-2 glass-panel overflow-hidden flex flex-col"
      >
        <StructuredForm />
      </motion.div>

      {/* Right Card: Chat Assistant (1/3 width) */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="flex-1 glass-panel overflow-hidden flex flex-col"
      >
        <ChatAssistant />
      </motion.div>
    </div>
  );
};

export default LogInteractionScreen;
