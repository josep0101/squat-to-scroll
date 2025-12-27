import React, { useState, useEffect } from 'react';
import { AppScreen, ChallengeData } from './types';
import HomeScreen from './components/HomeScreen';
import DetectionScreen from './components/DetectionScreen';
import SuccessScreen from './components/SuccessScreen';

const App: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<AppScreen>(AppScreen.HOME);
  const [challengeData, setChallengeData] = useState<ChallengeData>({
    website: 'instagram.com',
    duration: 5,
    squatsRequired: 10
  });

  // Trigger Warmup on mount
  useEffect(() => {
    // MediaPipe is initialized in DetectionScreen
  }, []);

  const handleStartChallenge = (data: ChallengeData) => {
    setChallengeData(data);
    setCurrentScreen(AppScreen.DETECTION);
  };

  const handleChallengeComplete = () => {
    setCurrentScreen(AppScreen.SUCCESS);
  };

  const handleRestart = () => {
    setCurrentScreen(AppScreen.HOME);
  };

  return (
    <div className="w-full h-full min-h-screen">
      {currentScreen === AppScreen.HOME && (
        <HomeScreen onStart={handleStartChallenge} />
      )}
      {currentScreen === AppScreen.DETECTION && (
        <DetectionScreen
          targetSquats={challengeData.squatsRequired}
          onComplete={handleChallengeComplete}
          onCancel={handleRestart}
        />
      )}
      {currentScreen === AppScreen.SUCCESS && (
        <SuccessScreen
          data={challengeData}
          onDoMore={handleRestart}
        />
      )}
    </div>
  );
};

export default App;