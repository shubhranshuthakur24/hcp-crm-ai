import React from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store';
import { User, Calendar, Tag, MessageSquare, Briefcase, FileText } from 'lucide-react';

const FormField = ({ label, value, icon: Icon }: { label: string, value: string, icon: any }) => (
  <div className="flex flex-col gap-2 p-4 glass-panel border-opacity-20 animate-fade-in">
    <div className="flex items-center gap-2 text-xs font-semibold text-secondary uppercase tracking-wider">
      <Icon size={14} className="text-secondary" />
      {label}
    </div>
    <div className="text-sm text-primary font-medium min-h-[1.25rem]">
      {value || <span className="text-white/10 italic">Waiting for AI extraction...</span>}
    </div>
  </div>
);

const StructuredForm: React.FC = () => {
  const { interaction } = useSelector((state: RootState) => state.app);

  return (
    <div className="h-full flex flex-col gap-6 p-8 overflow-y-auto premium-scroll">
      <div className="flex flex-col gap-2 mb-4">
        <h2 className="text-2xl font-bold glow-text">Interaction Summary</h2>
        <p className="text-secondary text-sm">Real-time AI data extraction from your conversation.</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <FormField label="HCP Name" value={interaction.hcp_name} icon={User} />
        <FormField label="Interaction Type" value={interaction.interaction_type} icon={Briefcase} />
        <FormField label="Date" value={interaction.date} icon={Calendar} />
        <FormField label="Time" value={interaction.time} icon={Calendar} />
      </div>

      <div className="flex flex-col gap-4">
        <FormField label="Attendees" value={interaction.attendees} icon={User} />
        <FormField label="Topics Discussed" value={interaction.topics_discussed} icon={Tag} />
        <FormField label="Materials Shared" value={interaction.materials_shared} icon={FileText} />
        <FormField label="Key Outcomes" value={interaction.outcomes} icon={MessageSquare} />
      </div>

      <div className="p-4 glass-panel border-opacity-20 flex items-center justify-between">
        <div className="text-xs font-semibold text-secondary uppercase tracking-wider">Sentiment</div>
        <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
          interaction.sentiment === 'positive' ? 'bg-green-500/20 text-green-400' :
          interaction.sentiment === 'negative' ? 'bg-red-500/20 text-red-400' :
          'bg-blue-500/20 text-blue-400'
        }`}>
          {interaction.sentiment}
        </div>
      </div>
    </div>
  );
};

export default StructuredForm;
