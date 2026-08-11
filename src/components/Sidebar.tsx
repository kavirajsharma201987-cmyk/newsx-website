import { Newspaper, Sparkles, TrendingUp, Radio, Mail, Phone } from 'lucide-react';
import { t } from '../services/localization';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  selectedLanguageId: number;
}

export function Sidebar({
  activeTab,
  setActiveTab,
  selectedLanguageId
}: SidebarProps) {
  return (
    <aside className="sidebar">
      {/* Brand Logo */}
      <div className="logo-container">
        <img src="/favicon.svg" alt="NewsX-India Logo" style={{ width: '28px', height: '28px', objectFit: 'contain' }} />
        <span className="logo-text">NewsX-India</span>
      </div>

      {/* Navigation Options */}
      <nav className="nav-links">
        <button
          className={`nav-item ${activeTab === 'news' ? 'active' : ''}`}
          onClick={() => setActiveTab('news')}
        >
          <Newspaper size={20} />
          <span>{t(selectedLanguageId, 'tab_news')}</span>
        </button>

        <button
          className={`nav-item ${activeTab === 'ai_news' ? 'active' : ''}`}
          onClick={() => setActiveTab('ai_news')}
        >
          <Sparkles size={20} />
          <span>{t(selectedLanguageId, 'tab_ai_news')}</span>
        </button>

        <button
          className={`nav-item ${activeTab === 'hourly_top' ? 'active' : ''}`}
          onClick={() => setActiveTab('hourly_top')}
        >
          <TrendingUp size={20} />
          <span>{t(selectedLanguageId, 'tab_hourly_top')}</span>
        </button>

        <button
          className={`nav-item ${activeTab === 'radio' ? 'active' : ''}`}
          onClick={() => setActiveTab('radio')}
        >
          <Radio size={20} />
          <span>{t(selectedLanguageId, 'tab_radio')}</span>
        </button>
      </nav>

      {/* Sidebar Footer with Contact Us (Desktop only) */}
      <div className="sidebar-footer" style={{ marginTop: 'auto', padding: '1rem', borderTop: '1px solid rgba(255, 255, 255, 0.05)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            {t(selectedLanguageId, 'btn_contact')}
          </span>
          <a
            href="mailto:kaviraj.sharma201987@gmail.com"
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)', textDecoration: 'none', transition: 'color 0.2s' }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#3b82f6'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
          >
            <Mail size={12} style={{ flexShrink: 0 }} />
            <span style={{ wordBreak: 'break-all' }}>kaviraj.sharma201987@gmail.com</span>
          </a>
          <a
            href="tel:+919465576228"
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)', textDecoration: 'none', transition: 'color 0.2s' }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#3b82f6'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
          >
            <Phone size={12} style={{ flexShrink: 0 }} />
            <span>+91 94655 76228</span>
          </a>
        </div>
      </div>
    </aside>
  );
}
