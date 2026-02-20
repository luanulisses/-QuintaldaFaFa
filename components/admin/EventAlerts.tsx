import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

// ── Types ──────────────────────────────────────────────────────────────────────
interface AgendaEvent {
    id: string;
    title: string;
    start_date: string; // ISO
    type: string;
    status: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────────
const TYPE_LABELS: Record<string, string> = {
    birthday: 'Aniversário',
    wedding: 'Casamento',
    corporate: 'Corporativo',
    other: 'Outro',
};

function daysFrom(dateStr: string): number {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const d = new Date(dateStr);
    d.setHours(0, 0, 0, 0);
    return Math.round((d.getTime() - now.getTime()) / 86_400_000);
}

function getUrgency(days: number): 'today' | 'tomorrow' | 'soon' | null {
    if (days === 0) return 'today';
    if (days === 1) return 'tomorrow';
    if (days >= 2 && days <= 7) return 'soon';
    return null;
}

// ──────────────────────────────────────────────────────────────────────────────
// Hook: useUpcomingEvents
// ──────────────────────────────────────────────────────────────────────────────
export function useUpcomingEvents() {
    const [events, setEvents] = useState<AgendaEvent[]>([]);

    useEffect(() => {
        const fetch = async () => {
            const now = new Date();
            const today = now.toISOString().slice(0, 10);
            const in7 = new Date(now.getTime() + 7 * 86_400_000).toISOString().slice(0, 10);

            const { data } = await supabase
                .from('events')
                .select('id, title, start_date, type, status')
                .gte('start_date', today + 'T00:00:00')
                .lte('start_date', in7 + 'T23:59:59')
                .neq('status', 'cancelled')
                .order('start_date', { ascending: true });

            setEvents(data || []);
        };

        fetch();
        const interval = setInterval(fetch, 5 * 60 * 1000); // refresh every 5min
        return () => clearInterval(interval);
    }, []);

    return events;
}

// ──────────────────────────────────────────────────────────────────────────────
// NotificationBell — goes in the top header
// ──────────────────────────────────────────────────────────────────────────────
export const NotificationBell: React.FC = () => {
    const events = useUpcomingEvents();
    const [open, setOpen] = useState(false);
    const panelRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();

    // Close on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const count = events.length;

    const urgencyConfig = {
        today: { label: 'HOJE', bg: '#FEE2E2', color: '#991B1B', dot: '#EF4444' },
        tomorrow: { label: 'AMANHÃ', bg: '#FEF3C7', color: '#92400E', dot: '#F59E0B' },
        soon: { label: 'EM BREVE', bg: '#DBEAFE', color: '#1E40AF', dot: '#3B82F6' },
    };

    return (
        <div ref={panelRef} style={{ position: 'relative' }}>
            {/* Bell button */}
            <button
                onClick={() => setOpen(o => !o)}
                title="Próximos eventos"
                style={{
                    position: 'relative',
                    width: '38px', height: '38px',
                    borderRadius: '50%',
                    border: count > 0 ? '2px solid #EF4444' : '1.5px solid rgba(120,185,38,0.25)',
                    background: open ? '#F0F7E8' : '#fff',
                    cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.2s',
                    boxShadow: count > 0 ? '0 0 0 3px rgba(239,68,68,0.1)' : 'none',
                }}
            >
                <span
                    className="material-symbols-outlined"
                    style={{ fontSize: '20px', color: count > 0 ? '#EF4444' : '#78B926' }}
                >
                    {count > 0 ? 'notifications_active' : 'notifications'}
                </span>
                {count > 0 && (
                    <span style={{
                        position: 'absolute', top: '-4px', right: '-4px',
                        background: '#EF4444', color: '#fff',
                        borderRadius: '50%', width: '18px', height: '18px',
                        fontSize: '10px', fontWeight: 700,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        border: '2px solid #fff',
                        animation: 'pulse 2s infinite',
                    }}>
                        {count}
                    </span>
                )}
            </button>

            {/* Dropdown panel */}
            {open && (
                <div style={{
                    position: 'absolute', right: 0, top: 'calc(100% + 8px)',
                    width: '320px',
                    background: '#fff',
                    borderRadius: '16px',
                    boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
                    border: '1px solid rgba(120,185,38,0.15)',
                    zIndex: 9999,
                    overflow: 'hidden',
                    animation: 'fadeInDown 0.2s ease',
                }}>
                    {/* Header */}
                    <div style={{
                        padding: '14px 16px',
                        borderBottom: '1px solid #F0F7E8',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        background: 'linear-gradient(135deg, #F0F7E8 0%, #fff 100%)',
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span className="material-symbols-outlined" style={{ color: '#78B926', fontSize: '18px' }}>
                                event_upcoming
                            </span>
                            <span style={{ fontWeight: 700, fontSize: '14px', color: '#2D3748' }}>
                                Próximos Eventos
                            </span>
                        </div>
                        {count > 0 && (
                            <span style={{
                                background: '#EF4444', color: '#fff',
                                borderRadius: '20px', padding: '2px 8px',
                                fontSize: '11px', fontWeight: 700,
                            }}>
                                {count} alerta{count > 1 ? 's' : ''}
                            </span>
                        )}
                    </div>

                    {/* Events list */}
                    <div style={{ maxHeight: '360px', overflowY: 'auto' }}>
                        {count === 0 ? (
                            <div style={{ padding: '32px 16px', textAlign: 'center', color: '#8BA082' }}>
                                <span className="material-symbols-outlined" style={{ fontSize: '40px', opacity: 0.4, display: 'block', marginBottom: '8px' }}>
                                    event_available
                                </span>
                                <p style={{ fontSize: '13px' }}>Nenhum evento nos próximos 7 dias</p>
                            </div>
                        ) : (
                            events.map(ev => {
                                const days = daysFrom(ev.start_date);
                                const urgency = getUrgency(days)!;
                                const cfg = urgencyConfig[urgency];
                                const time = ev.start_date.slice(11, 16);
                                return (
                                    <div
                                        key={ev.id}
                                        onClick={() => { navigate('/admin/agenda'); setOpen(false); }}
                                        style={{
                                            padding: '12px 16px',
                                            borderBottom: '1px solid #F9FDF5',
                                            cursor: 'pointer',
                                            display: 'flex', gap: '12px', alignItems: 'flex-start',
                                            transition: 'background 0.15s',
                                        }}
                                        onMouseEnter={e => (e.currentTarget.style.background = '#F9FDF5')}
                                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                                    >
                                        {/* Dot indicator */}
                                        <div style={{
                                            width: '10px', height: '10px', borderRadius: '50%',
                                            background: cfg.dot, flexShrink: 0, marginTop: '4px',
                                            boxShadow: urgency === 'today' ? `0 0 0 3px rgba(239,68,68,0.2)` : 'none',
                                        }} />
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{
                                                display: 'flex', alignItems: 'center',
                                                gap: '6px', marginBottom: '2px',
                                            }}>
                                                <span style={{
                                                    fontWeight: 700, fontSize: '13px',
                                                    color: '#2D3748',
                                                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                                                }}>
                                                    {ev.title}
                                                </span>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                                                <span style={{
                                                    background: cfg.bg, color: cfg.color,
                                                    padding: '1px 7px', borderRadius: '20px',
                                                    fontSize: '10px', fontWeight: 700,
                                                }}>
                                                    {urgency === 'today' ? '⚡ HOJE' : urgency === 'tomorrow' ? '⏰ AMANHÃ' : `📅 em ${days} dias`}
                                                </span>
                                                <span style={{ fontSize: '11px', color: '#8BA082' }}>
                                                    🕐 {time} • {TYPE_LABELS[ev.type] || ev.type}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {/* Footer */}
                    <div style={{ padding: '10px 16px', borderTop: '1px solid #F0F7E8', textAlign: 'center' }}>
                        <button
                            onClick={() => { navigate('/admin/agenda'); setOpen(false); }}
                            style={{
                                background: 'none', border: 'none', cursor: 'pointer',
                                color: '#78B926', fontWeight: 700, fontSize: '13px',
                            }}
                        >
                            Ver Agenda Completa →
                        </button>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes pulse {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.15); }
                }
                @keyframes fadeInDown {
                    from { opacity: 0; transform: translateY(-8px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
};

// ──────────────────────────────────────────────────────────────────────────────
// UrgentEventBanner — shows above page content for today/tomorrow events
// ──────────────────────────────────────────────────────────────────────────────
export const UrgentEventBanner: React.FC = () => {
    const events = useUpcomingEvents();
    const navigate = useNavigate();
    const isMobile = window.innerWidth < 768;

    const urgent = events.filter(ev => {
        const d = daysFrom(ev.start_date);
        return (d === 0 || d === 1) && !dismissed.has(ev.id);
    });

    if (urgent.length === 0) return null;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
            {urgent.map(ev => {
                const days = daysFrom(ev.start_date);
                const isToday = days === 0;
                const time = ev.start_date.slice(11, 16);

                return (
                return (
                    <div
                        key={ev.id}
                        style={{
                            display: 'flex',
                            flexDirection: isMobile ? 'column' : 'row',
                            alignItems: isMobile ? 'flex-start' : 'center',
                            gap: isMobile ? '8px' : '12px',
                            padding: isMobile ? '10px 12px' : '12px 16px',
                            borderRadius: '14px',
                            position: 'relative',
                            background: isToday
                                ? 'linear-gradient(135deg, #FEE2E2 0%, #FEF2F2 100%)'
                                : 'linear-gradient(135deg, #FEF3C7 0%, #FFFBEB 100%)',
                            border: `1.5px solid ${isToday ? '#FCA5A5' : '#FCD34D'}`,
                            boxShadow: isToday
                                ? '0 4px 12px rgba(239,68,68,0.12)'
                                : '0 4px 12px rgba(245,158,11,0.12)',
                            animation: 'slideInDown 0.3s ease',
                        }}
                    >
                        {/* Icon + Text Group */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, width: '100%' }}>
                            {/* Icon */}
                            {!isMobile && (
                                <div style={{
                                    width: '40px', height: '40px', borderRadius: '10px', flexShrink: 0,
                                    background: isToday ? '#EF4444' : '#F59E0B',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    boxShadow: `0 4px 12px ${isToday ? 'rgba(239,68,68,0.35)' : 'rgba(245,158,11,0.35)'}`,
                                }}>
                                    <span className="material-symbols-outlined" style={{ color: '#fff', fontSize: '20px' }}>
                                        {isToday ? 'event_available' : 'schedule'}
                                    </span>
                                </div>
                            )}

                            {/* Text */}
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{
                                    fontWeight: 700, fontSize: isMobile ? '12px' : '13px',
                                    color: isToday ? '#7F1D1D' : '#78350F',
                                    display: 'flex', alignItems: 'center', gap: '6px',
                                    flexWrap: 'wrap'
                                }}>
                                    <span style={{
                                        background: isToday ? '#EF4444' : '#F59E0B',
                                        color: '#fff', borderRadius: '6px',
                                        padding: '1px 7px', fontSize: '9px', fontWeight: 800,
                                        letterSpacing: '0.5px',
                                    }}>
                                        {isToday ? '⚡ HOJE' : '⏰ AMANHÃ'}
                                    </span>
                                    {ev.title}
                                </div>
                                <div style={{ fontSize: '10px', color: isToday ? '#991B1B' : '#92400E', marginTop: '2px' }}>
                                    🕐 {time} &nbsp;•&nbsp; {TYPE_LABELS[ev.type] || ev.type}
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            flexShrink: 0,
                            width: isMobile ? '100%' : 'auto',
                            justifyContent: isMobile ? 'space-between' : 'flex-end',
                            marginTop: isMobile ? '8px' : '0',
                            paddingTop: isMobile ? '8px' : '0',
                            borderTop: isMobile ? `1px solid ${isToday ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)'}` : 'none'
                        }}>
                            <button
                                onClick={() => navigate('/admin/agenda')}
                                style={{
                                    padding: '5px 10px', borderRadius: '8px',
                                    border: `1.5px solid ${isToday ? '#EF4444' : '#F59E0B'}`,
                                    background: 'transparent',
                                    color: isToday ? '#EF4444' : '#D97706',
                                    fontSize: '11px', fontWeight: 700, cursor: 'pointer',
                                    flex: isMobile ? 1 : 'none',
                                    textAlign: 'center'
                                }}
                            >
                                Ver Agenda
                            </button>
                            <button
                                onClick={() => setDismissed(d => new Set([...d, ev.id]))}
                                title="Dispensar alerta"
                                style={{
                                    background: isMobile ? (isToday ? 'rgba(239,68,68,0.05)' : 'rgba(245,158,11,0.05)') : 'none',
                                    border: 'none', cursor: 'pointer',
                                    color: isToday ? '#EF4444' : '#D97706', opacity: 0.6,
                                    padding: '6px', borderRadius: '6px',
                                    display: 'flex', alignItems: 'center',
                                }}
                            >
                                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>close</span>
                            </button>
                        </div>
                    </div>
                );
            })}

            <style>{`
                @keyframes slideInDown {
                    from { opacity: 0; transform: translateY(-12px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
};
