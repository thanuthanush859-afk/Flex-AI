
import React from 'react';
import { Message } from '../types';
import { User, GraduationCap } from 'lucide-react';

interface ChatBubbleProps {
  message: Message;
}

export const ChatBubble: React.FC<ChatBubbleProps> = ({ message }) => {
  const isModel = message.role === 'model';
  
  const getSubjectColor = (subject?: string) => {
    switch (subject) {
      case 'Math': return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
      case 'Science': return 'text-purple-400 bg-purple-500/10 border-purple-500/20';
      case 'History': return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
      case 'English': return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
      case 'CS': return 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20';
      default: return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
    }
  };

  return (
    <div className={`flex gap-4 ${isModel ? 'justify-start' : 'flex-row-reverse'}`}>
      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-lg ${
        isModel 
          ? 'bg-gradient-to-br from-emerald-400 to-emerald-600 text-white neon-glow-emerald' 
          : 'bg-white/10 text-slate-300 border border-white/10'
      }`}>
        {isModel ? <GraduationCap size={20} /> : <User size={20} />}
      </div>
      
      <div className={`max-w-[85%] md:max-w-[80%] space-y-2 min-w-0`}>
        {message.subject && (
          <div className={`flex ${!isModel ? 'justify-end' : 'justify-start'}`}>
            <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider border ${getSubjectColor(message.subject)}`}>
              {message.subject}
            </span>
          </div>
        )}
        <div className={`rounded-[2rem] p-6 transition-all duration-500 break-words overflow-hidden ${
          isModel 
            ? 'glass-panel text-slate-100' 
            : 'bg-gradient-to-br from-blue-600 to-purple-700 text-white shadow-2xl neon-glow-purple'
        }`}>
          {message.image && (
            <div className="relative group mb-4">
              <div className="absolute -inset-1 bg-white/20 blur opacity-0 group-hover:opacity-100 transition duration-500 rounded-2xl"></div>
              <img 
                src={message.image} 
                alt="Question" 
                className="max-h-80 w-full object-cover rounded-2xl border border-white/10 relative z-10" 
              />
            </div>
          )}
          <div className="prose prose-invert prose-sm max-w-full overflow-hidden">
            {message.text.split('\n').map((line, i) => (
              <p key={i} className="mb-3 last:mb-0 leading-relaxed text-[15px] font-medium opacity-90 break-words">
                {line}
              </p>
            ))}
          </div>
        </div>
        <div className={`flex items-center gap-2 px-4 text-[10px] font-bold uppercase tracking-widest text-slate-500 ${!isModel ? 'flex-row-reverse' : ''}`}>
          <span>{new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          <span className="w-1 h-1 rounded-full bg-slate-700"></span>
          <span>{isModel ? 'Flex ai' : 'You'}</span>
        </div>
      </div>
    </div>
  );
};
