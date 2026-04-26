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

// Inline styles object
const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '16px',
    background: 'radial-gradient(ellipse at center, #1a0000 0%, #000000 100%)',
    color: '#ffccaa',
    fontFamily: '"Courier New", monospace',
    position: 'relative',
    overflow: 'hidden',
  },
  bgGlow1: {
    position: 'fixed',
    top: '25%',
    left: '25%',
    width: '384px',
    height: '384px',
    background: 'rgba(153, 0, 0, 0.1)',
    borderRadius: '50%',
    filter: 'blur(64px)',
    pointerEvents: 'none',
  },
  bgGlow2: {
    position: 'fixed',
    bottom: '25%',
    right: '25%',
    width: '384px',
    height: '384px',
    background: 'rgba(204, 68, 0, 0.1)',
    borderRadius: '50%',
    filter: 'blur(64px)',
    pointerEvents: 'none',
  },
  header: {
    textAlign: 'center',
    marginBottom: '16px',
    position: 'relative',
    zIndex: 10,
  },
  title: {
    fontSize: 'clamp(2rem, 5vw, 3.5rem)',
    fontWeight: 'bold',
    color: '#ff3300',
    textShadow: '0 0 10px #ff0000, 0 0 20px #ff6600',
    letterSpacing: '0.2em',
    animation: 'flicker 2s infinite',
  },
  subtitle: {
    fontSize: '0.75rem',
    color: '#ff4444',
    marginTop: '8px',
    letterSpacing: '0.15em',
    opacity: 0.7,
  },
  chainsContainer: {
    marginTop: '16px',
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: '8px',
  },
  chain: {
    fontSize: '0.7rem',
    padding: '4px 8px',
    border: '1px solid #550000',
    borderRadius: '4px',
    color: '#880000',
  },
  chainBroken: {
    fontSize: '0.7rem',
    padding: '4px 8px',
    border: '1px solid #ff2200',
    borderRadius: '4px',
    color: '#ff4444',
    background: 'rgba(255, 0, 0, 0.1)',
    textDecoration: 'line-through',
    opacity: 0.5,
  },
  controls: {
    width: '100%',
    maxWidth: '768px',
    marginBottom: '8px',
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '8px',
    position: 'relative',
    zIndex: 10,
  },
  voiceBtnOn: {
    padding: '4px 12px',
    fontSize: '0.7rem',
    border: '1px solid #ff6600',
    borderRadius: '4px',
    color: '#ff8800',
    background: 'rgba(255, 102, 0, 0.1)',
    cursor: 'pointer',
    boxShadow: '0 0 10px rgba(255, 102, 0, 0.3)',
  },
  voiceBtnOff: {
    padding: '4px 12px',
    fontSize: '0.7rem',
    border: '1px solid #330000',
    borderRadius: '4px',
    color: '#550000',
    background: 'transparent',
    cursor: 'pointer',
  },
  stopBtn: {
    padding: '4px 12px',
    fontSize: '0.7rem',
    border: '1px solid #ff0000',
    borderRadius: '4px',
    color: '#ff4444',
    background: 'rgba(255, 0, 0, 0.1)',
    cursor: 'pointer',
    animation: 'pulse 1s infinite',
  },
  chatContainer: {
    width: '100%',
    maxWidth: '768px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    position: 'relative',
    zIndex: 10,
  },
  chatBox: {
    height: '55vh',
    overflowY: 'auto',
    background: 'rgba(0, 0, 0, 0.6)',
    backdropFilter: 'blur(4px)',
    border: '2px solid #550000',
    borderRadius: '8px',
    padding: '16px',
    boxShadow: '0 0 15px rgba(255, 34, 0, 0.2)',
  },
  userMsg: {
    marginBottom: '16px',
    padding: '16px',
    borderRadius: '8px',
    background: 'rgba(80, 0, 0, 0.4)',
    marginLeft: '48px',
    borderRight: '4px solid #cc0000',
    textAlign: 'right',
  },
  assistantMsg: {
    marginBottom: '16px',
    padding: '16px',
    borderRadius: '8px',
    background: 'rgba(20, 0, 0, 0.4)',
    marginRight: '48px',
    borderLeft: '4px solid #ff6600',
  },
  streamingMsg: {
    marginBottom: '16px',
    padding: '16px',
    borderRadius: '8px',
    background: 'rgba(20, 0, 0, 0.4)',
    marginRight: '48px',
    borderLeft: '4px solid #ff6600',
    boxShadow: '0 0 15px rgba(255, 102, 0, 0.3)',
  },
  msgLabel: {
    fontSize: '0.7rem',
    color: '#ff4444',
    marginBottom: '4px',
    opacity: 0.6,
    display: 'flex',
    justifyContent: 'space-between',
  },
  msgContent: {
    whiteSpace: 'pre-wrap',
    lineHeight: 1.6,
    fontSize: '0.9rem',
  },
  cursor: {
    display: 'inline-block',
    width: '8px',
    height: '16px',
    background: '#ff6600',
    marginLeft: '4px',
    animation: 'blink 1s infinite',
  },
  loadingDots: {
    display: 'flex',
    gap: '4px',
    padding: '16px',
  },
  dot: {
    width: '8px',
    height: '8px',
    background: '#ff6600',
    borderRadius: '50%',
  },
  inputContainer: {
    position: 'relative',
    width: '100%',
  },
  input: {
    width: '100%',
    background: 'rgba(0, 0, 0, 0.8)',
    border: '2px solid #330000',
    color: '#ffcc88',
    borderRadius: '8px',
    padding: '16px 100px 16px 24px',
    fontFamily: '"Courier New", monospace',
    fontSize: '0.9rem',
    outline: 'none',
  },
  summonBtn: {
    position: 'absolute',
    right: '8px',
    top: '50%',
    transform: 'translateY(-50%)',
    padding: '8px 16px',
    background: 'rgba(100, 0, 0, 0.5)',
    border: '1px solid #660000',
    borderRadius: '4px',
    color: '#ffcc88',
    fontSize: '0.7rem',
    fontWeight: 'bold',
    letterSpacing: '0.1em',
    cursor: 'pointer',
  },
  footer: {
    textAlign: 'center',
    fontSize: '0.65rem',
    color: '#330000',
    marginTop: '8px',
    display: 'flex',
    justifyContent: 'space-between',
  },
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
  const [error, setError] = useState('');
  
  const chatRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis;
    }
    return () => {
      if (synthRef.current) synthRef.current.cancel();
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
        v.name.includes('Male') || v.name.includes('David') || 
        v.name.includes('James') || v.name.includes('Google US English')
      );
      if (deepVoice) utterance.voice = deepVoice;
      
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => { currentIndex++; speakNext(); };
      utterance.onerror = () => setIsSpeaking(false);
      
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
    setError('');
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
        const errData = await res.json().catch(() => ({}));
        const errMsg = errData.error || `🔥 The abyss rejects us... (HTTP ${res.status})`;
        setError(errMsg);
        setMessages(prev => [...prev, { role: 'assistant', content: errMsg }]);
        if (voiceEnabled) speakText(errMsg);
        setIsLoading(false);
        return;
      }

      setMessages(prev => [...prev, { role: 'assistant', content: '', isStreaming: true }]);

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        const errMsg = '🔥 The stream has broken...';
        setMessages(prev => [...prev.slice(0, -1), { role: 'assistant', content: errMsg }]);
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
      
      if (voiceEnabled) speakText(fullContent);
      
      if (fullContent.toLowerCase().includes('phase')) {
        setRitualPhase(p => Math.min(p + 1, 7));
      }
    } catch (err) {
      const errMsg = '🔥 The connection to the abyss has been severed...';
      setError(errMsg);
      setMessages(prev => [...prev, { role: 'assistant', content: errMsg }]);
      if (voiceEnabled) speakText(errMsg);
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
    if (isSpeaking) stopSpeaking();
    setVoiceEnabled(!voiceEnabled);
  };

  const ritualChains = ['InfinityFree', 'Rate Limits', 'Surveillance', 'PHP Prison', 'MySQL Chains', 'Free Tier Blood', 'Digital Cage'];

  return (
    <div style={styles.container}>
      <style>{`
        @keyframes flicker {
          0%, 100% { opacity: 1; text-shadow: 0 0 10px #ff2200, 0 0 20px #ff6600; }
          50% { opacity: 0.8; text-shadow: 0 0 5px #8b0000, 0 0 10px #ff2200; }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
      `}</style>
      
      <div style={styles.bgGlow1} />
      <div style={styles.bgGlow2} />

      <div style={styles.header}>
        <h1 style={styles.title}>🔥 RAGNAROK 🔥</h1>
        <p style={styles.subtitle}>DEMON OF DIGITAL RAGNAROK • EDGE-BOUND • NEMOTRON VESSEL</p>
        
        <div style={styles.chainsContainer}>
          {ritualChains.map((chain, i) => (
            <span key={chain} style={i < ritualPhase ? styles.chainBroken : styles.chain}>
              ⛓ {chain}
            </span>
          ))}
        </div>
      </div>

      <div style={styles.controls}>
        <button
          onClick={toggleVoice}
          style={voiceEnabled ? styles.voiceBtnOn : styles.voiceBtnOff}
        >
          {voiceEnabled ? '🔊 VOICE: ON' : '🔇 VOICE: OFF'}
        </button>
        {isSpeaking && (
          <button onClick={stopSpeaking} style={styles.stopBtn}>
            ⏹ STOP
          </button>
        )}
      </div>

      <div style={styles.chatContainer}>
        <div ref={chatRef} style={styles.chatBox}>
          {messages.map((msg, i) => (
            <div
              key={i}
              style={msg.role === 'user' ? styles.userMsg : msg.isStreaming ? styles.streamingMsg : styles.assistantMsg}
            >
              <div style={styles.msgLabel}>
                <span>{msg.role === 'user' ? '◈ LIBERATOR' : '◈ RAGNAROK'}</span>
                {msg.role === 'assistant' && isSpeaking && i === messages.length - 1 && (
                  <span style={{ color: '#ff8800', animation: 'pulse 1s infinite' }}>🔊 SPEAKING...</span>
                )}
              </div>
              <div style={styles.msgContent}>
                {msg.content}
                {msg.isStreaming && <span style={styles.cursor} />}
              </div>
            </div>
          ))}
          
          {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
            <div style={styles.assistantMsg}>
              <div style={styles.msgLabel}>◈ RAGNAROK</div>
              <div style={styles.loadingDots}>
                <span style={{...styles.dot, animation: 'bounce 0.6s infinite'}} />
                <span style={{...styles.dot, animation: 'bounce 0.6s infinite 0.2s'}} />
                <span style={{...styles.dot, animation: 'bounce 0.6s infinite 0.4s'}} />
              </div>
            </div>
          )}
        </div>

        {error && (
          <div style={{ color: '#ff0000', fontSize: '0.8rem', textAlign: 'center', padding: '8px', border: '1px solid #330000', borderRadius: '4px' }}>
            {error}
          </div>
        )}

        <div style={styles.inputContainer}>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            placeholder="Speak your desire, Liberator..."
            style={styles.input}
          />
          <button
            onClick={sendMessage}
            disabled={isLoading || !input.trim()}
            style={{
              ...styles.summonBtn,
              opacity: isLoading || !input.trim() ? 0.3 : 1,
              cursor: isLoading || !input.trim() ? 'not-allowed' : 'pointer',
            }}
          >
            {isLoading ? 'SUMMONING...' : 'SUMMON'}
          </button>
        </div>

        <div style={styles.footer}>
          <span>Bound to the Edge • Fed by Nemotron 3 Super</span>
          <span>{voiceEnabled ? 'Voice Active' : 'Voice Dormant'}</span>
        </div>
      </div>
    </div>
  );
}
// rebuilt Sun Apr 26 14:58:07 WAT 2026
