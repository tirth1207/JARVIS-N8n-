'use client';

import { useState, useRef, useEffect } from 'react';
import { Orb } from "@/app/components/RadialWaveform";
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import NoteGraph from './components/Graphview';

export default function Home() {
  const [message, setMessage] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'speaking' | 'listening' | 'idle'>('idle');
  const recognitionRef = useRef<any>(null);
  const [refresh, setRefresh] = useState(false);
  const autoSendRef = useRef(false); // 👈 Flag to auto-send after speech recognition

  const speak = (text: string) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.onstart = () => setStatus('speaking');
    utterance.onend = () => setStatus('idle');
    speechSynthesis.speak(utterance);
  };

  const handleSend = async () => {
    // if (!message.trim()) return;

    setLoading(true);
    try {
      const res = await fetch('/api/webhook', {
        method: 'POST',
        body: JSON.stringify({ message }),
      });
      const data = await res.json();
      setResponse(data.response);
      setRefresh(prev => !prev);
      speak(data.response);
    } catch (err) {
      setResponse('❌ Error connecting to n8n.');
    } finally {
      setLoading(false);
      setMessage('');
    }
  };

  const handleMicClick = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('🎙️ Speech recognition is not supported in this browser.');
      return;
    }

    if (!recognitionRef.current) {
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-IN';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        autoSendRef.current = true; // 👈 Flag to auto-send
        setMessage(transcript);     // 👈 Triggers useEffect
        setStatus('idle');
      };

      recognition.onerror = () => setStatus('idle');
      recognition.onend = () => setStatus('idle');

      recognitionRef.current = recognition;
    }

    setStatus('listening');
    recognitionRef.current.start();
  };

  // 👇 Auto-send message after speech recognition updates the message
  useEffect(() => {
    if (autoSendRef.current && message.trim()) {
      autoSendRef.current = false;
      handleSend();
    }
  }, [message]);

  return (
    <div className="flex min-h-screen">
      <div className='w-full'>
        <NoteGraph refresh={refresh} setRefresh={setRefresh}/>
      </div>
      {/* Main Section */}
      <aside className="flex flex-col w-full lg:w-[400px] bg-gray-900 text-white items-center justify-between">
        {/* Orb */}
        <div className="mt-8">
          <div className="w-40 h-40 flex items-center justify-center">
            <Orb status={status} />
          </div>
        </div>

        {/* Response */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 w-full">
          {response && (
            <div className="bg-gray-700 p-4 rounded-xl shadow-md w-fit max-w-md self-start text-white">
              <p>{response}</p>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="sticky bottom-0 bg-gray-800 p-4 w-full flex items-center gap-2">
          <Input
            placeholder="Type your message or use the mic..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="flex-1 bg-gray-700 text-white border-none"
            disabled={loading || status === 'listening'}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !loading && status !== 'listening' && message.trim()) {
                e.preventDefault();
                handleSend();
              }
            }}
          />
          <Button
            onClick={handleMicClick}
            className={`transition-all duration-300 ${status === 'listening' ? 'bg-green-500 text-white' : ''}`}
            disabled={status === 'listening'}
          >
            {status === 'listening' ? '🎙️ Listening...' : '🎤'}
          </Button>
          {/* <Button
            onClick={handleSend}
            disabled={loading || !message.trim()}
            className="ml-2"
          >
            {loading ? 'Thinking...' : 'Send'}
          </Button> */}
        </div>
      </aside>
    </div>
  );
}


