import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import FileUploader from '../../components/admin/FileUploader';

interface Client {
    id: string;
    name: string;
    phone: string;
    email?: string;
    total_events: number;
    last_event_date?: string;
    notes?: string;
    created_at: string;
    contract_url?: string;
    contract_value?: number;
    package_id?: string;
}

interface Package {
    id: string;
    name: string;
}

const AdminClients: React.FC = () => {
    const [clients, setClients] = useState<Client[]>([]);
    const [packages, setPackages] = useState<Package[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [selectedClient, setSelectedClient] = useState<Partial<Client> | null>(null);
    const [saving, setSaving] = useState(false);

    const fetchPackages = async () => {
        const { data } = await supabase.from('packages').select('id, name').eq('is_active', true);
        setPackages(data || []);
    };

    const fetchClients = async () => {
        setLoading(true);
        try {
            // No sistema atual, 'clientes' são Leads com status 'Fechado'
            // Mas para ser mais flexível, vamos buscar todos que já fecharam pelo menos um contrato
            // Ou simplesmente permitir cadastrar manualmente na tabela leads como 'Fechado'

            const { data, error } = await supabase
                .from('leads')
                .select('*')
                .eq('status', 'Fechado')
                .order('name', { ascending: true });

            if (error) throw error;

            // Agrupar por nome e telefone para não duplicar clientes
            const groupedMap = new Map();

            (data || []).forEach(d => {
                const key = `${d.name.trim().toLowerCase()}_${d.phone.replace(/\D/g, '')}`;
                const existing = groupedMap.get(key);

                if (!existing) {
                    groupedMap.set(key, { ...d, total_events: 1 });
                } else {
                    // Soma valores e pega data mais recente
                    existing.contract_value = (existing.contract_value || 0) + (d.contract_value || 0);
                    existing.total_events += 1;
                    if (d.event_date && (!existing.event_date || d.event_date > existing.event_date)) {
                        existing.event_date = d.event_date;
                    }
                }
            });

            const uniqueLeads = Array.from(groupedMap.values());

            // Mapear para interface de cliente
            const mapped = uniqueLeads.map(d => ({
                id: d.id,
                name: d.name,
                phone: d.phone,
                email: d.contact?.includes('@') ? d.contact : '',
                total_events: d.total_events,
                last_event_date: d.event_date,
                notes: d.notes,
                created_at: d.created_at,
                contract_url: d.contract_url,
                contract_value: d.contract_value,
                package_id: d.package_id
            }));

            setClients(mapped);
        } catch (err) {
            console.error('Erro ao buscar clientes:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchClients();
        fetchPackages();
    }, []);

    const filteredClients = clients.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.phone.includes(search)
    );

    const handleEdit = (client: Client) => {
        setSelectedClient(client);
        setShowModal(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedClient) return;
        setSaving(true);

        try {
            const payload = {
                name: selectedClient.name,
                phone: selectedClient.phone,
                notes: selectedClient.notes,
                status: 'Fechado', // Mantém como cliente
                contract_url: selectedClient.contract_url,
                contract_value: selectedClient.contract_value,
                package_id: selectedClient.package_id
            };

            if (selectedClient.id) {
                const { error } = await supabase
                    .from('leads')
                    .update(payload)
                    .eq('id', selectedClient.id);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('leads')
                    .insert([payload]);
                if (error) throw error;
            }

            setShowModal(false);
            fetchClients();
        } catch (err) {
            console.error('Erro ao salvar cliente:', err);
            alert('Erro ao salvar.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="font-display text-2xl font-bold text-text-main">Clientes</h1>
                    <p className="text-sm text-text-muted">Base de clientes que já fecharam eventos.</p>
                </div>
                <div className="flex gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-sm">search</span>
                        <input
                            type="text"
                            placeholder="Buscar cliente..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 rounded-xl border border-primary/10 focus:border-primary outline-none text-sm bg-white shadow-sm"
                        />
                    </div>
                    <button
                        onClick={() => { setSelectedClient({}); setShowModal(true); }}
                        className="bg-primary text-white px-4 py-2 rounded-xl font-bold text-sm shadow-md hover:bg-primary-dark transition-all flex items-center gap-2"
                    >
                        <span className="material-symbols-outlined text-lg">person_add</span>
                        Novo Cliente
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-secondary/10 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="text-xs text-secondary bg-surface-soft uppercase tracking-wider">
                                <th className="px-6 py-4 font-bold border-b border-primary/10">Nome</th>
                                <th className="px-6 py-4 font-bold border-b border-primary/10">Contato</th>
                                <th className="px-6 py-4 font-bold border-b border-primary/10">Último Evento</th>
                                <th className="px-6 py-4 font-bold border-b border-primary/10">Valor</th>
                                <th className="px-6 py-4 font-bold border-b border-primary/10 text-right">Ação</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm text-text-muted divide-y divide-primary/5">
                            {loading ? (
                                <tr><td colSpan={5} className="px-6 py-8 text-center">Carregando...</td></tr>
                            ) : filteredClients.length === 0 ? (
                                <tr><td colSpan={5} className="px-6 py-12 text-center">Nenhum cliente encontrado.</td></tr>
                            ) : (
                                filteredClients.map(client => (
                                    <tr key={client.id} className="hover:bg-surface-cream transition-colors group">
                                        <td className="px-6 py-4 font-bold text-text-main">{client.name}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span>{client.phone}</span>
                                                {client.email && <span className="text-xs opacity-60">{client.email}</span>}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="font-medium">
                                                    {client.last_event_date ? new Date(client.last_event_date + 'T00:00:00').toLocaleDateString('pt-BR') : '-'}
                                                </span>
                                                {client.package_id && (
                                                    <span className="text-[10px] text-primary font-bold uppercase mt-1 flex items-center gap-1">
                                                        <span className="material-symbols-outlined text-[12px]">inventory_2</span>
                                                        {packages.find(p => p.id === client.package_id)?.name || 'Pacote'}
                                                    </span>
                                                )}
                                                {client.contract_url && (
                                                    <a
                                                        href={client.contract_url}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="text-[10px] text-green-600 font-bold uppercase mt-0.5 flex items-center gap-1 hover:underline cursor-pointer"
                                                    >
                                                        <span className="material-symbols-outlined text-[12px]">description</span>
                                                        Ver Contrato
                                                    </a>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="font-bold text-text-main">
                                                {client.contract_value
                                                    ? client.contract_value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                                                    : 'R$ 0,00'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => handleEdit(client)}
                                                className="text-primary hover:underline font-bold text-xs bg-surface-soft px-3 py-1.5 rounded-lg transition-colors"
                                            >
                                                Ver Detalhes
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
                        <div className="p-6 border-b border-primary/10 flex justify-between items-center bg-surface-cream">
                            <h3 className="font-display text-xl font-bold text-text-main">
                                {selectedClient?.id ? 'Detalhes do Cliente' : 'Novo Cliente'}
                            </h3>
                            <button onClick={() => setShowModal(false)} className="text-text-muted hover:text-primary">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <form onSubmit={handleSave} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1">Nome Completo</label>
                                <input
                                    required
                                    type="text"
                                    value={selectedClient?.name || ''}
                                    onChange={e => setSelectedClient({ ...selectedClient, name: e.target.value })}
                                    className="w-full px-4 py-2 rounded-xl border border-primary/20 focus:border-primary outline-none text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1">WhatsApp / Telefone</label>
                                <input
                                    required
                                    type="text"
                                    value={selectedClient?.phone || ''}
                                    onChange={e => setSelectedClient({ ...selectedClient, phone: e.target.value })}
                                    className="w-full px-4 py-2 rounded-xl border border-primary/20 focus:border-primary outline-none text-sm"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-primary/5">
                                <div>
                                    <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1">Pacote Contratado</label>
                                    <select
                                        value={selectedClient?.package_id || ''}
                                        onChange={e => setSelectedClient({ ...selectedClient, package_id: e.target.value })}
                                        className="w-full px-4 py-2 rounded-xl border border-primary/20 focus:border-primary outline-none text-sm bg-white"
                                    >
                                        <option value="">Selecione um pacote...</option>
                                        {packages.map(pkg => (
                                            <option key={pkg.id} value={pkg.id}>{pkg.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1">Valor do Contrato (R$)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={selectedClient?.contract_value || ''}
                                        onChange={e => setSelectedClient({ ...selectedClient, contract_value: parseFloat(e.target.value) })}
                                        className="w-full px-4 py-2 rounded-xl border border-primary/20 focus:border-primary outline-none text-sm"
                                        placeholder="0,00"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1">Arquivo do Contrato (PDF/Imagem)</label>
                                <FileUploader
                                    bucket="site_assets"
                                    accept=".pdf,image/*"
                                    currentUrl={selectedClient?.contract_url}
                                    onUpload={url => setSelectedClient({ ...selectedClient, contract_url: url })}
                                    label="Anexar contrato"
                                />
                                {selectedClient?.contract_url && (
                                    <a
                                        href={selectedClient.contract_url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="mt-2 text-xs text-primary font-bold flex items-center gap-1 hover:underline"
                                    >
                                        <span className="material-symbols-outlined text-sm">description</span>
                                        Abrir Contrato Atual
                                    </a>
                                )}
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1">Observações</label>
                                <textarea
                                    rows={3}
                                    value={selectedClient?.notes || ''}
                                    onChange={e => setSelectedClient({ ...selectedClient, notes: e.target.value })}
                                    className="w-full px-4 py-2 rounded-xl border border-primary/20 focus:border-primary outline-none text-sm resize-none"
                                    placeholder="Preferências, histórico, detalhes de contato..."
                                />
                            </div>
                            <div className="pt-2 flex justify-end gap-2">
                                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-text-muted hover:bg-surface-soft rounded-lg font-medium text-sm">Cancelar</button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="px-6 py-2 bg-primary text-white rounded-lg font-bold shadow-md hover:bg-primary-dark disabled:opacity-70 text-sm"
                                >
                                    {saving ? 'Salvando...' : 'Salvar Cliente'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminClients;
