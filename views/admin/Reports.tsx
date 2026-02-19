import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

interface ReportData {
    events: any[];
    financial: any[];
    stats: {
        totalEvents: number;
        totalRevenue: number;
        totalExpense: number;
        leadsConverted: number;
    };
}

const AdminReports: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const [period, setPeriod] = useState(() => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    });
    const [data, setData] = useState<ReportData | null>(null);

    const fetchReport = async () => {
        setLoading(true);
        try {
            const [year, month] = period.split('-');
            const firstDay = `${year}-${month}-01`;
            const lastDay = new Date(Number(year), Number(month), 0).toISOString().split('T')[0];

            // 1. Fetch Events
            const { data: events } = await supabase
                .from('events')
                .select('*')
                .gte('start_date', `${firstDay}T00:00:00`)
                .lte('start_date', `${lastDay}T23:59:59`)
                .neq('status', 'cancelled');

            // 2. Fetch Financial
            const { data: financial } = await supabase
                .from('financial_movements')
                .select('*')
                .gte('date', firstDay)
                .lte('date', lastDay);

            // 3. Fetch Leads for conversion stat (Simplified: leads closed this month)
            const { data: leads } = await supabase
                .from('leads')
                .select('id')
                .eq('status', 'Fechado')
                .gte('created_at', firstDay)
                .lte('created_at', `${lastDay}T23:59:59`);

            const rev = (financial || []).filter(f => f.type === 'Receita').reduce((sum, f) => sum + Number(f.amount), 0);
            const exp = (financial || []).filter(f => f.type === 'Despesa').reduce((sum, f) => sum + Number(f.amount), 0);

            setData({
                events: events || [],
                financial: financial || [],
                stats: {
                    totalEvents: events?.length || 0,
                    totalRevenue: rev,
                    totalExpense: exp,
                    leadsConverted: leads?.length || 0
                }
            });
        } catch (err) {
            console.error('Erro ao gerar relatório:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReport();
    }, [period]);

    const handlePrint = () => {
        window.print();
    };

    const formatBRL = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    return (
        <div className="space-y-6">
            {/* Header - Hidden on Print */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 print:hidden">
                <div>
                    <h1 className="font-display text-2xl font-bold text-text-main">Relatórios e Fechamento</h1>
                    <p className="text-sm text-text-muted">Análise de desempenho e financeiro por período.</p>
                </div>
                <div className="flex gap-3">
                    <input
                        type="month"
                        value={period}
                        onChange={e => setPeriod(e.target.value)}
                        className="px-4 py-2 rounded-xl border border-primary/10 bg-white text-sm outline-none focus:border-primary shadow-sm"
                    />
                    <button
                        onClick={handlePrint}
                        className="flex items-center gap-2 bg-secondary text-white px-5 py-2.5 rounded-xl font-bold shadow-md hover:bg-secondary-dark transition-all"
                    >
                        <span className="material-symbols-outlined text-lg">print</span>
                        Imprimir / PDF
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="py-20 text-center text-text-muted">Gerando relatório...</div>
            ) : data && (
                <div id="report-content" className="space-y-8 bg-white p-0 md:p-8 rounded-2xl md:shadow-sm border-0 md:border border-secondary/5 print:border-0 print:p-0">

                    {/* Report Header for Print */}
                    <div className="hidden print:block text-center border-b pb-6 mb-8">
                        <h1 className="text-2xl font-bold">Quintal da Fafá - Gerencial</h1>
                        <p className="text-sm text-gray-500">Relatório Mensal: {period}</p>
                        <p className="text-[10px] mt-1">Gerado em: {new Date().toLocaleString('pt-BR')}</p>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-surface-cream p-5 rounded-2xl border border-primary/5">
                            <p className="text-[10px] font-black uppercase text-secondary tracking-widest mb-1">Eventos Realizados</p>
                            <p className="text-3xl font-display font-bold text-text-main">{data.stats.totalEvents}</p>
                        </div>
                        <div className="bg-green-50 p-5 rounded-2xl border border-green-100">
                            <p className="text-[10px] font-black uppercase text-green-700 tracking-widest mb-1">Receita Total</p>
                            <p className="text-3xl font-display font-bold text-green-700">{formatBRL(data.stats.totalRevenue)}</p>
                        </div>
                        <div className="bg-red-50 p-5 rounded-2xl border border-red-100">
                            <p className="text-[10px] font-black uppercase text-red-700 tracking-widest mb-1">Despesa Total</p>
                            <p className="text-3xl font-display font-bold text-red-700">{formatBRL(data.stats.totalExpense)}</p>
                        </div>
                        <div className="bg-primary/10 p-5 rounded-2xl border border-primary/20">
                            <p className="text-[10px] font-black uppercase text-primary tracking-widest mb-1">Novos Contratos</p>
                            <p className="text-3xl font-display font-bold text-primary">{data.stats.leadsConverted}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* List of Events */}
                        <div className="space-y-4">
                            <h3 className="font-bold text-lg flex items-center gap-2 border-b pb-2 text-text-main">
                                <span className="material-symbols-outlined text-primary">calendar_today</span>
                                Agenda do Período
                            </h3>
                            <div className="space-y-2">
                                {data.events.length === 0 ? <p className="text-sm text-text-muted italic">Nenhum evento no período.</p> :
                                    data.events.map(ev => (
                                        <div key={ev.id} className="flex justify-between items-center p-3 rounded-xl bg-surface-soft border border-primary/5">
                                            <div>
                                                <p className="text-sm font-bold text-text-main">{ev.title}</p>
                                                <p className="text-[10px] text-text-muted">{new Date(ev.start_date).toLocaleDateString('pt-BR')}</p>
                                            </div>
                                            <span className="text-[10px] bg-white px-2 py-1 rounded-lg border border-primary/10 font-bold uppercase">{ev.type}</span>
                                        </div>
                                    ))
                                }
                            </div>
                        </div>

                        {/* Financial Summary */}
                        <div className="space-y-4">
                            <h3 className="font-bold text-lg flex items-center gap-2 border-b pb-2 text-text-main">
                                <span className="material-symbols-outlined text-primary">account_balance_wallet</span>
                                Resumo Financeiro
                            </h3>
                            <div className="space-y-3">
                                <div className="flex justify-between text-sm">
                                    <span className="text-text-muted">Total Entradas:</span>
                                    <span className="font-bold text-green-600">{formatBRL(data.stats.totalRevenue)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-text-muted">Total Saídas:</span>
                                    <span className="font-bold text-red-500">{formatBRL(data.stats.totalExpense)}</span>
                                </div>
                                <div className="pt-3 border-t flex justify-between">
                                    <span className="font-black uppercase text-xs">Resultado Líquido:</span>
                                    <span className={`font-black text-xl ${data.stats.totalRevenue - data.stats.totalExpense >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                                        {formatBRL(data.stats.totalRevenue - data.stats.totalExpense)}
                                    </span>
                                </div>
                            </div>

                            {/* Mini Category Breakdown */}
                            <div className="mt-6 pt-6 border-t border-dashed">
                                <h4 className="text-xs font-bold uppercase tracking-widest text-secondary mb-3">Distribuição de Saídas</h4>
                                <div className="space-y-2">
                                    {Array.from(new Set(data.financial.filter(f => f.type === 'Despesa').map(f => f.category))).slice(0, 5).map(cat => {
                                        const total = data.financial.filter(f => f.category === cat).reduce((s, f) => s + f.amount, 0);
                                        const perc = (total / data.stats.totalExpense) * 100;
                                        return (
                                            <div key={cat} className="space-y-1">
                                                <div className="flex justify-between text-[10px] font-bold">
                                                    <span>{cat || 'Outros'}</span>
                                                    <span>{formatBRL(total)}</span>
                                                </div>
                                                <div className="w-full bg-surface-soft h-1 rounded-full overflow-hidden">
                                                    <div className="bg-primary h-full" style={{ width: `${perc}%` }} />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Report Footer */}
                    <div className="pt-10 mt-10 border-t border-secondary/10 flex justify-between items-end">
                        <div className="text-[10px] text-text-muted italic">
                            Quintal da Fafá - Gerência © {new Date().getFullYear()}
                        </div>
                        <div className="text-[10px] font-bold uppercase tracking-widest text-secondary">
                            Documento para uso interno
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                @media print {
                    body { background: white !important; }
                    .print\\:hidden { display: none !important; }
                    #report-content { border: none !important; box-shadow: none !important; margin: 0 !important; width: 100% !important; }
                }
            `}</style>
        </div>
    );
};

export default AdminReports;
