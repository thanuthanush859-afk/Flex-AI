
import React from 'react';
import { ChatSession } from '../types';
import { Plus, MessageSquare, GraduationCap, Trash2 } from 'lucide-react';

interface SidebarProps {
  sessions: ChatSession[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ sessions, activeId, onSelect, onNew }) => {
  const getSubjectColor = (subject?: string) => {
    switch (subject) {
      case 'Math': return 'text-blue-400';
      case 'Science': return 'text-purple-400';
      case 'History': return 'text-amber-400';
      case 'English': return 'text-rose-400';
      case 'CS': return 'text-indigo-400';
      default: return 'text-emerald-400';
    }
  };

  return (
    <aside className="w-72 glass-panel h-full text-slate-300 flex flex-col border-r-0 shrink-0">
      <div className="p-6 border-b border-white/5">
        <button 
          onClick={onNew}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-emerald-700 hover:from-emerald-400 hover:to-emerald-600 text-white py-3.5 px-4 rounded-2xl transition-all font-bold shadow-lg neon-glow-emerald active:scale-95"
        >
          <Plus size={20} />
          New Session
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
        <div className="px-3 mb-4">
          <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Neural History</h3>
        </div>
        {sessions.map((session) => (
          <button
            key={session.id}
            onClick={() => onSelect(session.id)}
            className={`w-full flex items-center gap-3 p-4 rounded-2xl text-sm text-left transition-all duration-300 ${
              activeId === session.id 
                ? 'bg-white/10 text-white border border-white/10 shadow-xl' 
                : 'hover:bg-white/5 text-slate-400 hover:text-slate-200'
            }`}
          >
            <MessageSquare size={18} className={activeId === session.id ? 'text-emerald-400' : getSubjectColor(session.subject)} />
            <span className="truncate flex-1 font-medium">{session.title}</span>
          </button>
        ))}
      </div>

      <div className="p-6 border-t border-white/5 bg-black/20">
        <div className="flex items-center gap-3 p-3 glass-panel rounded-2xl">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center neon-glow-emerald">
            <GraduationCap size={20} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-white truncate">Premium Student</p>
            <p className="text-[10px] text-emerald-500/70 font-bold uppercase tracking-wider">Infinity Plan</p>
          </div>
        </div>
      </div>
    </aside>
  );
};
