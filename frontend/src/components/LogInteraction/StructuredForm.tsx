import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '../../store';
import { updateInteraction } from '../../store/interactionSlice';
import { User, Calendar, Tag, MessageSquare, Briefcase, FileText, CheckCircle, Gift, Sparkles, Mic, Search, Plus, Globe } from 'lucide-react';
import axios from 'axios';

interface FormFieldProps {
  label: string;
  value: string;
  icon?: any;
  field: string;
  isTextArea?: boolean;
  type?: string;
  placeholder?: string;
  showMic?: boolean;
}

const FormField: React.FC<FormFieldProps> = ({ label, value, icon: Icon, field, isTextArea = false, type = 'text', placeholder = "Waiting for AI extraction...", showMic = false }) => {
  const dispatch = useDispatch();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    dispatch(updateInteraction({ [field]: e.target.value }));
  };

  return (
    <div className="flex flex-col gap-2 p-4 glass-panel border-opacity-20 animate-fade-in focus-within:border-white/30 transition-all relative">
      <div className="flex items-center gap-2 text-xs font-semibold text-secondary uppercase tracking-wider">
        {Icon && <Icon size={14} className="text-secondary" />}
        {label}
      </div>
      <div className="relative">
        {isTextArea ? (
          <textarea
            value={value}
            onChange={handleChange}
            placeholder={placeholder}
            className="glass-textarea w-full pr-8"
            rows={2}
          />
        ) : (
          <input
            type={type}
            value={value}
            onChange={handleChange}
            placeholder={placeholder}
            className="glass-input w-full"
          />
        )}
        {showMic && (
          <Mic size={16} className="absolute right-2 bottom-3 text-secondary hover:text-white cursor-pointer" />
        )}
      </div>
    </div>
  );
};

