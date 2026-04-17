import React from 'react';
import StructuredForm from './StructuredForm';
import ChatAssistant from './ChatAssistant';
import { motion } from 'framer-motion';

const LogInteractionScreen: React.FC = () => {
  return (
    <div className="flex w-full h-full bg-bg-dark overflow-hidden">
      {/* Left Panel: Form */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
        className="flex-1 min-w-[500px]"
      >
        <StructuredForm />
      </motion.div>

      {/* Right Panel: Chat Assistant */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className=""
      >
        <ChatAssistant />
      </motion.div>
    </div>
  );
};

export default LogInteractionScreen;
