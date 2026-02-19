import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';

// ─── Types ────────────────────────────────────────────────────────────────────
interface AgendaEvent {
    id: string;
    title: string;
    start_date: string;   // ISO
    end_date: string;     // ISO
    type: 'birthday' | 'wedding' | 'corporate' | 'other';
    status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
    description?: string;
}

const TYPE_LABELS: Record<string, string> = {
    birthday: 'Aniversário',
    wedding: 'Casamento',
    corporate: 'Corporativo',
    other: 'Outro',
};

const STATUS_LABELS: Record<string, string> = {
    pending: 'Pendente',
    confirmed: 'Confirmado',
    completed: 'Concluído',
    cancelled: 'Cancelado',
};

const TYPE_COLORS: Record<string, string> = {
    birthday: 'bg-orange-100 text-orange-700',
    wedding: 'bg-pink-100 text-pink-700',
    corporate: 'bg-blue-100 text-blue-700',
    other: 'bg-gray-100 text-gray-600',
};

const STATUS_COLORS: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-700',
    confirmed: 'bg-green-100 text-green-700',
    completed: 'bg-blue-100 text-blue-700',
    cancelled: 'bg-red-100 text-red-600',
};

const MONTH_NAMES = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

// ─── Blank form ───────────────────────────────────────────────────────────────
const blankForm = (): Omit<AgendaEvent, 'id'> => {
    const today = new Date().toISOString().slice(0, 16);
    return {
        title: '',
        start_date: today,
        end_date: today,
        type: 'other',
        status: 'pending',
        description: '',
    };
};

