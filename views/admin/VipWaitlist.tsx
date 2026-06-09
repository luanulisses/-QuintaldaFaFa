import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../lib/supabase';

interface VipLead {
    id: string;
    nome: string;
    email: string;
    telefone: string;
    origem: string;
    status: 'aguardando' | 'contatado' | 'cliente';
    created_at: string;
}

const VipWaitlist: React.FC = () => {
    const [leads, setLeads] = useState<VipLead[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState('Todos');
    const [searchTerm, setSearchTerm] = useState('');

    const fetchLeads = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('vip_waitlist')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching VIP leads:', error);
            } else {
                setLeads(data as VipLead[] || []);
            }
        } catch (err) {
            console.error('Unexpected error:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLeads();
    }, []);

    const handleStatusChange = async (id: string, newStatus: string) => {
        try {
            // Update local state optimistic
            setLeads(prev => prev.map(lead => lead.id === id ? { ...lead, status: newStatus as any } : lead));

            const { error } = await supabase
                .from('vip_waitlist')
                .update({ status: newStatus })
                .eq('id', id);

            if (error) {
                throw error;
            }
        } catch (err) {
            console.error('Error updating status:', err);
            alert('Erro ao atualizar status.');
            fetchLeads(); // Revert on error
        }
    };

    const handleExportCSV = () => {
        const headers = ['nome', 'email', 'telefone', 'origem', 'status', 'created_at'];
        const rows = leads.map(lead => [
            `"${lead.nome}"`,
            `"${lead.email}"`,
            `"${lead.telefone}"`,
            `"${lead.origem}"`,
            `"${lead.status}"`,
            `"${new Date(lead.created_at).toISOString()}"`
        ].join(','));

        const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows].join("\n");
        const encodedUri = encodeURI(csvContent);
        
        const dateStr = new Date().toISOString().split('T')[0];
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `vip_waitlist_${dateStr}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const filteredLeads = useMemo(() => {
        return leads.filter(lead => {
            const matchStatus = filterStatus === 'Todos' || lead.status === filterStatus;
            const term = searchTerm.toLowerCase();
            const matchSearch = term === '' || 
                lead.nome.toLowerCase().includes(term) ||
                lead.email.toLowerCase().includes(term) ||
                lead.telefone.includes(term);
            return matchStatus && matchSearch;
        });
    }, [leads, filterStatus, searchTerm]);

    // Counters based on raw leads
    const totalCount = leads.length;
    const aguardandoCount = leads.filter(l => l.status === 'aguardando').length;
    const contatadoCount = leads.filter(l => l.status === 'contatado').length;
    const clienteCount = leads.filter(l => l.status === 'cliente').length;

    const formatDateTime = (dateString?: string) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('pt-BR') + ' ' + new Date(dateString).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold font-display text-text-main">Lista VIP</h1>
                    <p className="text-sm text-text-muted">Gestão de leads da 2ª Edição</p>
                </div>
                <div className="flex items-center gap-2">
                    {/* Futura Integração: Evolution API / Disparos em Massa */}
                    <button 
                        disabled
                        className="flex items-center gap-2 bg-[#25D366] text-white px-4 py-2 rounded-lg font-bold opacity-50 cursor-not-allowed shadow-sm"
                        title="Em breve: Disparo via WhatsApp / Evolution API"
                    >
                        <span className="material-symbols-outlined">send_to_mobile</span> Disparar WhatsApp
                    </button>
                    
                    <button 
                        onClick={handleExportCSV}
                        className="flex items-center gap-2 bg-secondary text-white px-4 py-2 rounded-lg font-bold hover:bg-secondary/90 transition shadow-sm"
                    >
                        <span className="material-symbols-outlined">download</span> Exportar CSV
                    </button>
                </div>
            </div>

            {/* Dashboard Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-xl border border-primary/10 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-bold text-text-muted uppercase tracking-wider">Total de Inscritos</p>
                        <p className="text-2xl font-black text-text-main">{totalCount}</p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                        <span className="material-symbols-outlined">group</span>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-yellow-500/20 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-bold text-yellow-600 uppercase tracking-wider">Aguardando</p>
                        <p className="text-2xl font-black text-yellow-700">{aguardandoCount}</p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-600">
                        <span className="material-symbols-outlined">hourglass_empty</span>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-blue-500/20 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-bold text-blue-600 uppercase tracking-wider">Contatados</p>
                        <p className="text-2xl font-black text-blue-700">{contatadoCount}</p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                        <span className="material-symbols-outlined">call</span>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-green-500/20 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-bold text-green-600 uppercase tracking-wider">Clientes</p>
                        <p className="text-2xl font-black text-green-700">{clienteCount}</p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                        <span className="material-symbols-outlined">local_activity</span>
                    </div>
                </div>
            </div>

            {/* Filters and Search */}
            <div className="flex flex-col md:flex-row justify-between gap-4">
                <div className="flex bg-white rounded-lg p-1 shadow-sm border border-secondary/10 overflow-x-auto max-w-full">
                    {['Todos', 'aguardando', 'contatado', 'cliente'].map(status => (
                        <button
                            key={status}
                            onClick={() => setFilterStatus(status)}
                            className={`px-4 py-2 rounded-md text-sm font-bold transition-all whitespace-nowrap capitalize ${filterStatus === status ? 'bg-primary text-white shadow-sm' : 'text-text-muted hover:bg-surface-soft hover:text-primary'}`}
                        >
                            {status}
                        </button>
                    ))}
                </div>

                <div className="relative flex-1 max-w-md">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">search</span>
                    <input 
                        type="text" 
                        placeholder="Buscar por nome, e-mail ou WhatsApp..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-secondary/20 rounded-xl outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors bg-white shadow-sm"
                    />
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-secondary/10 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="text-xs text-secondary bg-surface-soft uppercase tracking-wider">
                                <th className="px-6 py-4 font-bold border-b border-primary/10">Nome</th>
                                <th className="px-6 py-4 font-bold border-b border-primary/10">Contato</th>
                                <th className="px-6 py-4 font-bold border-b border-primary/10">Origem</th>
                                <th className="px-6 py-4 font-bold border-b border-primary/10">Data</th>
                                <th className="px-6 py-4 font-bold border-b border-primary/10">Status</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm text-text-muted divide-y divide-primary/5">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-text-muted">
                                        <div className="flex justify-center items-center gap-2">
                                            <span className="material-symbols-outlined animate-spin">sync</span>
                                            Carregando lista VIP...
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredLeads.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-text-muted">
                                        <div className="flex flex-col items-center">
                                            <span className="material-symbols-outlined text-4xl mb-2 opacity-50">inbox</span>
                                            <p>Nenhum cadastro encontrado.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredLeads.map((lead) => (
                                    <tr key={lead.id} className="hover:bg-surface-cream transition-colors">
                                        <td className="px-6 py-4 font-bold text-text-main">{lead.nome}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span>{lead.email}</span>
                                                <span className="text-xs text-text-muted flex items-center gap-1">
                                                    <span className="material-symbols-outlined text-[10px]">call</span> {lead.telefone}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-xs">{lead.origem}</td>
                                        <td className="px-6 py-4 text-xs">{formatDateTime(lead.created_at)}</td>
                                        <td className="px-6 py-4">
                                            <select 
                                                value={lead.status} 
                                                onChange={(e) => handleStatusChange(lead.id, e.target.value)}
                                                className={`px-3 py-1 rounded-full text-xs font-bold outline-none cursor-pointer border shadow-sm ${
                                                    lead.status === 'aguardando' ? 'bg-yellow-50 text-yellow-700 border-yellow-200 focus:ring-yellow-500' :
                                                    lead.status === 'contatado' ? 'bg-blue-50 text-blue-700 border-blue-200 focus:ring-blue-500' :
                                                    'bg-green-50 text-green-700 border-green-200 focus:ring-green-500'
                                                }`}
                                            >
                                                <option value="aguardando" className="bg-white text-black">Aguardando</option>
                                                <option value="contatado" className="bg-white text-black">Contatado</option>
                                                <option value="cliente" className="bg-white text-black">Cliente</option>
                                            </select>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default VipWaitlist;
