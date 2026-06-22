import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { Html5Qrcode } from 'html5-qrcode';

interface Purchase {
    id: string;
    list_number: string;
    customer_name: string;
    customer_phone: string;
    items: { geral?: number; meia?: number; passaporte?: number; pescaria?: number; brinquedos?: number };
    total_amount: number;
    payment_status: string;
    checked_in: boolean;
    checked_in_at: string | null;
    checked_by?: string | null;
}

const formatItems = (items: Purchase['items']) => {
    const labels: Record<string, string> = { 
        geral: 'Ingresso Geral', 
        meia: 'Meia-Entrada',
        passaporte: 'Passaporte Kids', 
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
    const [operator, setOperator] = useState<string>('Portaria');

    // Scanner States
    const [scannerActive, setScannerActive] = useState(false);
    const [scannerPaused, setScannerPaused] = useState(false);
    const [scannerError, setScannerError] = useState<string | null>(null);
    const html5QrCodeRef = useRef<Html5Qrcode | null>(null);

    const EDITION_2_START = '2026-06-20T00:00:00Z';

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    setOperator(user.email || user.id || 'Portaria');
                }
            } catch (err) {
                console.error("Error fetching authenticated user:", err);
            }
        };
        fetchUser();

        return () => {
            if (html5QrCodeRef.current) {
                html5QrCodeRef.current.stop().catch(err => console.error("Error stopping scanner on unmount", err));
            }
        };
    }, []);

    const searchCode = async (codeToSearch: string) => {
        setResult(null);
        setNotFound(false);
        setJustConfirmed(false);

        const term = codeToSearch.trim().toUpperCase();
        if (!term) return null;

        // Search in Second Edition only, matching exact list_number or customer_name
        let { data, error } = await supabase
            .from('arraia_purchases')
            .select('*')
            .or(`list_number.eq.${term},customer_name.ilike.%${codeToSearch.trim()}%`)
            .gte('created_at', EDITION_2_START)
            .limit(1)
            .maybeSingle();

        if (data) {
            setResult(data);
            return data;
        } else {
            setNotFound(true);
            return null;
        }
    };

    const search = async () => {
        if (!query.trim()) return;
        await searchCode(query);
    };

    const confirmEntry = async () => {
        if (!result) return;
        if (result.checked_in) return;
        if (result.payment_status !== 'approved') return;
        setConfirming(true);

        const checkedBy = operator;

        await supabase
            .from('arraia_purchases')
            .update({ 
                checked_in: true, 
                checked_in_at: new Date().toISOString(),
                checked_by: checkedBy
            })
            .eq('id', result.id);

        setResult({ 
            ...result, 
            checked_in: true, 
            checked_in_at: new Date().toISOString(),
            checked_by: checkedBy
        });
        setJustConfirmed(true);
        setConfirming(false);
    };

    const reset = () => {
        setQuery('');
        setResult(null);
        setNotFound(false);
        setJustConfirmed(false);
        if (scannerActive && scannerPaused) {
            resumeScanner();
        }
    };

    // Scanner actions
    const startScanner = async () => {
        setScannerError(null);
        setResult(null);
        setNotFound(false);
        setJustConfirmed(false);
        setScannerActive(true);
        setScannerPaused(false);
        
        setTimeout(async () => {
            try {
                const html5QrCode = new Html5Qrcode("qr-reader");
                html5QrCodeRef.current = html5QrCode;

                await html5QrCode.start(
                    { facingMode: "environment" },
                    {
                        fps: 10,
                        qrbox: { width: 250, height: 250 }
                    },
                    (decodedText) => {
                        pauseAndProcess(decodedText);
                    },
                    (errorMessage) => {
                        // ignore scan errors
                    }
                );
            } catch (err: any) {
                console.error("Failed to start scanner:", err);
                setScannerError("Não foi possível acessar a câmera. Verifique as permissões de vídeo.");
                setScannerActive(false);
            }
        }, 150);
    };

    const stopScanner = async () => {
        if (html5QrCodeRef.current) {
            try {
                if (html5QrCodeRef.current.isScanning) {
                    await html5QrCodeRef.current.stop();
                }
            } catch (err) {
                console.error("Failed to stop scanner:", err);
            }
        }
        html5QrCodeRef.current = null;
        setScannerActive(false);
        setScannerPaused(false);
    };

    const pauseAndProcess = async (decodedText: string) => {
        if (html5QrCodeRef.current) {
            try {
                html5QrCodeRef.current.pause(true);
                setScannerPaused(true);
            } catch (e) {
                console.error("Error pausing scanner", e);
            }
        }
        await searchCode(decodedText);
    };

    const resumeScanner = () => {
        if (html5QrCodeRef.current) {
            try {
                html5QrCodeRef.current.resume();
                setScannerPaused(false);
                setResult(null);
                setNotFound(false);
                setJustConfirmed(false);
            } catch (e) {
                console.error("Error resuming scanner", e);
            }
        }
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
                <p style={{ fontSize: '12px', color: '#EDD68A', opacity: 0.5, margin: 0 }}>2ª Edição · Quintal da Fafá</p>
            </div>

            <div style={{ width: '100%', maxWidth: '420px' }}>
                {/* Scanner button */}
                <button 
                    onClick={scannerActive ? stopScanner : startScanner}
                    style={{
                        width: '100%',
                        padding: '16px',
                        borderRadius: '16px',
                        background: '#D9981F',
                        color: '#1C0C04',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '16px',
                        fontWeight: 900,
                        marginBottom: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        boxShadow: '0 4px 15px rgba(217, 152, 31, 0.2)'
                    }}
                >
                    {scannerActive ? '✕ Fechar Scanner' : '📷 Escanear QR Code'}
                </button>

                {/* Scanner Container */}
                {scannerActive && (
                    <div style={{
                        background: '#2C1504',
                        borderRadius: '24px',
                        border: '2px solid #D9981F',
                        padding: '16px',
                        marginBottom: '16px',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                        textAlign: 'center',
                        position: 'relative'
                    }}>
                        <div id="qr-reader" style={{ width: '100%', borderRadius: '16px', overflow: 'hidden', background: '#000' }}></div>
                        {scannerError && (
                            <p style={{ color: '#EF4444', fontSize: '14px', fontWeight: 'bold', marginTop: '12px', margin: '12px 0 0 0' }}>
                                {scannerError}
                            </p>
                        )}
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginTop: '12px' }}>
                            {scannerPaused && (
                                <button 
                                    onClick={resumeScanner}
                                    style={{
                                        padding: '8px 16px',
                                        borderRadius: '8px',
                                        background: '#D9981F',
                                        color: '#1C0C04',
                                        border: 'none',
                                        cursor: 'pointer',
                                        fontWeight: 800,
                                        fontSize: '13px'
                                    }}
                                >
                                    🔄 Escanear outro QR
                                </button>
                            )}
                            <button 
                                onClick={stopScanner}
                                style={{
                                    padding: '8px 16px',
                                    borderRadius: '8px',
                                    background: 'rgba(255,255,255,0.1)',
                                    color: '#EDD68A',
                                    border: '1px solid rgba(255,255,255,0.2)',
                                    cursor: 'pointer',
                                    fontWeight: 700,
                                    fontSize: '13px'
                                }}
                            >
                                Parar Câmera
                            </button>
                        </div>
                    </div>
                )}

                {/* Search box */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                    <input
                        type="text"
                        placeholder="Número (ARRAIA-001) ou Nome..."
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && search()}
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

                {/* Result: Not Found */}
                {notFound && (
                    <div style={{ background: '#EF4444', borderRadius: '20px', padding: '24px', textAlign: 'center', boxShadow: '0 8px 32px rgba(239,68,68,0.2)' }}>
                        <p style={{ fontSize: '32px', margin: '0 0 8px 0' }}>🔴</p>
                        <p style={{ fontWeight: 900, fontSize: '18px', color: 'white', margin: '0 0 8px 0' }}>Ingresso não encontrado</p>
                        <p style={{ fontSize: '13px', color: 'white', opacity: 0.85, margin: '0 0 16px 0' }}>
                            Nenhum comprador ou lista encontrada para a 2ª Edição.
                        </p>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                            {scannerPaused && (
                                <button onClick={resumeScanner}
                                    style={{ padding: '10px 18px', borderRadius: '12px', background: '#D9981F', color: '#1C0C04', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '13px' }}>
                                    🔄 Escanear novamente
                                </button>
                            )}
                            <button onClick={reset}
                                style={{ padding: '10px 18px', borderRadius: '12px', background: 'white', color: '#EF4444', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '13px' }}>
                                Nova busca
                            </button>
                        </div>
                    </div>
                )}

                {/* Result: Purchase Loaded */}
                {result && (
                    <div style={{ 
                        background: result.checked_in && !justConfirmed ? '#374151' : result.payment_status !== 'approved' ? '#2d1b0d' : 'white', 
                        borderRadius: '24px', 
                        overflow: 'hidden', 
                        boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                        border: result.payment_status !== 'approved' ? '2px solid #F59E0B' : result.checked_in && !justConfirmed ? '2px solid #EF4444' : '2px solid #10B981'
                    }}>
                        {/* Header Status Bar */}
                        <div style={{ 
                            background: justConfirmed 
                                ? '#10B981' 
                                : result.checked_in 
                                    ? '#EF4444' 
                                    : result.payment_status !== 'approved'
                                        ? '#F59E0B'
                                        : '#10B981', 
                            padding: '20px', 
                            textAlign: 'center',
                            color: result.checked_in && !justConfirmed ? 'white' : result.payment_status !== 'approved' ? '#78350F' : 'white'
                        }}>
                            <p style={{ fontSize: '16px', fontWeight: 900, textTransform: 'uppercase', margin: 0, letterSpacing: '0.05em' }}>
                                {justConfirmed 
                                    ? '🟢 Ingresso válido' 
                                    : result.checked_in 
                                        ? '🔴 Ingresso já utilizado' 
                                        : result.payment_status !== 'approved'
                                            ? '🟠 Pagamento não confirmado'
                                            : '🟢 Ingresso válido'
                                }
                            </p>
                            <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', margin: '12px 0 4px 0', opacity: 0.7 }}>
                                Nº na Lista
                            </p>
                            <p style={{ fontSize: '36px', fontWeight: 900, margin: 0, letterSpacing: '3px' }}>
                                {result.list_number}
                            </p>
                        </div>

                        {/* Details Area */}
                        <div style={{ padding: '20px', color: '#1C0C04' }}>
                            <p style={{ fontSize: '20px', fontWeight: 900, margin: '0 0 4px 0', color: result.checked_in && !justConfirmed ? '#EDD68A' : '#1C0C04' }}>
                                {result.customer_name}
                            </p>
                            <p style={{ fontSize: '14px', margin: '0 0 16px 0', color: result.checked_in && !justConfirmed ? '#EDD68A' : '#5C2E0A', opacity: 0.8 }}>
                                {result.customer_phone}
                            </p>

                            <div style={{ 
                                background: result.checked_in && !justConfirmed ? '#4B5563' : '#FDF6EC', 
                                borderRadius: '12px', 
                                padding: '12px', 
                                marginBottom: '16px' 
                            }}>
                                {formatItems(result.items).split('\n').map((line, i) => (
                                    <p key={i} style={{ margin: '2px 0', fontSize: '15px', fontWeight: 700, color: result.checked_in && !justConfirmed ? 'white' : '#5C2E0A' }}>
                                        🎫 {line}
                                    </p>
                                ))}
                                <p style={{ margin: '8px 0 0 0', fontSize: '13px', color: result.checked_in && !justConfirmed ? 'rgba(255,255,255,0.7)' : '#7a5235' }}>
                                    Total pago: <strong>R$ {Number(result.total_amount).toFixed(2).replace('.', ',')}</strong>
                                </p>
                            </div>

                            {/* Warnings */}
                            {result.payment_status !== 'approved' && (
                                <div style={{ background: '#FEF3C7', border: '1px solid #F59E0B', borderRadius: '12px', padding: '12px', marginBottom: '16px', textAlign: 'center' }}>
                                    <p style={{ fontWeight: 900, color: '#92400E', margin: 0, fontSize: '14px' }}>
                                        🟠 PAGAMENTO NÃO CONFIRMADO
                                    </p>
                                    <p style={{ fontSize: '12px', color: '#92400E', opacity: 0.9, margin: '4px 0 0 0' }}>
                                        Status: {result.payment_status} — Entrada não permitida.
                                    </p>
                                </div>
                            )}

                            {result.checked_in && !justConfirmed && (
                                <div style={{ background: '#FEE2E2', border: '1px solid #EF4444', borderRadius: '12px', padding: '12px', marginBottom: '16px', textAlign: 'center' }}>
                                    <p style={{ fontWeight: 900, color: '#991B1B', margin: 0, fontSize: '14px' }}>
                                        🔴 INGRESSO JÁ UTILIZADO
                                    </p>
                                    {result.checked_in_at && (
                                        <p style={{ fontSize: '12px', color: '#991B1B', opacity: 0.9, margin: '4px 0 0 0' }}>
                                            Entrada registrada em {new Date(result.checked_in_at).toLocaleDateString('pt-BR')} às {new Date(result.checked_in_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                            {result.checked_by && ` por ${result.checked_by}`}
                                        </p>
                                    )}
                                </div>
                            )}

                            {justConfirmed && (
                                <div style={{ background: '#D1FAE5', border: '2px solid #10B981', borderRadius: '12px', padding: '16px', marginBottom: '16px', textAlign: 'center' }}>
                                    <p style={{ fontSize: '32px', margin: '0 0 4px 0' }}>🟢</p>
                                    <p style={{ fontWeight: 900, color: '#065F46', margin: 0, fontSize: '18px' }}>INGRESSO VÁLIDO</p>
                                    <p style={{ fontSize: '12px', color: '#065F46', opacity: 0.8, margin: '4px 0 0 0' }}>
                                        Check-in realizado com sucesso!
                                    </p>
                                </div>
                            )}

                            {/* Actions buttons */}
                            <div style={{ display: 'flex', gap: '8px' }}>
                                {!result.checked_in && result.payment_status === 'approved' && (
                                    <button 
                                        onClick={confirmEntry} 
                                        disabled={confirming}
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
                                            boxShadow: '0 4px 12px rgba(16,185,129,0.3)'
                                        }}
                                    >
                                        {confirming ? 'Confirmando...' : '✅ CONFIRMAR ENTRADA'}
                                    </button>
                                )}
                                {scannerPaused && (
                                    <button 
                                        onClick={resumeScanner}
                                        style={{
                                            flex: 1,
                                            padding: '16px',
                                            borderRadius: '16px',
                                            background: '#D9981F',
                                            color: '#1C0C04',
                                            border: 'none',
                                            cursor: 'pointer',
                                            fontWeight: 900,
                                            fontSize: '15px'
                                        }}
                                    >
                                        🔄 PRÓXIMO QR
                                    </button>
                                )}
                                <button 
                                    onClick={reset}
                                    style={{ 
                                        padding: '16px', 
                                        borderRadius: '16px', 
                                        background: result.checked_in && !justConfirmed ? '#4B5563' : '#F0DFBB', 
                                        color: result.checked_in && !justConfirmed ? 'white' : '#5C2E0A', 
                                        border: 'none', 
                                        cursor: 'pointer', 
                                        fontWeight: 700, 
                                        fontSize: '14px' 
                                    }}
                                >
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
