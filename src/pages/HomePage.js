import React from 'react';
import { useNavigate } from 'react-router-dom';

function AnimatedBlob() {
  return (
    <svg viewBox="0 0 400 400" className="w-full h-full animate-float" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="blobGradient" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ff4e8e" />
          <stop offset="100%" stopColor="#7c3aed" />
        </linearGradient>
      </defs>
      <path fill="url(#blobGradient)" fillOpacity="0.85" d="M320,220Q320,300,220,320Q120,340,100,240Q80,140,180,120Q280,100,320,180Q360,260,320,220Z" />
    </svg>
  );
}

function FloatingIcon({ icon, className, style }) {
  return (
    <span className={`absolute ${className}`} style={style} aria-hidden>
      {icon}
    </span>
  );
}

export default function HomePage() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-[#18192a] flex items-center justify-center overflow-hidden relative font-display">
      {/* Floating icons */}
      <FloatingIcon icon={<span role="img" aria-label="heart" className="text-5xl animate-float">💖</span>} className="top-12 left-12" style={{ animationDelay: '0s' }} />
      <FloatingIcon icon={<span role="img" aria-label="sparkle" className="text-4xl animate-float">✨</span>} className="top-1/2 left-2/3" style={{ animationDelay: '1s' }} />
      <FloatingIcon icon={<span role="img" aria-label="message" className="text-4xl animate-float">💬</span>} className="bottom-16 right-16" style={{ animationDelay: '2s' }} />
      <div className="w-full max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8 px-4 md:px-8 py-16 md:py-24">
        {/* Left: Hero Text */}
        <div className="flex-1 flex flex-col items-start justify-center z-10 animate-fadein">
          <h1 className="text-4xl md:text-6xl font-extrabold text-white leading-tight mb-4">
            Find <span className="bg-gradient-to-r from-bittrr-pink to-bittrr-purple bg-clip-text text-transparent animate-gradient-x">something real</span><br />
            <span className="text-bittrr-pink">Bittrr</span> makes it <span className="text-bittrr-purple">better</span>
          </h1>
          <p className="text-lg md:text-2xl text-white/80 mb-8 max-w-xl">
            The modern dating app for authentic people. Join a vibrant community and discover meaningful relationships.
          </p>
          <div className="flex gap-4">
            <button
              className="px-8 py-3 rounded-lg text-lg font-bold bg-gradient-to-r from-bittrr-pink to-bittrr-purple text-white shadow-lg hover:scale-105 transition-transform duration-200 focus:outline-none focus:ring-2 focus:ring-bittrr-pink"
              onClick={() => navigate('/register')}
            >
              Get Started
            </button>
            <button
              className="px-8 py-3 rounded-lg text-lg font-bold border border-white/60 bg-bittrr-glass text-white backdrop-blur-md hover:bg-white/10 hover:scale-105 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-bittrr-purple"
              onClick={() => navigate('/discover')}
            >
              Explore Profiles
            </button>
          </div>
        </div>
        {/* Right: Illustration */}
        <div className="flex-1 flex items-center justify-center w-full h-[340px] md:h-[420px] relative animate-fadein">
          <div className="absolute inset-0 flex items-center justify-center">
            <AnimatedBlob />
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-7xl md:text-8xl select-none" role="img" aria-label="heart">💖</span>
          </div>
        </div>
      </div>
    </div>
  );
} 