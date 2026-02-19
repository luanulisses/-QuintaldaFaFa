import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

interface Lead {
    id: string; // UUID
    name: string;
    phone: string;
    event_date: string;
    guests: number;
    status: 'Novo' | 'Em Negociação' | 'Fechado' | 'Perdido';
    source?: string;
    created_at: string;
    // Type is not in the DB yet, so let's make it optional or derive it
    type?: string;
}

const AdminLeads: React.FC = () => {
    const [filterStatus, setFilterStatus] = useState('Todos');
    const [leads, setLeads] = useState<Lead[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
    const [converting, setConverting] = useState<string | null>(null);

    const fetchLeads = async () => {
        setLoading(true);
        try {
            let query = supabase.from('leads').select('*').order('created_at', { ascending: false });

            if (filterStatus !== 'Todos') {
                query = query.eq('status', filterStatus);
            }

            const { data, error } = await query;

            if (error) {
                console.error('Error fetching leads:', error);
            } else {
                setLeads(data || []);
            }
        } catch (err) {
            console.error('Unexpected error:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLeads();
    }, [filterStatus]);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Novo': return 'bg-blue-100 text-blue-700';
            case 'Em Negociação': return 'bg-yellow-100 text-yellow-700';
            case 'Fechado': return 'bg-green-100 text-green-700';
            case 'Perdido': return 'bg-red-100 text-red-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    // Helper to format date
    const formatDate = (dateString?: string) => {
        if (!dateString) return '-';
        // Simples ajuste para fuso horário se necessário, ou usar direto
        return new Date(dateString).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
    };

    // Helper to format created_at
    const formatDateTime = (dateString?: string) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('pt-BR');
    };

    // ... (existing helper functions)

    const handleEdit = (lead: Lead) => {
        setSelectedLead(lead);
        setShowModal(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedLead) return;

        try {
            const { error } = await supabase
                .from('leads')
                .update({
                    name: selectedLead.name,
                    phone: selectedLead.phone,
                    event_date: selectedLead.event_date,
                    guests: selectedLead.guests,
                    status: selectedLead.status
                })
                .eq('id', selectedLead.id);

            if (error) throw error;

            setShowModal(false);
            fetchLeads(); // Refresh list
            alert('Orçamento atualizado com sucesso!');
        } catch (error) {
            console.error('Erro ao atualizar:', error);
            alert('Erro ao atualizar orçamento.');
        }
    };

    const deleteLead = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir este orçamento?')) return;

        const { error } = await supabase.from('leads').delete().eq('id', id);
        if (error) {
            console.error('Erro ao excluir lead:', error);
            alert(`Erro ao excluir: ${error.message}`);
        } else {
            fetchLeads();
        }
    };

    const convertToEvent = async (lead: Lead) => {
        if (!confirm(`Deseja criar um evento na agenda para "${lead.name}"?`)) return;

        setConverting(lead.id);
        try {
            // Check if already has an event
            const { data: existing } = await supabase
                .from('events')
                .select('id')
                .eq('client_id', lead.id)
                .maybeSingle();

            if (existing) {
                alert('Este lead já possui um evento vinculado na agenda.');
                setConverting(null);
                return;
            }

            const startDate = lead.event_date ? `${lead.event_date}T18:00:00` : new Date().toISOString();
            const endDate = lead.event_date ? `${lead.event_date}T23:59:00` : new Date().toISOString();

            const { error } = await supabase
                .from('events')
                .insert([{
                    title: `Evento: ${lead.name}`,
                    start_date: startDate,
                    end_date: endDate,
                    type: 'other',
                    status: 'confirmed',
                    client_id: lead.id,
                    description: `Evento convertido do orçamento de ${lead.name}. Convidados: ${lead.guests}`
                }]);

            if (error) throw error;
            alert('Evento criado com sucesso na Agenda!');
        } catch (err) {
            console.error('Erro ao converter:', err);
            alert('Erro ao criar evento.');
        } finally {
            setConverting(null);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                {/* ... (existing filters) ... */}
                <div className="flex bg-white rounded-lg p-1 shadow-sm border border-secondary/10 overflow-x-auto max-w-full">
                    {['Todos', 'Novo', 'Em Negociação', 'Fechado', 'Perdido'].map(status => (
                        <button
                            key={status}
                            onClick={() => setFilterStatus(status)}
                            className={`px-4 py-2 rounded-md text-sm font-bold transition-all whitespace-nowrap ${filterStatus === status ? 'bg-primary text-white shadow-sm' : 'text-text-muted hover:bg-surface-soft hover:text-primary'}`}
                        >
                            {status}
                        </button>
                    ))}
                </div>
                {/* Removed Create Button for simplicity in this step, focusing on Edit */}
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-secondary/10 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="text-xs text-secondary bg-surface-soft uppercase tracking-wider">
                                <th className="px-6 py-4 font-bold border-b border-primary/10">Nome / Contato</th>
                                <th className="px-6 py-4 font-bold border-b border-primary/10">Data Evento</th>
                                <th className="px-6 py-4 font-bold border-b border-primary/10">Convidados</th>
                                <th className="px-6 py-4 font-bold border-b border-primary/10">Criado em</th>
                                <th className="px-6 py-4 font-bold border-b border-primary/10">Status</th>
                                <th className="px-6 py-4 font-bold border-b border-primary/10 text-right">Ação</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm text-text-muted divide-y divide-primary/5">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-text-muted">
                                        <div className="flex justify-center items-center gap-2">
                                            <span className="material-symbols-outlined animate-spin">sync</span>
                                            Carregando orçamentos...
                                        </div>
                                    </td>
                                </tr>
                            ) : leads.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-text-muted">
                                        <div className="flex flex-col items-center">
                                            <span className="material-symbols-outlined text-4xl mb-2 opacity-50">inbox</span>
                                            <p>Nenhum orçamento encontrado.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                leads.map((lead) => (
                                    <tr key={lead.id} className="hover:bg-surface-cream transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-text-main text-base">{lead.name}</span>
                                                <span className="text-xs text-text-muted flex items-center gap-1 mt-0.5">
                                                    <span className="material-symbols-outlined text-[10px]">call</span> {lead.phone}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 font-medium">{formatDate(lead.event_date)}</td>
                                        <td className="px-6 py-4 font-medium">{lead.guests}</td>
                                        <td className="px-6 py-4 text-xs">{formatDateTime(lead.created_at)}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1 ${getStatusColor(lead.status)}`}>
                                                <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                                                {lead.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                {lead.status === 'Fechado' && (
                                                    <button
                                                        onClick={() => convertToEvent(lead)}
                                                        disabled={converting === lead.id}
                                                        className="text-primary hover:bg-primary/10 p-2 rounded-lg transition-colors flex items-center gap-1"
                                                        title="Converter em Evento na Agenda"
                                                    >
                                                        <span className="material-symbols-outlined text-lg">
                                                            {converting === lead.id ? 'sync' : 'event_available'}
                                                        </span>
                                                        <span className="text-[10px] font-bold uppercase">Agendar</span>
                                                    </button>
                                                )}
                                                <button onClick={() => handleEdit(lead)} className="text-secondary hover:text-primary p-2 hover:bg-surface-soft rounded-lg transition-colors" title="Editar">
                                                    <span className="material-symbols-outlined text-lg">edit</span>
                                                </button>
                                                <button onClick={() => deleteLead(lead.id)} className="text-red-400 hover:text-red-600 p-2 hover:bg-red-50 rounded-lg transition-colors" title="Excluir">
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

                {/* Pagination (Static for MVP) */}
                <div className="border-t border-primary/10 p-4 flex justify-between items-center text-sm text-text-muted bg-surface-cream">
                    <span>Mostrando {leads.length} registros</span>
                </div>
            </div>

            {/* Edit Modal */}
            {showModal && selectedLead && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-fade-in">
                        <div className="p-6 border-b border-primary/10 flex justify-between items-center bg-surface-cream">
                            <h3 className="font-display text-xl font-bold text-text-main">Editar Orçamento</h3>
                            <button onClick={() => setShowModal(false)} className="text-text-muted hover:text-primary">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <form onSubmit={handleSave} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1">Nome</label>
                                <input
                                    type="text"
                                    value={selectedLead.name}
                                    onChange={(e) => setSelectedLead({ ...selectedLead, name: e.target.value })}
                                    className="w-full px-4 py-2 rounded-xl border border-primary/20 focus:border-primary outline-none"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1">Telefone</label>
                                    <input
                                        type="text"
                                        value={selectedLead.phone}
                                        onChange={(e) => setSelectedLead({ ...selectedLead, phone: e.target.value })}
                                        className="w-full px-4 py-2 rounded-xl border border-primary/20 focus:border-primary outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1">Convidados</label>
                                    <input
                                        type="number"
                                        value={selectedLead.guests}
                                        onChange={(e) => setSelectedLead({ ...selectedLead, guests: parseInt(e.target.value) })}
                                        className="w-full px-4 py-2 rounded-xl border border-primary/20 focus:border-primary outline-none"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1">Data Evento</label>
                                    <input
                                        type="date"
                                        value={selectedLead.event_date || ''}
                                        onChange={(e) => setSelectedLead({ ...selectedLead, event_date: e.target.value })}
                                        className="w-full px-4 py-2 rounded-xl border border-primary/20 focus:border-primary outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1">Status</label>
                                    <select
                                        value={selectedLead.status}
                                        onChange={(e) => setSelectedLead({ ...selectedLead, status: e.target.value as any })}
                                        className="w-full px-4 py-2 rounded-xl border border-primary/20 focus:border-primary outline-none bg-white"
                                    >
                                        <option value="Novo">Novo</option>
                                        <option value="Em Negociação">Em Negociação</option>
                                        <option value="Fechado">Fechado</option>
                                        <option value="Perdido">Perdido</option>
                                    </select>
                                </div>
                            </div>

                            <div className="pt-4 flex justify-end gap-2">
                                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-text-muted hover:bg-surface-soft rounded-lg font-medium">Cancelar</button>
                                <button type="submit" className="px-6 py-2 bg-primary text-white rounded-lg font-bold shadow-md hover:bg-primary-dark">Salvar Alterações</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminLeads;
