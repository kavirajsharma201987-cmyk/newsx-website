import { X, ExternalLink, Calendar } from 'lucide-react';
import { NewsArticle, getSourceName } from '../services/newsService';
import { tCategory } from '../services/localization';

interface ArticleModalProps {
  article: NewsArticle | null;
  onClose: () => void;
  selectedLanguageId: number;
}

export function ArticleModal({ article, onClose, selectedLanguageId }: ArticleModalProps) {
  if (!article) return null;

  const formatDate = (isoString: string) => {
    if (!isoString) return '';
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString(undefined, {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return isoString;
    }
  };

  const sourceName = getSourceName(article);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Close button */}
        <button className="modal-close-btn" onClick={onClose} title="Close modal">
          <X size={20} />
        </button>

        {/* Body content */}
        <div className="modal-body" style={{ paddingTop: '2.5rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
            {article.category && (
              <span className="modal-category" style={{ marginBottom: 0 }}>
                {tCategory(selectedLanguageId, article.category)}
              </span>
            )}
            <span
              className="modal-category"
              style={{
                marginBottom: 0,
                background: 'rgba(59, 130, 246, 0.2)',
                border: '1px solid rgba(59, 130, 246, 0.4)',
                color: '#60a5fa'
              }}
            >
              {sourceName}
            </span>
          </div>

          <h2 className="modal-title">{article.title}</h2>
          
          <div className="modal-meta" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginBottom: '1.5rem' }}>
            <Calendar size={14} />
            <span>{formatDate(article.published_at)}</span>
          </div>

          <p className="modal-text">
            {article.des}
          </p>

          <div className="modal-action-bar">
            {article.source_url && (
              <a
                href={article.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="modal-source-btn"
              >
                <ExternalLink size={16} style={{ marginRight: '6px' }} />
                {selectedLanguageId === 4 ? "मूल कवरेज पढ़ें" : "Read Original Coverage"}
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
