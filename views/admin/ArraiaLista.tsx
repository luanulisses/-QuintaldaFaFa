import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';

interface Purchase {
    id: string;
    list_number: string | null;
    customer_name: string;
    customer_email: string;
    customer_phone: string;
    items: { geral?: number; passaporte?: number; combo?: number };
    total_amount: number;
    payment_status: string;
    checked_in: boolean;
    checked_in_at: string | null;
    created_at: string;
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
    pending:  { label: 'Aguardando PIX', color: '#F59E0B' },
    approved: { label: 'Pago ✅',         color: '#10B981' },
    rejected: { label: 'Cancelado',       color: '#EF4444' },
};

const formatItems = (items: Purchase['items']) => {
    const labels: Record<string, string> = { geral: 'Geral', passaporte: 'Kids', combo: 'Combo' };
    return Object.entries(items || {})
        .filter(([, v]) => (v as number) > 0)
        .map(([k, v]) => `${v}x ${labels[k]}`)
        .join(' · ');
};

const ArraiaLista: React.FC = () => {
    const [purchases, setPurchases] = useState<Purchase[]>([]);
    const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'checked_in'>('all');
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);

    const fetchPurchases = useCallback(async () => {
        const { data } = await supabase
            .from('arraia_purchases')
            .select('*')
            .order('created_at', { ascending: false });
        if (data) setPurchases(data);
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchPurchases();
        // Polling a cada 15s para atualizar em tempo real
        const interval = setInterval(fetchPurchases, 15000);
        return () => clearInterval(interval);
    }, [fetchPurchases]);

    const filtered = purchases.filter(p => {
        const matchSearch = search === '' ||
            p.customer_name.toLowerCase().includes(search.toLowerCase()) ||
            p.customer_email.toLowerCase().includes(search.toLowerCase()) ||
            (p.list_number || '').toLowerCase().includes(search.toLowerCase());
        const matchFilter =
            filter === 'all' ? true :
            filter === 'checked_in' ? p.checked_in :
            p.payment_status === filter;
        return matchSearch && matchFilter;
    });

    const stats = {
        total: purchases.length,
        paid: purchases.filter(p => p.payment_status === 'approved').length,
        pending: purchases.filter(p => p.payment_status === 'pending').length,
        checkedIn: purchases.filter(p => p.checked_in).length,
        revenue: purchases.filter(p => p.payment_status === 'approved').reduce((s, p) => s + Number(p.total_amount), 0),
    };

    const exportCSV = () => {
        const rows = [
            ['Nº Lista', 'Nome', 'E-mail', 'Telefone', 'Ingressos', 'Total', 'Status', 'Check-in', 'Data'],
            ...purchases.map(p => [
                p.list_number || '-',
                p.customer_name,
                p.customer_email,
                p.customer_phone,
                formatItems(p.items),
                `R$ ${Number(p.total_amount).toFixed(2)}`,
                STATUS_LABELS[p.payment_status]?.label || p.payment_status,
                p.checked_in ? `Sim (${new Date(p.checked_in_at!).toLocaleTimeString('pt-BR')})` : 'Não',
                new Date(p.created_at).toLocaleString('pt-BR'),
            ])
        ];
        const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
        const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = 'arraia_lista.csv'; a.click();
    };

    return (
        <div style={{ fontFamily: 'Inter, sans-serif', background: '#FDF6EC', minHeight: '100vh', padding: '24px' }}>
            {/* Header */}
            <div style={{ marginBottom: '24px' }}>
                <h1 style={{ fontSize: '28px', fontWeight: 900, color: '#5C2E0A', margin: 0 }}>
                    🌽 Lista de Inscritos — Arraiá 2026
                </h1>
                <p style={{ color: '#7a5235', fontSize: '14px', marginTop: '4px' }}>Atualiza automaticamente a cada 15 segundos</p>
            </div>

            {/* Stats Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px', marginBottom: '24px' }}>
                {[
                    { label: 'Total Inscritos', value: stats.total, color: '#5C2E0A' },
                    { label: 'Pagos ✅', value: stats.paid, color: '#10B981' },
                    { label: 'Aguardando PIX', value: stats.pending, color: '#F59E0B' },
                    { label: 'Check-in Feito', value: stats.checkedIn, color: '#A84B18' },
                    { label: 'Receita Total', value: `R$ ${stats.revenue.toFixed(2).replace('.', ',')}`, color: '#D9981F' },
                ].map((s, i) => (
                    <div key={i} style={{ background: 'white', borderRadius: '16px', padding: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', borderLeft: `4px solid ${s.color}` }}>
                        <p style={{ fontSize: '11px', fontWeight: 700, color: '#7a5235', textTransform: 'uppercase', margin: '0 0 6px 0', letterSpacing: '0.05em' }}>{s.label}</p>
                        <p style={{ fontSize: '24px', fontWeight: 900, color: s.color, margin: 0 }}>{s.value}</p>
                    </div>
                ))}
            </div>

            {/* Filters + Search */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
                <input
                    placeholder="🔍 Buscar por nome, e-mail ou Nº lista..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    style={{ flex: '1', minWidth: '200px', padding: '10px 16px', borderRadius: '12px', border: '1px solid #e0cdb0', fontSize: '14px', background: 'white' }}
                />
                {(['all', 'pending', 'approved', 'checked_in'] as const).map(f => (
                    <button key={f} onClick={() => setFilter(f)}
                        style={{ padding: '10px 16px', borderRadius: '12px', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '13px',
                            background: filter === f ? '#5C2E0A' : 'white',
                            color: filter === f ? '#EDD68A' : '#5C2E0A',
                            boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                        }}>
                        {f === 'all' ? 'Todos' : f === 'checked_in' ? 'Check-in ✅' : STATUS_LABELS[f]?.label}
                    </button>
                ))}
                <button onClick={exportCSV}
                    style={{ padding: '10px 16px', borderRadius: '12px', background: '#D9981F', color: '#1C0C04', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '13px' }}>
                    📥 Exportar CSV
                </button>
                <button onClick={fetchPurchases}
                    style={{ padding: '10px 16px', borderRadius: '12px', background: '#f0e0c0', color: '#5C2E0A', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '13px' }}>
                    🔄 Atualizar
                </button>
            </div>

            {/* Table */}
            {loading ? (
                <p style={{ textAlign: 'center', color: '#7a5235', padding: '40px' }}>Carregando...</p>
            ) : (
                <div style={{ background: 'white', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                        <thead>
                            <tr style={{ background: '#5C2E0A', color: '#EDD68A' }}>
                                {['Nº Lista', 'Nome', 'Telefone', 'Ingressos', 'Total', 'Status', 'Check-in'].map(h => (
                                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 700, fontSize: '11px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.length === 0 ? (
                                <tr><td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: '#7a5235' }}>Nenhum resultado encontrado</td></tr>
                            ) : filtered.map((p, i) => (
                                <tr key={p.id} style={{ borderBottom: '1px solid #f5ece0', background: i % 2 === 0 ? 'white' : '#FEFAF5' }}>
                                    <td style={{ padding: '12px 16px', fontWeight: 900, color: '#D9981F', fontFamily: 'monospace', fontSize: '14px' }}>
                                        {p.list_number || '—'}
                                    </td>
                                    <td style={{ padding: '12px 16px', fontWeight: 600, color: '#1C0C04' }}>
                                        {p.customer_name}
                                        <br/><span style={{ fontSize: '11px', color: '#7a5235', fontWeight: 400 }}>{p.customer_email}</span>
                                    </td>
                                    <td style={{ padding: '12px 16px', color: '#5C2E0A' }}>{p.customer_phone}</td>
                                    <td style={{ padding: '12px 16px', color: '#5C2E0A' }}>{formatItems(p.items)}</td>
                                    <td style={{ padding: '12px 16px', fontWeight: 700, color: '#D9981F' }}>
                                        R$ {Number(p.total_amount).toFixed(2).replace('.', ',')}
                                    </td>
                                    <td style={{ padding: '12px 16px' }}>
                                        <span style={{ background: (STATUS_LABELS[p.payment_status]?.color || '#7a5235') + '20', color: STATUS_LABELS[p.payment_status]?.color || '#7a5235', padding: '4px 10px', borderRadius: '999px', fontSize: '11px', fontWeight: 700 }}>
                                            {STATUS_LABELS[p.payment_status]?.label || p.payment_status}
                                        </span>
                                    </td>
                                    <td style={{ padding: '12px 16px', color: p.checked_in ? '#10B981' : '#7a5235', fontWeight: p.checked_in ? 700 : 400, fontSize: '12px' }}>
                                        {p.checked_in
                                            ? `✅ ${p.checked_in_at ? new Date(p.checked_in_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : 'Sim'}`
                                            : '—'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <div style={{ padding: '12px 16px', borderTop: '1px solid #f5ece0', fontSize: '12px', color: '#7a5235' }}>
                        Exibindo {filtered.length} de {purchases.length} registros
                    </div>
                </div>
            )}
        </div>
    );
};

export default ArraiaLista;
