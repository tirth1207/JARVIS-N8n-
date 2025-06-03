'use client';

import { useState, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import AIOrb from '@/app/components/RadialWaveform';


export default function Home() {
  const [message, setMessage] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const [speaking, setSpeaking] = useState(false);

  const speak = (text: string) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => setSpeaking(false);
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
      speak(data.response);
    } catch (err) {
      setResponse('❌ Error connecting to n8n.');
    } finally {
      setLoading(false);
      setMessage('');
    }
  };

  const handleMicClick = () => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      alert('🎙️ Speech recognition is not supported in this browser.');
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!recognitionRef.current) {
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-IN';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setMessage(transcript);
        setListening(false);
      };

      recognition.onerror = () => setListening(false);
      recognition.onend = () => setListening(false);

      recognitionRef.current = recognition;
    }

    setListening(true);
    recognitionRef.current.start();
  };

  return (
    <main className="relative min-h-screen flex flex-col items-center justify-center space-y-6 p-6">
      <div className="grid grid-cols-1 gap-4">
        <div className="flex h-60 w-full items-center justify-center ">
          <AIOrb isListening={listening} isSpeaking={speaking} />
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
            className={listening ? 'bg-green-500' : ''}
            disabled={listening}
          >
            {listening ? '🎙️ Listening...' : '🎤'}
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
