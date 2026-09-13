import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Send, Loader2, Bot, User } from 'lucide-react';
import { apiClient } from '../services/api';
import { useAssessment } from '../context/AssessmentContext';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  suggestions?: string[];
}

const STARTER_PROMPTS = [
  'What are my most dangerous findings?',
  'Why is my security score low?',
  'Which device should I fix first?',
  'Summarize this audit for management.',
];

export const AICopilot: React.FC = () => {
  const { assessment, isDemoData } = useAssessment();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isThinking]);

  const send = async (promptOverride?: string) => {
    const prompt = (promptOverride ?? input).trim();
    if (!prompt || isThinking) return;

    setMessages((prev) => [...prev, { role: 'user', content: prompt }]);
    setInput('');
    setIsThinking(true);

    try {
      const res = await apiClient.copilotQuery(prompt, assessment?.id !== undefined && !isDemoData ? assessment?.id : undefined);
      setMessages((prev) => [...prev, { role: 'assistant', content: res.response, suggestions: res.suggestions }]);
    } catch (err) {
      setMessages((prev) => [...prev, {
        role: 'assistant',
        content: 'I could not reach the analysis backend just now. Please check your connection and try again.'
      }]);
    } finally {
      setIsThinking(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-14rem)] max-w-3xl mx-auto">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-cyan-400" />
          AI Security Copilot
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          {isDemoData
            ? 'Grounded in synthetic demo data — run a real audit for answers about your own devices.'
            : `Grounded in "${assessment?.name}". Ask about findings, priorities, or a plain-English summary.`}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto rounded-3xl bg-[#0B0F19] border border-slate-800 p-4 sm:p-6 space-y-4">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
              <Bot className="w-7 h-7 text-cyan-400" />
            </div>
            <p className="text-sm text-slate-400 max-w-sm">
              Ask a question about your audit, or try one of these:
            </p>
            <div className="flex flex-col gap-2 w-full max-w-sm">
              {STARTER_PROMPTS.map((p) => (
                <button
                  key={p}
                  onClick={() => send(p)}
                  className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/40 text-slate-300 text-xs text-left transition-colors"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, idx) => (
          <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'assistant' && (
              <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 text-cyan-400" />
              </div>
            )}
            <div className={`max-w-[80%] space-y-2`}>
              <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-tr-sm'
                  : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-sm'
              }`}>
                {msg.content}
              </div>
              {msg.suggestions && msg.suggestions.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {msg.suggestions.map((s) => (
                    <button
                      key={s}
                      onClick={() => send(s)}
                      className="px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 hover:border-cyan-500/40 text-[11px] text-slate-400 hover:text-cyan-300 transition-colors"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {msg.role === 'user' && (
              <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center shrink-0">
                <User className="w-4 h-4 text-slate-400" />
              </div>
            )}
          </div>
        ))}

        {isThinking && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="px-4 py-2.5 rounded-2xl bg-slate-900 border border-slate-800 flex items-center gap-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" />
              <span className="text-xs text-slate-500">Analyzing...</span>
            </div>
          </div>
        )}
        <div ref={scrollRef} />
      </div>

      <div className="mt-4 flex items-center gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') send(); }}
          placeholder="Ask about your audit findings..."
          className="flex-1 px-4 py-3 rounded-2xl bg-[#0B0F19] border border-slate-800 text-slate-200 text-sm focus:outline-none focus:border-cyan-500"
        />
        <button
          onClick={() => send()}
          disabled={isThinking || !input.trim()}
          className="p-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-lg shadow-cyan-500/25 disabled:opacity-50 transition-all"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
