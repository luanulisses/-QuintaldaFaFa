import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

interface Supplier {
    id: string;
    name: string;
    category: string;
    contact_name?: string;
    phone?: string;
    email?: string;
    instagram?: string;
    notes?: string;
    created_at: string;
}

const CATEGORIES = [
    'Buffet', 'Decoração', 'Fotografia', 'Filmagem', 'Som e Iluminação',
    'Bebidas', 'Doces e Bolos', 'Lembrancinhas', 'Animação/Recreação', 'Segurança', 'Limpeza', 'Outros'
];

const AdminSuppliers: React.FC = () => {
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [selectedSupplier, setSelectedSupplier] = useState<Partial<Supplier> | null>(null);
    const [saving, setSaving] = useState(false);

    const fetchSuppliers = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('suppliers')
                .select('*')
                .order('name', { ascending: true });

            if (error) {
                if (error.code === 'PGRST116' || error.message.includes('relation "public.suppliers" does not exist')) {
                    console.warn('Tabela suppliers não existe. Execute o script SQL.');
                    setSuppliers([]);
                } else {
                    throw error;
                }
            } else {
                setSuppliers(data || []);
            }
        } catch (err) {
            console.error('Erro ao buscar fornecedores:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSuppliers();
    }, []);

    const filteredSuppliers = suppliers.filter(s =>
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.category.toLowerCase().includes(search.toLowerCase())
    );

    const handleEdit = (supplier: Supplier) => {
        setSelectedSupplier(supplier);
        setShowModal(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Excluir este fornecedor?')) return;
        try {
            const { error } = await supabase.from('suppliers').delete().eq('id', id);
            if (error) throw error;
            fetchSuppliers();
        } catch (err) {
            alert('Erro ao excluir.');
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedSupplier) return;
        setSaving(true);

        try {
            const payload = {
                name: selectedSupplier.name,
                category: selectedSupplier.category || 'Outros',
                contact_name: selectedSupplier.contact_name,
                phone: selectedSupplier.phone,
                email: selectedSupplier.email,
                instagram: selectedSupplier.instagram,
                notes: selectedSupplier.notes,
            };

            if (selectedSupplier.id) {
                const { error } = await supabase.from('suppliers').update(payload).eq('id', selectedSupplier.id);
                if (error) throw error;
            } else {
                const { error } = await supabase.from('suppliers').insert([payload]);
                if (error) throw error;
            }

            setShowModal(false);
            fetchSuppliers();
        } catch (err) {
            console.error('Erro ao salvar fornecedor:', err);
            alert('Erro ao salvar. Verifique se a tabela foi criada no Supabase.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="font-display text-2xl font-bold text-text-main">Fornecedores</h1>
                    <p className="text-sm text-text-muted">Parceiros e prestadores de serviço.</p>
                </div>
                <div className="flex gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-sm">search</span>
                        <input
                            type="text"
                            placeholder="Buscar por nome ou categoria..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 rounded-xl border border-primary/10 focus:border-primary outline-none text-sm bg-white shadow-sm"
                        />
                    </div>
                    <button
                        onClick={() => { setSelectedSupplier({ category: 'Buffet' }); setShowModal(true); }}
                        className="bg-primary text-white px-4 py-2 rounded-xl font-bold text-sm shadow-md hover:bg-primary-dark transition-all flex items-center gap-2"
                    >
                        <span className="material-symbols-outlined text-lg">add_business</span>
                        Novo Fornecedor
                    </button>
                </div>
            </div>

            {suppliers.length === 0 && !loading && (
                <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl text-sm text-blue-700">
                    ℹ️ Ninguém cadastrado ainda. Lembre-se de executar o script <strong>create_suppliers_table.sql</strong> no seu dashboard do Supabase.
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    <div className="col-span-full text-center py-12">Carregando...</div>
                ) : filteredSuppliers.length === 0 ? (
                    <div className="col-span-full text-center py-12 text-text-muted">Nenhum fornecedor encontrado.</div>
                ) : (
                    filteredSuppliers.map(sup => (
                        <div key={sup.id} className="bg-white rounded-2xl p-6 border border-secondary/10 shadow-sm hover:shadow-md transition-all group relative">
                            <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => handleEdit(sup)} className="p-1.5 bg-surface-soft text-secondary hover:text-primary rounded-lg">
                                    <span className="material-symbols-outlined text-sm">edit</span>
                                </button>
                                <button onClick={() => handleDelete(sup.id)} className="p-1.5 bg-red-50 text-red-400 hover:text-red-600 rounded-lg">
                                    <span className="material-symbols-outlined text-sm">delete</span>
                                </button>
                            </div>

                            <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-wider">
                                {sup.category}
                            </span>
                            <h3 className="font-display text-lg font-bold text-text-main mt-2">{sup.name}</h3>
                            {sup.contact_name && <p className="text-xs text-text-muted mb-3 font-medium flex items-center gap-1.5"><span className="material-symbols-outlined text-sm">person</span> {sup.contact_name}</p>}

                            <div className="space-y-2 mt-4 pt-4 border-t border-primary/5">
                                {sup.phone && (
                                    <a href={`tel:${sup.phone}`} className="flex items-center gap-2 text-sm text-text-muted hover:text-primary transition-colors">
                                        <span className="material-symbols-outlined text-lg">call</span>
                                        {sup.phone}
                                    </a>
                                )}
                                {sup.instagram && (
                                    <a href={`https://instagram.com/${sup.instagram.replace('@', '')}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-text-muted hover:text-primary transition-colors">
                                        <span className="material-symbols-outlined text-lg">share</span>
                                        @{sup.instagram.replace('@', '')}
                                    </a>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
                        <div className="p-6 border-b border-primary/10 flex justify-between items-center bg-surface-cream">
                            <h3 className="font-display text-xl font-bold text-text-main">
                                {selectedSupplier?.id ? 'Editar Fornecedor' : 'Novo Fornecedor'}
                            </h3>
                            <button onClick={() => setShowModal(false)} className="text-text-muted hover:text-primary">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <form onSubmit={handleSave} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2 sm:col-span-1">
                                    <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1">Nome da Empresa *</label>
                                    <input
                                        required
                                        type="text"
                                        value={selectedSupplier?.name || ''}
                                        onChange={e => setSelectedSupplier({ ...selectedSupplier, name: e.target.value })}
                                        className="w-full px-4 py-2 rounded-xl border border-primary/20 focus:border-primary outline-none text-sm"
                                    />
                                </div>
                                <div className="col-span-2 sm:col-span-1">
                                    <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1">Categoria</label>
                                    <select
                                        value={selectedSupplier?.category || ''}
                                        onChange={e => setSelectedSupplier({ ...selectedSupplier, category: e.target.value })}
                                        className="w-full px-4 py-2 rounded-xl border border-primary/20 focus:border-primary outline-none text-sm bg-white"
                                    >
                                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1">Nome p/ Contato</label>
                                    <input
                                        type="text"
                                        value={selectedSupplier?.contact_name || ''}
                                        onChange={e => setSelectedSupplier({ ...selectedSupplier, contact_name: e.target.value })}
                                        className="w-full px-4 py-2 rounded-xl border border-primary/20 focus:border-primary outline-none text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1">WhatsApp / Telefone</label>
                                    <input
                                        type="text"
                                        value={selectedSupplier?.phone || ''}
                                        onChange={e => setSelectedSupplier({ ...selectedSupplier, phone: e.target.value })}
                                        className="w-full px-4 py-2 rounded-xl border border-primary/20 focus:border-primary outline-none text-sm"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1">Email</label>
                                    <input
                                        type="email"
                                        value={selectedSupplier?.email || ''}
                                        onChange={e => setSelectedSupplier({ ...selectedSupplier, email: e.target.value })}
                                        className="w-full px-4 py-2 rounded-xl border border-primary/20 focus:border-primary outline-none text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1">Instagram (@usuario)</label>
                                    <input
                                        type="text"
                                        value={selectedSupplier?.instagram || ''}
                                        onChange={e => setSelectedSupplier({ ...selectedSupplier, instagram: e.target.value })}
                                        className="w-full px-4 py-2 rounded-xl border border-primary/20 focus:border-primary outline-none text-sm"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1">Notas Internas</label>
                                <textarea
                                    rows={3}
                                    value={selectedSupplier?.notes || ''}
                                    onChange={e => setSelectedSupplier({ ...selectedSupplier, notes: e.target.value })}
                                    className="w-full px-4 py-2 rounded-xl border border-primary/20 focus:border-primary outline-none text-sm resize-none"
                                />
                            </div>

                            <div className="pt-2 flex justify-end gap-2">
                                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-text-muted hover:bg-surface-soft rounded-lg font-medium text-sm">Cancelar</button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="px-6 py-2 bg-primary text-white rounded-lg font-bold shadow-md hover:bg-primary-dark disabled:opacity-70 text-sm"
                                >
                                    {saving ? 'Salvando...' : 'Salvar Fornecedor'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminSuppliers;
