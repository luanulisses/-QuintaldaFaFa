import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

interface Package {
    id: string;
    name: string;
    description: string;
    base_price: number;
    items: string[];
    min_guests: number;
    max_guests: number;
    is_active: boolean;
}

const AdminPackages: React.FC = () => {
    const [packages, setPackages] = useState<Package[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingPkg, setEditingPkg] = useState<Partial<Package> | null>(null);
    const [newItem, setNewItem] = useState('');
    const [saving, setSaving] = useState(false);

    const fetchPackages = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('packages')
                .select('*')
                .order('base_price', { ascending: true });

            if (error) throw error;
            setPackages(data || []);
        } catch (err) {
            console.error('Erro ao buscar pacotes:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPackages();
    }, []);

    const handleOpenModal = (pkg: Partial<Package> = {}) => {
        setEditingPkg({
            name: '',
            description: '',
            base_price: 0,
            items: [],
            min_guests: 0,
            max_guests: 100,
            is_active: true,
            ...pkg
        });
        setShowModal(true);
    };

    const addItem = () => {
        if (!newItem.trim() || !editingPkg) return;
        setEditingPkg({
            ...editingPkg,
            items: [...(editingPkg.items || []), newItem.trim()]
        });
        setNewItem('');
    };

    const removeItem = (index: number) => {
        if (!editingPkg) return;
        const updated = [...(editingPkg.items || [])];
        updated.splice(index, 1);
        setEditingPkg({ ...editingPkg, items: updated });
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingPkg) return;
        setSaving(true);

        try {
            if (editingPkg.id) {
                const { error } = await supabase.from('packages').update(editingPkg).eq('id', editingPkg.id);
                if (error) throw error;
            } else {
                const { error } = await supabase.from('packages').insert([editingPkg]);
                if (error) throw error;
            }
            setShowModal(false);
            fetchPackages();
        } catch (err) {
            console.error('Erro ao salvar pacote:', err);
            alert('Erro ao salvar pacote.');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Excluir este pacote permanentemente?')) return;
        try {
            const { error } = await supabase.from('packages').delete().eq('id', id);
            if (error) throw error;
            fetchPackages();
        } catch (err) {
            alert('Erro ao excluir.');
        }
    };

    const formatCurrency = (val: number) =>
        val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="font-display text-2xl font-bold text-text-main">Pacotes & Preços</h1>
                    <p className="text-sm text-text-muted">Gerencie as opções de festas e valores base.</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl font-bold shadow-md hover:bg-primary-dark transition-all active:scale-95"
                >
                    <span className="material-symbols-outlined text-lg">add_circle</span>
                    Criar Novo Pacote
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    <div className="col-span-full text-center py-12">Carregando...</div>
                ) : packages.length === 0 ? (
                    <div className="col-span-full bg-white p-12 rounded-2xl border border-dashed border-primary/20 text-center text-text-muted">
                        <span className="material-symbols-outlined text-5xl mb-3 opacity-20">inventory_2</span>
                        <p>Nenhum pacote cadastrado.</p>
                        <button onClick={() => handleOpenModal()} className="mt-4 text-primary font-bold hover:underline">Começar agora →</button>
                    </div>
                ) : (
                    packages.map(pkg => (
                        <div key={pkg.id} className="bg-white rounded-2xl border border-secondary/10 shadow-sm overflow-hidden flex flex-col group transition-all hover:shadow-lg">
                            <div className="p-6 flex-1">
                                <div className="flex justify-between items-start mb-4">
                                    <h3 className="font-display text-xl font-bold text-text-main">{pkg.name}</h3>
                                    {!pkg.is_active && (
                                        <span className="bg-gray-100 text-gray-500 text-[10px] px-2 py-1 rounded-full font-bold uppercase">Inativo</span>
                                    )}
                                </div>
                                <div className="text-3xl font-display font-black text-primary mb-4">
                                    <span className="text-sm font-medium text-text-muted mr-1">R$</span>
                                    {pkg.base_price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </div>
                                <p className="text-sm text-text-muted mb-6 line-clamp-2">{pkg.description}</p>

                                <div className="space-y-2 mb-6">
                                    <h4 className="text-xs font-bold text-secondary uppercase tracking-wider">O que inclui:</h4>
                                    <ul className="space-y-1.5">
                                        {(pkg.items || []).slice(0, 4).map((item, i) => (
                                            <li key={i} className="flex items-center gap-2 text-xs text-text-muted">
                                                <span className="material-symbols-outlined text-primary text-sm">check_circle</span>
                                                {item}
                                            </li>
                                        ))}
                                        {pkg.items?.length > 4 && (
                                            <li className="text-[10px] text-primary font-bold">+ {pkg.items.length - 4} itens</li>
                                        )}
                                    </ul>
                                </div>
                            </div>

                            <div className="p-4 bg-surface-cream border-t border-primary/5 flex items-center justify-between">
                                <div className="text-[10px] text-text-muted font-bold uppercase">
                                    <span className="material-symbols-outlined text-sm align-middle mr-1">groups</span>
                                    {pkg.min_guests}-{pkg.max_guests} pessoas
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => handleOpenModal(pkg)} className="p-2 text-secondary hover:text-primary transition-colors">
                                        <span className="material-symbols-outlined text-lg">edit</span>
                                    </button>
                                    <button onClick={() => handleDelete(pkg.id)} className="p-2 text-red-300 hover:text-red-500 transition-colors">
                                        <span className="material-symbols-outlined text-lg">delete</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Modal */}
            {showModal && editingPkg && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col">
                        <div className="p-6 border-b border-primary/10 flex justify-between items-center bg-surface-cream">
                            <h3 className="font-display text-xl font-bold text-text-main">
                                {editingPkg.id ? 'Editar Pacote' : 'Novo Pacote'}
                            </h3>
                            <button onClick={() => setShowModal(false)} className="text-text-muted hover:text-primary">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1">Nome do Pacote *</label>
                                    <input
                                        required
                                        type="text"
                                        value={editingPkg.name || ''}
                                        onChange={e => setEditingPkg({ ...editingPkg, name: e.target.value })}
                                        className="w-full px-4 py-2 rounded-xl border border-primary/20 focus:border-primary outline-none text-sm"
                                        placeholder="Ex: Pacote Rubi - Aniversário Infantil"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1">Preço Base (R$) *</label>
                                    <input
                                        required
                                        type="number"
                                        step="0.01"
                                        value={editingPkg.base_price || ''}
                                        onChange={e => setEditingPkg({ ...editingPkg, base_price: parseFloat(e.target.value) })}
                                        className="w-full px-4 py-2 rounded-xl border border-primary/20 focus:border-primary outline-none text-sm"
                                        placeholder="0,00"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1">Descrição Curta</label>
                                <textarea
                                    rows={2}
                                    value={editingPkg.description || ''}
                                    onChange={e => setEditingPkg({ ...editingPkg, description: e.target.value })}
                                    className="w-full px-4 py-2 rounded-xl border border-primary/20 focus:border-primary outline-none text-sm resize-none"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1">Mín. Convidados</label>
                                    <input
                                        type="number"
                                        value={editingPkg.min_guests || 0}
                                        onChange={e => setEditingPkg({ ...editingPkg, min_guests: parseInt(e.target.value) })}
                                        className="w-full px-4 py-2 rounded-xl border border-primary/20 focus:border-primary outline-none text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1">Máx. Convidados</label>
                                    <input
                                        type="number"
                                        value={editingPkg.max_guests || 100}
                                        onChange={e => setEditingPkg({ ...editingPkg, max_guests: parseInt(e.target.value) })}
                                        className="w-full px-4 py-2 rounded-xl border border-primary/20 focus:border-primary outline-none text-sm"
                                    />
                                </div>
                            </div>

                            {/* Items List Manager */}
                            <div className="space-y-3">
                                <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1">Benefícios e Itens Inclusos</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={newItem}
                                        onChange={e => setNewItem(e.target.value)}
                                        onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), addItem())}
                                        placeholder="Adicionar item (ex: Buffet Completo)"
                                        className="flex-1 px-4 py-2 rounded-xl border border-primary/20 focus:border-primary outline-none text-sm"
                                    />
                                    <button
                                        type="button"
                                        onClick={addItem}
                                        className="px-4 bg-primary text-white rounded-xl font-bold hover:bg-primary-dark transition-colors"
                                    >
                                        Add
                                    </button>
                                </div>
                                <div className="flex flex-wrap gap-2 pt-2">
                                    {(editingPkg.items || []).map((item, i) => (
                                        <span key={i} className="inline-flex items-center gap-2 bg-surface-cream border border-primary/10 px-3 py-1.5 rounded-lg text-xs text-text-main font-medium">
                                            {item}
                                            <button onClick={() => removeItem(i)} className="text-red-400 hover:text-red-600">
                                                <span className="material-symbols-outlined text-sm">close</span>
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <div className="flex items-center gap-3 py-2">
                                <input
                                    type="checkbox"
                                    id="is_active"
                                    checked={editingPkg.is_active}
                                    onChange={e => setEditingPkg({ ...editingPkg, is_active: e.target.checked })}
                                    className="w-4 h-4 accent-primary"
                                />
                                <label htmlFor="is_active" className="text-sm font-bold text-text-main cursor-pointer">Pacote ativo (visível para orçamentos)</label>
                            </div>

                            <div className="pt-4 flex justify-end gap-2 sticky bottom-0 bg-white pb-2">
                                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-text-muted hover:bg-surface-soft rounded-lg font-medium text-sm">Cancelar</button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="px-8 py-2 bg-primary text-white rounded-lg font-bold shadow-md hover:bg-primary-dark disabled:opacity-70"
                                >
                                    {saving ? 'Salvando...' : 'Salvar Pacote'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminPackages;
