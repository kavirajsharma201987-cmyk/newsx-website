import { useEffect, useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { NewsGrid } from './components/NewsGrid';
import { AiBriefsTimeline } from './components/AiBriefsTimeline';
import { RadioGrid } from './components/RadioGrid';
import { RadioPlayer } from './components/RadioPlayer';
import { ArticleModal } from './components/ArticleModal';
import { LiveRadioStation, fetchRadioStations, NewsArticle, languages } from './services/newsService';
import { RotateCw, Globe, Mail, Phone, X } from 'lucide-react';
import { t } from './services/localization';

function App() {
  const [activeTab, setActiveTab] = useState<string>('news');
  const [selectedLanguageId, setSelectedLanguageId] = useState<number>(1); // Default to 1 (English)
  const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(null);
  
  // Refresh indicator trigger state
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

  // Contact Us Modal state
  const [isContactOpen, setIsContactOpen] = useState<boolean>(false);

  // Radio stations list and player states
  const [stations, setStations] = useState<LiveRadioStation[]>([]);
  const [stationsLoading, setStationsLoading] = useState<boolean>(true);
  const [stationsError, setStationsError] = useState<boolean>(false);
  const [currentStation, setCurrentStation] = useState<LiveRadioStation | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  // Sync language selection from localStorage on mount
  useEffect(() => {
    const savedLid = localStorage.getItem('newsx_selected_lid');
    if (savedLid) {
      setSelectedLanguageId(Number(savedLid));
    }
  }, []);

  // Persist language selection in localStorage
  const handleLanguageChange = (id: number) => {
    setSelectedLanguageId(id);
    localStorage.setItem('newsx_selected_lid', String(id));
  };

  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  // Fetch radio stations when language or refresh trigger changes
  useEffect(() => {
    let active = true;
    async function loadStations() {
      setStationsLoading(true);
      setStationsError(false);
      try {
        const data = await fetchRadioStations(selectedLanguageId);
        if (active) {
          setStations(data);
          
          // Auto-select first station if no station is currently playing
          if (data.length > 0 && !currentStation) {
            setCurrentStation(data[0]);
          } else if (data.length > 0 && currentStation) {
            // Check if current station is in the new language list, if not play the new language's first station
            const exists = data.some(s => s.id === currentStation.id);
            if (!exists && !isPlaying) {
              setCurrentStation(data[0]);
            }
          }
        }
      } catch (err) {
        console.error("Failed to load radio stations in App:", err);
        if (active) {
          setStationsError(true);
        }
      } finally {
        if (active) {
          setStationsLoading(false);
        }
      }
    }
    loadStations();
    return () => {
      active = false;
    };
  }, [selectedLanguageId, refreshTrigger]);

  const handlePlayPauseToggle = () => {
    setIsPlaying(!isPlaying);
  };

  const handleStationSelect = (station: LiveRadioStation) => {
    if (currentStation?.id === station.id) {
      setIsPlaying(!isPlaying);
    } else {
      setCurrentStation(station);
      setIsPlaying(true);
    }
  };

  const handlePrevStation = () => {
    if (stations.length === 0 || !currentStation) return;
    const currentIndex = stations.findIndex(s => s.id === currentStation.id);
    const prevIndex = (currentIndex - 1 + stations.length) % stations.length;
    setCurrentStation(stations[prevIndex]);
    setIsPlaying(true);
  };

  const handleNextStation = () => {
    if (stations.length === 0 || !currentStation) return;
    const currentIndex = stations.findIndex(s => s.id === currentStation.id);
    const nextIndex = (currentIndex + 1) % stations.length;
    setCurrentStation(stations[nextIndex]);
    setIsPlaying(true);
  };

  return (
    <div className="app-container">
      {/* Sidebar Layout */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        selectedLanguageId={selectedLanguageId}
      />

      {/* Main View Area */}
      <main className="main-content">
        <header className="content-header">
          <h1 className="page-title">
            {activeTab === 'news' && t(selectedLanguageId, 'title_news')}
            {activeTab === 'ai_news' && t(selectedLanguageId, 'title_ai_news')}
            {activeTab === 'hourly_top' && t(selectedLanguageId, 'title_hourly_top')}
            {activeTab === 'radio' && t(selectedLanguageId, 'title_radio')}
          </h1>

          {/* Action Header controls */}
          <div className="header-actions">
            {/* Contact Us button */}
            <button className="refresh-btn" onClick={() => setIsContactOpen(true)} title="Contact Support">
              <Mail size={16} />
              <span>{t(selectedLanguageId, 'btn_contact')}</span>
            </button>

            {/* Global Language Selector */}
            <div className="header-lang-select" title="Change Language">
              <Globe size={16} style={{ color: '#3b82f6' }} />
              <select
                value={selectedLanguageId}
                onChange={(e) => handleLanguageChange(Number(e.target.value))}
              >
                {languages.map((lang) => (
                  <option key={lang.id} value={lang.id}>
                    {lang.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Global Refresh Button */}
            <button className="refresh-btn" onClick={handleRefresh} title="Refresh content">
              <RotateCw size={16} />
              <span>{t(selectedLanguageId, 'btn_refresh')}</span>
            </button>
          </div>
        </header>

        {/* Tab views rendering */}
        {activeTab === 'news' && (
          <NewsGrid
            selectedLanguageId={selectedLanguageId}
            onArticleSelect={setSelectedArticle}
            refreshTrigger={refreshTrigger}
          />
        )}

        {activeTab === 'ai_news' && (
          <AiBriefsTimeline
            selectedLanguageId={selectedLanguageId}
            briefType="hourly_ai_top"
            refreshTrigger={refreshTrigger}
          />
        )}

        {activeTab === 'hourly_top' && (
          <AiBriefsTimeline
            selectedLanguageId={selectedLanguageId}
            briefType="hourly_non_ai"
            refreshTrigger={refreshTrigger}
          />
        )}

        {activeTab === 'radio' && (
          <RadioGrid
            stations={stations}
            isLoading={stationsLoading}
            isError={stationsError}
            currentStation={currentStation}
            isPlaying={isPlaying}
            onStationSelect={handleStationSelect}
          />
        )}
      </main>

      {/* Persistent Bottom Audio Player */}
      <RadioPlayer
        currentStation={currentStation}
        isPlaying={isPlaying}
        onPlayPauseToggle={handlePlayPauseToggle}
        onPrevStation={handlePrevStation}
        onNextStation={handleNextStation}
      />

      {/* Details modal overlays */}
      <ArticleModal
        article={selectedArticle}
        onClose={() => setSelectedArticle(null)}
        selectedLanguageId={selectedLanguageId}
      />

      {/* Contact Support Modal Overlay */}
      {isContactOpen && (
        <div className="modal-overlay" onClick={() => setIsContactOpen(false)}>
          <div className="glass-modal contact-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px', width: '90%', padding: '2.5rem 2rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', position: 'relative', alignItems: 'center', textAlign: 'center', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '20px', boxShadow: '0 20px 50px rgba(0,0,0,0.1)' }}>
            <button className="modal-close" onClick={() => setIsContactOpen(false)} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'transparent', border: 'none', color: '#9ca3af', cursor: 'pointer' }}>
              <X size={20} />
            </button>
            
            <div style={{ padding: '1rem', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.5rem' }}>
              <Phone size={32} style={{ color: '#3b82f6' }} />
            </div>
            
            <h2 style={{ fontSize: '1.4rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
              {t(selectedLanguageId, 'btn_contact')}
            </h2>
            
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
              Feel free to reach out to us for any queries, support, or feedback.
            </p>
            
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1rem' }}>
              <a
                href="mailto:kaviraj.sharma201987@gmail.com"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', padding: '0.85rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px', color: 'var(--text-primary)', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 500, transition: 'all 0.2s' }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--color-blue)'; e.currentTarget.style.background = 'var(--color-blue-glow)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.background = 'var(--bg-secondary)'; }}
              >
                <Mail size={16} style={{ color: '#3b82f6' }} />
                <span>kaviraj.sharma201987@gmail.com</span>
              </a>
              <a
                href="tel:+919465576228"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', padding: '0.85rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px', color: 'var(--text-primary)', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 500, transition: 'all 0.2s' }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--color-blue)'; e.currentTarget.style.background = 'var(--color-blue-glow)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.background = 'var(--bg-secondary)'; }}
              >
                <Phone size={16} style={{ color: '#3b82f6' }} />
                <span>+91 94655 76228</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
