import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

interface Lead {
    id: string;
    name: string;
    phone: string;
    event_date: string;
    guests: number;
    status: string;
    created_at: string;
}

interface Event {
    id: string;
    title: string;
    start_date: string; // ISO timestamp
    type: string;
    status: string;
}

interface FinancialMovement {
    id: string;
    type: 'Receita' | 'Despesa';
    amount: number;
    date: string;
}

const AdminDashboard: React.FC = () => {
    const [recentLeads, setRecentLeads] = useState<Lead[]>([]);
    const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
    const [kpis, setKpis] = useState({
        eventsThisMonth: 0,
        newLeads: 0,
        revenueThisMonth: 0,
        expensesThisMonth: 0,
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        setLoading(true);
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
        const today = now.toISOString().split('T')[0];

        try {
            // Fetch recent leads (last 5)
            const { data: leadsData } = await supabase
                .from('leads')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(5);

            // Fetch upcoming events (from today onwards, next 5)
            const { data: eventsData } = await supabase
                .from('events')
                .select('id, title, start_date, type, status')
                .gte('start_date', today + 'T00:00:00')
                .order('start_date', { ascending: true })
                .limit(5);

            // Count events this month
            const { count: eventsCount } = await supabase
                .from('events')
                .select('*', { count: 'exact', head: true })
                .gte('start_date', startOfMonth + 'T00:00:00')
                .lte('start_date', endOfMonth + 'T23:59:59');

            // Count new leads this month
            const { count: leadsCount } = await supabase
                .from('leads')
                .select('*', { count: 'exact', head: true })
                .gte('created_at', startOfMonth + 'T00:00:00')
                .lte('created_at', endOfMonth + 'T23:59:59');

            // Revenue this month
            const { data: revenueData } = await supabase
                .from('financial_movements')
                .select('amount')
                .eq('type', 'Receita')
                .gte('date', startOfMonth)
                .lte('date', endOfMonth);

            // Expenses this month
            const { data: expensesData } = await supabase
                .from('financial_movements')
                .select('amount')
                .eq('type', 'Despesa')
                .gte('date', startOfMonth)
                .lte('date', endOfMonth);

            const totalRevenue = (revenueData || []).reduce((sum, r) => sum + Number(r.amount), 0);
            const totalExpenses = (expensesData || []).reduce((sum, r) => sum + Number(r.amount), 0);

            // Group duplicates in recent leads to avoid visual noise
            const groupedLeadsMap = new Map();
            (leadsData || []).forEach(l => {
                const key = `${l.name.trim().toLowerCase()}_${l.phone.replace(/\D/g, '')}_${l.event_date || ''}`;
                if (!groupedLeadsMap.has(key)) {
                    groupedLeadsMap.set(key, l);
                }
            });
            const uniqueRecentLeads = Array.from(groupedLeadsMap.values());

            setRecentLeads(uniqueRecentLeads);
            setUpcomingEvents(eventsData || []);
            setKpis({
                eventsThisMonth: eventsCount || 0,
                newLeads: leadsCount || 0,
                revenueThisMonth: totalRevenue,
                expensesThisMonth: totalExpenses,
            });
        } catch (err) {
            console.error('Erro ao carregar dados do dashboard:', err);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (value: number) =>
        value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return '-';
        return new Date(dateStr + 'T00:00:00').toLocaleDateString('pt-BR');
    };

    const getMonthAbbr = (dateStr: string) => {
        const months = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];
        return months[new Date(dateStr).getMonth()];
    };

    const getDayNum = (dateStr: string) => {
        return new Date(dateStr).getDate();
    };

    const getEventTime = (dateStr: string) => {
        return dateStr.slice(11, 16); // HH:MM from ISO string
    };

    const EVENT_TYPE_LABELS: Record<string, string> = {
        birthday: 'Aniversário',
        wedding: 'Casamento',
        corporate: 'Corporativo',
        other: 'Outro',
    };

    const EVENT_STATUS_COLORS: Record<string, string> = {
        confirmed: 'bg-green-100 text-green-700',
        pending: 'bg-yellow-100 text-yellow-700',
        completed: 'bg-blue-100 text-blue-700',
        cancelled: 'bg-red-100 text-red-600',
    };

    const EVENT_STATUS_LABELS: Record<string, string> = {
        confirmed: 'Confirmado',
        pending: 'Pendente',
        completed: 'Concluído',
        cancelled: 'Cancelado',
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Novo': return 'bg-blue-100 text-blue-700';
            case 'Em Negociação': return 'bg-yellow-100 text-yellow-700';
            case 'Fechado': return 'bg-green-100 text-green-700';
            case 'Perdido': return 'bg-red-100 text-red-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    const eventColors = ['bg-primary', 'bg-secondary', 'bg-accent', 'bg-green-500', 'bg-purple-500'];

    return (
        <div className="space-y-8">
            {/* Quick Actions */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-primary/10">
                <h2 className="font-display text-lg font-bold text-text-main mb-4">Gestão de Conteúdo (Acesso Rápido)</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Link to="/admin/conteudo" className="flex items-center gap-4 p-4 rounded-xl bg-surface-soft hover:bg-white border border-transparent hover:border-primary/20 hover:shadow-md transition-all group">
                        <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center group-hover:scale-110 transition-transform">
                            <span className="material-symbols-outlined">web</span>
                        </div>
                        <div>
                            <h3 className="font-bold text-text-main group-hover:text-primary transition-colors">Conteúdo do Site</h3>
                            <p className="text-xs text-text-muted">Editar textos, hero e estrutura</p>
                        </div>
                    </Link>
                    <Link to="/admin/galeria" className="flex items-center gap-4 p-4 rounded-xl bg-surface-soft hover:bg-white border border-transparent hover:border-primary/20 hover:shadow-md transition-all group">
                        <div className="w-12 h-12 rounded-full bg-secondary/10 text-secondary flex items-center justify-center group-hover:scale-110 transition-transform">
                            <span className="material-symbols-outlined">photo_library</span>
                        </div>
                        <div>
                            <h3 className="font-bold text-text-main group-hover:text-primary transition-colors">Galeria de Fotos</h3>
                            <p className="text-xs text-text-muted">Adicionar ou remover fotos</p>
                        </div>
                    </Link>
                    <Link to="/admin/depoimentos" className="flex items-center gap-4 p-4 rounded-xl bg-surface-soft hover:bg-white border border-transparent hover:border-primary/20 hover:shadow-md transition-all group">
                        <div className="w-12 h-12 rounded-full bg-accent/10 text-accent flex items-center justify-center group-hover:scale-110 transition-transform">
                            <span className="material-symbols-outlined">reviews</span>
                        </div>
                        <div>
                            <h3 className="font-bold text-text-main group-hover:text-primary transition-colors">Depoimentos</h3>
                            <p className="text-xs text-text-muted">Gerenciar avaliações de clientes</p>
                        </div>
                    </Link>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-secondary/10 flex flex-col justify-between h-32 relative overflow-hidden group hover:shadow-lg transition-all">
                    <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                        <span className="material-symbols-outlined text-6xl text-primary">event_available</span>
                    </div>
                    <span className="text-secondary text-sm font-bold uppercase tracking-wider">Eventos este Mês</span>
                    <div className="flex items-end gap-2">
                        {loading ? (
                            <span className="text-4xl font-display font-bold text-text-main animate-pulse">...</span>
                        ) : (
                            <span className="text-4xl font-display font-bold text-text-main">{kpis.eventsThisMonth}</span>
                        )}
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-secondary/10 flex flex-col justify-between h-32 relative overflow-hidden group hover:shadow-lg transition-all">
                    <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                        <span className="material-symbols-outlined text-6xl text-accent">person_add</span>
                    </div>
                    <span className="text-secondary text-sm font-bold uppercase tracking-wider">Novos Leads (Mês)</span>
                    <div className="flex items-end gap-2">
                        {loading ? (
                            <span className="text-4xl font-display font-bold text-text-main animate-pulse">...</span>
                        ) : (
                            <span className="text-4xl font-display font-bold text-text-main">{kpis.newLeads}</span>
                        )}
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-secondary/10 flex flex-col justify-between h-32 relative overflow-hidden group hover:shadow-lg transition-all">
                    <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                        <span className="material-symbols-outlined text-6xl text-green-600">attach_money</span>
                    </div>
                    <span className="text-secondary text-sm font-bold uppercase tracking-wider">Receita (Mês)</span>
                    <div className="flex items-end gap-2">
                        {loading ? (
                            <span className="text-3xl font-display font-bold text-text-main animate-pulse">...</span>
                        ) : (
                            <span className="text-3xl font-display font-bold text-text-main">{formatCurrency(kpis.revenueThisMonth)}</span>
                        )}
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-secondary/10 flex flex-col justify-between h-32 relative overflow-hidden group hover:shadow-lg transition-all">
                    <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                        <span className="material-symbols-outlined text-6xl text-red-400">money_off</span>
                    </div>
                    <span className="text-secondary text-sm font-bold uppercase tracking-wider">Despesas (Mês)</span>
                    <div className="flex items-end gap-2">
                        {loading ? (
                            <span className="text-3xl font-display font-bold text-text-main animate-pulse">...</span>
                        ) : (
                            <span className="text-3xl font-display font-bold text-text-main">{formatCurrency(kpis.expensesThisMonth)}</span>
                        )}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Recent Leads */}
                <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-secondary/10 overflow-hidden">
                    <div className="p-6 border-b border-light flex justify-between items-center">
                        <h3 className="font-display text-lg font-bold text-text-main">Orçamentos Recentes</h3>
                        <Link to="/admin/orcamentos" className="text-primary text-sm font-bold hover:underline">Ver todos</Link>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="text-xs text-secondary bg-surface-soft uppercase tracking-wider">
                                    <th className="px-6 py-3 font-bold border-b border-primary/10">Nome</th>
                                    <th className="px-6 py-3 font-bold border-b border-primary/10">Data Evento</th>
                                    <th className="px-6 py-3 font-bold border-b border-primary/10">Status</th>
                                    <th className="px-6 py-3 font-bold border-b border-primary/10 text-right">Ação</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm text-text-muted divide-y divide-primary/5">
                                {loading ? (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-8 text-center text-text-muted">
                                            <div className="flex justify-center items-center gap-2">
                                                <span className="material-symbols-outlined animate-spin">sync</span>
                                                Carregando...
                                            </div>
                                        </td>
                                    </tr>
                                ) : recentLeads.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-10 text-center text-text-muted">
                                            <div className="flex flex-col items-center gap-2">
                                                <span className="material-symbols-outlined text-4xl opacity-30">inbox</span>
                                                <p>Nenhum orçamento recebido ainda.</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    recentLeads.map((lead) => (
                                        <tr key={lead.id} className="hover:bg-primary/5 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-text-main">{lead.name}</span>
                                                    <span className="text-xs text-text-muted">{lead.phone}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">{formatDate(lead.event_date)}</td>
                                            <td className="px-6 py-4">
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(lead.status)}`}>
                                                    {lead.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <Link
                                                    to="/admin/orcamentos"
                                                    className="text-primary hover:text-primary-dark font-bold text-xs bg-surface-soft px-3 py-1.5 rounded-lg transition-colors"
                                                >
                                                    Ver
                                                </Link>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Upcoming Events */}
                <div className="bg-white rounded-2xl shadow-sm border border-secondary/10 overflow-hidden">
                    <div className="p-6 border-b border-light">
                        <h3 className="font-display text-lg font-bold text-text-main">Próximos Eventos</h3>
                    </div>
                    <div className="p-4 space-y-3">
                        {loading ? (
                            <div className="flex justify-center items-center py-8 text-text-muted gap-2">
                                <span className="material-symbols-outlined animate-spin">sync</span>
                                Carregando...
                            </div>
                        ) : upcomingEvents.length === 0 ? (
                            <div className="flex flex-col items-center py-8 gap-2 text-text-muted">
                                <span className="material-symbols-outlined text-4xl opacity-30">event_busy</span>
                                <p className="text-sm">Nenhum evento próximo.</p>
                            </div>
                        ) : (
                            upcomingEvents.map((event, idx) => (
                                <div key={event.id} className="flex items-start gap-4 p-3 rounded-xl bg-surface-soft border border-primary/10 hover:border-primary/30 transition-colors">
                                    <div className={`flex-shrink-0 w-12 h-12 ${eventColors[idx % eventColors.length]} text-white rounded-xl flex flex-col items-center justify-center shadow-sm`}>
                                        <span className="text-xs font-bold uppercase">{getMonthAbbr(event.start_date)}</span>
                                        <span className="text-lg font-bold leading-none">{getDayNum(event.start_date)}</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-bold text-text-main text-sm truncate">{event.title}</h4>
                                        <p className="text-xs text-text-muted mt-0.5 flex items-center gap-1 flex-wrap">
                                            <span className="material-symbols-outlined text-[10px]">schedule</span>
                                            {getEventTime(event.start_date)}
                                            <span className="mx-1">•</span>
                                            <span className="text-[10px]">{EVENT_TYPE_LABELS[event.type] || event.type}</span>
                                            <span className="mx-1">•</span>
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${EVENT_STATUS_COLORS[event.status] || 'bg-gray-100 text-gray-600'}`}>
                                                {EVENT_STATUS_LABELS[event.status] || event.status}
                                            </span>
                                        </p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
