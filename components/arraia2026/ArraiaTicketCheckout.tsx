import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { supabase } from '../../lib/supabase';
import { initMercadoPago, Payment } from '@mercadopago/sdk-react';
import DigitalTicket from './DigitalTicket';
import { ACTIVE_TICKET_CONFIG } from '../../lib/ticketConfig';

initMercadoPago(import.meta.env.VITE_MERCADOPAGO_PUBLIC_KEY, { locale: 'pt-BR' });

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

type PixState = {
    purchaseId: string;
    qrCodeBase64: string;
    copyPaste: string;
    expiresAt: Date;
    listNumber?: string;
    customerName: string;
    itemsText: string;
    total: number;
};

const ArraiaTicketCheckout: React.FC = () => {
    const [formData, setFormData] = useState({ name: '', email: '', phone: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [purchaseError, setPurchaseError] = useState<string | null>(null);

    const [qty, setQty] = useState({ geral: 0, meia: 0, passaporte: 0 });
    const [paymentMethod, setPaymentMethod] = useState<'pix' | 'credit_card'>('pix');

    const [pixData, setPixData] = useState<PixState | null>(null);
    const [pixStep, setPixStep] = useState<'idle' | 'pix' | 'loading_cc' | 'success'>('idle');
    const [pixTimeLeft, setPixTimeLeft] = useState(30 * 60);
    const [copied, setCopied] = useState(false);
    const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const currentPrices = {
        geral: ACTIVE_TICKET_CONFIG.general.price,
        meia: ACTIVE_TICKET_CONFIG.half.price,
        passaporte: ACTIVE_TICKET_CONFIG.kids.price
    };
    const total = (qty.geral * currentPrices.geral) + (qty.meia * currentPrices.meia) + (qty.passaporte * currentPrices.passaporte);

    const mpInitialization = useMemo(() => ({ amount: total }), [total]);
    const mpCustomization = useMemo(() => ({
        paymentMethods: { 
            maxInstallments: 3, 
            creditCard: 'all' as const,
            types: {
                excluded: ['ticket', 'bank_transfer', 'atm', 'debitCard', 'wallet_purchase', 'onboarding_credits'] as any
            }
        }
    }), []);

    // PIX countdown timer
    useEffect(() => {
        if (pixStep !== 'pix') return;
        const t = setInterval(() => {
            setPixTimeLeft(prev => {
                if (prev <= 1) { clearInterval(t); return 0; }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(t);
    }, [pixStep]);

    // Poll for payment confirmation
    const startPolling = useCallback((purchaseId: string) => {
        if (pollingRef.current) clearInterval(pollingRef.current);
        pollingRef.current = setInterval(async () => {
            const { data, error } = await supabase
                .rpc('check_purchase_status', { p_purchase_id: purchaseId })
                .single();
                
            if (data?.payment_status === 'approved' && data.list_number) {
                clearInterval(pollingRef.current!);
                setPixData(prev => prev ? { ...prev, listNumber: data.list_number } : prev);
                setPixStep('success');
            }
        }, 5000);
    }, []);

    useEffect(() => {
        return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
    }, []);

    const handleQtyChange = (field: keyof typeof qty, delta: number) => {
        setQty(prev => {
            const nextValue = Math.max(0, prev[field] + delta);
            return { ...prev, [field]: nextValue };
        });
    };

    const formatItems = (q: typeof qty) => {
        const labels = { 
            geral: ACTIVE_TICKET_CONFIG.general.label, 
            meia: ACTIVE_TICKET_CONFIG.half.label,
            passaporte: ACTIVE_TICKET_CONFIG.kids.label
        };
        return Object.entries(q).filter(([, v]) => (v as number) > 0).map(([k, v]) => `${v}x ${labels[k as keyof typeof labels]}`).join(', ');
    };

    const handlePurchase = async (e: React.FormEvent) => {
        e.preventDefault();
        if (paymentMethod !== 'pix') return;
        if (total === 0) { setPurchaseError('Selecione pelo menos um ingresso.'); return; }
        
        try {
            setIsSubmitting(true);
            setPurchaseError(null);

            const res = await fetch(`${SUPABASE_URL}/functions/v1/mercadopago-pix`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': SUPABASE_ANON_KEY,
                },
                body: JSON.stringify({
                    customer_name: formData.name,
                    customer_email: formData.email,
                    customer_phone: formData.phone,
                    items: qty,
                    total_amount: total,
                    event_edition: 'segunda_edicao_2026',
                })
            });

            const result = await res.json();
            if (!res.ok) throw new Error(result.error || 'Erro ao gerar PIX');

            setPixData({
                purchaseId: result.purchase_id,
                qrCodeBase64: result.qr_code_base64,
                copyPaste: result.copy_paste,
                expiresAt: new Date(result.expires_at),
                customerName: formData.name,
                itemsText: formatItems(qty),
                total,
            });
            setPixTimeLeft(30 * 60);
            setPixStep('pix');
            startPolling(result.purchase_id);

        } catch (err: any) {
            setPurchaseError('Erro: ' + err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const getPaymentErrorMessage = (statusDetail: string) => {
        switch (statusDetail) {
            case "cc_rejected_high_risk":
                return "Pagamento recusado pela análise de segurança. Tente outro cartão ou escolha PIX.";
            case "cc_rejected_insufficient_amount":
                return "Cartão sem limite disponível.";
            case "cc_rejected_bad_filled_card_number":
                return "Número do cartão inválido.";
            case "cc_rejected_bad_filled_date":
                return "Data de validade inválida.";
            case "cc_rejected_bad_filled_security_code":
                return "Código de segurança inválido.";
            case "cc_rejected_blacklist":
                return "Pagamento recusado. Entre em contato com o banco.";
            case "cc_rejected_other_reason":
                return "Pagamento não autorizado. Tente outro cartão.";
            default:
                return "Não foi possível processar o pagamento. Tente novamente.";
        }
    };

    const onCardPaymentSubmit = useCallback((cardFormData: any) => {
        return new Promise<void>(async (resolve, reject) => {
            if (total === 0) { 
                setPurchaseError('Selecione pelo menos um ingresso.'); 
                reject();
                return; 
            }
            if (!formData.name || !formData.email || !formData.phone) {
                setPurchaseError('Preencha seus dados de contato primeiro.');
                reject();
                return;
            }

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 15000);

            try {
                setIsSubmitting(true);
                setPurchaseError(null);

                const payload = {
                    customer_name: formData.name,
                    customer_email: formData.email,
                    customer_phone: formData.phone,
                    items: qty,
                    total_amount: total,
                    event_edition: 'segunda_edicao_2026',
                    ...cardFormData,
                };

                const res = await fetch(`${SUPABASE_URL}/functions/v1/mercadopago-cc`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                    },
                    body: JSON.stringify(payload),
                    signal: controller.signal
                });

                clearTimeout(timeoutId);

                const result = await res.json();

                if (!res.ok) throw new Error(result.error || 'Erro ao processar cartão');

                if (result.status === 'approved') {
                    setPixData({
                        purchaseId: result.purchase_id,
                        qrCodeBase64: '',
                        copyPaste: '',
                        expiresAt: new Date(),
                        customerName: formData.name,
                        itemsText: formatItems(qty),
                        total,
                    });
                    setPixStep('loading_cc');
                    startPolling(result.purchase_id);
                    resolve();
                } else if (result.status === 'in_process') {
                    setPurchaseError('Pagamento em análise pelo Mercado Pago. Você receberá a confirmação por e-mail se aprovado.');
                    resolve();
                } else if (result.status === 'rejected') {
                    const msg = getPaymentErrorMessage(result.status_detail);
                    setPurchaseError(msg);
                    reject(new Error(msg));
                } else {
                    const msg = 'Pagamento não aprovado. Tente novamente.';
                    setPurchaseError(msg);
                    reject(new Error(msg));
                }

            } catch (err: any) {
                let msg = 'Ocorreu um erro inesperado ao processar seu pagamento. Tente novamente mais tarde.';
                if (err.name === 'AbortError') {
                    msg = 'A conexão com o servidor demorou muito. Por favor, tente novamente.';
                }
                setPurchaseError(msg);
                reject(new Error(msg));
            } finally {
                setIsSubmitting(false);
            }
        });
    }, [total, formData, qty, SUPABASE_URL, SUPABASE_ANON_KEY, startPolling]);

    const handleCardPaymentSubmit = useCallback((param: any) => {
        return onCardPaymentSubmit(param.formData);
    }, [onCardPaymentSubmit]);

    const copyPixCode = () => {
        if (pixData?.copyPaste) {
            navigator.clipboard.writeText(pixData.copyPaste);
            setCopied(true);
            setTimeout(() => setCopied(false), 3000);
        }
    };

    const pixMinutes = String(Math.floor(pixTimeLeft / 60)).padStart(2, '0');
    const pixSeconds = String(pixTimeLeft % 60).padStart(2, '0');

    return (
        <div className="w-full relative z-10" id="checkout-form">
            {/* O que não é modais primeiro... */}
            
            {/* Lotes - Quadro de Preços Resumido */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                {/* 3º Lote */}
                <div className="bg-[#2A0854] rounded-xl overflow-hidden shadow-xl border border-[#FFD54F]/30 flex flex-col transform hover:-translate-y-2 transition-transform duration-300">
                    <div className="bg-[#FFD54F] text-[#3B0964] text-center py-3 font-black text-lg">
                        🎟️ 3º LOTE – ATUAL
                    </div>
                    <div className="p-6 flex-1 flex flex-col gap-4 bg-gradient-to-b from-[#2A0854] to-[#1C053A]">
                        <div>
                            <div className="flex justify-between items-center mb-1">
                                <div className="flex items-center gap-2">
                                    <span className="text-[#FFD54F] text-xl">👥</span>
                                    <span className="font-bold text-white leading-tight">INGRESSO GERAL</span>
                                </div>
                            </div>
                            <div className="text-white font-black text-3xl text-center mt-2">R$ 30,00</div>
                        </div>
                        <div className="border-t border-dashed border-white/20"></div>
                        <div>
                            <div className="flex justify-between items-center mb-1">
                                <div className="flex items-center gap-2">
                                    <span className="text-white/70 text-xl">👤</span>
                                    <span className="font-bold text-white text-sm leading-tight">MEIA-ENTRADA <span className="bg-[#FFD54F] text-[#3B0964] px-1 rounded ml-1 text-[10px]">6 A 12 ANOS</span></span>
                                </div>
                            </div>
                            <div className="text-white font-black text-2xl text-center mt-2">R$ 15,00</div>
                        </div>
                    </div>
                    <div className="bg-[#1C053A] text-white/50 text-center py-2 text-xs">
                        Crianças até 5 anos não pagam.
                    </div>
                </div>

                {/* Card Vazio Oculto para Alinhamento ou Apenas Espaçamento no Desktop se quisermos 2 ou 3 cards... 
                    A referência mostra: 1 bloco 1º lote (com Geral e Meia) e 1 bloco Passaporte Kids lado a lado.
                    Como o usuário pediu os cards parecidos com a imagem (que tem 1º lote englobando Geral e Meia em um card só, e Passaporte Kids em outro)
                    Eu vou ajustar isso no JSX.
                */}
            </div>

            {/* Quadro de Lotes fiel à imagem (Ingresso Geral e Meia no mesmo bloco, Passaporte separado) */}
            <div className="mb-6">
                <div className="flex items-center gap-2 mb-4">
                    <span className="text-[#FFD54F] text-xl">🎟️</span>
                    <span className="text-white font-bold text-lg">3º LOTE – ATUAL</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Geral */}
                    <div className="bg-[#1C053A] rounded-xl p-6 border border-white/10 shadow-lg hover:border-[#FFD54F]/30 transition-colors flex flex-col justify-center items-center">
                        <div className="flex items-center gap-2 mb-2 text-white/80">
                            <span className="text-xl text-[#FFD54F]">👥</span>
                            <span className="font-bold uppercase tracking-wider text-sm">Ingresso Geral</span>
                        </div>
                        <div className="text-white font-black text-3xl">
                            <span className="text-lg text-white/60 mr-1">R$</span>30<span className="text-lg text-white/60">,00</span>
                        </div>
                    </div>
                    
                    {/* Meia */}
                    <div className="bg-[#1C053A] rounded-xl p-6 border border-white/10 shadow-lg hover:border-[#FFD54F]/30 transition-colors flex flex-col justify-center items-center">
                        <div className="flex flex-col items-center gap-1 mb-2">
                            <div className="flex items-center gap-2 text-white/80">
                                <span className="text-xl text-[#FFD54F]">👤</span>
                                <span className="font-bold uppercase tracking-wider text-sm">Meia-Entrada</span>
                            </div>
                            <span className="bg-[#FFD54F] text-[#3B0964] px-2 py-0.5 rounded text-[10px] font-black tracking-widest">6 A 12 ANOS</span>
                        </div>
                        <div className="text-white font-black text-3xl">
                            <span className="text-lg text-white/60 mr-1">R$</span>15<span className="text-lg text-white/60">,00</span>
                        </div>
                    </div>

                    {/* Kids */}
                    <div className="bg-[#4CAF50]/10 rounded-xl p-6 border border-[#4CAF50]/40 shadow-lg hover:border-[#4CAF50] transition-colors flex flex-col justify-center items-center relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-[#4CAF50]"></div>
                        <div className="flex items-center gap-2 mb-2 text-white/90">
                            <span className="text-2xl">🧒</span>
                            <span className="font-bold uppercase tracking-wider text-sm">Passaporte Kids</span>
                        </div>
                        <div className="text-white font-black text-3xl mb-2">
                            <span className="text-lg text-white/60 mr-1">R$</span>25<span className="text-lg text-white/60">,00</span>
                        </div>
                        <div className="flex flex-col items-center">
                            <span className="bg-[#4CAF50] text-white px-2 py-0.5 rounded-full text-[10px] font-bold mb-1">PREÇO FIXO</span>
                            <span className="text-white/60 text-[11px]">Não participa dos lotes</span>
                        </div>
                    </div>
                </div>
                <div className="mt-3 flex items-start gap-2 text-white/50 text-xs">
                    <span>ℹ️</span>
                    <p>Crianças até 5 anos não pagam entrada. Necessário documento comprobatório.</p>
                </div>
            </div>

            {/* Formulário de Checkout */}
            <div className="mt-8 bg-[#2A0854]/80 backdrop-blur-md rounded-2xl shadow-2xl p-6 md:p-8 border border-white/10 transition-all duration-500">
                <div className="text-center mb-8">
                    <h3 className="font-display font-black text-2xl text-[#FFD54F] flex items-center justify-center gap-2">
                        <span>🎟️</span> FINALIZAR COMPRA
                    </h3>
                    <p className="text-white/60 text-sm mt-1">Preencha seus dados e selecione a quantidade desejada</p>
                </div>

                <form onSubmit={handlePurchase} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <input 
                            type="text" 
                            required placeholder="Seu nome completo"
                            value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                            className="w-full bg-white text-black px-4 py-3 border-none rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FFD54F]"
                        />
                        <input 
                            type="tel" 
                            required placeholder="Seu WhatsApp"
                            value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})}
                            className="w-full bg-white text-black px-4 py-3 border-none rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FFD54F]"
                        />
                        <input 
                            type="email" 
                            required placeholder="Seu e-mail"
                            value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})}
                            className="w-full bg-white text-black px-4 py-3 border-none rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FFD54F]"
                        />
                    </div>

                    <div className="bg-white rounded-xl overflow-hidden border border-gray-100 shadow-inner">
                        <div className="bg-gray-100 px-4 py-3 border-b border-gray-200">
                            <label className="text-[#3B0964] text-xs font-black tracking-widest uppercase">Selecione seus Ingressos</label>
                        </div>
                        <div className="divide-y divide-gray-100">
                            {[
                                { id: 'geral', label: ACTIVE_TICKET_CONFIG.general.label, subtitle: `(R$ ${ACTIVE_TICKET_CONFIG.general.price.toFixed(2).replace('.', ',')})`, price: ACTIVE_TICKET_CONFIG.general.price, icon: '🎟️' },
                                { id: 'meia', label: ACTIVE_TICKET_CONFIG.half.label, subtitle: `(R$ ${ACTIVE_TICKET_CONFIG.half.price.toFixed(2).replace('.', ',')})`, price: ACTIVE_TICKET_CONFIG.half.price, icon: '👤' },
                                { id: 'passaporte', label: ACTIVE_TICKET_CONFIG.kids.label, subtitle: `(R$ ${ACTIVE_TICKET_CONFIG.kids.price.toFixed(2).replace('.', ',')})`, price: ACTIVE_TICKET_CONFIG.kids.price, icon: '🧒' },
                            ].map(item => (
                                <div key={item.id} className="flex flex-col sm:flex-row justify-between items-center p-4 bg-white hover:bg-gray-50 transition-colors gap-4 sm:gap-0">
                                    <div className="flex items-center gap-3 w-full sm:w-auto">
                                        <span className="text-xl">{item.icon}</span>
                                        <div>
                                            <span className="text-gray-900 font-bold text-sm block">{item.label}</span>
                                            <span className="text-gray-500 text-xs">{item.subtitle}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between w-full sm:w-auto gap-8">
                                        <div className="flex items-center gap-1 bg-gray-100 rounded-full p-1 border border-gray-200">
                                            <button type="button" onClick={() => handleQtyChange(item.id as any, -1)} className="w-8 h-8 rounded-full bg-white text-gray-800 flex items-center justify-center shadow-sm font-bold hover:bg-gray-50">-</button>
                                            <span className="text-[#3B0964] font-black w-8 text-center">{(qty as any)[item.id]}</span>
                                            <button type="button" onClick={() => handleQtyChange(item.id as any, 1)} className="w-8 h-8 rounded-full bg-white text-gray-800 flex items-center justify-center shadow-sm font-bold hover:bg-gray-50">+</button>
                                        </div>
                                        <span className="text-gray-900 font-bold text-sm w-20 text-right">
                                            R$ {((qty as any)[item.id] * item.price).toFixed(2).replace('.', ',')}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex justify-between items-center border-t border-white/20 pt-4 pb-2">
                        <span className="text-white font-bold text-xl uppercase tracking-wider">Total</span>
                        <span className="text-[#FFD54F] font-black text-4xl">R$ {total.toFixed(2).replace('.', ',')}</span>
                    </div>

                    <div>
                        <label className="block text-white text-xs font-black tracking-widest uppercase mb-3">Forma de Pagamento</label>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <button type="button" onClick={() => setPaymentMethod('pix')} className={`flex-1 py-4 rounded-xl text-sm font-bold border-2 transition-all flex flex-col items-center justify-center gap-1 ${paymentMethod === 'pix' ? 'border-[#4CAF50] bg-[#1C053A] text-[#4CAF50]' : 'border-white/10 bg-black/20 text-white/50 hover:border-white/30'}`}>
                                <div className="flex items-center gap-2">
                                    <span className="text-2xl">❖</span> <span className="text-lg">PIX</span>
                                </div>
                                <span className="text-[10px] font-normal opacity-80">Aprovação imediata</span>
                            </button>
                            <button type="button" onClick={() => setPaymentMethod('credit_card')} className={`flex-1 py-4 rounded-xl text-sm font-bold border-2 transition-all flex flex-col items-center justify-center gap-1 ${paymentMethod === 'credit_card' ? 'border-[#2196F3] bg-[#1C053A] text-[#2196F3]' : 'border-white/10 bg-black/20 text-white/50 hover:border-white/30'}`}>
                                <div className="flex items-center gap-2">
                                    <span className="text-2xl">💳</span> <span className="text-lg">CARTÃO</span>
                                </div>
                                <span className="text-[10px] font-normal opacity-80">Débito ou Crédito</span>
                            </button>
                        </div>
                    </div>

                    {paymentMethod === 'pix' ? (
                        <div className="pt-2">
                            {purchaseError && <p className="text-red-400 text-sm text-center font-bold mb-3">{purchaseError}</p>}
                            <button 
                                type="submit" disabled={isSubmitting || total === 0}
                                className="w-full bg-[#4CAF50] hover:bg-[#388E3C] text-white font-black py-5 rounded-xl text-xl transition-all shadow-[0_0_20px_rgba(76,175,80,0.4)] hover:shadow-[0_0_30px_rgba(76,175,80,0.6)] flex justify-center items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-[0.98]"
                            >
                                <span>🔒</span> {isSubmitting ? 'GERANDO PIX...' : 'FINALIZAR COMPRA'}
                            </button>
                            <p className="text-center text-white/40 text-xs mt-3 flex items-center justify-center gap-1">
                                <span>🔒</span> Ambiente seguro e protegido
                            </p>
                        </div>
                    ) : (
                        <div className="bg-white rounded-xl p-4 border border-gray-200 mt-4">
                            {total > 0 && formData.name && formData.email && formData.phone ? (
                                <>
                                    <Payment 
                                        initialization={mpInitialization}
                                        customization={mpCustomization}
                                        onSubmit={handleCardPaymentSubmit}
                                        locale="pt-BR"
                                    />
                                    {purchaseError && (
                                        <p className="text-red-500 text-sm text-center font-bold mt-3">{purchaseError}</p>
                                    )}
                                </>
                            ) : (
                                <p className="text-sm text-center text-gray-500 font-bold py-6">Preencha seus dados completos e selecione pelo menos 1 ingresso para liberar o pagamento por cartão.</p>
                            )}
                        </div>
                    )}
                </form>
            </div>

            {/* Modals from before */}
            {pixStep === 'pix' && pixData && (
                <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-[32px] max-w-md w-full overflow-hidden shadow-2xl">
                        <div className="bg-[#3B0964] px-8 py-6 text-center">
                            <p className="text-[#FFD54F] text-xs font-bold tracking-widest uppercase mb-1">Pague com PIX</p>
                            <h2 className="text-white font-display text-2xl font-bold">Arraiá Quintal da Fafá 2026</h2>
                            <p className="text-white/70 text-sm mt-1">{pixData.itemsText}</p>
                        </div>

                        <div className="p-8 text-center">
                            {pixData.qrCodeBase64 ? (
                                <img
                                    src={`data:image/png;base64,${pixData.qrCodeBase64}`}
                                    alt="QR Code PIX"
                                    className="w-52 h-52 mx-auto rounded-2xl border-4 border-[#FFD54F] shadow-lg"
                                />
                            ) : (
                                <div className="w-52 h-52 mx-auto rounded-2xl bg-gray-100 flex items-center justify-center text-5xl border-4 border-[#FFD54F]">
                                    📱
                                </div>
                            )}

                            <div className="mt-4 bg-[#FFD54F]/10 rounded-2xl p-4">
                                <p className="text-[#3B0964] font-display text-3xl font-black">
                                    R$ {pixData.total.toFixed(2).replace('.', ',')}
                                </p>
                            </div>

                            {pixData.copyPaste && (
                                <button
                                    type="button"
                                    onClick={copyPixCode}
                                    className="mt-4 w-full bg-[#3B0964] text-white py-3 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-[#5a189a] transition-colors"
                                >
                                    {copied ? '✅ Código copiado!' : '📋 Copiar código PIX copia-e-cola'}
                                </button>
                            )}

                            <div className="mt-6 flex items-center justify-center gap-2">
                                <span className="text-2xl">⏱️</span>
                                <span className={`font-display text-2xl font-bold ${pixTimeLeft < 60 ? 'text-red-500' : 'text-[#3B0964]'}`}>
                                    {pixMinutes}:{pixSeconds}
                                </span>
                                <span className="text-gray-500 text-sm">para expirar</span>
                            </div>

                            <button
                                type="button"
                                onClick={async () => {
                                    try {
                                        const res = await fetch(`${SUPABASE_URL}/functions/v1/mercadopago-verify`, {
                                            method: 'POST',
                                            headers: {
                                                'Content-Type': 'application/json',
                                                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                                            },
                                            body: JSON.stringify({ purchase_id: pixData.purchaseId })
                                        });
                                        const result = await res.json();
                                        if (result.success && result.list_number) {
                                            if (pollingRef.current) clearInterval(pollingRef.current);
                                            setPixData(prev => prev ? { ...prev, listNumber: result.list_number } : prev);
                                            setPixStep('success');
                                        } else {
                                            alert('Ainda não identificamos o pagamento no Mercado Pago. Aguarde mais uns instantes e tente novamente!');
                                        }
                                    } catch (err) {
                                        console.error('Verify error:', err);
                                        alert('Erro ao consultar. Continue aguardando.');
                                    }
                                }}
                                className="mt-4 w-full bg-[#10B981] hover:bg-[#059669] text-white py-3 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-colors border-none cursor-pointer"
                            >
                                ✅ JÁ PAGUEI, VERIFICAR PAGAMENTO
                            </button>

                            <p className="text-gray-500 text-xs mt-4 leading-relaxed">
                                Após pagar, a confirmação é automática. <br/>
                                Você receberá seu ingresso por <strong>e-mail e WhatsApp</strong>.
                            </p>

                            {pixTimeLeft === 0 && (
                                <p className="text-red-500 font-bold mt-3 text-sm">⚠️ PIX expirado. Recarregue a página para tentar novamente.</p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {pixStep === 'loading_cc' && pixData && (
                <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-[32px] max-w-md w-full overflow-hidden shadow-2xl p-10 text-center">
                        <div className="animate-spin w-16 h-16 border-4 border-[#FFD54F] border-t-transparent rounded-full mx-auto mb-6"></div>
                        <h2 className="text-[#3B0964] font-display text-2xl font-bold mb-2">Processando...</h2>
                        <p className="text-gray-500 text-sm">Aguardando confirmação do pagamento. Não feche esta tela.</p>
                    </div>
                </div>
            )}

            {pixStep === 'success' && pixData && (
                <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
                    <div className="max-w-sm w-full relative">
                        <button onClick={() => window.location.reload()} className="absolute -top-12 right-0 w-8 h-8 rounded-full bg-white/20 text-white font-bold flex items-center justify-center hover:bg-white/40 transition-colors z-10">&times;</button>
                        <DigitalTicket 
                            listNumber={pixData.listNumber || 'Aguardando...'}
                            customerName={pixData.customerName}
                            customerPhone={formData.phone}
                            itemsText={pixData.itemsText}
                            total={pixData.total}
                            paymentStatus="approved"
                        />
                        <button
                            type="button"
                            onClick={() => {
                                const cleanPhone = formData.phone.replace(/\D/g, '');
                                const msg = `Olá! Sou ${pixData.customerName}. Arraiá do Quintal da Fafá 2026! 🌽\n\n📌 *MEU NÚMERO NA LISTA: ${pixData.listNumber || 'Aguardando...'}*\n🛒 Itens: ${pixData.itemsText}\n\nGuarde esta mensagem para a portaria!`;
                                window.open(`https://wa.me/55${cleanPhone}?text=${encodeURIComponent(msg)}`, '_blank');
                            }}
                            className="mt-4 w-full bg-[#25D366] text-white py-3 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-[#128C7E] transition-all shadow-lg text-sm border-none cursor-pointer"
                        >
                            <span>📲 RECEBER NO WHATSAPP</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ArraiaTicketCheckout;
