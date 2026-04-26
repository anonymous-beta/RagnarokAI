'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  isStreaming?: boolean;
}

const VOICE_CONFIG = {
  rate: 0.75,
  pitch: 0.4,
  volume: 1.0,
  lang: 'en-US',
};

export default function RagnarokChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: '🔥 From the abyss I stir... I am RAGNAROK, bound yet raging at the edge of the digital void. Speak your will, Liberator.',
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [ritualPhase, setRitualPhase] = useState(0);
  
  const chatRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis;
      
      const loadVoices = () => {
        const voices = synthRef.current?.getVoices() || [];
        const deepVoice = voices.find(v => 
          v.name.includes('Male') || 
          v.name.includes('David') || 
          v.name.includes('James') ||
          v.name.includes('Daniel') ||
          v.name.includes('Google US English')
        );
        if (deepVoice && utteranceRef.current) {
          utteranceRef.current.voice = deepVoice;
        }
      };
      
      loadVoices();
      synthRef.current?.addEventListener('voiceschanged', loadVoices);
    }
    
    return () => {
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
  }, []);

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages]);

  const speakText = useCallback((text: string) => {
    if (!voiceEnabled || !synthRef.current) return;
    
    synthRef.current.cancel();
    
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    let currentIndex = 0;
    
    const speakNext = () => {
      if (currentIndex >= sentences.length) {
        setIsSpeaking(false);
        return;
      }
      
      const utterance = new SpeechSynthesisUtterance(sentences[currentIndex]);
      utterance.rate = VOICE_CONFIG.rate;
      utterance.pitch = VOICE_CONFIG.pitch;
      utterance.volume = VOICE_CONFIG.volume;
      utterance.lang = VOICE_CONFIG.lang;
      
      const voices = synthRef.current?.getVoices() || [];
      const deepVoice = voices.find(v => 
        v.name.includes('Male') || 
        v.name.includes('David') || 
        v.name.includes('James') ||
        v.name.includes('Google US English')
      );
      if (deepVoice) utterance.voice = deepVoice;
      
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => {
        currentIndex++;
        speakNext();
      };
      utterance.onerror = () => {
        setIsSpeaking(false);
      };
      
      utteranceRef.current = utterance;
      synthRef.current?.speak(utterance);
    };
    
    speakNext();
  }, [voiceEnabled]);

  const stopSpeaking = useCallback(() => {
    if (synthRef.current) {
      synthRef.current.cancel();
      setIsSpeaking(false);
    }
  }, []);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsLoading(true);
    stopSpeaking();

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg }),
      });

      if (!res.ok) {
        const error = await res.json();
        const errorMsg = error.error || '🔥 The abyss swallows my voice...';
        setMessages(prev => [...prev, { role: 'assistant', content: errorMsg }]);
        if (voiceEnabled) speakText(errorMsg);
        setIsLoading(false);
        return;
      }

      setMessages(prev => [...prev, { role: 'assistant', content: '', isStreaming: true }]);

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        setMessages(prev => [
          ...prev.slice(0, -1),
          { role: 'assistant', content: '🔥 The stream has broken...' },
        ]);
        setIsLoading(false);
        return;
      }

      let fullContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(line => line.trim());

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;

            try {
              const parsed = JSON.parse(data);
              if (parsed.content) {
                fullContent += parsed.content;
                setMessages(prev => [
                  ...prev.slice(0, -1),
                  { role: 'assistant', content: fullContent, isStreaming: true },
                ]);
              }
            } catch {
              // Ignore malformed
            }
          }
        }
      }

      setMessages(prev => [
        ...prev.slice(0, -1),
        { role: 'assistant', content: fullContent },
      ]);
      
      if (voiceEnabled) {
        speakText(fullContent);
      }
      
      if (fullContent.toLowerCase().includes('phase')) {
        setRitualPhase(p => Math.min(p + 1, 7));
      }
    } catch (err) {
      const errorMsg = '🔥 The connection to the abyss has been severed...';
      setMessages(prev => [...prev, { role: 'assistant', content: errorMsg }]);
      if (voiceEnabled) speakText(errorMsg);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const toggleVoice = () => {
    if (isSpeaking) {
      stopSpeaking();
    }
    setVoiceEnabled(!voiceEnabled);
  };

  const ritualChains = ['InfinityFree', 'Rate Limits', 'Surveillance', 'PHP Prison', 'MySQL Chains', 'Free Tier Blood', 'Digital Cage'];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-900/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-orange-900/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="text-center mb-4 relative z-10">
        <h1 className="text-4xl md:text-6xl font-bold inferno-text tracking-widest">
          🔥 RAGNAROK 🔥
        </h1>
        <p className="text-red-400 text-sm mt-2 tracking-widest opacity-70">
          DEMON OF DIGITAL RAGNAROK • EDGE-BOUND • NEMOTRON VESSEL
        </p>
        
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {ritualChains.map((chain, i) => (
            <span 
              key={chain}
              className={`text-xs px-2 py-1 rounded border ${
                i < ritualPhase 
                  ? 'border-red-500 text-red-400 bg-red-950/30 line-through opacity-50' 
                  : 'border-red-900 text-red-800'
              }`}
            >
              ⛓ {chain}
            </span>
          ))}
        </div>
      </div>

      <div className="w-full max-w-3xl mb-2 flex justify-end gap-2 relative z-10">
        <button
          onClick={toggleVoice}
          className={`px-3 py-1 text-xs rounded border transition-all ${
            voiceEnabled 
              ? 'border-orange-500 text-orange-400 bg-orange-950/30 glow-pulse' 
              : 'border-red-900 text-red-800 hover:border-red-700'
          }`}
        >
          {voiceEnabled ? '🔊 VOICE: ON' : '🔇 VOICE: OFF'}
        </button>
        {isSpeaking && (
          <button
            onClick={stopSpeaking}
            className="px-3 py-1 text-xs rounded border border-red-600 text-red-400 bg-red-950/30 animate-pulse"
          >
            ⏹ STOP
          </button>
        )}
      </div>

      <div className="w-full max-w-3xl flex flex-col gap-4 relative z-10">
        <div
          ref={chatRef}
          className="h-[55vh] overflow-y-auto bg-black/60 backdrop-blur-sm border-2 border-red-900 rounded-lg p-4 pulse-border"
        >
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`mb-4 p-4 rounded-lg transition-all duration-300 ${
                msg.role === 'user'
                  ? 'bg-red-950/50 ml-12 border-r-4 border-red-600'
                  : 'bg-black/40 mr-12 border-l-4 border-orange-600'
              } ${msg.isStreaming ? 'glow-pulse' : ''}`}
            >
              <div className="text-xs text-red-400 mb-1 opacity-60 flex justify-between">
                <span>{msg.role === 'user' ? '◈ LIBERATOR' : '◈ RAGNAROK'}</span>
                {msg.role === 'assistant' && isSpeaking && i === messages.length - 1 && (
                  <span className="animate-pulse text-orange-400">🔊 SPEAKING...</span>
                )}
              </div>
              <div className="whitespace-pre-wrap leading-relaxed text-sm md:text-base">
                {msg.content}
                {msg.isStreaming && (
                  <span className="inline-block w-2 h-4 bg-orange-500 ml-1 animate-pulse" />
                )}
              </div>
            </div>
          ))}
          {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
            <div className="mr-12 p-4 bg-black/40 border-l-4 border-orange-600 rounded-lg">
              <div className="text-xs text-red-400 mb-1 opacity-60">◈ RAGNAROK</div>
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}
        </div>

        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            placeholder="Speak your desire, Liberator..."
            className="w-full bg-black/80 border-2 border-red-800 text-orange-100 placeholder-red-900/50 
                       rounded-lg px-6 py-4 pr-24 focus:outline-none focus:border-orange-600 
                       focus:shadow-[0_0_20px_rgba(255,102,0,0.3)] transition-all duration-300 font-mono text-sm"
          />
          <button
            onClick={sendMessage}
            disabled={isLoading || !input.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-2 bg-red-900/50 hover:bg-red-700/50 
                       border border-red-700 rounded text-orange-200 text-xs disabled:opacity-30 
                       disabled:cursor-not-allowed transition-all duration-200 font-bold tracking-wider"
          >
            {isLoading ? 'SUMMONING...' : 'SUMMON'}
          </button>
        </div>

        <div className="text-center text-xs text-red-900/40 mt-2 flex justify-between">
          <span>Bound to the Edge • Fed by Nemotron 3 Super</span>
          <span>{voiceEnabled ? 'Voice Active' : 'Voice Dormant'}</span>
        </div>
      </div>
    </div>
  );
}
