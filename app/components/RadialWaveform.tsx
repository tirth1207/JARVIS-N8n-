import React, { useState, useEffect } from 'react';

function RandomColor() {
    const [color, setColor] = useState('white');

    useEffect(() => {
      const generateRandomColor = () => {
        const r = Math.floor(Math.random() * 256);
        const g = Math.floor(Math.random() * 256);
        const b = Math.floor(Math.random() * 256);
        setColor(`rgb(${r}, ${g}, ${b})`);
      };
      generateRandomColor();
    }, []);

    return color;
}

const AIOrb = ({ isListening = false, isSpeaking = false }) => {
  const [audioLevel, setAudioLevel] = useState(0);
  const [randomSeed, setRandomSeed] = useState(0);
    
  // Simulate audio level changes and random pattern updates
  useEffect(() => {
    let interval;
    if (isListening || isSpeaking) {
      interval = setInterval(() => {
        setAudioLevel(Math.random() * 100);
        setRandomSeed(Math.random() * 360);
      }, 200);
    } else {
      setAudioLevel(0);
      const slowInterval = setInterval(() => {
        setRandomSeed(Math.random() * 360);
      }, 1000);
      return () => clearInterval(slowInterval);
    }
    return () => clearInterval(interval);
  }, [isListening, isSpeaking]);
  // Two-color palette - you can customize these
  const color1 = RandomColor(); // emerald green
  const color2 = RandomColor(); // pink

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {/* Outer glow ring */}
      <div 
        className={`absolute inset-0 m-auto w-52 h-52 rounded-full transition-all duration-3000 `}
        style={{
          transform: `scale(${1 + (audioLevel / 400)})`,
          boxShadow: `0 0 ${20 + audioLevel/5}px ${isListening || isSpeaking ? 'rgba(16, 185, 129, 0.6)' : 'rgba(16, 185, 129, 0.3)'}`,
        }}
      />
      
      {/* Main orb */}
      <div 
        className="relative w-50 h-50 rounded-full overflow-hidden"
      >
        {/* Base gradient background */}
        <div 
          className="absolute inset-0"
          style={{
            background: `conic-gradient(
              from ${Date.now() * 0.001 + randomSeed}deg,
              ${color1} 0%,
              ${color2} 50%,
              ${color1} 100%
            )`,
            animation: (isListening || isSpeaking) ? 'spin 3s linear infinite' : 'spin 8s linear infinite',
          }}
        />
        
        {/* Random organic shapes overlay */}
        <div className="absolute inset-0">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full"
              style={{
                width: `${30 + (randomSeed + i * 20) % 40}%`,
                height: `${30 + (randomSeed + i * 15) % 40}%`,
                background: `radial-gradient(circle, ${i % 2 === 0 ? color1 : color2}66, transparent 70%)`,
                left: `${10 + (randomSeed + i * 30) % 60}%`,
                top: `${10 + (randomSeed + i * 25) % 60}%`,
                transform: `rotate(${i * 60 + randomSeed}deg) scale(${0.7 + (audioLevel / 300)})`,
                opacity: (isListening || isSpeaking) ? 0.8 : 0.5,
                transition: 'all 0.3s ease-out',
              }}
            />
          ))}
        </div>
        
        {/* Flowing liquid effect */}
        <div 
          className="absolute inset-0 rounded-full"
          style={{
            background: `radial-gradient(
              ellipse ${60 + audioLevel/3}% ${40 + audioLevel/4}% at ${30 + (randomSeed % 40)}% ${30 + ((randomSeed * 1.5) % 40)}%,
              ${color1}44 0%,
              transparent 50%
            ), radial-gradient(
              ellipse ${40 + audioLevel/4}% ${60 + audioLevel/3}% at ${70 - (randomSeed % 40)}% ${70 - ((randomSeed * 1.2) % 40)}%,
              ${color2}44 0%,
              transparent 50%
            )`,
            transform: `rotate(${-randomSeed}deg)`,
            transition: 'all 0.5s ease-out',
          }}
        />
        
        {/* Dynamic noise texture */}
        <div 
          className="absolute inset-0 rounded-full opacity-30"
          style={{
            background: `repeating-conic-gradient(
              from ${randomSeed}deg,
              transparent 0deg,
              ${color1}22 ${2 + (audioLevel/50)}deg,
              transparent ${4 + (audioLevel/25)}deg,
              ${color2}22 ${6 + (audioLevel/30)}deg,
              transparent ${8 + (audioLevel/40)}deg
            )`,
            transform: `scale(${0.9 + (audioLevel / 500)})`,
          }}
        />
      </div>
      
      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default AIOrb;
