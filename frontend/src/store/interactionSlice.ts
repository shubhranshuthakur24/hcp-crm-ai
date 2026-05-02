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
  currentInteractionId: number | null;
  saveStatus: 'idle' | 'saving' | 'saved' | 'error';
  saveMessage: string;
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
  currentInteractionId: null,
  saveStatus: 'idle',
  saveMessage: '',
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
    setCurrentInteractionId: (state, action: PayloadAction<number | null>) => {
      state.currentInteractionId = action.payload;
    },
    setSaveState: (
      state,
      action: PayloadAction<{ status: AppState['saveStatus']; message?: string }>
    ) => {
      state.saveStatus = action.payload.status;
      state.saveMessage = action.payload.message ?? '';
    },
    resetInteraction: (state) => {
      state.interaction = initialState.interaction;
      state.chatHistory = initialState.chatHistory;
      state.currentInteractionId = null;
      state.saveStatus = 'idle';
      state.saveMessage = '';
    }
  },
});

export const {
  updateInteraction,
  addChatMessage,
  setTyping,
  setCurrentInteractionId,
  setSaveState,
  resetInteraction,
} = interactionSlice.actions;
export default interactionSlice.reducer;
