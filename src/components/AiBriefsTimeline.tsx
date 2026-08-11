import { useEffect, useState, useRef } from 'react';
import { Clock, Link2, Sparkles, TrendingUp, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { AiNewsBrief, fetchAiBriefs } from '../services/newsService';
import { t } from '../services/localization';

interface AiBriefsTimelineProps {
  selectedLanguageId: number;
  briefType: 'hourly_ai_top' | 'hourly_non_ai';
  refreshTrigger: number;
}

export function AiBriefsTimeline({ selectedLanguageId, briefType, refreshTrigger }: AiBriefsTimelineProps) {
  const [briefs, setBriefs] = useState<AiNewsBrief[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isError, setIsError] = useState<boolean>(false);
  const [expandedBriefs, setExpandedBriefs] = useState<{ [id: number]: boolean }>({});

  // Pagination states
  const [page, setPage] = useState<number>(0);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [isFetchingMore, setIsFetchingMore] = useState<boolean>(false);
  const pageSize = 15;

  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // Initial load reset
  useEffect(() => {
    let active = true;
    async function loadData() {
      setIsLoading(true);
      setIsError(false);
      setPage(0);
      setHasMore(true);
      try {
        const data = await fetchAiBriefs(selectedLanguageId, briefType, 0, pageSize);
        if (active) {
          setBriefs(data);
          
          // Reset expanded state and expand the first brief by default
          const initialExpanded: { [id: number]: boolean } = {};
          if (data.length > 0 && data[0].id) {
            initialExpanded[Number(data[0].id)] = true;
          }
          setExpandedBriefs(initialExpanded);

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
  }, [selectedLanguageId, briefType, refreshTrigger]);

  // Load next page of briefs
  const loadMoreBriefs = async () => {
    if (isLoading || isFetchingMore || !hasMore) return;
    setIsFetchingMore(true);
    const nextPage = page + 1;
    try {
      const data = await fetchAiBriefs(selectedLanguageId, briefType, nextPage, pageSize);
      if (data.length > 0) {
        setBriefs(prev => [...prev, ...data]);
        setPage(nextPage);
        if (data.length < pageSize) {
          setHasMore(false);
        }
      } else {
        setHasMore(false);
      }
    } catch (err) {
      console.error("Failed to load more briefs:", err);
    } finally {
      setIsFetchingMore(false);
    }
  };

  // Setup intersection observer
  useEffect(() => {
    if (!hasMore || isLoading || briefs.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMoreBriefs();
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
  }, [hasMore, isLoading, isFetchingMore, page, briefs]);

  const toggleExpand = (id: number) => {
    setExpandedBriefs(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const formatDateRange = (startStr: string, endStr: string) => {
    try {
      const startDate = new Date(startStr);
      const endDate = new Date(endStr);
      
      const formattedDate = startDate.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric'
      });
      
      const startTime = startDate.toLocaleTimeString(undefined, {
        hour: '2-digit',
        minute: '2-digit'
      });
      
      const endTime = endDate.toLocaleTimeString(undefined, {
        hour: '2-digit',
        minute: '2-digit'
      });

      return `${formattedDate} • ${startTime} - ${endTime}`;
    } catch (e) {
      return `${startStr} - ${endStr}`;
    }
  };

  // Timeline loading skeletons
  const SkeletonBrief = () => (
    <div className="glass-card brief-card skeleton-container" style={{ minHeight: '140px', padding: '1.75rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <div className="skeleton" style={{ width: '30%', height: '16px' }}></div>
        <div className="skeleton" style={{ width: '15%', height: '24px' }}></div>
      </div>
      <div className="skeleton" style={{ width: '90%', height: '28px', marginBottom: '0.75rem' }}></div>
      <div className="skeleton" style={{ width: '60%', height: '18px' }}></div>
    </div>
  );

  return (
    <div className="briefs-list">
      {isLoading ? (
        Array.from({ length: 4 }).map((_, idx) => (
          <SkeletonBrief key={idx} />
        ))
      ) : isError ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '300px', gap: '1rem', color: '#9ca3af' }}>
          <AlertCircle size={40} style={{ color: '#ef4444' }} />
          <h3>{t(selectedLanguageId, 'failed_load')}</h3>
          <p style={{ color: '#6b7280' }}>{t(selectedLanguageId, 'conn_error')}</p>
        </div>
      ) : briefs.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '300px', gap: '1rem', color: '#9ca3af' }}>
          <Clock size={40} />
          <h3>{t(selectedLanguageId, 'no_briefs')}</h3>
          <p style={{ color: '#6b7280' }}>{t(selectedLanguageId, 'no_briefs_sub')}</p>
        </div>
      ) : (
        <>
          {briefs.map(brief => {
            const isExpanded = !!expandedBriefs[Number(brief.id)];
            const hasSources = brief.source_articles && brief.source_articles.length > 0;
            
            return (
              <div
                key={brief.id}
                className={`glass-card brief-card ${briefType === 'hourly_non_ai' ? 'headline' : ''}`}
                style={{ borderLeftWidth: '4px', borderLeftColor: briefType === 'hourly_non_ai' ? '#3b82f6' : '#7c3aed' }}
              >
                {/* Brief Summary Header */}
                <div
                  className="brief-header"
                  style={{ cursor: 'pointer', userSelect: 'none' }}
                  onClick={() => toggleExpand(Number(brief.id))}
                >
                  <div className="brief-meta">
                    <span className="brief-date-tag">
                      <Clock size={12} style={{ display: 'inline-block', marginRight: '4px', verticalAlign: 'text-bottom' }} />
                      {formatDateRange(brief.period_start, brief.period_end)}
                    </span>
                    <h3 className="brief-title">{brief.title}</h3>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span className={`brief-pill ${briefType === 'hourly_non_ai' ? 'headline' : ''}`}>
                      {briefType === 'hourly_non_ai' ? (
                        <TrendingUp size={12} style={{ display: 'inline-block', marginRight: '4px', verticalAlign: 'text-bottom' }} />
                      ) : (
                        <Sparkles size={12} style={{ display: 'inline-block', marginRight: '4px', verticalAlign: 'text-bottom' }} />
                      )}
                      {briefType === 'hourly_non_ai' ? t(selectedLanguageId, 'tab_hourly_top') : t(selectedLanguageId, 'tab_ai_news')}
                    </span>
                    <button style={{ background: 'transparent', border: 'none', color: '#9ca3af', cursor: 'pointer' }}>
                      {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </button>
                  </div>
                </div>

                {/* Accordion Expansion Body */}
                {isExpanded && (
                  <div style={{ marginTop: '1.25rem', animation: 'fadeIn 0.2s ease' }}>
                    {brief.about && (
                      <p className="brief-description">
                        {brief.about}
                      </p>
                    )}

                    {/* Bullet Summaries */}
                    <div className="brief-points">
                      {brief.points.map((point, index) => (
                        <div key={index} className="brief-point">
                          <span className="brief-point-bullet">•</span>
                          <span>{point}</span>
                        </div>
                      ))}
                    </div>

                    {/* Tag Metadata */}
                    {(brief.people.length > 0 || brief.countries.length > 0 || brief.organizations.length > 0) && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.25rem' }}>
                        {brief.people.map((p, idx) => (
                          <span key={idx} style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', color: '#cbd5e1' }}>
                            👤 {p}
                          </span>
                        ))}
                        {brief.organizations.map((o, idx) => (
                          <span key={idx} style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', color: '#cbd5e1' }}>
                            🏢 {o}
                          </span>
                        ))}
                        {brief.countries.map((c, idx) => (
                          <span key={idx} style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', color: '#cbd5e1' }}>
                            📍 {c}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Source Articles reference pills */}
                    {hasSources && (
                      <div className="brief-sources">
                        <div className="sources-heading">Source References</div>
                        <div className="sources-links">
                          {brief.source_articles.map((src, idx) => (
                            <a
                              key={src.id || idx}
                              href={src.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="source-link-pill"
                            >
                              <Link2 size={12} />
                              <span>{src.title}</span>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Single generic fallback source url */}
                    {!hasSources && brief.source_url && (
                      <div className="brief-sources">
                        <div className="sources-heading">Source Link</div>
                        <div className="sources-links">
                          <a
                            href={brief.source_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="source-link-pill"
                          >
                            <Link2 size={12} />
                            <span>{brief.source_name || 'Read Full Coverage'}</span>
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {/* Sentinel element at bottom for Infinite Scroll */}
          <div ref={sentinelRef} style={{ height: '40px', marginTop: '2rem', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            {isFetchingMore && (
              <div className="sound-wave active" style={{ height: '24px' }}>
                <div className="sound-bar" style={{ width: '4px', background: briefType === 'hourly_non_ai' ? '#3b82f6' : '#7c3aed' }}></div>
                <div className="sound-bar" style={{ width: '4px', background: briefType === 'hourly_non_ai' ? '#3b82f6' : '#7c3aed' }}></div>
                <div className="sound-bar" style={{ width: '4px', background: briefType === 'hourly_non_ai' ? '#3b82f6' : '#7c3aed' }}></div>
                <div className="sound-bar" style={{ width: '4px', background: briefType === 'hourly_non_ai' ? '#3b82f6' : '#7c3aed' }}></div>
              </div>
            )}
            {!hasMore && briefs.length > 0 && (
              <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>{t(selectedLanguageId, 'end_of_list')}</span>
            )}
          </div>
        </>
      )}
    </div>
  );
}