// ─── Component ────────────────────────────────────────────────────────────────
const AdminAgenda: React.FC = () => {
    const [view, setView] = useState<'calendar' | 'list'>('calendar');
    const [events, setEvents] = useState<AgendaEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    // Calendar navigation
    const today = new Date();
    const [calYear, setCalYear] = useState(today.getFullYear());
    const [calMonth, setCalMonth] = useState(today.getMonth()); // 0-11

    // Modal
    const [showModal, setShowModal] = useState(false);
    const [editingEvent, setEditingEvent] = useState<AgendaEvent | null>(null);
    const [form, setForm] = useState(blankForm());
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

    // ── Fetch ──────────────────────────────────────────────────────────────────
    const fetchEvents = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const { data, error: err } = await supabase
                .from('events')
                .select('*')
                .order('start_date', { ascending: true });
            if (err) throw err;
            setEvents(data || []);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchEvents(); }, [fetchEvents]);

    // ── Calendar helpers ───────────────────────────────────────────────────────
    const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
    const firstWeekday = new Date(calYear, calMonth, 1).getDay(); // 0=Sun

    const eventsForDay = (day: number) => {
        const prefix = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        return events.filter(e => e.start_date.startsWith(prefix));
    };

    const prevMonth = () => {
        if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1); }
        else setCalMonth(m => m - 1);
    };
    const nextMonth = () => {
        if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1); }
        else setCalMonth(m => m + 1);
    };
    const goToday = () => { setCalYear(today.getFullYear()); setCalMonth(today.getMonth()); };

    const isToday = (day: number) =>
        day === today.getDate() && calMonth === today.getMonth() && calYear === today.getFullYear();

    // ── Modal helpers ──────────────────────────────────────────────────────────
    const openCreate = (day?: number) => {
        const base = day
            ? `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}T12:00`
            : new Date().toISOString().slice(0, 16);
        setForm({ ...blankForm(), start_date: base, end_date: base });
        setEditingEvent(null);
        setShowModal(true);
    };

    const openEdit = (ev: AgendaEvent) => {
        setForm({
            title: ev.title,
            start_date: ev.start_date.slice(0, 16),
            end_date: ev.end_date.slice(0, 16),
            type: ev.type,
            status: ev.status,
            description: ev.description || '',
        });
        setEditingEvent(ev);
        setShowModal(true);
    };

    const closeModal = () => { setShowModal(false); setEditingEvent(null); };

    // ── Save ───────────────────────────────────────────────────────────────────
    const handleSave = async () => {
        if (!form.title.trim()) { alert('Informe o título do evento.'); return; }
        setSaving(true);
        try {
            const isClosing = form.status === 'confirmed' && (!editingEvent || editingEvent.status !== 'confirmed');

            let finalEventId = editingEvent?.id;

            if (editingEvent) {
                const { error: err } = await supabase
                    .from('events')
                    .update({ ...form })
                    .eq('id', editingEvent.id);
                if (err) throw err;
            } else {
                const { data, error: err } = await supabase
                    .from('events')
                    .insert([{ ...form }])
                    .select()
                    .single();
                if (err) throw err;
                finalEventId = data.id;
            }

            // Financial link logic
            if (isClosing) {
                const amountStr = prompt(`Deseja registrar o valor do contrato para "${form.title}" no Fluxo de Caixa?\n(Deixe em branco para ignorar ou informe o valor abaixo):`, '0.00');

                if (amountStr !== null && amountStr.trim() !== '') {
                    const amount = parseFloat(amountStr.replace(',', '.'));
                    if (!isNaN(amount) && amount > 0) {
                        const { error: finErr } = await supabase
                            .from('financial_movements')
                            .insert([{
                                type: 'Receita',
                                category: 'Pacote',
                                description: `Receita: ${form.title}`,
                                amount: amount,
                                date: form.start_date.split('T')[0]
                            }]);

                        if (finErr) {
                            console.error('Erro ao gerar financeiro:', finErr);
                            alert('Evento salvo, mas houve um erro ao registrar no financeiro.');
                        } else {
                            alert('Sucesso! Evento confirmado e receita registrada no financeiro.');
                        }
                    }
                }
            }

            await fetchEvents();
            closeModal();
        } catch (e: any) {
            alert(`Erro ao salvar: ${e.message}`);
        } finally {
            setSaving(false);
        }
    };

    // ── Delete ─────────────────────────────────────────────────────────────────
    const handleDelete = async (id: string) => {
        setSaving(true);
        try {
            const { error: err } = await supabase.from('events').delete().eq('id', id);
            if (err) throw err;
            await fetchEvents();
            setDeleteConfirm(null);
            if (showModal) closeModal();
        } catch (e: any) {
            alert(`Erro ao excluir: ${e.message}`);
        } finally {
            setSaving(false);
        }
    };

    // ── Filter events for list view ────────────────────────────────────────────
    const monthPrefix = `${calYear}-${String(calMonth + 1).padStart(2, '0')}`;
    const monthEvents = events.filter(e => e.start_date.startsWith(monthPrefix));

    // ── Render ─────────────────────────────────────────────────────────────────
    return (
        <div className="space-y-6">

            {/* ── Toolbar ── */}
            <div className="flex flex-wrap justify-between items-center gap-4">
                {/* View toggle */}
                <div className="flex gap-2 bg-white rounded-lg p-1 border border-secondary/10 shadow-sm">
                    <button
                        onClick={() => setView('calendar')}
                        className={`p-2 rounded-md ${view === 'calendar' ? 'bg-primary text-white shadow-sm' : 'text-text-muted hover:bg-surface-soft'}`}
                        title="Calendário"
                    >
                        <span className="material-symbols-outlined text-lg">calendar_month</span>
                    </button>
                    <button
                        onClick={() => setView('list')}
                        className={`p-2 rounded-md ${view === 'list' ? 'bg-primary text-white shadow-sm' : 'text-text-muted hover:bg-surface-soft'}`}
                        title="Lista"
                    >
                        <span className="material-symbols-outlined text-lg">view_list</span>
                    </button>
                </div>

                {/* Month / nav */}
                <h2 className="font-display text-2xl font-bold text-text-main">
                    {MONTH_NAMES[calMonth]} {calYear}
                </h2>

                <div className="flex items-center gap-2">
                    <button
                        onClick={goToday}
                        className="px-3 py-1.5 bg-white border border-primary/10 rounded-lg hover:bg-surface-soft text-text-muted text-sm font-medium"
                    >
                        Hoje
                    </button>
                    <button
                        onClick={prevMonth}
                        className="p-1.5 bg-white border border-primary/10 rounded-lg hover:bg-surface-soft text-text-muted"
                    >
                        <span className="material-symbols-outlined text-lg">chevron_left</span>
                    </button>
                    <button
                        onClick={nextMonth}
                        className="p-1.5 bg-white border border-primary/10 rounded-lg hover:bg-surface-soft text-text-muted"
                    >
                        <span className="material-symbols-outlined text-lg">chevron_right</span>
                    </button>
                    <button
                        onClick={() => openCreate()}
                        className="flex items-center gap-1 px-4 py-1.5 bg-primary text-white rounded-lg text-sm font-bold shadow-sm hover:bg-primary-dark transition-colors ml-2"
                    >
                        <span className="material-symbols-outlined text-lg">add</span>
                        Novo Evento
                    </button>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                    ⚠️ {error}
                </div>
            )}

            {loading && (
                <div className="text-center py-12 text-text-muted">Carregando eventos…</div>
            )}

            {/* ── Calendar View ── */}
            {!loading && view === 'calendar' && (
                <div className="bg-white rounded-2xl shadow-sm border border-secondary/10 p-4 md:p-6">
                    {/* Weekday headers */}
                    <div className="grid grid-cols-7 text-center mb-2">
                        {['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB'].map(d => (
                            <div key={d} className="text-xs font-bold text-secondary uppercase tracking-wider py-2">{d}</div>
                        ))}
                    </div>

                    {/* Days grid */}
                    <div className="grid grid-cols-7">
                        {/* Empty cells before first day */}
                        {Array.from({ length: firstWeekday }).map((_, i) => (
                            <div key={`empty-${i}`} className="border border-primary/5 min-h-[100px]" />
                        ))}

                        {/* Day cells */}
                        {Array.from({ length: daysInMonth }, (_, i) => {
                            const day = i + 1;
                            const dayEvts = eventsForDay(day);
                            return (
                                <div
                                    key={day}
                                    className={`border border-primary/5 min-h-[100px] p-1.5 flex flex-col gap-1 cursor-pointer hover:bg-surface-soft/50 transition-colors ${isToday(day) ? 'bg-primary/5' : ''}`}
                                    onClick={() => openCreate(day)}
                                >
                                    <span className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full self-start ${isToday(day) ? 'bg-primary text-white' : 'text-text-muted'}`}>
                                        {day}
                                    </span>
                                    {dayEvts.map(ev => (
                                        <div
                                            key={ev.id}
                                            onClick={(e) => { e.stopPropagation(); openEdit(ev); }}
                                            className={`w-full px-1.5 py-0.5 rounded text-[10px] font-bold truncate cursor-pointer hover:opacity-80 ${TYPE_COLORS[ev.type]}`}
                                            title={ev.title}
                                        >
                                            {ev.start_date.slice(11, 16)} {ev.title}
                                        </div>
                                    ))}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* ── List View ── */}
            {!loading && view === 'list' && (
                <div className="bg-white rounded-2xl shadow-sm border border-secondary/10 overflow-hidden">
                    {monthEvents.length === 0 ? (
                        <div className="text-center py-16 text-text-muted">
                            <span className="material-symbols-outlined text-4xl block mb-2 text-primary/30">event</span>
                            Nenhum evento neste mês.
                            <br />
                            <button onClick={() => openCreate()} className="mt-4 text-primary font-bold hover:underline text-sm">
                                + Adicionar evento
                            </button>
                        </div>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="text-xs text-secondary bg-surface-soft uppercase tracking-wider">
                                    <th className="px-6 py-4 font-bold border-b border-primary/10">Data / Hora</th>
                                    <th className="px-6 py-4 font-bold border-b border-primary/10">Evento</th>
                                    <th className="px-6 py-4 font-bold border-b border-primary/10">Tipo</th>
                                    <th className="px-6 py-4 font-bold border-b border-primary/10">Status</th>
                                    <th className="px-6 py-4 font-bold border-b border-primary/10"></th>
                                </tr>
                            </thead>
                            <tbody className="text-sm text-text-muted divide-y divide-primary/5">
                                {monthEvents.map(ev => (
                                    <tr key={ev.id} className="hover:bg-surface-cream transition-colors">
                                        <td className="px-6 py-4 font-bold text-text-main whitespace-nowrap">
                                            {new Date(ev.start_date).toLocaleDateString('pt-BR')}
                                            <span className="font-normal text-text-muted ml-2">{ev.start_date.slice(11, 16)}</span>
                                        </td>
                                        <td className="px-6 py-4">{ev.title}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${TYPE_COLORS[ev.type]}`}>
                                                {TYPE_LABELS[ev.type]}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${STATUS_COLORS[ev.status]}`}>
                                                {STATUS_LABELS[ev.status]}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => openEdit(ev)}
                                                className="text-primary hover:underline text-xs font-bold"
                                            >
                                                Editar
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            )}

            {/* ── Modal Create/Edit ── */}
            {showModal && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-primary/10 overflow-hidden">
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-primary/10 bg-surface-soft">
                            <h3 className="font-display text-lg font-bold text-text-main">
                                {editingEvent ? 'Editar Evento' : 'Novo Evento'}
                            </h3>
                            <button onClick={closeModal} className="text-text-muted hover:text-primary transition-colors">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        {/* Body */}
                        <div className="p-6 space-y-4">
                            {/* Title */}
                            <div>
                                <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-1">Título *</label>
                                <input
                                    type="text"
                                    className="w-full px-4 py-2 rounded-lg border border-primary/15 focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none text-sm"
                                    placeholder="Nome do evento"
                                    value={form.title}
                                    onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                                />
                            </div>

                            {/* Date/Time row */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-1">Início *</label>
                                    <input
                                        type="datetime-local"
                                        className="w-full px-3 py-2 rounded-lg border border-primary/15 focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none text-sm"
                                        value={form.start_date}
                                        onChange={e => setForm(f => ({ ...f, start_date: e.target.value, end_date: e.target.value }))}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-1">Término</label>
                                    <input
                                        type="datetime-local"
                                        className="w-full px-3 py-2 rounded-lg border border-primary/15 focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none text-sm"
                                        value={form.end_date}
                                        onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))}
                                    />
                                </div>
                            </div>

                            {/* Type / Status row */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-1">Tipo</label>
                                    <select
                                        className="w-full px-3 py-2 rounded-lg border border-primary/15 focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none text-sm bg-white"
                                        value={form.type}
                                        onChange={e => setForm(f => ({ ...f, type: e.target.value as any }))}
                                    >
                                        <option value="birthday">Aniversário</option>
                                        <option value="wedding">Casamento</option>
                                        <option value="corporate">Corporativo</option>
                                        <option value="other">Outro</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-1">Status</label>
                                    <select
                                        className="w-full px-3 py-2 rounded-lg border border-primary/15 focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none text-sm bg-white"
                                        value={form.status}
                                        onChange={e => setForm(f => ({ ...f, status: e.target.value as any }))}
                                    >
                                        <option value="pending">Pendente</option>
                                        <option value="confirmed">Confirmado</option>
                                        <option value="completed">Concluído</option>
                                        <option value="cancelled">Cancelado</option>
                                    </select>
                                </div>
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-1">Observações</label>
                                <textarea
                                    className="w-full px-4 py-2 rounded-lg border border-primary/15 focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none text-sm resize-none"
                                    rows={3}
                                    placeholder="Detalhes extras, contato, decoração…"
                                    value={form.description}
                                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                                />
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-between px-6 py-4 border-t border-primary/10 bg-surface-soft">
                            {editingEvent ? (
                                deleteConfirm === editingEvent.id ? (
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-red-600 font-bold">Confirmar exclusão?</span>
                                        <button
                                            onClick={() => handleDelete(editingEvent.id)}
                                            disabled={saving}
                                            className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-bold hover:bg-red-700 disabled:opacity-50"
                                        >
                                            Sim, excluir
                                        </button>
                                        <button
                                            onClick={() => setDeleteConfirm(null)}
                                            className="px-3 py-1.5 bg-white border border-gray-200 text-text-muted rounded-lg text-xs font-bold"
                                        >
                                            Cancelar
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => setDeleteConfirm(editingEvent.id)}
                                        className="flex items-center gap-1 text-red-500 hover:text-red-700 text-xs font-bold"
                                    >
                                        <span className="material-symbols-outlined text-sm">delete</span>
                                        Excluir
                                    </button>
                                )
                            ) : <div />}

                            <div className="flex gap-3">
                                <button onClick={closeModal} className="px-4 py-2 bg-white border border-primary/15 text-text-muted rounded-lg text-sm font-bold hover:bg-surface-soft">
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="px-5 py-2 bg-primary text-white rounded-lg text-sm font-bold shadow-sm hover:bg-primary-dark disabled:opacity-50 transition-colors"
                                >
                                    {saving ? 'Salvando…' : editingEvent ? 'Salvar' : 'Criar Evento'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminAgenda;
