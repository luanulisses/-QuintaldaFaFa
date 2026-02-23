import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useNavigate } from 'react-router-dom';

interface ContractRecord {
    id: string;
    client_name: string;
    event_date: string;
    total_value: number;
    created_at: string;
}

const AdminContracts: React.FC = () => {
    const [contracts, setContracts] = useState<ContractRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const fetchContracts = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('contracts')
                .select('id, client_name, event_date, total_value, created_at')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setContracts(data || []);
        } catch (err) {
            console.error('Erro ao buscar contratos:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchContracts();
    }, []);

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
    };

    const formatDate = (dateStr: string) => {
        if (!dateStr) return '-';
        const [y, m, d] = dateStr.split('-');
        return `${d}/${m}/${y}`;
    };

    const exportCSV = () => {
        const headers = ['Cliente', 'Data do Evento', 'Valor Total', 'Gerado em'];
        const csvRows = contracts.map(c => [
            `"${c.client_name}"`,
            c.event_date,
            c.total_value,
            `"${new Date(c.created_at).toLocaleDateString('pt-BR')}"`
        ]);

        const csvContent = "\uFEFF" + [headers, ...csvRows].map(e => e.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `contratos_quintal_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="font-display text-2xl font-bold text-[#2D2420]">Contratos Gerados</h1>
                    <p className="text-sm text-[#5A2D0C]/60">Lista de contratos interativos salvos no sistema.</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={exportCSV}
                        className="bg-white text-[#5C2A0A] border border-[#5C2A0A] px-6 py-2.5 rounded-xl font-bold text-sm shadow-sm hover:bg-[#5C2A0A]/5 transition-all flex items-center gap-2"
                    >
                        <span className="material-symbols-outlined text-lg">download</span>
                        Exportar Lista
                    </button>
                    <button
                        onClick={() => navigate('/admin/contratos/novo')}
                        className="bg-[#5C2A0A] text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-lg hover:bg-[#3D1C07] transition-all flex items-center gap-2"
                    >
                        <span className="material-symbols-outlined text-lg">add_notes</span>
                        Novo Contrato
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-[#E2DED0] overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="text-xs text-[#5A2D0C] bg-[#FAF7F5] uppercase tracking-wider">
                                <th className="px-6 py-4 font-bold border-b border-[#E2DED0]">Cliente</th>
                                <th className="px-6 py-4 font-bold border-b border-[#E2DED0]">Data do Evento</th>
                                <th className="px-6 py-4 font-bold border-b border-[#E2DED0]">Valor Total</th>
                                <th className="px-6 py-4 font-bold border-b border-[#E2DED0]">Gerado em</th>
                                <th className="px-6 py-4 font-bold border-b border-[#E2DED0] text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm divide-y divide-[#E2DED0]">
                            {loading ? (
                                <tr><td colSpan={5} className="px-6 py-8 text-center text-[#5A2D0C]/40">Carregando contratos...</td></tr>
                            ) : contracts.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-[#5A2D0C]/40">
                                        <div className="flex flex-col items-center gap-2">
                                            <span className="material-symbols-outlined text-4xl opacity-20">description</span>
                                            <p>Nenhum contrato salvo ainda.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                contracts.map(contract => (
                                    <tr key={contract.id} className="hover:bg-[#FAF7F5] transition-colors group">
                                        <td className="px-6 py-4 font-bold text-[#2D2420]">{contract.client_name}</td>
                                        <td className="px-6 py-4 text-[#5A2D0C]">{formatDate(contract.event_date)}</td>
                                        <td className="px-6 py-4 font-bold text-[#78B926]">{formatCurrency(contract.total_value)}</td>
                                        <td className="px-6 py-4 text-[#5A2D0C]/60 text-xs">
                                            {new Date(contract.created_at).toLocaleDateString('pt-BR')}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2 text-right">
                                                <button
                                                    onClick={() => navigate(`/admin/contratos/${contract.id}`)}
                                                    className="p-2 text-[#5C2A0A] hover:bg-[#5C2A0A]/5 rounded-lg transition-colors tooltip flex items-center justify-center"
                                                    title="Visualizar/Editar"
                                                >
                                                    <span className="material-symbols-outlined text-xl">visibility</span>
                                                </button>
                                                <button
                                                    onClick={() => navigate(`/admin/contratos/${contract.id}?print=true`)}
                                                    className="p-2 text-[#78B926] hover:bg-[#78B926]/5 rounded-lg transition-colors tooltip flex items-center justify-center"
                                                    title="Gerar PDF"
                                                >
                                                    <span className="material-symbols-outlined text-xl">picture_as_pdf</span>
                                                </button>
                                                <button
                                                    onClick={async () => {
                                                        if (confirm('Deseja excluir este registro de contrato?')) {
                                                            await supabase.from('contracts').delete().eq('id', contract.id);
                                                            fetchContracts();
                                                        }
                                                    }}
                                                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors flex items-center justify-center"
                                                    title="Excluir"
                                                >
                                                    <span className="material-symbols-outlined text-xl">delete</span>
                                                </button>
                                            </div>
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

export default AdminContracts;
