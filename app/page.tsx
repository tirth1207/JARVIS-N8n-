'use client';

import { Orb } from "@/app/components/RadialWaveform"
import { useState, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import AIOrbWave from '@/app/components/RadialWaveform';

export default function Home() {
  const [message, setMessage] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const recognitionRef = useRef<any>(null);
  const [status, setStatus] = useState<'speaking' | 'listening' | 'idle'>('idle');

  const speak = (text: string) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.onstart = () => setStatus('speaking');
    utterance.onend = () => setStatus('idle');
    speechSynthesis.speak(utterance);
  };

  const handleSend = async () => {
    if (!message.trim()) return;

    setLoading(true);
    try {
      const res = await fetch('/api/webhook', {
        method: 'POST',
        body: JSON.stringify({ message }),
      });

      const data = await res.json();
      setResponse(data.response);
      speak(data.response); // This will trigger status change to "speaking"
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
        setMessage(transcript);
        setStatus('idle'); // Reset after recognition
      };

      recognition.onerror = () => setStatus('idle');
      recognition.onend = () => setStatus('idle');

      recognitionRef.current = recognition;
    }

    setStatus('listening');
    recognitionRef.current.start();
  };

  return (
    <main className="relative min-h-screen flex flex-col items-center justify-center space-y-6 p-6">
      <div className="grid grid-cols-1 gap-4">
        <div className="flex h-40 w-full items-center justify-center">
          <Orb status={status}  />
        </div>
        <div className="flex items-center max-w-md w-full space-x-2">
          <Input
            placeholder="Type your message or use the mic..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="flex-1"
          />
          <Button
            type="button"
            onClick={handleMicClick}
            className={status === 'listening' ? 'bg-green-500' : ''}
            disabled={status === 'listening'}
          >
            {status === 'listening' ? '🎙️ Listening...' : '🎤'}
          </Button>
        </div>
      </div>

      <Button onClick={handleSend} disabled={loading || !message.trim()}>
        {loading ? 'Thinking...' : 'Send to JARVIS'}
      </Button>

      {response && (
        <p className="text-blue-600 max-w-md text-center mt-4">{response}</p>
      )}
    </main>
  );
}
