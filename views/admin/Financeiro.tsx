import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';

interface FinancialMovement {
    id: string;
    date: string;
    description: string;
    amount: number;
    type: 'Receita' | 'Despesa';
    category: string;
    created_at: string;
}

type FilterType = 'Todos' | 'Receita' | 'Despesa';

const CATEGORIES_RECEITA = ['Sinal', 'Pagamento Final', 'Pacote', 'Outros'];
const CATEGORIES_DESPESA = ['Aluguel', 'Manutenção', 'Limpeza', 'Marketing', 'Decoração', 'Buffet', 'Pessoal', 'Outros'];

const emptyForm = {
    type: 'Receita' as 'Receita' | 'Despesa',
    description: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    category: '',
};

const AdminFinanceiro: React.FC = () => {
    const [movements, setMovements] = useState<FinancialMovement[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterType, setFilterType] = useState<FilterType>('Todos');
    const [filterMonth, setFilterMonth] = useState(() => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    });

    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState(emptyForm);
    const [saving, setSaving] = useState(false);

    const fetchMovements = useCallback(async () => {
        setLoading(true);
        try {
            const [year, month] = filterMonth.split('-');
            const startDate = `${year}-${month}-01`;
            const endDate = new Date(Number(year), Number(month), 0).toISOString().split('T')[0];

            let query = supabase
                .from('financial_movements')
                .select('*')
                .gte('date', startDate)
                .lte('date', endDate)
                .order('date', { ascending: false });

            if (filterType !== 'Todos') {
                query = query.eq('type', filterType);
            }

            const { data, error } = await query;
            if (error) throw error;
            setMovements(data || []);
        } catch (err) {
            console.error('Erro ao buscar movimentos:', err);
        } finally {
            setLoading(false);
        }
    }, [filterType, filterMonth]);

    useEffect(() => {
        fetchMovements();
    }, [fetchMovements]);

    const totalReceita = movements.filter(m => m.type === 'Receita').reduce((s, m) => s + Number(m.amount), 0);
    const totalDespesa = movements.filter(m => m.type === 'Despesa').reduce((s, m) => s + Number(m.amount), 0);
    const saldo = totalReceita - totalDespesa;

    const formatCurrency = (v: number) =>
        v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    const formatDate = (d: string) =>
        new Date(d + 'T00:00:00').toLocaleDateString('pt-BR');

    const openNew = () => {
        setEditingId(null);
        setForm(emptyForm);
        setShowModal(true);
    };

    const openEdit = (m: FinancialMovement) => {
        setEditingId(m.id);
        setForm({
            type: m.type,
            description: m.description,
            amount: String(m.amount),
            date: m.date,
            category: m.category || '',
        });
        setShowModal(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        const payload = {
            type: form.type,
            description: form.description,
            amount: parseFloat(form.amount.replace(',', '.')),
            date: form.date,
            category: form.category,
        };
        try {
            if (editingId) {
                const { error } = await supabase.from('financial_movements').update(payload).eq('id', editingId);
                if (error) throw error;
            } else {
                const { error } = await supabase.from('financial_movements').insert([payload]);
                if (error) throw error;
            }
            setShowModal(false);
            fetchMovements();
        } catch (err) {
            console.error('Erro ao salvar:', err);
            alert('Erro ao salvar. Tente novamente.');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Excluir este lançamento?')) return;
        const { error } = await supabase.from('financial_movements').delete().eq('id', id);
        if (!error) fetchMovements();
    };

    const categories = form.type === 'Receita' ? CATEGORIES_RECEITA : CATEGORIES_DESPESA;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="font-display text-2xl font-bold text-text-main">Fluxo de Caixa</h1>
                    <p className="text-sm text-text-muted">Registre receitas e despesas do espaço.</p>
                </div>
                <button
                    onClick={openNew}
                    className="flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl font-bold shadow-md hover:bg-primary-dark transition-all active:scale-95"
                >
                    <span className="material-symbols-outlined text-lg">add</span>
                    Novo Lançamento
                </button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="bg-white rounded-2xl p-5 border border-secondary/10 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-green-100 text-green-600 flex items-center justify-center flex-shrink-0">
                        <span className="material-symbols-outlined">trending_up</span>
                    </div>
                    <div>
                        <p className="text-xs font-bold text-text-muted uppercase tracking-wider">Receitas</p>
                        <p className="text-2xl font-display font-bold text-green-600">{formatCurrency(totalReceita)}</p>
                    </div>
                </div>
                <div className="bg-white rounded-2xl p-5 border border-secondary/10 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-red-100 text-red-500 flex items-center justify-center flex-shrink-0">
                        <span className="material-symbols-outlined">trending_down</span>
                    </div>
                    <div>
                        <p className="text-xs font-bold text-text-muted uppercase tracking-wider">Despesas</p>
                        <p className="text-2xl font-display font-bold text-red-500">{formatCurrency(totalDespesa)}</p>
                    </div>
                </div>
                <div className={`rounded-2xl p-5 border shadow-sm flex items-center gap-4 ${saldo >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${saldo >= 0 ? 'bg-green-200 text-green-700' : 'bg-red-200 text-red-700'}`}>
                        <span className="material-symbols-outlined">account_balance_wallet</span>
                    </div>
                    <div>
                        <p className="text-xs font-bold text-text-muted uppercase tracking-wider">Saldo do Mês</p>
                        <p className={`text-2xl font-display font-bold ${saldo >= 0 ? 'text-green-700' : 'text-red-600'}`}>{formatCurrency(saldo)}</p>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                <div className="flex bg-white rounded-lg p-1 shadow-sm border border-secondary/10">
                    {(['Todos', 'Receita', 'Despesa'] as FilterType[]).map(f => (
                        <button
                            key={f}
                            onClick={() => setFilterType(f)}
                            className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${filterType === f ? 'bg-primary text-white shadow-sm' : 'text-text-muted hover:bg-surface-soft hover:text-primary'}`}
                        >
                            {f}
                        </button>
                    ))}
                </div>
                <input
                    type="month"
                    value={filterMonth}
                    onChange={e => setFilterMonth(e.target.value)}
                    className="px-4 py-2 rounded-xl border border-secondary/20 bg-white text-sm text-text-main outline-none focus:border-primary shadow-sm"
                />
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-secondary/10 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="text-xs text-secondary bg-surface-soft uppercase tracking-wider">
                                <th className="px-6 py-4 font-bold border-b border-primary/10">Data</th>
                                <th className="px-6 py-4 font-bold border-b border-primary/10">Descrição</th>
                                <th className="px-6 py-4 font-bold border-b border-primary/10">Categoria</th>
                                <th className="px-6 py-4 font-bold border-b border-primary/10">Tipo</th>
                                <th className="px-6 py-4 font-bold border-b border-primary/10 text-right">Valor</th>
                                <th className="px-6 py-4 font-bold border-b border-primary/10 text-right">Ação</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm text-text-muted divide-y divide-primary/5">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-10 text-center">
                                        <div className="flex justify-center items-center gap-2 text-text-muted">
                                            <span className="material-symbols-outlined animate-spin">sync</span>
                                            Carregando...
                                        </div>
                                    </td>
                                </tr>
                            ) : movements.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-14 text-center">
                                        <div className="flex flex-col items-center gap-2 text-text-muted">
                                            <span className="material-symbols-outlined text-5xl opacity-30">receipt_long</span>
                                            <p className="font-medium">Nenhum lançamento neste período.</p>
                                            <p className="text-xs">Clique em <strong>Novo Lançamento</strong> para começar.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                movements.map(m => (
                                    <tr key={m.id} className="hover:bg-surface-cream transition-colors group">
                                        <td className="px-6 py-4 font-medium whitespace-nowrap">{formatDate(m.date)}</td>
                                        <td className="px-6 py-4 font-bold text-text-main">{m.description}</td>
                                        <td className="px-6 py-4 text-text-muted">{m.category || '-'}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1 ${m.type === 'Receita' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                                                <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                                                {m.type}
                                            </span>
                                        </td>
                                        <td className={`px-6 py-4 text-right font-bold text-base ${m.type === 'Receita' ? 'text-green-600' : 'text-red-500'}`}>
                                            {m.type === 'Despesa' ? '- ' : '+ '}{formatCurrency(Number(m.amount))}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => openEdit(m)} className="text-secondary hover:text-primary p-2 hover:bg-surface-soft rounded-lg transition-colors" title="Editar">
                                                    <span className="material-symbols-outlined text-lg">edit</span>
                                                </button>
                                                <button onClick={() => handleDelete(m.id)} className="text-red-400 hover:text-red-600 p-2 hover:bg-red-50 rounded-lg transition-colors" title="Excluir">
                                                    <span className="material-symbols-outlined text-lg">delete</span>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                <div className="border-t border-primary/10 p-4 flex justify-between items-center text-sm text-text-muted bg-surface-cream">
                    <span>{movements.length} lançamento{movements.length !== 1 ? 's' : ''}</span>
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
                        <div className="p-6 border-b border-primary/10 flex justify-between items-center bg-surface-cream">
                            <h3 className="font-display text-xl font-bold text-text-main">
                                {editingId ? 'Editar Lançamento' : 'Novo Lançamento'}
                            </h3>
                            <button onClick={() => setShowModal(false)} className="text-text-muted hover:text-primary">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <form onSubmit={handleSave} className="p-6 space-y-4">
                            {/* Tipo */}
                            <div>
                                <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-2">Tipo</label>
                                <div className="flex gap-2">
                                    {(['Receita', 'Despesa'] as const).map(t => (
                                        <button
                                            key={t}
                                            type="button"
                                            onClick={() => setForm({ ...form, type: t, category: '' })}
                                            className={`flex-1 py-2 rounded-xl font-bold text-sm border-2 transition-all ${form.type === t
                                                ? t === 'Receita' ? 'bg-green-100 border-green-500 text-green-700' : 'bg-red-100 border-red-400 text-red-600'
                                                : 'bg-white border-secondary/20 text-text-muted hover:border-primary/40'}`}
                                        >
                                            {t === 'Receita' ? '↑ Receita' : '↓ Despesa'}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Descrição */}
                            <div>
                                <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1">Descrição</label>
                                <input
                                    required
                                    type="text"
                                    value={form.description}
                                    onChange={e => setForm({ ...form, description: e.target.value })}
                                    placeholder="Ex: Sinal do casamento Ana & João"
                                    className="w-full px-4 py-2.5 rounded-xl border border-primary/20 focus:border-primary outline-none text-sm"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                {/* Valor */}
                                <div>
                                    <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1">Valor (R$)</label>
                                    <input
                                        required
                                        type="number"
                                        min="0.01"
                                        step="0.01"
                                        value={form.amount}
                                        onChange={e => setForm({ ...form, amount: e.target.value })}
                                        placeholder="0,00"
                                        className="w-full px-4 py-2.5 rounded-xl border border-primary/20 focus:border-primary outline-none text-sm"
                                    />
                                </div>
                                {/* Data */}
                                <div>
                                    <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1">Data</label>
                                    <input
                                        required
                                        type="date"
                                        value={form.date}
                                        onChange={e => setForm({ ...form, date: e.target.value })}
                                        className="w-full px-4 py-2.5 rounded-xl border border-primary/20 focus:border-primary outline-none text-sm text-text-main"
                                    />
                                </div>
                            </div>

                            {/* Categoria */}
                            <div>
                                <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1">Categoria</label>
                                <select
                                    value={form.category}
                                    onChange={e => setForm({ ...form, category: e.target.value })}
                                    className="w-full px-4 py-2.5 rounded-xl border border-primary/20 focus:border-primary outline-none text-sm bg-white text-text-main"
                                >
                                    <option value="">Selecionar categoria</option>
                                    {categories.map(c => (
                                        <option key={c} value={c}>{c}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="pt-2 flex justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-4 py-2 text-text-muted hover:bg-surface-soft rounded-lg font-medium text-sm"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="px-6 py-2 bg-primary text-white rounded-lg font-bold shadow-md hover:bg-primary-dark disabled:opacity-70 text-sm"
                                >
                                    {saving ? 'Salvando...' : 'Salvar'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminFinanceiro;
