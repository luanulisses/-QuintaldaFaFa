import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { supabase } from '../../lib/supabase';
import { useGallery, GalleryItem } from '../../lib/hooks/useGallery';
import ArraiaMenu, { MenuType } from '../landing/ArraiaMenu';
import { Link } from 'react-router-dom';
import { initMercadoPago, Payment } from '@mercadopago/sdk-react';

initMercadoPago(import.meta.env.VITE_MERCADOPAGO_PUBLIC_KEY, { locale: 'pt-BR' });

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

const Arraia2026PreLaunch: React.FC = () => {
    const [formData, setFormData] = useState({ name: '', email: '', phone: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [purchaseError, setPurchaseError] = useState<string | null>(null);

    // Sales State
    const [qty, setQty] = useState({ geral: 0, meia: 0, passaporte: 0 });
    const [paymentMethod, setPaymentMethod] = useState<'pix' | 'credit_card'>('pix');

    // PIX payment state
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
    const [pixData, setPixData] = useState<PixState | null>(null);
    const [pixStep, setPixStep] = useState<'idle' | 'pix' | 'loading_cc' | 'success'>('idle');
    const [pixTimeLeft, setPixTimeLeft] = useState(30 * 60);
    const [copied, setCopied] = useState(false);
    const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const [vipCount, setVipCount] = useState<number | null>(null);
    const nameInputRef = useRef<HTMLInputElement>(null);
    const [highlightForm, setHighlightForm] = useState(false);

    const { fetchGalleryImages } = useGallery();
    const [galleryImages, setGalleryImages] = useState<GalleryItem[]>([]);
    const [lightboxImage, setLightboxImage] = useState<string | null>(null);
    const [openFaq, setOpenFaq] = useState<number | null>(null);

    const [menuOpen, setMenuOpen] = useState(false);
    const [menuType, setMenuType] = useState<MenuType>('gastronomia');
    const openMenu = (type: MenuType) => {
        setMenuType(type);
        setMenuOpen(true);
    };

    useEffect(() => {
        fetchGalleryImages().then(setGalleryImages).catch(console.error);
    }, []);

    const currentPrices = { geral: 20, meia: 10, passaporte: 25 };
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

    const scrollToTickets = (e: React.MouseEvent) => {
        e.preventDefault();
        const ticketsSection = document.getElementById('checkout-form');
        if (ticketsSection) {
            ticketsSection.scrollIntoView({ behavior: 'smooth' });
            setHighlightForm(true);
            setTimeout(() => {
                nameInputRef.current?.focus();
            }, 800);
            
            setTimeout(() => {
                setHighlightForm(false);
            }, 3800);
        }
    };

    useEffect(() => {
        const fetchVipCount = async () => {
            try {
                const { data, error } = await supabase.rpc('get_vip_waitlist_count');
                if (!error && data !== null) {
                    setVipCount(data);
                }
            } catch (err) {
                console.error("Error fetching VIP count:", err);
            }
        };
        fetchVipCount();
    }, []);

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
            const { data } = await supabase
                .from('arraia_purchases')
                .select('payment_status, list_number')
                .eq('id', purchaseId)
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
            geral: 'Ingresso Geral', 
            meia: 'Meia-Entrada (6-12 anos)',
            passaporte: 'Passaporte Kids'
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
        <div className="font-body w-full flex-1 flex flex-col bg-[#F5ECD5] text-[#3B0964]">
            {/* ===== Payment Overlays (Pix/CC/Success) ===== */}
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
                <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-[32px] max-w-md w-full overflow-hidden shadow-2xl text-center">
                        <div className="bg-gradient-to-br from-[#3B0964] to-[#5a189a] px-8 py-10">
                            <div className="text-6xl mb-4">🎉</div>
                            <h2 className="text-[#FFD54F] font-display text-3xl font-bold">Pagamento Confirmado!</h2>
                            <p className="text-white mt-2">Olá, {pixData.customerName}!</p>
                        </div>

                        <div className="bg-[#FFD54F] px-8 py-8">
                            <p className="text-[#3B0964] text-xs font-bold tracking-[0.3em] uppercase mb-3">Seu número na lista</p>
                            <p className="text-[#3B0964] font-display text-5xl font-black tracking-wider">
                                {pixData.listNumber}
                            </p>
                            <p className="text-[#3B0964]/70 text-sm mt-3">Anote este número — você vai precisar na portaria!</p>
                        </div>

                        <div className="px-8 py-6">
                            <p className="text-gray-700 text-sm leading-relaxed">
                                <strong>{pixData.itemsText}</strong><br/>
                                O comprovante foi enviado para seu e-mail. 🌽
                            </p>
                            <div className="mt-4 bg-gray-50 rounded-2xl p-4 text-left border border-gray-200">
                                <p className="text-[#3B0964] font-bold text-sm">📋 Na portaria, informe:</p>
                                <p className="text-gray-600 text-sm mt-1">{pixData.listNumber} + seu nome</p>
                            </div>

                            <button
                                onClick={() => {
                                    const cleanPhone = formData.phone.replace(/\D/g, '');
                                    const msg = `Olá! Sou ${pixData.customerName}. Arraiá do Quintal da Fafá 2026! 🌽\n\n📌 *MEU NÚMERO NA LISTA: ${pixData.listNumber}*\n🛒 Itens: ${pixData.itemsText}\n\nGuarde esta mensagem para a portaria!`;
                                    window.open(`https://wa.me/55${cleanPhone}?text=${encodeURIComponent(msg)}`, '_blank');
                                }}
                                className="mt-6 w-full bg-[#25D366] text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-[#128C7E] transition-all shadow-lg hover:shadow-xl transform active:scale-95"
                            >
                                <span>📲 RECEBER NO WHATSAPP</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}


            {/* Navigation Header */}
            <nav className="absolute top-0 left-0 w-full z-50 flex items-center justify-between px-4 md:px-12 py-6 bg-transparent">
                <Link to="/" className="flex items-center gap-2 text-white hover:scale-105 transition-transform">
                    <div className="flex flex-col items-start">
                        <span className="font-display font-bold text-3xl text-white drop-shadow-md tracking-tight leading-none">Quintal da</span>
                        <span className="font-display font-black text-4xl text-[#FFD54F] drop-shadow-md leading-none">Fafá</span>
                        <span className="bg-[#4CAF50] text-white text-[9px] uppercase font-black px-2 py-0.5 rounded-sm mt-1 shadow-sm">FESTA JUNINA</span>
                    </div>
                </Link>

                <div className="hidden lg:flex items-center gap-8 text-white font-bold text-sm tracking-wide">
                    <a href="#hero" className="hover:text-[#FFD54F] transition-colors">O EVENTO</a>
                    <a href="#hero" className="hover:text-[#FFD54F] transition-colors">ATRAÇÕES</a>
                    <a href="#cardapio" className="hover:text-[#FFD54F] transition-colors">CARDÁPIOS</a>
                    <a href="#ingressos" className="hover:text-[#FFD54F] transition-colors">INGRESSOS</a>
                    <a href="#cardapio" className="hover:text-[#FFD54F] transition-colors">INFORMAÇÕES</a>
                    <Link to="/" className="hover:text-[#FFD54F] transition-colors">CONTATO</Link>
                </div>

                <a href="#checkout-form" onClick={scrollToTickets} className="hidden md:block">
                    <button className="bg-[#FFD54F] hover:bg-[#ffb703] text-[#3B0964] px-6 py-3 rounded-md font-black text-sm transition-all shadow-md flex items-center gap-2">
                        <span>🏷️</span> COMPRAR INGRESSO
                    </button>
                </a>
            </nav>

            {/* Hero Section */}
            <section id="hero" className="relative pt-32 pb-20 px-4 min-h-[600px] flex items-center bg-gradient-to-b from-[#1C053A] via-[#2A0854] to-[#1C053A] overflow-hidden">
                {/* Background Decor (Luzes e Bandeirinhas) */}
                <div className="absolute top-0 left-0 w-full h-full opacity-30 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at top, #FFD54F 0%, transparent 50%)' }}></div>
                <div className="absolute top-0 left-0 w-full flex justify-around pointer-events-none drop-shadow-2xl opacity-80" style={{ transform: 'translateY(-10px)' }}>
                    {Array.from({ length: 20 }).map((_, i) => {
                        const colors = ['#FFD54F', '#4caf50', '#ff5722', '#e91e63', '#2196f3', '#9c27b0'];
                        return (
                            <div key={i} className="w-8 h-12 md:w-16 md:h-24" style={{ backgroundColor: colors[i % colors.length], clipPath: 'polygon(0 0, 100% 0, 100% 100%, 50% 75%, 0 100%)', transform: `rotate(${Math.sin(i) * 15}deg)` }}></div>
                        )
                    })}
                </div>

                <div className="container mx-auto max-w-[1400px] relative z-10 flex flex-col lg:flex-row items-center justify-between gap-12">
                    {/* Left Column */}
                    <div className="flex-1 text-center lg:text-left text-white mt-10 md:mt-0">
                        <div className="bg-[#FFD54F] text-[#3B0964] inline-block px-4 py-1 font-black text-sm md:text-base rounded-sm mb-4 shadow-sm">
                            2ª EDIÇÃO
                        </div>
                        <h1 className="text-5xl md:text-7xl lg:text-[80px] font-display font-black leading-none drop-shadow-lg mb-2">
                            <span className="text-white block relative">
                                <span className="absolute -left-6 md:-left-12 top-1/2 -translate-y-1/2 text-2xl md:text-4xl text-[#FFD54F] opacity-70">✨</span>
                                ARRAIÁ
                                <span className="absolute -right-6 md:-right-12 top-1/2 -translate-y-1/2 text-2xl md:text-4xl text-[#FFD54F] opacity-70">✨</span>
                            </span>
                            <span className="text-xl md:text-3xl block text-[#FFD54F] tracking-widest my-2">- DO -</span>
                            <span className="text-[#FFD54F] block">QUINTAL DA FAFÁ</span>
                        </h1>
                        <p className="text-xl md:text-2xl font-bold mb-8 text-white/90 drop-shadow-md">
                            A FESTA MAIS ANIMADA DE PLANALTINA!
                        </p>

                        <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 mb-8">
                            <div className="border border-[#FFD54F] rounded-lg px-4 py-2 flex items-center gap-3 bg-black/20 backdrop-blur-sm">
                                <span className="text-[#FFD54F] text-2xl">📅</span>
                                <div className="text-left leading-tight">
                                    <span className="block font-bold text-sm">18 DE JULHO</span>
                                    <span className="block font-bold text-xs text-white/80">DE 2026</span>
                                </div>
                            </div>
                            <div className="border border-[#FFD54F] rounded-lg px-4 py-2 flex items-center gap-3 bg-black/20 backdrop-blur-sm">
                                <span className="text-[#FFD54F] text-2xl">📍</span>
                                <div className="text-left leading-tight">
                                    <span className="block font-bold text-sm">PLANALTINA</span>
                                    <span className="block font-bold text-xs text-white/80">DF</span>
                                </div>
                            </div>
                            <div className="border border-[#FFD54F] rounded-lg px-4 py-2 flex items-center gap-3 bg-black/20 backdrop-blur-sm">
                                <span className="text-[#FFD54F] text-2xl">🕗</span>
                                <div className="text-left leading-tight">
                                    <span className="block font-bold text-sm">A PARTIR DAS</span>
                                    <span className="block font-bold text-xs text-white/80">20H</span>
                                </div>
                            </div>
                        </div>

                        <a href="#checkout-form" onClick={scrollToTickets} className="inline-block w-full sm:w-auto">
                            <button className="w-full sm:w-auto bg-[#4CAF50] hover:bg-[#388E3C] text-white px-8 py-4 rounded-xl font-black text-lg md:text-xl transition-all shadow-[0_4px_15px_rgba(76,175,80,0.5)] flex items-center justify-center gap-3">
                                🎟️ GARANTA SEU INGRESSO AGORA!
                            </button>
                        </a>

                        {vipCount !== null && vipCount > 0 && (
                            <div className="mt-4 flex items-center justify-center lg:justify-start gap-2 text-sm text-[#FFD54F] font-bold">
                                <span>🔥</span>
                                <p>Mais de {vipCount} pessoas já demonstraram interesse na 2ª edição!</p>
                            </div>
                        )}
                    </div>

                    {/* Right Column: Atrações */}
                    <div className="flex-1 w-full max-w-lg relative mt-12 lg:mt-0">
                        {/* Placa de madeira */}
                        <div className="relative bg-[#5C2E0B] border-4 border-[#3D1E06] rounded-xl p-4 text-center shadow-2xl mb-4 z-20" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/wood-pattern.png")' }}>
                            <div className="absolute top-2 left-2 w-3 h-3 rounded-full bg-black/60 shadow-inner"></div>
                            <div className="absolute top-2 right-2 w-3 h-3 rounded-full bg-black/60 shadow-inner"></div>
                            <div className="absolute bottom-2 left-2 w-3 h-3 rounded-full bg-black/60 shadow-inner"></div>
                            <div className="absolute bottom-2 right-2 w-3 h-3 rounded-full bg-black/60 shadow-inner"></div>
                            
                            <h3 className="font-display font-black text-[#FFD54F] text-xl md:text-2xl drop-shadow-md">
                                ⭐ ATRAÇÕES CONFIRMADAS ⭐
                            </h3>
                        </div>

                        {/* Artes Oficiais */}
                        <div className="flex flex-col md:flex-row gap-6 w-full">
                            <div className="flex-1 rounded-2xl overflow-hidden border border-[#FFD54F] shadow-[0_8px_30px_rgba(156,39,176,0.4)] hover:scale-[1.03] transition-all duration-300">
                                <img src="/images/Lampião eletrico.png" alt="Lampião Elétrico" className="w-full h-auto object-contain" />
                            </div>
                            <div className="flex-1 rounded-2xl overflow-hidden border border-[#FFD54F] shadow-[0_8px_30px_rgba(156,39,176,0.4)] hover:scale-[1.03] transition-all duration-300">
                                <img src="/images/KARLITO.png" alt="Karlito Tremendão" className="w-full h-auto object-contain" />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Ingressos Section */}
            <section id="ingressos" className="py-16 px-4 relative" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/cream-paper.png")' }}>
                <div className="container mx-auto max-w-[1200px]">
                    <div className="text-center mb-10">
                        <h2 className="font-display font-black text-3xl md:text-4xl text-[#3B0964] flex items-center justify-center gap-4">
                            <span className="text-[#FFD54F]">⇌</span>
                            ESCOLHA SEU INGRESSO
                            <span className="text-[#FFD54F]">⇌</span>
                        </h2>
                        <p className="text-[#5C2E0B] text-sm mt-2 font-medium">Passaporte Kids com preço único, não entra nos lotes.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {/* 1º Lote */}
                        <div className="bg-[#F9F9F9] rounded-xl overflow-hidden shadow-xl border border-gray-200 flex flex-col transform lg:-translate-y-4">
                            <div className="bg-[#4CAF50] text-white text-center py-3 font-black text-lg relative">
                                1º LOTE
                                <span className="absolute right-2 top-1/2 -translate-y-1/2 bg-[#FFD54F] text-[#3B0964] text-[10px] px-2 py-0.5 rounded-sm">ATUAL</span>
                            </div>
                            <div className="p-6 flex-1 flex flex-col gap-4">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-[#4CAF50] text-xl">👥</span>
                                        <span className="font-bold text-[#3B0964] leading-tight">INGRESSO<br/>GERAL</span>
                                    </div>
                                    <div className="text-[#4CAF50] font-black text-3xl text-right">R$ 20,00</div>
                                </div>
                                <div className="border-t border-dashed border-gray-300"></div>
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-[#3B0964] text-xl">👤</span>
                                        <span className="font-bold text-[#3B0964] text-sm leading-tight">MEIA-ENTRADA<br/>6 A 12 ANOS</span>
                                    </div>
                                    <div className="text-[#3B0964] font-black text-2xl text-right">R$ 10,00</div>
                                </div>
                            </div>
                            <div className="bg-[#4CAF50] text-white text-center py-3 font-bold text-sm flex items-center justify-center gap-2">
                                <span>✓</span> EM VENDAS
                            </div>
                        </div>

                        {/* 2º Lote */}
                        <div className="bg-[#F9F9F9] rounded-xl overflow-hidden shadow-md border border-gray-200 flex flex-col opacity-80">
                            <div className="bg-[#5a189a] text-white text-center py-3 font-black text-lg">
                                2º LOTE
                            </div>
                            <div className="p-6 flex-1 flex flex-col gap-4">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-[#5a189a] text-xl">👥</span>
                                        <span className="font-bold text-[#3B0964] leading-tight">INGRESSO<br/>GERAL</span>
                                    </div>
                                    <div className="text-[#5a189a] font-black text-3xl text-right">R$ 25,00</div>
                                </div>
                                <div className="border-t border-dashed border-gray-300"></div>
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-[#3B0964] text-xl">👤</span>
                                        <span className="font-bold text-[#3B0964] text-sm leading-tight">MEIA-ENTRADA<br/>6 A 12 ANOS</span>
                                    </div>
                                    <div className="text-[#3B0964] font-black text-2xl text-right">R$ 12,00</div>
                                </div>
                            </div>
                            <div className="bg-gray-300 text-gray-600 text-center py-3 font-bold text-sm flex items-center justify-center gap-2">
                                <span>🔒</span> EM BREVE
                            </div>
                        </div>

                        {/* 3º Lote */}
                        <div className="bg-[#F9F9F9] rounded-xl overflow-hidden shadow-md border border-gray-200 flex flex-col opacity-80">
                            <div className="bg-[#3B0964] text-white text-center py-3 font-black text-lg">
                                3º LOTE
                            </div>
                            <div className="p-6 flex-1 flex flex-col gap-4">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-[#3B0964] text-xl">👥</span>
                                        <span className="font-bold text-[#3B0964] leading-tight">INGRESSO<br/>GERAL</span>
                                    </div>
                                    <div className="text-[#3B0964] font-black text-3xl text-right">R$ 30,00</div>
                                </div>
                                <div className="border-t border-dashed border-gray-300"></div>
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-[#3B0964] text-xl">👤</span>
                                        <span className="font-bold text-[#3B0964] text-sm leading-tight">MEIA-ENTRADA<br/>6 A 12 ANOS</span>
                                    </div>
                                    <div className="text-[#3B0964] font-black text-2xl text-right">R$ 15,00</div>
                                </div>
                            </div>
                            <div className="bg-gray-300 text-gray-600 text-center py-3 font-bold text-sm flex items-center justify-center gap-2">
                                <span>🔒</span> EM BREVE
                            </div>
                        </div>

                        {/* Passaporte Kids */}
                        <div className="bg-[#FDF6E3] rounded-xl overflow-hidden shadow-xl border border-[#E65100] flex flex-col">
                            <div className="bg-[#E65100] text-white text-center py-3 font-black text-lg">
                                PREÇO ÚNICO
                            </div>
                            <div className="p-6 flex-1 flex flex-col items-center justify-center text-center">
                                <div className="w-16 h-16 rounded-full bg-white border-2 border-[#E65100] flex items-center justify-center mb-3 text-3xl">👧</div>
                                <h4 className="font-bold text-[#3B0964] text-lg mb-1">PASSAPORTE<br/>KIDS</h4>
                                <div className="text-[#E65100] font-black text-4xl mb-3">R$ 25,00</div>
                                <p className="text-xs text-gray-600 mb-4">Preço único<br/>Não entra nos lotes</p>
                                <span className="text-[#E65100] text-3xl">🎟️</span>
                            </div>
                        </div>
                    </div>

                    {/* Formulário de Checkout */}
                    <div id="checkout-form" className={`mt-16 bg-white rounded-2xl shadow-2xl p-6 md:p-10 max-w-3xl mx-auto border-2 transition-all duration-500 ${highlightForm ? 'border-[#FFD54F] scale-[1.02]' : 'border-transparent'}`}>
                        <div className="text-center mb-8">
                            <h3 className="font-display font-black text-2xl text-[#3B0964]">🎟️ FINALIZAR COMPRA</h3>
                            <p className="text-gray-500 text-sm">Preencha seus dados para garantir seus ingressos.</p>
                        </div>

                        <form onSubmit={handlePurchase} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <input 
                                    type="text" ref={nameInputRef}
                                    required placeholder="Seu nome completo"
                                    value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                                    className="w-full bg-gray-50 text-black px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FFD54F]"
                                />
                                <input 
                                    type="tel" 
                                    required placeholder="Seu WhatsApp"
                                    value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})}
                                    className="w-full bg-gray-50 text-black px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FFD54F]"
                                />
                                <input 
                                    type="email" 
                                    required placeholder="Seu e-mail"
                                    value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})}
                                    className="w-full bg-gray-50 text-black px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FFD54F] md:col-span-2"
                                />
                            </div>

                            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                                <label className="text-[#3B0964] text-sm font-bold uppercase mb-4 block">Selecione os ingressos:</label>
                                <div className="space-y-3">
                                    {[
                                        { id: 'geral', label: 'Ingresso Geral', price: 20 },
                                        { id: 'meia', label: 'Meia-Entrada (6 a 12 anos)', price: 10 },
                                        { id: 'passaporte', label: 'Passaporte Kids', price: 25 },
                                    ].map(item => (
                                        <div key={item.id} className="flex justify-between items-center bg-white p-3 rounded-lg border border-gray-100 shadow-sm">
                                            <span className="text-gray-800 font-medium text-sm">{item.label} (R$ {item.price})</span>
                                            <div className="flex items-center gap-3 bg-gray-100 rounded-full px-2 py-1">
                                                <button type="button" onClick={() => handleQtyChange(item.id as any, -1)} className="w-6 h-6 rounded-full bg-white text-gray-800 flex items-center justify-center shadow-sm font-bold">-</button>
                                                <span className="text-[#3B0964] font-black w-4 text-center">{(qty as any)[item.id]}</span>
                                                <button type="button" onClick={() => handleQtyChange(item.id as any, 1)} className="w-6 h-6 rounded-full bg-white text-gray-800 flex items-center justify-center shadow-sm font-bold">+</button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="flex justify-between items-center border-t border-gray-200 pt-4">
                                <span className="text-[#3B0964] font-bold text-xl">Total:</span>
                                <span className="text-[#4CAF50] font-black text-3xl">R$ {total.toFixed(2).replace('.', ',')}</span>
                            </div>

                            <div>
                                <label className="block text-[#3B0964] text-sm font-bold uppercase mb-3">Forma de Pagamento:</label>
                                <div className="flex gap-4">
                                    <button type="button" onClick={() => setPaymentMethod('pix')} className={`flex-1 py-3 rounded-xl text-sm font-bold border-2 transition-all flex items-center justify-center gap-2 ${paymentMethod === 'pix' ? 'border-[#3B0964] bg-[#3B0964] text-white shadow-md' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}>
                                        <span className="text-xl">📱</span> PIX
                                    </button>
                                    <button type="button" onClick={() => setPaymentMethod('credit_card')} className={`flex-1 py-3 rounded-xl text-sm font-bold border-2 transition-all flex items-center justify-center gap-2 ${paymentMethod === 'credit_card' ? 'border-[#3B0964] bg-[#3B0964] text-white shadow-md' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}>
                                        <span className="text-xl">💳</span> Cartão
                                    </button>
                                </div>
                            </div>

                            {paymentMethod === 'pix' ? (
                                <>
                                    {purchaseError && <p className="text-red-500 text-sm text-center font-bold">{purchaseError}</p>}
                                    <button 
                                        type="submit" disabled={isSubmitting || total === 0}
                                        className="w-full bg-[#4CAF50] hover:bg-[#388E3C] text-white font-black py-4 rounded-xl text-xl transition-all shadow-lg active:shadow-none flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isSubmitting ? 'GERANDO PIX...' : 'FINALIZAR COMPRA NO PIX'}
                                    </button>
                                </>
                            ) : (
                                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
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
                                        <p className="text-sm text-center text-gray-500 font-bold py-6">Preencha seus dados e selecione pelo menos 1 ingresso para liberar o pagamento por cartão.</p>
                                    )}
                                </div>
                            )}
                        </form>
                    </div>
                </div>
            </section>

            {/* Indicadores de Confiança UX */}
            <div className="container mx-auto max-w-3xl mt-6 px-4">
                <div className="bg-[#2A0854]/5 border border-[#3B0964]/10 rounded-xl p-4 flex flex-wrap items-center justify-center gap-4 md:gap-8 text-[#3B0964] font-medium text-sm">
                    <div className="flex items-center gap-2"><span className="text-xl">🔒</span> Compra Segura</div>
                    <div className="flex items-center gap-2"><span className="text-xl">💳</span> PIX e Cartão</div>
                    <div className="flex items-center gap-2"><span className="text-xl">🎟️</span> Ingresso Digital</div>
                    <div className="flex items-center gap-2"><span className="text-xl">👨‍👩‍👧‍👦</span> Evento Familiar</div>
                </div>
            </div>

            {/* NOVA SEÇÃO 1: O QUE TE ESPERA NO ARRAIÁ */}
            <section className="mt-16 py-20 px-4 bg-[#3B0964] relative text-white">
                <div className="container mx-auto max-w-[1200px]">
                    <div className="text-center mb-16">
                        <h2 className="font-display font-black text-3xl md:text-4xl text-[#FFD54F] mb-4">
                            🎉 O QUE TE ESPERA NO ARRAIÁ
                        </h2>
                        <p className="text-white/80 text-lg">Uma noite completa de diversão para toda a família.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* 🌽 Comidas Típicas */}
                        <div className="group relative bg-[#1C053A]/80 backdrop-blur-md border border-[#FFD54F]/20 rounded-3xl overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.5)] hover:shadow-[0_0_25px_rgba(255,213,79,0.2)] hover:border-[#FFD54F]/60 transition-all duration-500 hover:scale-[1.02] flex flex-col h-[420px]">
                            <div className="h-[45%] relative overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-t from-[#1C053A] to-transparent z-10"></div>
                                <img src="/images/gastronomia_tipica.jpg" alt="Comidas Típicas" className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700" />
                                <div className="absolute top-4 left-4 z-20 flex items-center gap-2 bg-black/50 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/10">
                                    <span className="text-xl">🌽</span>
                                    <span className="text-white font-bold text-xs tracking-wider uppercase">Cardápio Típico</span>
                                </div>
                            </div>
                            <div className="p-6 flex-1 flex flex-col relative z-20 -mt-6">
                                <h3 className="font-display font-black text-2xl text-[#FFD54F] mb-2 drop-shadow-md">COMIDAS TÍPICAS</h3>
                                <p className="text-white/80 text-sm mb-4 leading-relaxed line-clamp-2">
                                    Comidas e doces típicos para deixar sua festa ainda melhor.
                                </p>
                                <ul className="flex flex-wrap gap-2 text-[#FFD54F] font-medium text-xs mb-4">
                                    <li className="bg-white/5 px-2 py-1 rounded-md border border-white/5">Milho</li>
                                    <li className="bg-white/5 px-2 py-1 rounded-md border border-white/5">Pamonha</li>
                                    <li className="bg-white/5 px-2 py-1 rounded-md border border-white/5">Caldos</li>
                                    <li className="bg-white/5 px-2 py-1 rounded-md border border-white/5">Churrasco</li>
                                    <li className="bg-white/5 px-2 py-1 rounded-md border border-white/5">Doces</li>
                                </ul>
                                <button onClick={() => openMenu('gastronomia')} className="mt-auto w-full bg-[#FFD54F]/10 hover:bg-[#FFD54F] text-[#FFD54F] hover:text-[#3B0964] border border-[#FFD54F]/30 hover:border-[#FFD54F] py-3 rounded-xl font-bold transition-all flex justify-center items-center gap-2 shadow-[0_4px_15px_rgba(0,0,0,0.2)]">
                                    <span>🍽️</span> VER CARDÁPIO COMPLETO
                                </button>
                            </div>
                        </div>

                        {/* 🍺 Bebidas */}
                        <div className="group relative bg-[#1C053A]/80 backdrop-blur-md border border-[#FFD54F]/20 rounded-3xl overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.5)] hover:shadow-[0_0_25px_rgba(255,213,79,0.2)] hover:border-[#FFD54F]/60 transition-all duration-500 hover:scale-[1.02] flex flex-col h-[420px]">
                            <div className="h-[45%] relative overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-t from-[#1C053A] to-transparent z-10"></div>
                                <img src="/images/bebidas_tipica.jpg" alt="Bebidas" className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700" />
                                <div className="absolute top-4 left-4 z-20 flex items-center gap-2 bg-black/50 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/10">
                                    <span className="text-xl">🍺</span>
                                    <span className="text-white font-bold text-xs tracking-wider uppercase">Bar Completo</span>
                                </div>
                            </div>
                            <div className="p-6 flex-1 flex flex-col relative z-20 -mt-6">
                                <h3 className="font-display font-black text-2xl text-[#FFD54F] mb-2 drop-shadow-md">BEBIDAS</h3>
                                <p className="text-white/80 text-sm mb-4 leading-relaxed line-clamp-2">
                                    Bebidas geladas para acompanhar sua noite.
                                </p>
                                <ul className="flex flex-wrap gap-2 text-[#FFD54F] font-medium text-xs mb-4">
                                    <li className="bg-white/5 px-2 py-1 rounded-md border border-white/5">Refrigerantes</li>
                                    <li className="bg-white/5 px-2 py-1 rounded-md border border-white/5">Água</li>
                                    <li className="bg-white/5 px-2 py-1 rounded-md border border-white/5">Sucos</li>
                                    <li className="bg-white/5 px-2 py-1 rounded-md border border-white/5">Cervejas</li>
                                    <li className="bg-white/5 px-2 py-1 rounded-md border border-white/5">Drinks</li>
                                    <li className="bg-white/5 px-2 py-1 rounded-md border border-white/5">Destilados</li>
                                </ul>
                                <button onClick={() => openMenu('bebidas')} className="mt-auto w-full bg-[#FFD54F]/10 hover:bg-[#FFD54F] text-[#FFD54F] hover:text-[#3B0964] border border-[#FFD54F]/30 hover:border-[#FFD54F] py-3 rounded-xl font-bold transition-all flex justify-center items-center gap-2 shadow-[0_4px_15px_rgba(0,0,0,0.2)]">
                                    <span>🍻</span> VER CARDÁPIO DE BEBIDAS
                                </button>
                            </div>
                        </div>

                        {/* 🎵 Shows Ao Vivo */}
                        <div className="group relative bg-[#1C053A]/80 backdrop-blur-md border border-[#FFD54F]/20 rounded-3xl overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.5)] hover:shadow-[0_0_25px_rgba(255,213,79,0.2)] hover:border-[#FFD54F]/60 transition-all duration-500 hover:scale-[1.02] flex flex-col h-[420px]">
                            <div className="h-[50%] relative flex gap-3 p-4 pt-12 bg-gradient-to-b from-[#2A0854] to-[#1C053A] overflow-hidden">
                                <div className="absolute top-4 left-4 z-20 flex items-center gap-2 bg-black/50 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/10">
                                    <span className="text-xl">🎵</span>
                                    <span className="text-white font-bold text-xs tracking-wider uppercase">Palco Principal</span>
                                </div>
                                <div className="flex-1 rounded-xl overflow-hidden border border-[#FFD54F]/30 shadow-lg relative group-hover:scale-[1.08] transition-transform duration-700 bg-black/20">
                                    <img src="/images/Lampião eletrico.png" className="w-full h-full object-contain" alt="Lampião Elétrico" />
                                </div>
                                <div className="flex-1 rounded-xl overflow-hidden border border-[#FFD54F]/30 shadow-lg relative group-hover:scale-[1.08] transition-transform duration-700 delay-75 bg-black/20">
                                    <img src="/images/KARLITO.png" className="w-full h-full object-contain" alt="Karlito" />
                                </div>
                                <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#1C053A] to-transparent z-10"></div>
                            </div>
                            <div className="p-6 flex-1 flex flex-col relative z-20 -mt-4">
                                <h3 className="font-display font-black text-2xl text-[#FFD54F] mb-2 drop-shadow-md">SHOWS AO VIVO</h3>
                                <p className="text-white/80 text-sm mb-4 leading-relaxed">
                                    Atrações confirmadas para animar a nossa festa com muita música boa!
                                </p>
                            </div>
                        </div>

                        {/* 👨‍👩‍👧‍👦 Ambiente Familiar */}
                        <div className="group relative bg-[#1C053A]/80 backdrop-blur-md border border-[#FFD54F]/20 rounded-3xl overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.5)] hover:shadow-[0_0_25px_rgba(255,213,79,0.2)] hover:border-[#FFD54F]/60 transition-all duration-500 hover:scale-[1.02] flex flex-col h-[420px]">
                            <div className="h-[45%] relative overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-t from-[#1C053A] to-transparent z-10"></div>
                                <img src="https://images.unsplash.com/photo-1531058020387-3be344556be6?auto=format&fit=crop&q=80" alt="Ambiente Familiar" className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700" />
                                <div className="absolute top-4 left-4 z-20 flex items-center gap-2 bg-black/50 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/10">
                                    <span className="text-xl">👨‍👩‍👧‍👦</span>
                                    <span className="text-white font-bold text-xs tracking-wider uppercase">Para Todos</span>
                                </div>
                            </div>
                            <div className="p-6 flex-1 flex flex-col relative z-20 -mt-6">
                                <h3 className="font-display font-black text-2xl text-[#FFD54F] mb-2 drop-shadow-md">AMBIENTE FAMILIAR</h3>
                                <p className="text-white/80 text-sm mb-4 leading-relaxed line-clamp-2">
                                    Estrutura completa e aconchegante para você e sua família aproveitarem!
                                </p>
                                <ul className="grid grid-cols-2 gap-x-2 gap-y-3 text-white/90 font-medium text-xs mb-4">
                                    <li className="flex items-center gap-1.5"><span className="bg-[#4CAF50]/20 text-[#4CAF50] rounded-full w-4 h-4 flex items-center justify-center text-[10px]">✓</span> Segurança</li>
                                    <li className="flex items-center gap-1.5"><span className="bg-[#4CAF50]/20 text-[#4CAF50] rounded-full w-4 h-4 flex items-center justify-center text-[10px]">✓</span> Espaço amplo</li>
                                    <li className="flex items-center gap-1.5"><span className="bg-[#4CAF50]/20 text-[#4CAF50] rounded-full w-4 h-4 flex items-center justify-center text-[10px]">✓</span> Todas as idades</li>
                                    <li className="flex items-center gap-1.5"><span className="bg-[#4CAF50]/20 text-[#4CAF50] rounded-full w-4 h-4 flex items-center justify-center text-[10px]">✓</span> Área coberta</li>
                                    <li className="flex items-center gap-1.5"><span className="bg-[#4CAF50]/20 text-[#4CAF50] rounded-full w-4 h-4 flex items-center justify-center text-[10px]">✓</span> Banheiros</li>
                                </ul>
                                <div className="mt-auto w-full bg-[#FFD54F]/10 text-[#FFD54F] border border-[#FFD54F]/30 py-3 rounded-xl font-bold flex justify-center items-center gap-2 text-xs uppercase tracking-wider">
                                    <span>👨‍👩‍👧‍👦</span> ESTRUTURA PARA TODA A FAMÍLIA
                                </div>
                            </div>
                        </div>

                        {/* 🎟️ Passaporte Kids */}
                        <div className="group relative bg-[#1C053A]/80 backdrop-blur-md border border-[#4CAF50]/40 rounded-3xl overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.5)] hover:shadow-[0_0_25px_rgba(76,175,80,0.2)] hover:border-[#4CAF50]/80 transition-all duration-500 hover:scale-[1.02] flex flex-col h-[420px]">
                            <div className="h-[45%] relative overflow-hidden bg-[#2A0854]">
                                <div className="absolute inset-0 bg-gradient-to-t from-[#1C053A] to-transparent z-10"></div>
                                <img src="/images/brinquedos.png" alt="Passaporte Kids" className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700 opacity-80" />
                                <div className="absolute top-4 left-4 z-20 flex items-center gap-2 bg-[#4CAF50] backdrop-blur-sm px-3 py-1.5 rounded-lg border border-white/20 shadow-lg">
                                    <span className="text-white font-black text-xs tracking-wider uppercase">✅ INCLUSO NO PASSAPORTE</span>
                                </div>
                            </div>
                            <div className="p-6 flex-1 flex flex-col relative z-20 -mt-6">
                                <h3 className="font-display font-black text-2xl text-[#4CAF50] mb-2 drop-shadow-md">PASSAPORTE KIDS</h3>
                                <p className="text-[#FFD54F] font-bold text-sm mb-4 leading-relaxed drop-shadow-sm">
                                    Diversão liberada para as crianças!
                                </p>
                                <ul className="grid grid-cols-2 gap-x-2 gap-y-3 text-white/90 font-medium text-xs mb-4">
                                    <li className="flex items-center gap-1.5"><span className="text-lg">🎠</span> Touro Mecânico</li>
                                    <li className="flex items-center gap-1.5"><span className="text-lg">🎈</span> Pula-Pula</li>
                                    <li className="flex items-center gap-1.5"><span className="text-lg">🛝</span> Tobogã</li>
                                    <li className="flex items-center gap-1.5"><span className="text-lg">🚂</span> Carreta</li>
                                    <li className="flex items-center gap-1.5"><span className="text-lg">🧸</span> Brinquedoteca</li>
                                    <li className="flex items-center gap-1.5"><span className="text-lg">🏓</span> Ping Pong</li>
                                </ul>
                                <div className="mt-auto w-full bg-[#4CAF50]/10 text-[#4CAF50] border border-[#4CAF50]/30 py-3 rounded-xl font-bold flex justify-center items-center gap-2 text-xs uppercase tracking-wider">
                                    <span>🎟️</span> INCLUSO NO PASSAPORTE KIDS
                                </div>
                            </div>
                        </div>

                        {/* 🎣 Atrações Avulsas */}
                        <div className="group relative bg-[#1C053A]/80 backdrop-blur-md border border-[#E65100]/40 rounded-3xl overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.5)] hover:shadow-[0_0_25px_rgba(230,81,0,0.2)] hover:border-[#E65100]/80 transition-all duration-500 hover:scale-[1.02] flex flex-col h-[420px]">
                            <div className="h-[45%] relative overflow-hidden bg-[#2A0854]">
                                <div className="absolute inset-0 bg-gradient-to-t from-[#1C053A] to-transparent z-10"></div>
                                <img src="/images/pescaria.png" alt="Atrações Avulsas" className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700 opacity-80" />
                                <div className="absolute top-4 left-4 z-20 flex items-center gap-2 bg-[#E65100] backdrop-blur-sm px-3 py-1.5 rounded-lg border border-white/20 shadow-lg">
                                    <span className="text-white font-black text-xs tracking-wider uppercase">🚫 FORA DO PASSAPORTE</span>
                                </div>
                            </div>
                            <div className="p-6 flex-1 flex flex-col relative z-20 -mt-6">
                                <h3 className="font-display font-black text-2xl text-[#FFD54F] mb-2 drop-shadow-md">ATRAÇÕES AVULSAS</h3>
                                <p className="text-white/80 text-sm mb-4 leading-relaxed line-clamp-2">
                                    Brincadeiras clássicas que todo mundo ama!
                                </p>
                                <ul className="flex flex-col gap-3 text-white/90 font-medium text-sm mb-4 flex-1">
                                    <li className="flex items-center gap-3 bg-white/5 p-2 rounded-lg border border-white/5"><span className="text-xl">🐟</span> Pescaria</li>
                                    <li className="flex items-center gap-3 bg-white/5 p-2 rounded-lg border border-white/5"><span className="text-xl">🤡</span> Boca do Palhaço</li>
                                    <li className="flex items-center gap-3 bg-white/5 p-2 rounded-lg border border-white/5"><span className="text-xl">⭕</span> Jogo de Argolas</li>
                                </ul>
                                <div className="mt-auto w-full bg-[#E65100]/20 text-[#FFD54F] border border-[#E65100]/50 py-3 rounded-xl text-xs font-bold flex justify-center items-center gap-2 text-center shadow-inner">
                                    <span>⚠️</span> Estas atrações possuem cobrança individual.
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* NOVA SEÇÃO 2: LOCAL DO EVENTO */}
            <section className="py-20 px-4 bg-[#F5ECD5] text-[#3B0964]">
                <div className="container mx-auto max-w-[1000px] text-center">
                    <span className="text-6xl text-[#E65100] mb-4 block drop-shadow-md">📍</span>
                    <h2 className="font-display font-black text-4xl md:text-5xl mb-2 text-[#3B0964]">Quintal da Fafá</h2>
                    <p className="text-xl font-bold mb-2 text-[#E65100]">Planaltina – DF</p>
                    <p className="text-lg mb-8 max-w-2xl mx-auto text-[#3B0964]/80">Um espaço amplo, seguro e preparado para receber toda a família.</p>
                    
                    <div className="relative rounded-3xl w-full h-[300px] md:h-[450px] mb-10 overflow-hidden shadow-[0_10px_40px_rgba(0,0,0,0.2)] border-8 border-white group">
                        <div className="absolute top-4 left-4 z-20 flex items-center gap-2 bg-[#4CAF50] backdrop-blur-sm px-4 py-2 rounded-lg border border-white/20 shadow-lg">
                            <span className="text-white font-black text-sm tracking-wider uppercase">✅ Local Oficial do Evento</span>
                        </div>
                        <img src="https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=80" alt="Espaço do Evento" className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent pointer-events-none"></div>
                    </div>
                    
                    <a href="https://www.google.com/maps/search/?api=1&query=Quintal+da+Fafá+Planaltina+DF" target="_blank" rel="noopener noreferrer" className="inline-block">
                        <button className="bg-[#3B0964] hover:bg-[#2A0854] text-white px-10 py-5 rounded-xl font-black text-xl md:text-2xl transition-all shadow-[0_8px_25px_rgba(59,9,100,0.4)] hover:shadow-[0_12px_30px_rgba(59,9,100,0.6)] hover:-translate-y-1 flex items-center gap-3 mx-auto">
                            <span>🚗</span> COMO CHEGAR
                        </button>
                    </a>
                </div>
            </section>

            {/* NOVA SEÇÃO 3: GALERIA */}
            <section className="py-20 px-4 bg-[#1C053A] text-white overflow-hidden relative">
                <div className="container mx-auto max-w-[1200px] relative z-10">
                    
                    {/* ESTATÍSTICAS */}
                    <div className="mb-20">
                        <h3 className="text-center font-display font-black text-2xl text-[#FFD54F] mb-8 tracking-widest uppercase">Números da Primeira Edição</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 text-center shadow-lg hover:bg-white/10 transition-colors">
                                <span className="text-4xl block mb-2">🎟️</span>
                                <h4 className="font-black text-3xl text-white mb-1">800+</h4>
                                <p className="text-[#FFD54F] text-xs font-bold uppercase tracking-wider">Ingressos Vendidos</p>
                            </div>
                            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 text-center shadow-lg hover:bg-white/10 transition-colors">
                                <span className="text-4xl block mb-2">👨‍👩‍👧‍👦</span>
                                <h4 className="font-black text-3xl text-white mb-1">100%</h4>
                                <p className="text-[#FFD54F] text-xs font-bold uppercase tracking-wider">Público Presente</p>
                            </div>
                            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 text-center shadow-lg hover:bg-white/10 transition-colors">
                                <span className="text-4xl block mb-2">🎵</span>
                                <h4 className="font-black text-3xl text-white mb-1">8h</h4>
                                <p className="text-[#FFD54F] text-xs font-bold uppercase tracking-wider">Horas de Música</p>
                            </div>
                            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 text-center shadow-lg hover:bg-white/10 transition-colors">
                                <span className="text-4xl block mb-2">📸</span>
                                <h4 className="font-black text-3xl text-white mb-1">200+</h4>
                                <p className="text-[#FFD54F] text-xs font-bold uppercase tracking-wider">Fotos Registradas</p>
                            </div>
                        </div>
                    </div>

                    <div className="text-center mb-12">
                        <h2 className="font-display font-black text-3xl md:text-5xl text-[#FFD54F] mb-6 leading-tight">
                            🎉 REVIVA OS MELHORES MOMENTOS DA NOSSA PRIMEIRA EDIÇÃO
                        </h2>
                        <p className="text-white/80 text-lg md:text-xl max-w-3xl mx-auto leading-relaxed">
                            Mais de centenas de pessoas fizeram parte dessa história. Veja como foi nossa primeira edição e prepare-se para viver uma experiência ainda maior em 18 de julho de 2026.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {galleryImages && galleryImages.length > 0 ? (
                            galleryImages.slice(0, 8).map((img, i) => (
                                <div key={i} onClick={() => setLightboxImage(img.url)} className="aspect-square bg-[#2A0854] rounded-2xl overflow-hidden cursor-pointer group relative shadow-lg hover:shadow-[0_0_25px_rgba(255,213,79,0.4)] transition-all duration-500 border border-white/5 hover:border-[#FFD54F]/50">
                                    <img src={img.url} alt="Galeria" loading="lazy" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-90 group-hover:opacity-100" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-[#1C053A]/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-6">
                                        <div className="bg-[#FFD54F] text-[#3B0964] rounded-full w-12 h-12 flex items-center justify-center shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                                            <span className="text-2xl">🔍</span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            Array.from({length: 8}).map((_, i) => (
                                <div key={i} className="aspect-square bg-white/10 rounded-2xl overflow-hidden cursor-pointer group relative animate-pulse">
                                    <div className="w-full h-full bg-[#2A0854]"></div>
                                </div>
                            ))
                        )}
                    </div>
                    
                    <div className="mt-12 text-center">
                        <Link to="/galeria" className="inline-block group">
                            <button className="bg-transparent border border-[#FFD54F]/50 hover:border-[#FFD54F] text-[#FFD54F] hover:bg-[#FFD54F]/10 px-8 py-4 rounded-xl font-bold transition-all shadow-[0_0_15px_rgba(255,213,79,0.1)] hover:shadow-[0_0_25px_rgba(255,213,79,0.3)] flex items-center gap-3 mx-auto">
                                <span className="text-2xl">📸</span>
                                VER ÁLBUM COMPLETO DA 1ª EDIÇÃO
                            </button>
                        </Link>
                        <p className="text-white/50 text-sm mt-3">Mais de 200 fotos exclusivas no nosso álbum oficial.</p>
                    </div>
                </div>

                {/* Lightbox Modal */}
                {lightboxImage && (
                    <div className="fixed inset-0 z-[200] bg-black/95 flex items-center justify-center p-4" onClick={() => setLightboxImage(null)}>
                        <button className="absolute top-6 right-6 text-white text-4xl hover:text-[#FFD54F]">&times;</button>
                        <img src={lightboxImage} alt="Fullscreen" className="max-w-full max-h-[90vh] object-contain rounded-xl shadow-2xl" />
                    </div>
                )}
            </section>

            {/* NOVA SEÇÃO 4: DÚVIDAS FREQUENTES */}
            <section className="py-20 px-4 bg-[#F9F9F9] text-[#3B0964]">
                <div className="container mx-auto max-w-[800px]">
                    <div className="text-center mb-12">
                        <h2 className="font-display font-black text-3xl md:text-4xl">🤔 DÚVIDAS FREQUENTES</h2>
                    </div>

                    <div className="space-y-4">
                        {[
                            {
                                q: "Criança paga?",
                                a: "Até 5 anos não paga.<br/>De 6 a 12 anos meia entrada."
                            },
                            {
                                q: "A pescaria está inclusa?",
                                a: "<strong>Não.</strong><br/>A pescaria e algumas brincadeiras possuem cobrança individual."
                            },
                            {
                                q: "Posso comprar no local?",
                                a: "Sim, sujeito à disponibilidade."
                            },
                            {
                                q: "Aceita PIX e cartão?",
                                a: "<strong>Sim.</strong><br/>PIX, cartão e Mercado Pago."
                            },
                            {
                                q: "Recebo ingresso digital?",
                                a: "<strong>Sim.</strong><br/>O ingresso é enviado por WhatsApp e e-mail."
                            }
                        ].map((faq, idx) => (
                            <div key={idx} className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                                <button 
                                    onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                                    className="w-full px-6 py-5 text-left flex justify-between items-center font-bold text-lg"
                                >
                                    <span>{faq.q}</span>
                                    <span className={`text-[#E65100] transform transition-transform duration-300 ${openFaq === idx ? 'rotate-180' : ''}`}>▼</span>
                                </button>
                                <div 
                                    className={`px-6 overflow-hidden transition-all duration-300 ease-in-out ${openFaq === idx ? 'max-h-40 pb-5 opacity-100' : 'max-h-0 opacity-0'}`}
                                >
                                    <p className="text-gray-600 leading-relaxed" dangerouslySetInnerHTML={{ __html: faq.a }}></p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* NOVA SEÇÃO 5: BANNER FINAL DE CONVERSÃO */}
            <section className="py-24 px-4 relative overflow-hidden bg-gradient-to-br from-[#2A0854] to-[#1C053A] text-white text-center">
                <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at center, #FFD54F 0%, transparent 70%)' }}></div>
                
                <div className="container mx-auto max-w-[800px] relative z-10">
                    <h2 className="font-display font-black text-4xl md:text-6xl text-[#FFD54F] mb-6 leading-tight drop-shadow-lg">
                        🔥 AGORA É A SUA VEZ!
                    </h2>
                    
                    <p className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto mb-12 leading-relaxed font-medium">
                        A segunda edição promete ser ainda maior, com mais atrações, mais estrutura, mais diversão e momentos inesquecíveis para toda a família.
                    </p>

                    <a href="#checkout-form" onClick={scrollToTickets} className="inline-block relative group">
                        <div className="absolute inset-0 bg-[#4CAF50] rounded-2xl blur-lg opacity-60 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <button className="relative bg-gradient-to-b from-[#4CAF50] to-[#388E3C] border-2 border-white/20 hover:border-white/50 text-white px-12 py-6 rounded-2xl font-black text-xl md:text-2xl transition-all shadow-[0_8px_30px_rgba(76,175,80,0.5)] group-hover:-translate-y-2 flex items-center justify-center gap-4">
                            <span className="text-3xl">🎟️</span> GARANTIR MEU INGRESSO AGORA
                        </button>
                    </a>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-[#3D1E06] py-10 px-4" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/wood-pattern.png")' }}>
                <div className="container mx-auto flex flex-col md:flex-row items-center justify-between gap-6 border-b border-white/10 pb-8">
                    <div className="flex flex-col items-center md:items-start text-white">
                        <span className="font-display font-bold text-2xl drop-shadow-md leading-none">Quintal da</span>
                        <span className="font-display font-black text-3xl text-[#FFD54F] drop-shadow-md leading-none">Fafá</span>
                        <span className="bg-[#4CAF50] text-white text-[8px] uppercase font-black px-1.5 py-0.5 rounded-sm mt-1">FESTA JUNINA</span>
                    </div>

                    <div className="text-center">
                        <p className="text-white font-bold text-lg">18 DE JULHO DE 2026</p>
                        <p className="text-[#FFD54F] text-sm uppercase tracking-widest mt-1">PLANALTINA - DF</p>
                    </div>

                    <div className="flex items-center gap-4">
                        <a href="#" className="w-10 h-10 rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 flex items-center justify-center text-white hover:scale-110 transition-transform">
                            <span className="material-symbols-outlined text-lg">photo_camera</span>
                        </a>
                        <a href="#" className="w-10 h-10 rounded-full bg-[#3b5998] flex items-center justify-center text-white hover:scale-110 transition-transform font-bold font-serif text-xl">
                            f
                        </a>
                        <a href="#" className="w-10 h-10 rounded-full bg-[#25D366] flex items-center justify-center text-white hover:scale-110 transition-transform">
                            <span className="material-symbols-outlined text-lg">call</span>
                        </a>
                    </div>
                </div>
                <div className="text-center mt-6">
                    <p className="text-white/40 text-xs">© 2026 Quintal da Fafá. Todos os direitos reservados.</p>
                </div>
            </footer>

            {/* Menu Modal */}
            <ArraiaMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} type={menuType} />
        </div>
    );
};

export default Arraia2026PreLaunch;