const StructuredForm: React.FC = () => {
  const { interaction } = useSelector((state: RootState) => state.app);
  const dispatch = useDispatch();
  const [isSaving, setIsSaving] = React.useState(false);

  const handleManualSave = async () => {
    setIsSaving(true);
    try {
      await axios.post('http://localhost:8000/log_interaction', { data: interaction });
      alert("Interaction logged successfully!");
    } catch (error) {
      console.error("Save error:", error);
      alert("Failed to save interaction. Check console for details.");
    } finally {
      setIsSaving(false);
    }
  };

  const sentimentOptions = [
    { value: 'positive', label: 'Positive', emoji: '😊' },
    { value: 'neutral', label: 'Neutral', emoji: '😐' },
    { value: 'negative', label: 'Negative', emoji: '☹️' },
  ];

  return (
    <div className="h-full flex flex-col gap-6 p-8 overflow-y-auto premium-scroll">
      <div className="flex items-center justify-between mb-4">
        <div className="flex flex-col gap-2">
          <h2 className="text-2xl font-bold glow-text">Log HCP Interaction</h2>
          <p className="text-secondary text-sm font-medium">Interaction Details</p>
        </div>
        <button 
          onClick={handleManualSave}
          disabled={isSaving}
          className="bg-white text-black px-6 py-2 rounded-xl font-bold text-sm hover:bg-zinc-200 transition-colors flex items-center gap-2 disabled:opacity-50"
        >
          {isSaving ? "Saving..." : <><CheckCircle size={16} /> Log Interaction</>}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <FormField label="HCP Name" value={interaction.hcp_name} field="hcp_name" placeholder="Search or select HCP..." />
        <div className="flex flex-col gap-2 p-4 glass-panel border-opacity-20">
          <div className="flex items-center gap-2 text-xs font-semibold text-secondary uppercase tracking-wider">Interaction Type</div>
          <select 
            value={interaction.interaction_type} 
            onChange={(e) => dispatch(updateInteraction({ interaction_type: e.target.value }))}
            className="glass-input bg-transparent border-none appearance-none cursor-pointer"
          >
            <option value="">Select type...</option>
            <option value="Meeting">Meeting</option>
            <option value="Call">Call</option>
            <option value="Lunch">Lunch</option>
          </select>
        </div>
        <FormField label="Date" value={interaction.date} field="date" type="date" />
        <FormField label="Time" value={interaction.time} field="time" type="time" />
      </div>

      <div className="flex flex-col gap-4">
        <FormField label="Attendees" value={interaction.attendees} field="attendees" placeholder="Enter names or search..." />
        
        <div className="flex flex-col gap-2">
          <FormField label="Topics Discussed" value={interaction.topics_discussed} field="topics_discussed" isTextArea placeholder="Enter key discussion points..." showMic />
          <button className="flex items-center gap-2 text-xs text-secondary hover:text-white transition-colors w-fit px-1 py-2">
            <Sparkles size={14} className="text-secondary" />
            <span>Summarize from Voice Note (Requires Consent)</span>
          </button>
        </div>

        <div className="flex flex-col gap-4 p-6 glass-panel border-opacity-20">
          <div className="text-xs font-semibold text-secondary uppercase tracking-wider mb-2">Materials Shared / Samples Distributed</div>
          
          <div className="flex flex-col gap-3 p-4 bg-white/5 rounded-xl border border-white/5">
             <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Materials Shared</span>
                <button className="flex items-center gap-2 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-xs transition-all border border-white/10">
                  <Search size={12} /> Search/Add
                </button>
             </div>
             <p className="text-xs text-secondary italic">{interaction.materials_shared || "No materials added."}</p>
          </div>

          <div className="flex flex-col gap-3 p-4 bg-white/5 rounded-xl border border-white/5">
             <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Samples Distributed</span>
                <button className="flex items-center gap-2 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-xs transition-all border border-white/10">
                  <Plus size={12} /> Add Sample
                </button>
             </div>
             <p className="text-xs text-secondary italic">{interaction.samples_distributed || "No samples added."}</p>
          </div>
        </div>

        <div className="p-6 glass-panel border-opacity-20 flex flex-col gap-4">
          <div className="text-xs font-semibold text-secondary uppercase tracking-wider">Observed/Inferred HCP Sentiment</div>
          <div className="sentiment-radio-group">
            {sentimentOptions.map((opt) => (
              <label 
                key={opt.value} 
                className={`sentiment-option ${interaction.sentiment === opt.value ? 'active' : ''}`}
              >
                <input 
                  type="radio" 
                  name="sentiment"
                  value={opt.value}
                  checked={interaction.sentiment === opt.value}
                  onChange={() => dispatch(updateInteraction({ sentiment: opt.value as any }))}
                />
                <span className="text-lg">{opt.emoji}</span>
                <span>{opt.label}</span>
              </label>
            ))}
          </div>
        </div>

        <FormField label="Outcomes" value={interaction.outcomes} field="outcomes" isTextArea placeholder="Key outcomes or agreements..." />
        <FormField label="Follow-up Actions" value={interaction.follow_up_actions} field="follow_up_actions" isTextArea placeholder="Enter next steps or tasks..." />

        {/* AI Suggested Follow-ups */}
        <div className="flex flex-col gap-3 pt-4">
          <div className="text-xs font-bold text-secondary uppercase tracking-wider">AI Suggested Follow-ups:</div>
          <div className="flex flex-col gap-2">
            {interaction.suggested_follow_ups && interaction.suggested_follow_ups.length > 0 ? (
              interaction.suggested_follow_ups.map((suggestion, idx) => (
                <button 
                  key={idx} 
                  className="text-xs text-blue-400 hover:text-blue-300 text-left transition-colors flex items-center gap-2"
                  onClick={() => dispatch(updateInteraction({ follow_up_actions: (interaction.follow_up_actions ? interaction.follow_up_actions + '\n' : '') + suggestion }))}
                >
                  {suggestion.startsWith('+') ? suggestion : `+ ${suggestion}`}
                </button>
              ))
            ) : (
              <p className="text-xs text-secondary italic">Talk to the AI to see suggestions...</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StructuredForm;
