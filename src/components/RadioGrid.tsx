import { Radio, Play, Pause, AlertCircle } from 'lucide-react';
import { LiveRadioStation } from '../services/newsService';

interface RadioGridProps {
  stations: LiveRadioStation[];
  isLoading: boolean;
  isError: boolean;
  currentStation: LiveRadioStation | null;
  isPlaying: boolean;
  onStationSelect: (station: LiveRadioStation) => void;
}

export function RadioGrid({
  stations,
  isLoading,
  isError,
  currentStation,
  isPlaying,
  onStationSelect
}: RadioGridProps) {
  
  // Loading skeletons for radio stations
  const SkeletonRadio = () => (
    <div className="glass-card radio-card skeleton-container" style={{ minHeight: '180px' }}>
      <div className="skeleton" style={{ width: '64px', height: '64px', borderRadius: '50%' }}></div>
      <div className="skeleton" style={{ width: '60%', height: '20px' }}></div>
      <div className="skeleton" style={{ width: '40%', height: '14px' }}></div>
    </div>
  );

  return (
    <div>
      {isLoading ? (
        <div className="radio-stations-grid">
          {Array.from({ length: 4 }).map((_, idx) => (
            <SkeletonRadio key={idx} />
          ))}
        </div>
      ) : isError ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '300px', gap: '1rem', color: '#9ca3af' }}>
          <AlertCircle size={40} style={{ color: '#ef4444' }} />
          <h3>Failed to load radio stations</h3>
          <p style={{ color: '#6b7280' }}>Please check your connection or try again.</p>
        </div>
      ) : stations.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '300px', gap: '1rem', color: '#9ca3af' }}>
          <Radio size={40} />
          <h3>No stations found</h3>
          <p style={{ color: '#6b7280' }}>There are no radio broadcasts listed in this language yet.</p>
        </div>
      ) : (
        <div className="radio-stations-grid">
          {stations.map(station => {
            const isActive = currentStation?.id === station.id;
            const isStationPlaying = isActive && isPlaying;
            
            return (
              <div
                key={station.id}
                className={`glass-card radio-card ${isActive ? 'active' : ''}`}
                onClick={() => onStationSelect(station)}
              >
                {/* Visualizer disc avatar */}
                <div className="radio-avatar">
                  {isStationPlaying ? (
                    <Pause size={24} fill="currentColor" />
                  ) : isActive ? (
                    <Play size={24} fill="currentColor" style={{ marginLeft: '4px' }} />
                  ) : (
                    <Radio size={24} />
                  )}
                </div>

                <div className="radio-name">{station.name}</div>
                <div className="radio-freq">{station.frequency || 'Live Broadcast'}</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
