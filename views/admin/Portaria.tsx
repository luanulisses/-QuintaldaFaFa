import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';

interface Purchase {
    id: string;
    list_number: string;
    customer_name: string;
    customer_phone: string;
    items: { geral?: number; meia?: number; passaporte?: number; combo?: number; pescaria?: number; brinquedos?: number };
    total_amount: number;
    payment_status: string;
    checked_in: boolean;
    checked_in_at: string | null;
}

const formatItems = (items: Purchase['items']) => {
    const labels: Record<string, string> = { 
        geral: 'Ingresso Geral', 
        meia: 'Meia-Entrada',
        passaporte: 'Passaporte Kids', 
        combo: 'Combo Premium',
        pescaria: 'Ficha Pescaria',
        brinquedos: 'Brinquedo Individual'
    };
    return Object.entries(items || {})
        .filter(([, v]) => (v as number) > 0)
        .map(([k, v]) => `${v}x ${labels[k] || k}`)
        .join('\n');
};

const Portaria: React.FC = () => {
    const [query, setQuery] = useState('');
    const [result, setResult] = useState<Purchase | null>(null);
    const [notFound, setNotFound] = useState(false);
    const [confirming, setConfirming] = useState(false);
    const [justConfirmed, setJustConfirmed] = useState(false);

    const search = async () => {
        if (!query.trim()) return;
        setResult(null);
        setNotFound(false);
        setJustConfirmed(false);

        const term = query.trim().toUpperCase();

        // Busca por número da lista OU por nome
        let { data } = await supabase
            .from('arraia_purchases')
            .select('*')
            .or(`list_number.ilike.%${term}%,customer_name.ilike.%${query.trim()}%`)
            .eq('payment_status', 'approved')
            .limit(1)
            .single();

        if (data) {
            setResult(data);
        } else {
            setNotFound(true);
        }
    };

    const confirmEntry = async () => {
        if (!result) return;
        if (result.checked_in) return;
        setConfirming(true);

        await supabase
            .from('arraia_purchases')
            .update({ checked_in: true, checked_in_at: new Date().toISOString() })
            .eq('id', result.id);

        setResult({ ...result, checked_in: true, checked_in_at: new Date().toISOString() });
        setJustConfirmed(true);
        setConfirming(false);
    };

    const reset = () => {
        setQuery('');
        setResult(null);
        setNotFound(false);
        setJustConfirmed(false);
    };

    return (
        <div style={{
            fontFamily: 'Inter, sans-serif',
            background: '#1C0C04',
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'flex-start',
            padding: '32px 16px',
            color: '#EDD68A',
        }}>
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                <p style={{ fontSize: '30px', margin: '0 0 4px 0' }}>🌽</p>
                <h1 style={{ fontSize: '22px', fontWeight: 900, color: '#EDD68A', margin: '0 0 4px 0' }}>
                    PORTARIA — ARRAIÁ 2026
                </h1>
                <p style={{ fontSize: '12px', color: '#EDD68A', opacity: 0.5, margin: 0 }}>06 de Junho · Quintal da Fafá</p>
            </div>

            {/* Search box */}
            <div style={{ width: '100%', maxWidth: '420px' }}>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                    <input
                        type="text"
                        placeholder="Número (ARRAIA-001) ou Nome..."
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && search()}
                        autoFocus
                        style={{
                            flex: 1,
                            padding: '16px',
                            borderRadius: '16px',
                            border: '2px solid #D9981F',
                            background: '#2C1504',
                            color: '#EDD68A',
                            fontSize: '18px',
                            fontWeight: 700,
                            outline: 'none',
                        }}
                    />
                    <button onClick={search}
                        style={{
                            padding: '16px 20px',
                            borderRadius: '16px',
                            background: '#D9981F',
                            color: '#1C0C04',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '20px',
                            fontWeight: 900,
                        }}>
                        🔍
                    </button>
                </div>

                {/* Result */}
                {notFound && (
                    <div style={{ background: '#EF4444', borderRadius: '20px', padding: '24px', textAlign: 'center' }}>
                        <p style={{ fontSize: '32px', margin: '0 0 8px 0' }}>❌</p>
                        <p style={{ fontWeight: 900, fontSize: '18px', color: 'white', margin: '0 0 8px 0' }}>Não encontrado</p>
                        <p style={{ fontSize: '13px', color: 'white', opacity: 0.85, margin: '0 0 16px 0' }}>
                            Nenhum comprador confirmado com esse número ou nome.
                        </p>
                        <button onClick={reset}
                            style={{ padding: '10px 24px', borderRadius: '12px', background: 'white', color: '#EF4444', border: 'none', cursor: 'pointer', fontWeight: 700 }}>
                            Nova busca
                        </button>
                    </div>
                )}

                {result && (
                    <div style={{ background: result.checked_in && !justConfirmed ? '#374151' : 'white', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}>
                        {/* List number badge */}
                        <div style={{ background: justConfirmed ? '#10B981' : result.checked_in ? '#6B7280' : '#D9981F', padding: '20px', textAlign: 'center' }}>
                            <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#1C0C04', margin: '0 0 4px 0', opacity: 0.7 }}>
                                Nº na Lista
                            </p>
                            <p style={{ fontSize: '36px', fontWeight: 900, color: '#1C0C04', margin: 0, letterSpacing: '3px' }}>
                                {result.list_number}
                            </p>
                        </div>

                        {/* Details */}
                        <div style={{ padding: '20px' }}>
                            <p style={{ fontSize: '20px', fontWeight: 900, color: '#1C0C04', margin: '0 0 4px 0' }}>
                                {result.customer_name}
                            </p>
                            <p style={{ fontSize: '14px', color: '#5C2E0A', margin: '0 0 16px 0' }}>{result.customer_phone}</p>

                            <div style={{ background: '#FDF6EC', borderRadius: '12px', padding: '12px', marginBottom: '16px' }}>
                                {formatItems(result.items).split('\n').map((line, i) => (
                                    <p key={i} style={{ margin: '2px 0', fontSize: '15px', fontWeight: 700, color: '#5C2E0A' }}>🎫 {line}</p>
                                ))}
                                <p style={{ margin: '8px 0 0 0', fontSize: '13px', color: '#7a5235' }}>
                                    Total pago: <strong>R$ {Number(result.total_amount).toFixed(2).replace('.', ',')}</strong>
                                </p>
                            </div>

                            {/* Already checked in warning */}
                            {result.checked_in && !justConfirmed && (
                                <div style={{ background: '#FEF3C7', border: '2px solid #F59E0B', borderRadius: '12px', padding: '12px', marginBottom: '16px', textAlign: 'center' }}>
                                    <p style={{ fontWeight: 900, color: '#92400E', margin: 0, fontSize: '15px' }}>
                                        ⚠️ ATENÇÃO: Já fez check-in!
                                    </p>
                                    {result.checked_in_at && (
                                        <p style={{ fontSize: '13px', color: '#92400E', opacity: 0.8, margin: '4px 0 0 0' }}>
                                            Entrada registrada às {new Date(result.checked_in_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    )}
                                </div>
                            )}

                            {/* Success */}
                            {justConfirmed && (
                                <div style={{ background: '#D1FAE5', border: '2px solid #10B981', borderRadius: '12px', padding: '16px', marginBottom: '16px', textAlign: 'center' }}>
                                    <p style={{ fontSize: '32px', margin: '0 0 4px 0' }}>✅</p>
                                    <p style={{ fontWeight: 900, color: '#065F46', margin: 0, fontSize: '18px' }}>ENTRADA LIBERADA!</p>
                                </div>
                            )}

                            {/* Actions */}
                            <div style={{ display: 'flex', gap: '8px' }}>
                                {!result.checked_in && (
                                    <button onClick={confirmEntry} disabled={confirming}
                                        style={{
                                            flex: 1,
                                            padding: '16px',
                                            borderRadius: '16px',
                                            background: '#10B981',
                                            color: 'white',
                                            border: 'none',
                                            cursor: 'pointer',
                                            fontWeight: 900,
                                            fontSize: '16px',
                                            opacity: confirming ? 0.6 : 1,
                                        }}>
                                        {confirming ? 'Confirmando...' : '✅ LIBERAR ENTRADA'}
                                    </button>
                                )}
                                <button onClick={reset}
                                    style={{ padding: '16px', borderRadius: '16px', background: '#F0DFBB', color: '#5C2E0A', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '14px' }}>
                                    Nova busca
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Portaria;
