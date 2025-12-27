import React, { useEffect, useState } from 'react';
import { CheckCircle, X, Trophy, ArrowRight, Timer, PlusCircle, ExternalLink } from 'lucide-react';
import { ChallengeData } from '../types';
import { SoundFX } from '../utils/audio';

// Fix for missing chrome type definition
declare const chrome: any;

interface SuccessScreenProps {
  data: ChallengeData;
  onDoMore: () => void;
}

const SuccessScreen: React.FC<SuccessScreenProps> = ({ data, onDoMore }) => {
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  
  useEffect(() => {
    // Play unlock sound
    SoundFX.playUnlock();

    // Check query params for the original full URL (passed by background script)
    const params = new URLSearchParams(window.location.search);
    const target = params.get('target');
    if (target) {
        setOriginalUrl(target);
    }
  }, []);

  const handleProceed = async () => {
    SoundFX.playClick();
    
    // EXTENSION LOGIC: Save unlock state to chrome.storage
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        try {
            // Get current unlocks
            const result = await chrome.storage.local.get(['unlockedSites']);
            const currentUnlocks = result.unlockedSites || {};
            
            // Calculate expiry (Now + Duration in minutes)
            const expiry = Date.now() + (data.duration * 60 * 1000);
            
            // Normalize domain
            let domain = data.website;
            // Very basic normalization for storage key
            if (originalUrl) {
                try { domain = new URL(originalUrl).hostname; } catch(e) {}
            }

            // Save
            await chrome.storage.local.set({
                unlockedSites: {
                    ...currentUnlocks,
                    [domain]: expiry
                }
            });

            // Redirect
            if (originalUrl) {
                window.location.href = originalUrl;
            } else {
                // Fallback if manually typed
                window.open(`https://${data.website}`, '_blank');
            }
        } catch (e) {
            console.error("Extension storage failed", e);
            // Fallback for non-extension environment
            window.open(`https://${data.website}`, '_blank');
        }
    } else {
        // Fallback for web preview mode
        window.open(`https://${data.website}`, '_blank');
    }
  };

  return (
    <div className="font-display bg-background-light dark:bg-background-dark text-[#231a0f] dark:text-white overflow-hidden antialiased h-screen w-full relative flex items-center justify-center">
      
      {/* Background Pattern - Full Screen */}
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20 pointer-events-none"></div>
      
      {/* Background Gradient Spotlights */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-success/20 rounded-full blur-[100px]"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-primary/20 rounded-full blur-[100px]"></div>
      </div>

      {/* Confetti Container */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden h-full w-full z-0">
        {Array.from({ length: 30 }).map((_, i) => (
          <div key={i} className="confetti" style={{ 
            left: `${Math.random() * 100}%`, 
            animationDelay: `${Math.random() * 2}s`,
            animationDuration: `${3 + Math.random()}s`
          }}></div>
        ))}
      </div>

      {/* Main Card Container */}
      <div className="relative z-10 w-full max-w-md md:max-w-2xl bg-white/80 dark:bg-surface-dark/90 backdrop-blur-xl border-2 border-white/20 shadow-2xl rounded-[2.5rem] overflow-hidden flex flex-col md:flex-row animate-pop-in mx-4">
        
        {/* Left Side: Visuals */}
        <div className="bg-white dark:bg-black/20 p-8 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-white/10 md:w-2/5">
             <div className="mb-6 relative">
                 <div className="absolute inset-0 bg-gradient-to-br from-primary to-orange-500 rounded-full blur-2xl opacity-40"></div>
                 <Trophy size={80} className="text-primary relative z-10 drop-shadow-lg" />
             </div>
             <h2 className="text-3xl font-black text-center leading-none mb-2">UNLOCKED!</h2>
             <div className="bg-success/10 text-success font-bold px-3 py-1 rounded-full text-xs tracking-widest uppercase">
                 Mission Complete
             </div>
        </div>

        {/* Right Side: Content */}
        <div className="flex-1 p-8 flex flex-col relative">
            
            {/* Header Actions */}
            <div className="absolute top-6 right-6">
                <button 
                    onClick={() => { SoundFX.playClick(); onDoMore(); }}
                    className="p-2 hover:bg-black/5 rounded-full transition-colors"
                >
                    <X size={20} className="opacity-50 hover:opacity-100" />
                </button>
            </div>

            <div className="mt-2 mb-8">
                <h3 className="text-sm font-bold opacity-50 uppercase tracking-wider mb-1">You earned</h3>
                <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-black text-primary">{data.duration}</span>
                    <span className="text-xl font-bold opacity-80">MINUTES</span>
                </div>
                <p className="text-sm opacity-60 font-medium mt-1">of guilt-free scrolling time on {data.website}</p>
            </div>

            {/* Stats Summary */}
            <div className="bg-black/5 dark:bg-white/5 rounded-2xl p-4 flex items-center gap-4 mb-8 border border-black/5 dark:border-white/5">
                 <div className="size-12 rounded-xl bg-gray-200 dark:bg-black/40 overflow-hidden shrink-0">
                    <img src="https://images.unsplash.com/photo-1574680096145-d05b474e2155?auto=format&fit=crop&w=150&q=80" className="w-full h-full object-cover" />
                 </div>
                 <div className="flex-1">
                     <p className="text-xs font-bold uppercase opacity-50">Activity</p>
                     <p className="font-bold">Squat Challenge</p>
                 </div>
                 <div className="text-right">
                     <p className="text-xs font-bold uppercase opacity-50">Reps</p>
                     <p className="font-black text-xl">{data.squatsRequired}</p>
                 </div>
            </div>

            {/* Primary Action */}
            <button 
                onClick={handleProceed}
                className="group w-full bg-success hover:bg-green-500 text-white rounded-xl py-4 flex items-center justify-center gap-3 transition-all transform active:scale-[0.98] shadow-lg hover:shadow-success/40"
            >
                <div className="flex flex-col items-start leading-none">
                  <span className="text-[10px] font-bold uppercase opacity-80 tracking-widest">PROCEED TO</span>
                  <span className="font-black tracking-wide">{data.website.toUpperCase()}</span>
                </div>
                {originalUrl ? <ExternalLink size={24} className="group-hover:rotate-45 transition-transform" /> : <ArrowRight size={24} className="group-hover:translate-x-1 transition-transform" />}
            </button>

            <button 
                onClick={() => { SoundFX.playClick(); onDoMore(); }}
                className="mt-6 flex items-center justify-center gap-2 opacity-40 hover:opacity-100 transition-opacity text-xs font-bold uppercase tracking-widest"
            >
                <PlusCircle size={14} />
                <span>Earn More Time</span>
            </button>
        </div>

      </div>
    </div>
  );
};

export default SuccessScreen;