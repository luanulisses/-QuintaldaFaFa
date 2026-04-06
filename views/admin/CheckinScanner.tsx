import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

interface TicketInfo {
    id: string;
    ticket_type: string;
    owner_name: string;
    status_uso: boolean;
    used_at: string | null;
    arraia_purchases: {
        customer_name: string;
    };
}

const CheckinScanner: React.FC = () => {
    const [scanInput, setScanInput] = useState('');
    const [ticket, setTicket] = useState<TicketInfo | null>(null);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error' | 'warning', text: string } | null>(null);

    const handleScan = async (hash: string) => {
        if (!hash) return;
        
        setLoading(true);
        setMessage(null);
        setTicket(null);

        try {
            const { data, error } = await supabase
                .from('arraia_tickets')
                .select('*, arraia_purchases(customer_name)')
                .eq('secure_hash', hash)
                .single();

            if (error) {
                setMessage({ type: 'error', text: 'Ingresso não encontrado!' });
                return;
            }

            setTicket(data);

            if (data.status_uso) {
                setMessage({ 
                    type: 'error', 
                    text: `ESTE INGRESSO JÁ FOI USADO em ${new Date(data.used_at!).toLocaleString('pt-BR')}` 
                });
            } else {
                setMessage({ type: 'success', text: 'Ingresso Válido!' });
            }
        } catch (err) {
            setMessage({ type: 'error', text: 'Erro ao validar ingresso.' });
        } finally {
            setLoading(false);
            setScanInput('');
        }
    };

    const confirmCheckin = async () => {
        if (!ticket || ticket.status_uso) return;

        setLoading(true);
        try {
            const { error } = await supabase
                .from('arraia_tickets')
                .update({ 
                    status_uso: true, 
                    used_at: new Date().toISOString() 
                })
                .eq('id', ticket.id);

            if (error) throw error;

            setMessage({ type: 'success', text: 'CHECK-IN REALIZADO COM SUCESSO!' });
            setTicket({ ...ticket, status_uso: true, used_at: new Date().toISOString() });
        } catch (err) {
            setMessage({ type: 'error', text: 'Erro ao confirmar check-in.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-4 max-w-md mx-auto">
            <h2 className="text-2xl font-bold mb-6 text-[#5C2E0A] flex items-center gap-2">
                <span className="material-symbols-outlined">qr_code_scanner</span>
                Validação Arraiá 2026
            </h2>

            <div className="mb-8">
                <label className="block text-sm font-bold text-gray-700 mb-2">Escanear ou digitar Hash</label>
                <div className="flex gap-2">
                    <input 
                        type="text"
                        className="flex-1 border-2 border-[#5C2E0A]/20 rounded-xl px-4 py-3 focus:border-primary outline-none"
                        placeholder="Cole o código aqui..."
                        value={scanInput}
                        onChange={(e) => setScanInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleScan(scanInput)}
                    />
                    <button 
                        onClick={() => handleScan(scanInput)}
                        disabled={loading}
                        className="bg-[#5C2E0A] text-white px-4 py-2 rounded-xl font-bold disabled:opacity-50"
                    >
                        OK
                    </button>
                </div>
            </div>

            {loading && <div className="text-center py-4 text-primary animate-pulse">Processando...</div>}

            {message && (
                <div className={`p-6 rounded-2xl mb-6 text-center font-bold border-2 ${
                    message.type === 'success' ? 'bg-green-50 border-green-500 text-green-700' : 
                    message.type === 'error' ? 'bg-red-50 border-red-500 text-red-700' : 
                    'bg-yellow-50 border-yellow-500 text-yellow-700'
                }`}>
                    {message.text}
                </div>
            )}

            {ticket && (
                <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm">
                    <h3 className="text-lg font-bold text-[#5C2E0A] mb-4 border-b pb-2">Detalhes do Ingresso</h3>
                    <div className="space-y-3">
                        <div className="flex justify-between">
                            <span className="text-gray-500 text-sm italic">Comprador:</span>
                            <span className="font-bold">{ticket.arraia_purchases.customer_name}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500 text-sm italic">Tipo:</span>
                            <span className="font-bold uppercase text-primary">{ticket.ticket_type}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500 text-sm italic">Status:</span>
                            <span className={`font-bold ${ticket.status_uso ? 'text-red-600' : 'text-green-600'}`}>
                                {ticket.status_uso ? 'JÁ UTILIZADO' : ' DISPONÍVEL'}
                            </span>
                        </div>
                    </div>

                    {!ticket.status_uso && (
                        <button 
                            onClick={confirmCheckin}
                            disabled={loading}
                            className="w-full mt-6 bg-green-600 hover:bg-green-700 text-white py-4 rounded-2xl font-black text-lg transition-all shadow-lg"
                        >
                            LIBERAR ENTRADA
                        </button>
                    )}
                </div>
            )}

            <div className="mt-12 p-4 bg-gray-100 rounded-2xl text-[10px] text-gray-500 text-center uppercase tracking-widest">
                Sistema Interno - Quintal da Fafá 2026
            </div>
        </div>
    );
};

export default CheckinScanner;
