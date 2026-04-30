import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

export interface InteractionState {
  hcp_name: string;
  interaction_type: string;
  date: string;
  time: string;
  attendees: string;
  topics_discussed: string;
  materials_shared: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  outcomes: string;
  samples_distributed: string;
  follow_up_actions: string;
  suggested_follow_ups: string[];
}

interface AppState {
  interaction: InteractionState;
  chatHistory: { role: 'user' | 'assistant'; content: string }[];
  isTyping: boolean;
}

const initialState: AppState = {
  interaction: {
    hcp_name: '',
    interaction_type: '',
    date: '',
    time: '',
    attendees: '',
    topics_discussed: '',
    materials_shared: '',
    sentiment: 'neutral',
    outcomes: '',
    samples_distributed: '',
    follow_up_actions: '',
    suggested_follow_ups: [],
  },
  chatHistory: [
    { role: 'assistant', content: 'Hello! I am your AI CRM Assistant. How can I help you log an HCP interaction today?' }
  ],
  isTyping: false,
};

const interactionSlice = createSlice({
  name: 'interaction',
  initialState,
  reducers: {
    updateInteraction: (state, action: PayloadAction<Partial<InteractionState>>) => {
      state.interaction = { ...state.interaction, ...action.payload };
    },
    addChatMessage: (state, action: PayloadAction<{ role: 'user' | 'assistant'; content: string }>) => {
      state.chatHistory.push(action.payload);
    },
    setTyping: (state, action: PayloadAction<boolean>) => {
      state.isTyping = action.payload;
    },
    resetInteraction: (state) => {
      state.interaction = initialState.interaction;
      state.chatHistory = initialState.chatHistory;
    }
  },
});

export const { updateInteraction, addChatMessage, setTyping, resetInteraction } = interactionSlice.actions;
export default interactionSlice.reducer;
