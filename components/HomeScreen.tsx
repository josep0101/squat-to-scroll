import React, { useState, useEffect } from 'react';
import { Dumbbell, Settings, Flame, Link as LinkIcon, ChevronDown, ArrowRight, Loader2 } from 'lucide-react';
import { ChallengeData } from '../types';
import { SoundFX } from '../utils/audio';
import { preloadMediaPipe, subscribeToStatus, MediaPipeStatus } from '../utils/mediapipe-service';

interface HomeScreenProps {
  onStart: (data: ChallengeData) => void;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ onStart }) => {
  const [website, setWebsite] = useState('instagram.com');
  const [duration, setDuration] = useState(5);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [aiStatus, setAiStatus] = useState<MediaPipeStatus>('idle');

  // Preload MediaPipe AI when component mounts
  useEffect(() => {
    preloadMediaPipe();
    const unsubscribe = subscribeToStatus(setAiStatus);
    return unsubscribe;
  }, []);

  // Check for 'target' query param (from Chrome Extension redirect)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const targetUrl = params.get('target');
    if (targetUrl) {
      try {
        const hostname = new URL(targetUrl).hostname;
        setWebsite(hostname.replace('www.', ''));
      } catch (e) {
        setWebsite(targetUrl);
      }
    }
  }, []);

  const handleStart = () => {
    SoundFX.playStart(); // Play start sound
    setIsTransitioning(true);
    // Delay actual state change to allow animation to play
    setTimeout(() => {
      onStart({
        website,
        duration,
        squatsRequired: 10 // Fixed for demo, normally calculated based on duration
      });
    }, 600);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setWebsite(e.target.value);
  };

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    SoundFX.playClick();
    setDuration(Number(e.target.value));
  };

  const squatsCost = duration === 5 ? 10 : duration === 10 ? 20 : duration * 2;

  return (
    <div className={`relative flex h-screen w-full flex-col overflow-hidden bg-gradient-to-b from-[#FF8C00] via-[#ae4641] to-[#4B0082] transition-transform duration-700 ease-in-out font-display ${isTransitioning ? 'transitioning' : ''}`}>

      {/* Animation Styles */}
      <style>{`
        .transitioning .ui-element {
            animation: fade-out 0.5s ease-out forwards;
        }
        .transitioning header.ui-element { animation-delay: 0ms; }
        .transitioning main.ui-element { animation-delay: 100ms; }
        .transitioning footer.ui-element { animation-delay: 200ms; }
      `}</style>

      {/* Header */}
      <header className="ui-element flex items-center justify-between p-6 z-20 transition-opacity duration-500 w-full max-w-7xl mx-auto">
        <div className="flex h-10 w-10 md:h-12 md:w-12 items-center justify-center rounded-full bg-white border-2 border-black shadow-neubrutalism-sm">
          <Dumbbell size={20} className="text-black md:scale-125" />
        </div>
        <div className="flex items-center gap-3">
          {/* AI Status Indicator */}
          <div className={`flex items-center gap-2 rounded-full px-3 py-2 backdrop-blur-sm border transition-all duration-300 ${aiStatus === 'ready'
              ? 'bg-green-500/20 border-green-400/50'
              : aiStatus === 'loading'
                ? 'bg-yellow-500/20 border-yellow-400/50'
                : 'bg-black/20 border-white/20'
            }`}>
            {aiStatus === 'loading' && <Loader2 size={14} className="text-yellow-300 animate-spin" />}
            {aiStatus === 'ready' && <div className="w-2 h-2 rounded-full bg-green-400"></div>}
            {aiStatus === 'idle' && <div className="w-2 h-2 rounded-full bg-white/50"></div>}
            <span className="text-xs font-bold text-white/80 uppercase tracking-wide">
              {aiStatus === 'ready' ? 'AI Ready' : aiStatus === 'loading' ? 'Loading AI...' : 'AI'}
            </span>
          </div>
          <div className="flex items-center gap-2 rounded-full bg-black/20 px-4 py-2 backdrop-blur-sm border border-white/20 hover:bg-black/30 transition-colors cursor-default">
            <Flame size={20} className="text-[#ff8c00] fill-[#ff8c00] animate-pulse" />
            <span className="text-sm font-bold text-white tracking-wide">3 DAY STREAK</span>
          </div>
        </div>
        <button
          onClick={() => SoundFX.playClick()}
          className="flex h-10 w-10 md:h-12 md:w-12 items-center justify-center rounded-full bg-white border-2 border-black shadow-neubrutalism-sm cursor-pointer hover:bg-gray-100 transition-colors"
        >
          <Settings size={20} className="text-black md:scale-125" />
        </button>
      </header>

      {/* Main Content - Responsive Split Layout */}
      <main className="ui-element flex-1 w-full max-w-7xl mx-auto z-10 transition-opacity duration-500 flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16 px-6 pb-6">

        {/* Left Col: Typography */}
        <div className="text-center md:text-left md:flex-1">
          <h1 className="text-6xl md:text-8xl lg:text-9xl font-black text-white leading-[0.9] tracking-tighter drop-shadow-lg mb-4 md:mb-8">
            EARN<br />YOUR<br />SCROLL
          </h1>
          <p className="text-white/80 font-medium text-lg md:text-2xl max-w-md mx-auto md:mx-0">
            Sweat before you surf. The ultimate productivity locker for the modern web.
          </p>
        </div>

        {/* Right Col: Controls Card */}
        <div className="w-full max-w-md bg-white/10 backdrop-blur-lg border border-white/20 p-6 md:p-8 rounded-3xl shadow-xl flex flex-col gap-6 md:gap-8">

          {/* Target Website Input */}
          <div className="flex flex-col gap-2">
            <label className="ml-2 text-sm font-bold text-white tracking-wide uppercase">Target Website</label>
            <div className="relative flex w-full items-center rounded-2xl bg-white border-4 border-black shadow-neubrutalism transition-transform focus-within:-translate-y-1 focus-within:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
              <div className="pl-4 text-black">
                <LinkIcon size={24} />
              </div>
              <input
                className="flex-1 border-none bg-transparent p-4 text-lg font-bold text-black placeholder:text-gray-400 focus:ring-0 outline-none w-full min-w-0"
                placeholder="instagram.com"
                type="text"
                value={website}
                onChange={handleInputChange}
                onClick={() => SoundFX.init()} // Initialize audio ctx on first interaction
              />
              <div className="pr-4 hidden sm:block">
                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Duration Select */}
            <div className="flex flex-col gap-2">
              <label className="ml-2 text-sm font-bold text-white tracking-wide uppercase">Duration</label>
              <div className="relative h-full">
                <select
                  className="w-full h-full appearance-none rounded-2xl border-4 border-black bg-white p-4 pl-4 pr-10 text-lg font-bold text-black shadow-neubrutalism focus:ring-0 focus:outline-none focus:-translate-y-1 transition-transform cursor-pointer"
                  value={duration}
                  onChange={handleSelectChange}
                  onClick={() => SoundFX.init()}
                >
                  <option value="5">5 Mins</option>
                  <option value="10">10 Mins</option>
                  <option value="15">15 Mins</option>
                  <option value="30">30 Mins</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-black">
                  <ChevronDown size={24} />
                </div>
              </div>
            </div>

            {/* Cost Display */}
            <div className="flex flex-col gap-2">
              <label className="ml-2 text-sm font-bold text-white tracking-wide uppercase">Cost</label>
              <div className="flex h-full min-h-[68px] w-full items-center justify-center rounded-2xl border-4 border-black bg-[#ffcc00] shadow-neubrutalism transform hover:scale-105 transition-transform duration-300">
                <div className="flex flex-col items-center justify-center leading-none py-2">
                  <span className="text-3xl font-black text-black">{squatsCost}</span>
                  <span className="text-[10px] font-black text-black/70 tracking-widest uppercase mt-1">SQUATS</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Button */}
          <button
            className="group relative w-full overflow-hidden rounded-full bg-primary border-4 border-black p-5 shadow-neubrutalism active:shadow-none active:translate-x-1 active:translate-y-1 transition-all hover:brightness-110 cursor-pointer mt-2"
            onClick={handleStart}
          >
            <div className="absolute inset-0 w-full h-full bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.2)_50%,transparent_75%,transparent_100%)] bg-[length:250%_250%] bg-[position:-100%_0] hover:bg-[position:200%_0] transition-[background-position] duration-[1500ms] ease-in-out"></div>
            <div className="relative flex items-center justify-center gap-3">
              <span className="text-xl font-black text-white tracking-wider">START</span>
              <ArrowRight size={24} className="text-white font-bold group-hover:translate-x-1 transition-transform" />
            </div>
          </button>
          <p className="text-center text-xs font-medium text-white/60">
            Camera access required
          </p>
        </div>
      </main>

      {/* Footer / Background Ambience */}
      <div className="ui-element absolute top-1/4 left-0 -translate-x-1/2 h-64 w-64 rounded-full bg-white/5 blur-3xl z-0 pointer-events-none"></div>
      <div className="ui-element absolute bottom-0 right-0 translate-x-1/3 translate-y-1/3 h-96 w-96 rounded-full bg-[#ff8c00]/20 blur-3xl z-0 pointer-events-none"></div>
    </div>
  );
};

export default HomeScreen;