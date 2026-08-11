import { useEffect, useRef, useState } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX } from 'lucide-react';
import { LiveRadioStation } from '../services/newsService';

interface RadioPlayerProps {
  currentStation: LiveRadioStation | null;
  isPlaying: boolean;
  onPlayPauseToggle: () => void;
  onPrevStation: () => void;
  onNextStation: () => void;
}

export function RadioPlayer({
  currentStation,
  isPlaying,
  onPlayPauseToggle,
  onPrevStation,
  onNextStation
}: RadioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [volume, setVolume] = useState<number>(0.8);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [playbackError, setPlaybackError] = useState<string | null>(null);

  // Handle station changes
  useEffect(() => {
    if (!currentStation) return;

    setPlaybackError(null);

    if (!audioRef.current) {
      audioRef.current = new Audio(currentStation.url);
    } else {
      audioRef.current.src = currentStation.url;
    }

    audioRef.current.volume = isMuted ? 0 : volume;

    // Autoplay when station changes if isPlaying is true
    if (isPlaying) {
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.error("Playback error:", error);
          setPlaybackError("Failed to load stream. Please try again.");
          onPlayPauseToggle(); // Set back to paused state
        });
      }
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, [currentStation]);

  // Handle play/pause state shifts
  useEffect(() => {
    if (!audioRef.current) return;

    if (isPlaying) {
      setPlaybackError(null);
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.error("Playback error:", error);
          setPlaybackError("Failed to play. Station may be offline.");
          onPlayPauseToggle();
        });
      }
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying]);

  // Handle volume adjustments
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  const handleVolumeSlider = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    setVolume(value);
    if (value > 0) setIsMuted(false);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  if (!currentStation) return null;

  return (
    <div className="radio-player-bar">
      {/* Station Info */}
      <div className="player-info">
        <div className={`vinyl-disc ${isPlaying ? 'spin' : ''}`}>
          📻
        </div>
        <div className="player-meta">
          <div className="player-title">{currentStation.name}</div>
          <div className="player-subtitle">
            {isPlaying && <span className="live-indicator"></span>}
            {currentStation.frequency || 'Live Stream'}
            {playbackError && <span style={{ color: '#ef4444', marginLeft: '8px', fontSize: '0.75rem' }}>{playbackError}</span>}
          </div>
        </div>
      </div>

      {/* Play Controls */}
      <div className="player-controls">
        <button className="control-btn" onClick={onPrevStation} title="Previous Station">
          <SkipBack size={18} />
        </button>
        <button className="control-btn play-pause" onClick={onPlayPauseToggle} title={isPlaying ? 'Pause' : 'Play'}>
          {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" style={{ marginLeft: '4px' }} />}
        </button>
        <button className="control-btn" onClick={onNextStation} title="Next Station">
          <SkipForward size={18} />
        </button>
        
        {/* Equalizer Visualizer */}
        <div className={`sound-wave ${isPlaying ? 'active' : ''}`} style={{ marginLeft: '12px' }}>
          <div className="sound-bar"></div>
          <div className="sound-bar"></div>
          <div className="sound-bar"></div>
          <div className="sound-bar"></div>
        </div>
      </div>

      {/* Volume Control */}
      <div className="player-volume">
        <button className="control-btn" onClick={toggleMute} style={{ border: 'none', background: 'transparent' }}>
          {isMuted || volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
        </button>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={isMuted ? 0 : volume}
          onChange={handleVolumeSlider}
          className="volume-slider"
          title="Volume"
        />
      </div>
    </div>
  );
}
