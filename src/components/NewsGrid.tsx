import { useEffect, useState, useRef } from 'react';
import { ThumbsUp, ThumbsDown, Calendar, AlertCircle, Flag, X, CheckCircle } from 'lucide-react';
import { NewsArticle, newsCategories, fetchNewsArticles, postReaction, getSourceName, submitReport } from '../services/newsService';
import { t, tCategory } from '../services/localization';

interface NewsGridProps {
  selectedLanguageId: number;
  onArticleSelect: (article: NewsArticle) => void;
  refreshTrigger: number;
}

export function NewsGrid({ selectedLanguageId, onArticleSelect, refreshTrigger }: NewsGridProps) {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [category, setCategory] = useState<string>('all');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isError, setIsError] = useState<boolean>(false);
  const [reactions, setReactions] = useState<{ [id: number]: number }>({}); // article_id -> reaction (1 = like, 2 = dislike)

  // Pagination states
  const [page, setPage] = useState<number>(0);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [isFetchingMore, setIsFetchingMore] = useState<boolean>(false);
  const pageSize = 20;

  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // Reporting states
  const [reportingArticle, setReportingArticle] = useState<NewsArticle | null>(null);
  const [selectedReasonIdx, setSelectedReasonIdx] = useState<number>(0);
  const [isSubmittingReport, setIsSubmittingReport] = useState<boolean>(false);
  const [showToast, setShowToast] = useState<{ show: boolean; msg: string; success: boolean }>({ show: false, msg: '', success: true });

  const reportReasons = [
    { key: 'spam', label: t(selectedLanguageId, 'reason_spam') },
    { key: 'broken', label: t(selectedLanguageId, 'reason_broken') },
    { key: 'inappropriate', label: t(selectedLanguageId, 'reason_inappropriate') },
    { key: 'copyright', label: t(selectedLanguageId, 'reason_copyright') }
  ];

  // Load reactions from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('newsx_reactions');
      if (stored) {
        setReactions(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Failed to load reactions:", e);
    }
  }, []);

  // Fetch articles on language or category shift (Reset page to 0)
  useEffect(() => {
    let active = true;
    async function loadData() {
      setIsLoading(true);
      setIsError(false);
      setPage(0);
      setHasMore(true);
      try {
        const data = await fetchNewsArticles(selectedLanguageId, category, 0, pageSize);
        if (active) {
          setArticles(data);
          if (data.length < pageSize) {
            setHasMore(false);
          }
        }
      } catch (err) {
        console.error(err);
        if (active) {
          setIsError(true);
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }
    loadData();
    return () => {
      active = false;
    };
  }, [selectedLanguageId, category, refreshTrigger]);

  // Fetch next page of articles
  const loadMoreArticles = async () => {
    if (isLoading || isFetchingMore || !hasMore) return;
    setIsFetchingMore(true);
    const nextPage = page + 1;
    try {
      const data = await fetchNewsArticles(selectedLanguageId, category, nextPage, pageSize);
      if (data.length > 0) {
        setArticles(prev => [...prev, ...data]);
        setPage(nextPage);
        if (data.length < pageSize) {
          setHasMore(false);
        }
      } else {
        setHasMore(false);
      }
    } catch (err) {
      console.error("Failed to load more articles:", err);
    } finally {
      setIsFetchingMore(false);
    }
  };

  // Setup intersection observer for infinite scroll
  useEffect(() => {
    if (!hasMore || isLoading || articles.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMoreArticles();
        }
      },
      { threshold: 0.1, rootMargin: '100px' }
    );

    const currentSentinel = sentinelRef.current;
    if (currentSentinel) {
      observer.observe(currentSentinel);
    }

    return () => {
      if (currentSentinel) {
        observer.unobserve(currentSentinel);
      }
    };
  }, [hasMore, isLoading, isFetchingMore, page, articles]);

  // Handle reaction clicking (likes / dislikes)
  const handleReactionClick = async (e: React.MouseEvent, article: NewsArticle, type: number) => {
    e.stopPropagation(); // Avoid triggering card detail click
    if (!article.id) return;

    const currentReaction = reactions[article.id] || 0;
    let nextReaction = 0;
    
    // Toggle reaction logic
    if (currentReaction !== type) {
      nextReaction = type;
    }

    // Calculate changes to counts
    let likesDelta = 0;
    let dislikesDelta = 0;

    if (currentReaction === 1) likesDelta = -1;
    if (currentReaction === 2) dislikesDelta = -1;
    if (nextReaction === 1) likesDelta = 1;
    if (nextReaction === 2) dislikesDelta = 1;

    // Update local UI immediately for responsiveness
    setArticles(prev => prev.map(art => {
      if (art.id === article.id) {
        return {
          ...art,
          likes_count: Math.max(0, art.likes_count + likesDelta),
          dislikes_count: Math.max(0, art.dislikes_count + dislikesDelta)
        };
      }
      return art;
    }));

    const updatedReactions = { ...reactions, [article.id]: nextReaction };
    if (nextReaction === 0) {
      delete updatedReactions[article.id];
    }
    setReactions(updatedReactions);
    localStorage.setItem('newsx_reactions', JSON.stringify(updatedReactions));

    // Send update to Supabase
    try {
      if (currentReaction !== 0) {
        const prevColVal = currentReaction === 1 ? article.likes_count - 1 : article.dislikes_count - 1;
        await postReaction(selectedLanguageId, article.id, currentReaction, Math.max(0, prevColVal));
      }
      if (nextReaction !== 0) {
        const newColVal = nextReaction === 1 ? article.likes_count + 1 : article.dislikes_count + 1;
        await postReaction(selectedLanguageId, article.id, nextReaction, newColVal);
      }
    } catch (err) {
      console.error("Failed to persist reaction on database:", err);
      // Revert states on error
      setArticles(prev => prev.map(art => {
        if (art.id === article.id) {
          return {
            ...art,
            likes_count: article.likes_count,
            dislikes_count: article.dislikes_count
          };
        }
        return art;
      }));
      const reverted = { ...reactions };
      if (currentReaction === 0) {
        delete reverted[article.id];
      } else {
        reverted[article.id] = currentReaction;
      }
      setReactions(reverted);
      localStorage.setItem('newsx_reactions', JSON.stringify(reverted));
    }
  };

  const handleReportClick = (e: React.MouseEvent, article: NewsArticle) => {
    e.stopPropagation();
    setReportingArticle(article);
    setSelectedReasonIdx(0);
  };

  const submitReportAction = async () => {
    if (!reportingArticle || !reportingArticle.id) return;
    setIsSubmittingReport(true);
    
    const reasonText = reportReasons[selectedReasonIdx].label;
    const url = reportingArticle.source_url || '';

    try {
      const success = await submitReport(reportingArticle.id, reasonText, url);
      if (success) {
        triggerToast(t(selectedLanguageId, 'report_success'), true);
      } else {
        triggerToast(t(selectedLanguageId, 'report_fail'), false);
      }
    } catch (err) {
      console.error(err);
      triggerToast(t(selectedLanguageId, 'report_fail'), false);
    } finally {
      setIsSubmittingReport(false);
      setReportingArticle(null);
    }
  };

  const triggerToast = (msg: string, success: boolean) => {
    setShowToast({ show: true, msg, success });
    setTimeout(() => {
      setShowToast(prev => ({ ...prev, show: false }));
    }, 3000);
  };

  const formatDate = (isoString: string) => {
    if (!isoString) return '';
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return isoString;
    }
  };

  // Skeleton Card component (No image block)
  const SkeletonCard = () => (
    <div className="glass-card skeleton-container" style={{ height: '220px' }}>
      <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <div className="skeleton" style={{ width: '40px', height: '16px' }}></div>
          <div className="skeleton" style={{ width: '60px', height: '16px' }}></div>
        </div>
        <div className="skeleton" style={{ width: '95%', height: '24px' }}></div>
        <div className="skeleton" style={{ width: '80%', height: '16px' }}></div>
        <div className="skeleton" style={{ width: '60%', height: '16px', marginTop: 'auto' }}></div>
      </div>
    </div>
  );

  return (
    <div>
      {/* Category Selection Filter */}
      <div className="categories-container">
        {newsCategories.map(cat => (
          <button
            key={cat.id}
            className={`category-chip ${category === cat.id ? 'active' : ''}`}
            onClick={() => setCategory(cat.id)}
          >
            <span>{tCategory(selectedLanguageId, cat.id)}</span>
          </button>
        ))}
      </div>

      {/* Grid Content states */}
      {isLoading ? (
        <div className="news-grid">
          {Array.from({ length: 6 }).map((_, idx) => (
            <SkeletonCard key={idx} />
          ))}
        </div>
      ) : isError ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '300px', gap: '1rem', color: 'var(--text-secondary)' }}>
          <AlertCircle size={40} style={{ color: '#ef4444' }} />
          <h3>{t(selectedLanguageId, 'failed_load')}</h3>
          <p style={{ color: '#6b7280' }}>{t(selectedLanguageId, 'conn_error')}</p>
        </div>
      ) : articles.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '300px', gap: '1rem', color: 'var(--text-secondary)' }}>
          <AlertCircle size={40} />
          <h3>{t(selectedLanguageId, 'no_news')}</h3>
          <p style={{ color: '#6b7280' }}>{t(selectedLanguageId, 'change_filter')}</p>
        </div>
      ) : (
        <>
          <div className="news-grid">
            {articles.map(article => {
              const userReaction = reactions[article.id || 0] || 0;
              return (
                <div
                  key={article.id}
                  className="glass-card"
                  onClick={() => onArticleSelect(article)}
                  style={{ cursor: 'pointer' }}
                >
                  {/* Body Content */}
                  <div className="card-body" style={{ minHeight: '200px', display: 'flex', flexDirection: 'column' }}>
                    
                    {/* Header Badges */}
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
                      {article.category && (
                        <span className="card-category-badge" style={{ position: 'static' }}>
                          {tCategory(selectedLanguageId, article.category)}
                        </span>
                      )}
                      <span
                        className="card-source-badge"
                        style={{
                          padding: '0.25rem 0.6rem',
                          fontSize: '0.7rem',
                          fontWeight: 750,
                          background: 'rgba(59, 130, 246, 0.25)',
                          border: '1px solid rgba(59, 130, 246, 0.4)',
                          borderRadius: '9999px',
                          color: '#60a5fa',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em'
                        }}
                      >
                        {getSourceName(article)}
                      </span>
                    </div>

                    <h3 className="card-title" title={article.title}>{article.title}</h3>
                    <p className="card-description" style={{ WebkitLineClamp: 3 }}>{article.des || 'Tap to view full article detail contents.'}</p>
                    
                    {/* Card Footer Actions */}
                    <div className="card-footer" style={{ marginTop: 'auto' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Calendar size={12} />
                        {formatDate(article.published_at)}
                      </span>
                      
                      <div className="card-actions">
                        <button
                          className={`action-btn ${userReaction === 1 ? 'active-like' : ''}`}
                          onClick={(e) => handleReactionClick(e, article, 1)}
                          title="Like"
                        >
                          <ThumbsUp size={14} />
                          <span>{article.likes_count || 0}</span>
                        </button>

                        <button
                          className={`action-btn ${userReaction === 2 ? 'active-dislike' : ''}`}
                          onClick={(e) => handleReactionClick(e, article, 2)}
                          title="Dislike"
                        >
                          <ThumbsDown size={14} />
                          <span>{article.dislikes_count || 0}</span>
                        </button>

                        <button
                          className="action-btn report-btn"
                          onClick={(e) => handleReportClick(e, article)}
                          title={t(selectedLanguageId, 'btn_report')}
                          style={{ color: '#9ca3af' }}
                          onMouseEnter={(e) => e.currentTarget.style.color = '#ef4444'}
                          onMouseLeave={(e) => e.currentTarget.style.color = '#9ca3af'}
                        >
                          <Flag size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Sentinel element at bottom for Infinite Scroll */}
          <div ref={sentinelRef} style={{ height: '40px', marginTop: '2rem', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            {isFetchingMore && (
              <div className="sound-wave active" style={{ height: '24px' }}>
                <div className="sound-bar" style={{ width: '4px', background: '#3b82f6' }}></div>
                <div className="sound-bar" style={{ width: '4px', background: '#3b82f6' }}></div>
                <div className="sound-bar" style={{ width: '4px', background: '#3b82f6' }}></div>
                <div className="sound-bar" style={{ width: '4px', background: '#3b82f6' }}></div>
              </div>
            )}
            {!hasMore && articles.length > 0 && (
              <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>{t(selectedLanguageId, 'end_of_list')}</span>
            )}
          </div>
        </>
      )}

      {/* Floating Toast Notification */}
      {showToast.show && (
        <div style={{
          position: 'fixed',
          bottom: '100px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: showToast.success ? 'rgba(16, 185, 129, 0.95)' : 'rgba(239, 68, 68, 0.95)',
          color: '#ffffff',
          padding: '0.75rem 1.5rem',
          borderRadius: '9999px',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          fontSize: '0.9rem',
          fontWeight: 600,
          zIndex: 1000,
          animation: 'fadeIn 0.2s ease-out'
        }}>
          {showToast.success ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
          <span>{showToast.msg}</span>
        </div>
      )}

      {/* Glassmorphic Report Modal Dialog */}
      {reportingArticle && (
        <div className="modal-overlay" onClick={() => setReportingArticle(null)}>
          <div className="glass-modal report-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '420px', width: '90%', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', position: 'relative' }}>
            <button className="modal-close" onClick={() => setReportingArticle(null)} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'transparent', border: 'none', color: '#9ca3af', cursor: 'pointer' }}>
              <X size={20} />
            </button>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Flag size={22} style={{ color: '#ef4444' }} />
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>{t(selectedLanguageId, 'report_title')}</h2>
            </div>
            
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
              {t(selectedLanguageId, 'report_prompt')}
            </p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {reportReasons.map((reason, idx) => (
                <label
                  key={reason.key}
                  className={`report-option-label ${selectedReasonIdx === idx ? 'active' : ''}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.75rem 1rem',
                    background: selectedReasonIdx === idx ? 'rgba(59, 130, 246, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                    border: `1px solid ${selectedReasonIdx === idx ? '#3b82f6' : 'rgba(255, 255, 255, 0.06)'}`,
                    borderRadius: '12px',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    color: selectedReasonIdx === idx ? '#3b82f6' : 'var(--text-primary)',
                    transition: 'all 0.2s'
                  }}
                >
                  <input
                    type="radio"
                    name="reportReason"
                    checked={selectedReasonIdx === idx}
                    onChange={() => setSelectedReasonIdx(idx)}
                    style={{ display: 'none' }}
                  />
                  <div style={{ width: '16px', height: '16px', borderRadius: '50%', border: `2px solid ${selectedReasonIdx === idx ? '#3b82f6' : 'rgba(255, 255, 255, 0.25)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}>
                    {selectedReasonIdx === idx && (
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#3b82f6' }}></div>
                    )}
                  </div>
                  <span>{reason.label}</span>
                </label>
              ))}
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
              <button
                className="refresh-btn"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.06)', color: 'var(--text-primary)', padding: '0.5rem 1rem' }}
                onClick={() => setReportingArticle(null)}
              >
                {t(selectedLanguageId, 'btn_cancel')}
              </button>
              <button
                className="refresh-btn"
                style={{ background: '#ef4444', color: '#ffffff', border: 'none', padding: '0.5rem 1.25rem' }}
                onClick={submitReportAction}
                disabled={isSubmittingReport}
              >
                {isSubmittingReport ? '...' : t(selectedLanguageId, 'btn_submit')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
