import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';

interface Purchase {
    id: string;
    list_number: string | null;
    customer_name: string;
    customer_email: string;
    customer_phone: string;
    items: { geral?: number; meia?: number; passaporte?: number; combo?: number; pescaria?: number; brinquedos?: number };
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
    const labels: Record<string, string> = { 
        geral: 'Geral', 
        meia: 'Meia',
        passaporte: 'Kids', 
        combo: 'Combo',
        pescaria: 'Pesc.',
        brinquedos: 'Brinq.'
    };
    return Object.entries(items || {})
        .filter(([, v]) => (v as number) > 0)
        .map(([k, v]) => `${v}x ${labels[k] || k}`)
        .join(' · ');
};

const ArraiaLista: React.FC = () => {
    const [purchases, setPurchases] = useState<Purchase[]>([]);
    const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'checked_in'>('all');
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState<Purchase | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);

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
        // ... (same logic as before)
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Deseja realmente excluir este registro? Esta ação é permanente.')) return;
        
        console.log('Tentando excluir registro:', id);
        setDeletingId(id);
        
        try {
            const { error, status } = await supabase.from('arraia_purchases').delete().eq('id', id);

            if (error) {
                console.error('Erro de Supabase ao excluir:', error);
                alert(`Erro ao excluir: ${error.message}`);
            } else {
                console.log('Exclusão bem-sucedida');
                fetchPurchases();
                alert('Registro excluído com sucesso!');
            }
        } catch (err) {
            console.error('Erro inesperado na exclusão:', err);
            alert('Um erro fatal ocorreu ao tentar excluir.');
        } finally {
            setDeletingId(null);
        }
    };

    const handleResetList = async () => {
        const confirm1 = window.confirm('🛑 ATENÇÃO: Esta ação apagará TODOS os registros de vendas do Arraiá. Deseja continuar?');
        if (!confirm1) return;
        
        const confirm2 = window.prompt('⚠️ CONFIRMAÇÃO FINAL: Digite "RESETAR" para confirmar a exclusão de todos os dados e o reset do contador.');
        if (confirm2 !== 'RESETAR') return;

        setLoading(true);
        const { error } = await supabase.from('arraia_purchases').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        
        if (error) alert('Erro ao limpar lista: ' + error.message);
        else {
            alert('Lista limpa com sucesso! Agora você deve resetar o contador no SQL Editor do Supabase.');
            fetchPurchases();
        }
        setLoading(false);
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editing) return;
        const { error } = await supabase
            .from('arraia_purchases')
            .update({
                customer_name: editing.customer_name,
                customer_email: editing.customer_email,
                customer_phone: editing.customer_phone,
                payment_status: editing.payment_status,
            })
            .eq('id', editing.id);
        
        if (error) alert('Erro ao salvar: ' + error.message);
        else {
            setEditing(null);
            fetchPurchases();
        }
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
                    style={{ padding: '10px 16px', borderRadius: '12px', background: '#D9981F', color: '#1C0C04', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>download</span> CSV
                </button>
                <button onClick={handleResetList}
                    style={{ padding: '10px 16px', borderRadius: '12px', background: '#FFF5F5', color: '#E53E3E', border: '1px solid #FED7D7', cursor: 'pointer', fontWeight: 700, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>delete_sweep</span> Limpar Tudo
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
                                {['Nº Lista', 'Nome', 'Telefone', 'Ingressos', 'Total', 'Status', 'Check-in', 'Ações'].map(h => (
                                    <th key={h} style={{ padding: '12px 16px', textAlign: h === 'Ações' ? 'right' : 'left', fontWeight: 700, fontSize: '11px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>{h}</th>
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
                                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                                        <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end' }}>
                                            <button 
                                                onClick={() => {
                                                    const cleanPhone = p.customer_phone.replace(/\D/g, '');
                                                    const msg = `Olá ${p.customer_name}! 🌽\n\nConfirmamos seu pagamento para o *Arraiá do Quintal da Fafá 2026*!\n\n📌 *SEU NÚMERO NA LISTA: ${p.list_number || 'PENDENTE'}*\n🛒 Ingressos: ${formatItems(p.items)}\n\nGuarde este número para a portaria! Nos vemos lá! 🤠`;
                                                    window.open(`https://wa.me/55${cleanPhone}?text=${encodeURIComponent(msg)}`, '_blank');
                                                }}
                                                style={{ background: '#25D36620', border: 'none', color: '#25D366', cursor: 'pointer', padding: '6px', borderRadius: '8px' }}
                                                title="Reenviar WhatsApp"
                                            >
                                                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>whatsapp</span>
                                            </button>
                                            <button onClick={() => setEditing(p)} style={{ background: '#5C2E0A10', border: 'none', color: '#5C2E0A', cursor: 'pointer', padding: '6px', borderRadius: '8px' }} title="Editar">
                                                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>edit</span>
                                            </button>
                                            <button onClick={() => handleDelete(p.id)} disabled={deletingId === p.id} style={{ background: '#EF444410', border: 'none', color: '#EF4444', cursor: 'pointer', padding: '6px', borderRadius: '8px', opacity: deletingId === p.id ? 0.5 : 1 }} title="Excluir">
                                                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>delete</span>
                                            </button>
                                        </div>
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

            {/* Modal de Edição */}
            {editing && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, backdropFilter: 'blur(4px)' }}>
                    <div style={{ background: 'white', padding: '24px', borderRadius: '24px', width: '100%', maxWidth: '400px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
                        <h3 style={{ margin: '0 0 20px 0', color: '#5C2E0A', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span className="material-symbols-outlined">edit</span> Editar Registro
                        </h3>
                        <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#7a5235', textTransform: 'uppercase', marginBottom: '4px' }}>Nome do Cliente</label>
                                <input type="text" value={editing.customer_name} onChange={e => setEditing({...editing, customer_name: e.target.value})} 
                                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e0cdb0', color: '#1C0C04' }} required />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#7a5235', textTransform: 'uppercase', marginBottom: '4px' }}>E-mail</label>
                                <input type="email" value={editing.customer_email} onChange={e => setEditing({...editing, customer_email: e.target.value})} 
                                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e0cdb0', color: '#1C0C04' }} required />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#7a5235', textTransform: 'uppercase', marginBottom: '4px' }}>Telefone</label>
                                <input type="text" value={editing.customer_phone} onChange={e => setEditing({...editing, customer_phone: e.target.value})} 
                                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e0cdb0', color: '#1C0C04' }} required />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#7a5235', textTransform: 'uppercase', marginBottom: '4px' }}>Status de Pagamento</label>
                                <select value={editing.payment_status} onChange={e => setEditing({...editing, payment_status: e.target.value})} 
                                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e0cdb0', color: '#1C0C04', background: 'white' }}>
                                    <option value="pending">Aguardando PIX</option>
                                    <option value="approved">Pago ✅</option>
                                    <option value="rejected">Cancelado</option>
                                </select>
                            </div>
                            <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                                <button type="submit" style={{ flex: 1, padding: '12px', borderRadius: '12px', background: '#5C2E0A', color: '#EDD68A', border: 'none', fontWeight: 700, cursor: 'pointer' }}>Salvar</button>
                                <button type="button" onClick={() => setEditing(null)} style={{ flex: 1, padding: '12px', borderRadius: '12px', background: '#eee', color: '#666', border: 'none', fontWeight: 700, cursor: 'pointer' }}>Cancelar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ArraiaLista;
