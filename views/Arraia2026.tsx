import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import Button from '../components/landing/Button';
import Section from '../components/landing/Section';
import Footer from '../components/landing/Footer';
import FaqAccordion from '../components/landing/FaqAccordion';
import ArraiaMenu from '../components/landing/ArraiaMenu';

const Arraia2026: React.FC = () => {
    const [timeLeft, setTimeLeft] = useState<{ days: number, hours: number, minutes: number, seconds: number }>({
        days: 0, hours: 0, minutes: 0, seconds: 0
    });

    // Form State
    const [formData, setFormData] = useState({ name: '', email: '', phone: '' });
    const [qty, setQty] = useState({ geral: 0, meia: 0, passaporte: 0, combo: 0, pescaria: 0, brinquedos: 0 });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [purchaseError, setPurchaseError] = useState<string | null>(null);

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
    const [pixStep, setPixStep] = useState<'idle' | 'pix' | 'success'>('idle');
    const [pixTimeLeft, setPixTimeLeft] = useState(30 * 60);
    const [copied, setCopied] = useState(false);
    const [menuType, setMenuType] = useState<'gastronomia' | 'bebidas' | null>(null);
    const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
    const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

    const currentPrices = { geral: 20, meia: 10, passaporte: 20, combo: 50, pescaria: 10, brinquedos: 10 };

    const total = (
        (qty.geral * currentPrices.geral) +
        (qty.meia * currentPrices.meia) +
        (qty.passaporte * currentPrices.passaporte) +
        (qty.combo * currentPrices.combo) +
        (qty.pescaria * currentPrices.pescaria) +
        (qty.brinquedos * currentPrices.brinquedos)
    );

    const eventDate = new Date('2026-06-06T20:00:00').getTime();

    useEffect(() => {
        const timer = setInterval(() => {
            const now = new Date().getTime();
            const dist = eventDate - now;
            if (dist < 0) { clearInterval(timer); return; }
            setTimeLeft({
                days: Math.floor(dist / (1000 * 60 * 60 * 24)),
                hours: Math.floor((dist % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
                minutes: Math.floor((dist % (1000 * 60 * 60)) / (1000 * 60)),
                seconds: Math.floor((dist % (1000 * 60)) / 1000)
            });
        }, 1000);
        return () => clearInterval(timer);
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
            // Enforce limit of 5 for additional items
            if ((field === 'pescaria' || field === 'brinquedos') && nextValue > 5) {
                return prev;
            }
            return { ...prev, [field]: nextValue };
        });
    };

    const formatItems = (q: typeof qty) => {
        const labels = { 
            geral: 'Ingresso Geral', 
            meia: 'Meia-Entrada (6-12 anos)',
            passaporte: 'Passaporte Kids', 
            combo: 'Combo (Geral + Kids + Meia)',
            pescaria: 'Pescaria',
            brinquedos: 'Brinquedo Individual'
        };
        return Object.entries(q).filter(([, v]) => (v as number) > 0).map(([k, v]) => `${v}x ${labels[k as keyof typeof labels]}`).join(', ');
    };

    const handlePurchase = async (e: React.FormEvent) => {
        e.preventDefault();
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
        <div className="font-body text-[#2D2420] bg-[#FFF6F0] w-full flex-1 flex flex-col">

            {/* ===== PIX Payment Screen ===== */}
            {pixStep === 'pix' && pixData && (
                <div className="fixed inset-0 z-[100] bg-[#1C0C04]/95 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-[32px] max-w-md w-full overflow-hidden shadow-2xl">
                        <div className="bg-[#5C2E0A] px-8 py-6 text-center">
                            <p className="text-[#D9981F] text-xs font-bold tracking-widest uppercase mb-1">Pague com PIX</p>
                            <h2 className="text-[#EDD68A] font-display text-2xl font-bold">Arraiá Quintal da Fafá 2026</h2>
                            <p className="text-[#EDD68A]/70 text-sm mt-1">{pixData.itemsText}</p>
                        </div>

                        <div className="p-8 text-center">
                            {/* PIX QR Code */}
                            {pixData.qrCodeBase64 ? (
                                <img
                                    src={`data:image/png;base64,${pixData.qrCodeBase64}`}
                                    alt="QR Code PIX"
                                    className="w-52 h-52 mx-auto rounded-2xl border-4 border-[#EDD68A] shadow-lg"
                                />
                            ) : (
                                <div className="w-52 h-52 mx-auto rounded-2xl bg-[#F0DFBB] flex items-center justify-center text-5xl border-4 border-[#EDD68A]">
                                    📱
                                </div>
                            )}

                            <div className="mt-4 bg-[#D9981F]/10 rounded-2xl p-4">
                                <p className="text-[#5C2E0A] font-display text-3xl font-black">
                                    R$ {pixData.total.toFixed(2).replace('.', ',')}
                                </p>
                                <p className="text-[#7a5235] text-sm mt-1">para Maria de Fátima</p>
                            </div>

                            {/* Copy paste */}
                            {pixData.copyPaste && (
                                <button
                                    onClick={copyPixCode}
                                    className="mt-4 w-full bg-[#5C2E0A] text-[#EDD68A] py-3 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-[#A84B18] transition-colors"
                                >
                                    {copied ? '✅ Código copiado!' : '📋 Copiar código PIX copia-e-cola'}
                                </button>
                            )}

                            {/* Timer */}
                            <div className="mt-6 flex items-center justify-center gap-2">
                                <span className="text-2xl">⏱️</span>
                                <span className={`font-display text-2xl font-bold ${pixTimeLeft < 60 ? 'text-red-500' : 'text-[#5C2E0A]'}`}>
                                    {pixMinutes}:{pixSeconds}
                                </span>
                                <span className="text-[#7a5235] text-sm">para expirar</span>
                            </div>

                            <p className="text-[#7a5235] text-xs mt-4 leading-relaxed">
                                Após pagar, a confirmação é automática. <br/>
                                Você receberá seu número da lista por <strong>e-mail e WhatsApp</strong>.
                            </p>

                            {pixTimeLeft === 0 && (
                                <p className="text-red-500 font-bold mt-3 text-sm">⚠️ PIX expirado. Recarregue a página para tentar novamente.</p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ===== Success Screen ===== */}
            {pixStep === 'success' && pixData && (
                <div className="fixed inset-0 z-[100] bg-[#1C0C04]/95 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-[32px] max-w-md w-full overflow-hidden shadow-2xl text-center">
                        <div className="bg-gradient-to-br from-[#5C2E0A] to-[#A84B18] px-8 py-10">
                            <div className="text-6xl mb-4">🎉</div>
                            <h2 className="text-[#EDD68A] font-display text-3xl font-bold">Pagamento Confirmado!</h2>
                            <p className="text-[#EDD68A]/80 mt-2">Olá, {pixData.customerName}!</p>
                        </div>

                        <div className="bg-[#D9981F] px-8 py-8">
                            <p className="text-[#1C0C04] text-xs font-bold tracking-[0.3em] uppercase mb-3">Seu número na lista</p>
                            <p className="text-[#1C0C04] font-display text-5xl font-black tracking-wider">
                                {pixData.listNumber}
                            </p>
                            <p className="text-[#1C0C04]/70 text-sm mt-3">Anote este número — você vai precisar na portaria!</p>
                        </div>

                        <div className="px-8 py-6">
                            <p className="text-[#6b4226] text-sm leading-relaxed">
                                <strong>{pixData.itemsText}</strong><br/>
                                O comprovante foi enviado para seu e-mail e WhatsApp. 🌽
                            </p>
                            <div className="mt-4 bg-[#FDF6EC] rounded-2xl p-4 text-left">
                                <p className="text-[#5C2E0A] font-bold text-sm">📋 Na portaria, informe:</p>
                                <p className="text-[#7a5235] text-sm mt-1">{pixData.listNumber} + seu nome</p>
                            </div>
                            <p className="text-[#7a5235] text-xs mt-4">📍 06/06 · Planaltina-DF · Portaria abre 19h30</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Navigation */}
            <nav className="bg-[#1C0C04]/95 backdrop-blur-md py-4 px-4 md:px-6 sticky top-0 z-50 flex justify-between items-center border-b border-[#D9981F]/20">
                <span className="font-display font-bold text-lg md:text-xl text-[#EDD68A] flex items-center gap-2">
                    <span className="hidden xs:inline">🌽</span> 
                    <span className="truncate max-w-[120px] xs:max-w-none">Quintal da Fafá</span>
                </span>
                <div className="hidden md:flex items-center gap-6 text-[#EDD68A]/80 text-sm font-bold uppercase tracking-wider">
                    <a href="#atracoes" className="hover:text-[#D9981F] transition-colors">Atrações</a>
                    <a href="#passaporte" className="hover:text-[#D9981F] transition-colors">Passaporte</a>
                    <a href="#adicionais" className="hover:text-[#D9981F] transition-colors">Adicionais</a>
                    <a href="#comprar" className="hover:text-[#D9981F] transition-colors">Preços</a>
                    <a href="#local" className="hover:text-[#D9981F] transition-colors">Local</a>
                </div>
                <a href="#checkout-form">
                    <button className="bg-[#D9981F] hover:bg-[#E85D2F] text-[#1C0C04] px-5 py-2 rounded-full font-black text-sm transition-all transform hover:scale-105 shadow-lg">
                        COMPRAR INGRESSO
                    </button>
                </a>
            </nav>

            {/* Hero Section */}
            <section className="relative min-h-[90vh] flex flex-col items-center justify-center text-center px-4 overflow-hidden" 
                     style={{ background: 'linear-gradient(175deg, #2e0e02 0%, #5C2E0A 55%, #8B4513 100%)' }}>

                {/* ====== BANDEIROLAS ====== */}
                <div className="absolute top-0 left-0 w-full z-20 pointer-events-none" style={{ height: '80px' }}>
                    {/* Fio da bandeirola */}
                    <div style={{
                        position: 'absolute',
                        top: '18px',
                        left: 0,
                        width: '100%',
                        height: '3px',
                        background: 'rgba(0,0,0,0.5)',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.4)',
                    }} />
                    {/* Triângulos */}
                    <div style={{
                        display: 'flex',
                        justifyContent: 'flex-start',
                        alignItems: 'flex-start',
                        position: 'absolute',
                        top: '6px',
                        left: '-10px',
                        width: 'calc(100% + 20px)',
                        gap: '2px',
                        flexWrap: 'nowrap',
                        overflow: 'hidden',
                    }}>
                        {Array.from({ length: 40 }).map((_, i) => {
                            const colors = ['#C94F1A', '#D9981F', '#8B1A1A', '#E8A020', '#5C2E0A', '#D4500A', '#EDD68A', '#A83218'];
                            const color = colors[i % colors.length];
                            return (
                                <div
                                    key={i}
                                    style={{
                                        width: 0,
                                        height: 0,
                                        borderLeft: '22px solid transparent',
                                        borderRight: '22px solid transparent',
                                        borderTop: `58px solid ${color}`,
                                        flexShrink: 0,
                                        transformOrigin: 'top center',
                                        animation: `bandeirola-swing ${1.8 + (i % 4) * 0.3}s ease-in-out infinite`,
                                        animationDelay: `${(i * 0.08) % 1}s`,
                                        filter: 'drop-shadow(0 3px 4px rgba(0,0,0,0.4))',
                                    }}
                                />
                            );
                        })}
                    </div>
                </div>
                {/* ====== FIM BANDEIROLAS ====== */}

                <div className="relative z-10 max-w-4xl space-y-6 animate-fade-in py-20">
                    <span className="inline-block py-2 px-6 rounded-full bg-[#E85D2F] text-white text-xs font-bold tracking-widest uppercase shadow-lg">
                        🎉 06 de Junho de 2026 · Planaltina — DF
                    </span>
                    <h1 className="font-display text-4xl sm:text-6xl md:text-8xl font-bold text-[#EDD68A] leading-tight md:leading-none drop-shadow-2xl px-2">
                        Arraiá do <br className="hidden sm:block"/> <em className="italic text-[#D9981F] not-italic font-display">Quintal da Fafá</em>
                    </h1>
                    <p className="font-display text-xl md:text-3xl text-[#EDD68A]/80 italic">
                        Celebre a tradição junina com música, alegria e diversão!
                    </p>

                    <div className="flex gap-2 sm:gap-4 justify-center py-8">
                        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 sm:p-4 md:p-6 border border-[#EDD68A]/30 min-w-[70px] sm:min-w-[90px]">
                            <span className="block text-2xl sm:text-3xl md:text-5xl font-display font-bold text-[#EDD68A]">{timeLeft.days}</span>
                            <span className="text-[10px] uppercase font-bold text-[#EDD68A]/60">Dias</span>
                        </div>
                        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 sm:p-4 md:p-6 border border-[#EDD68A]/30 min-w-[70px] sm:min-w-[90px]">
                            <span className="block text-2xl sm:text-3xl md:text-5xl font-display font-bold text-[#EDD68A]">{timeLeft.hours}</span>
                            <span className="text-[10px] uppercase font-bold text-[#EDD68A]/60">Horas</span>
                        </div>
                        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 sm:p-4 md:p-6 border border-[#EDD68A]/30 min-w-[70px] sm:min-w-[90px]">
                            <span className="block text-2xl sm:text-3xl md:text-5xl font-display font-bold text-[#EDD68A]">{timeLeft.minutes}</span>
                            <span className="text-[10px] uppercase font-bold text-[#EDD68A]/60">Min</span>
                        </div>
                        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 sm:p-4 md:p-6 border border-[#EDD68A]/30 min-w-[70px] sm:min-w-[90px]">
                            <span className="block text-2xl sm:text-3xl md:text-5xl font-display font-bold text-[#EDD68A]">{timeLeft.seconds}</span>
                            <span className="text-[10px] uppercase font-bold text-[#EDD68A]/60">Seg</span>
                        </div>
                    </div>

                    <div className="flex flex-col md:flex-row gap-4 justify-center animate-slide-up" style={{ animationDelay: '0.4s' }}>
                        <a href="#checkout-form">
                            <Button size="lg" className="bg-[#D9981F] hover:bg-[#E85D2F] text-[#1C0C04] font-bold border-none shadow-xl transform hover:-translate-y-1 transition-all">
                                🎟️ GARANTIR MEU INGRESSO
                            </Button>
                        </a>
                        <a href="#atracoes">
                            <button
                                style={{
                                    background: 'transparent',
                                    border: '2px solid #EDD68A',
                                    color: '#EDD68A',
                                    padding: '12px 32px',
                                    borderRadius: '9999px',
                                    fontWeight: 700,
                                    fontSize: '1rem',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    letterSpacing: '0.02em',
                                }}
                                onMouseEnter={e => {
                                    (e.target as HTMLButtonElement).style.background = 'rgba(237,214,138,0.15)';
                                }}
                                onMouseLeave={e => {
                                    (e.target as HTMLButtonElement).style.background = 'transparent';
                                }}
                            >
                                VER ATRAÇÕES ↓
                            </button>
                        </a>
                    </div>
                </div>
            </section>

            {/* Attractions */}
            <Section id="atracoes" variant="white" className="py-24">
                <div className="text-center mb-16 animate-fade-in">
                    <span className="text-[#A84B18] text-xs font-bold tracking-[0.2em] uppercase mb-2 block">O que esperar</span>
                    <h2 className="font-display text-4xl md:text-6xl font-bold text-[#5C2E0A] mb-6">Uma noite inesquecível</h2>
                    <p className="text-[#6b4226] text-lg max-w-2xl mx-auto">
                        Dois shows ao vivo, gastronomia típica, área kids e o clima mais acolhedor do Cerrado.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {[
                        { 
                            icon: '/images/karlito_tremendao_band.png', 
                            title: 'Karlito Tremendão', 
                            desc: 'Forró & Pisadinha" — O mais arretado da região com o melhor do piseiro.',
                            objPos: 'object-top'
                        },
                        { 
                            icon: '/images/bacurau_arretado_band.png', 
                            title: 'Bacurau Arretado', 
                            desc: '"Xote & Baião · O Arrasta Povão" — O rei do arrasta-pé trazendo toda a energia do Nordeste!',
                            objPos: 'object-top'
                        },
                        { 
                            icon: '/images/gastronomia_tipica.jpg', 
                            title: 'Gastronomia Típica', 
                            desc: 'Caldo de milho, pamonha, pastel, churrasquinho e mais. (Clique para ver cardápio e preços 📋)',
                            objPos: 'object-center',
                            isClickable: true,
                            type: 'gastronomia'
                        },
                        { 
                            icon: '/images/bebidas_tipica.jpg', 
                            title: 'Bebidas Festivas', 
                            desc: 'Cervejas geladas, drinks, Red Bull e sucos. (Clique para ver cardápio e preços 🥤)',
                            objPos: 'object-center',
                            isClickable: true,
                            type: 'bebidas'
                        },
                        { 
                            icon: '/images/pescaria.png', 
                            title: 'Pescaria 🎣', 
                            desc: 'R$ 10,00 — A clássica diversão com brindes garantidos!',
                            objPos: 'object-center',
                            isClickable: false
                        },
                        { 
                            icon: '/images/brinquedos.png', 
                            title: 'Brinquedos 🎪', 
                            desc: 'R$ 10,00 — Acesso individual a qualquer brinquedo do parque.',
                            objPos: 'object-center',
                            isClickable: false
                        },
                    ].map((card, i) => (
                        <div 
                            key={i} 
                            onClick={() => (card as any).isClickable && setMenuType((card as any).type || 'gastronomia')}
                            className={`bg-white rounded-3xl overflow-hidden border border-[#5C2E0A]/5 shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all animate-scale-in ${(card as any).isClickable ? 'cursor-pointer ring-offset-2 hover:ring-2 hover:ring-[#D9981F]' : ''}`} 
                            style={{ animationDelay: `${i * 0.1}s` }}
                        >
                            <div className="overflow-hidden h-52 w-full">
                                <img
                                    src={card.icon}
                                    alt={card.title}
                                    className={`w-full h-full object-cover ${card.objPos} transition-transform hover:scale-110 duration-500`}
                                />
                                {(card as any).isClickable && (
                                    <div className="absolute top-4 right-4 bg-[#D9981F] text-[#1C0C04] text-[10px] font-black py-1 px-3 rounded-full animate-bounce shadow-lg">
                                        VER PREÇOS 📋
                                    </div>
                                )}
                            </div>
                            <div className="p-6">
                                <h3 className="font-display text-xl font-bold text-[#5C2E0A] mb-3">{card.title}</h3>
                                <p className="text-[#7a5235] text-sm leading-relaxed">{card.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </Section>


            {/* Passaporte Section */}
            <section id="passaporte" className="py-24 bg-[#5C2E0A] text-[#EDD68A] overflow-hidden">
                <div className="container mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                    <div className="space-y-8">
                        <span className="text-[#D9981F] text-xs font-bold tracking-[0.2em] uppercase block">Para a criançada</span>
                        <h2 className="font-display text-4xl md:text-6xl font-bold">Passaporte da Alegria 🎪</h2>
                        <p className="text-[#EDD68A]/70 text-lg">
                            Diversão ilimitada para os pequenos com acesso a <strong>6 brinquedos</strong>. Vendido separado do ingresso de adulto.
                        </p>
                        <div className="bg-[#D9981F]/10 border border-[#D9981F]/30 p-4 rounded-xl flex items-center gap-3">
                            <span className="material-symbols-outlined text-[#D9981F]">schedule</span>
                            <p className="text-sm font-bold">Horário: Das 20:00h às 00:00h</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            {['Pula-pula', 'Ping Pong', 'Touro Mecânico', 'Escalada', 'Airgame', 'Tobogã'].map(item => (
                                <div key={item} className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl p-3">
                                    <span className="material-symbols-outlined text-[#D9981F] text-sm">check_circle</span>
                                    <span className="text-sm font-medium">{item}</span>
                                </div>
                            ))}
                        </div>
                        <div className="bg-[#D9981F]/10 border border-[#D9981F]/30 p-6 rounded-2xl">
                             <p className="text-sm">🎀 Crianças com Passaporte ganham uma <strong>pulseira colorida inviolável</strong> na entrada!</p>
                        </div>
                    </div>

                    <div className="bg-white/5 backdrop-blur-md border-2 border-[#D9981F]/30 rounded-[40px] p-12 text-center relative animate-pulse-glow">
                        <span className="font-display italic text-3xl text-[#D9981F] mb-4 block">Passaporte da Alegria</span>
                        <div className="text-8xl mb-8">🎫</div>
                        <p className="text-sm opacity-60 uppercase tracking-widest mb-2">A partir de</p>
                        <div className="font-display text-6xl font-black text-[#D9981F] mb-4">R$ 20</div>
                        <p className="text-xs opacity-50 mb-8">no 1º Lote · para crianças de 3 a 12 anos</p>
                        <div className="bg-[#D9981F] text-[#1C0C04] py-2 px-6 rounded-full inline-block font-bold text-xs uppercase tracking-tight">
                            🎟️ Incluído no Combo Especial
                        </div>
                    </div>
                </div>
            </section>

            {/* Pricing / Buy Section */}
            <section id="adicionais" className="py-24 bg-white relative overflow-hidden">
                {/* Decorative Elements */}
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#D9981F] via-[#A84B18] to-[#D9981F] opacity-20"></div>
                
                <div className="container mx-auto px-6">
                    <div className="text-center mb-16">
                        <span className="text-[#A84B18] text-xs font-bold tracking-[0.2em] uppercase mb-2 block">Mais Diversão</span>
                        <h2 className="font-display text-4xl md:text-6xl font-bold text-[#5C2E0A] mb-6">Serviços Adicionais</h2>
                        <p className="text-[#6b4226] text-lg max-w-2xl mx-auto">
                            Para quem quer diversão pontual ou prefere não adquirir o passaporte completo.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-5xl mx-auto">
                        {/* Pescaria Card */}
                        <div className="bg-[#FDF6EC] rounded-[40px] overflow-hidden border-2 border-[#D9981F]/20 hover:border-[#D9981F] transition-all group shadow-sm hover:shadow-2xl">
                            <div className="h-80 overflow-hidden relative">
                                <img 
                                    src="/images/pescaria.png" 
                                    alt="Pescaria" 
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-[#1C0C04]/60 to-transparent"></div>
                                <div className="absolute bottom-6 left-6 right-6 flex justify-between items-end">
                                    <div className="bg-[#D9981F] text-[#1C0C04] px-4 py-1 rounded-full text-[10px] font-black tracking-widest uppercase">Tradicional</div>
                                    <div className="font-display text-4xl font-black text-white drop-shadow-lg">R$ 10</div>
                                </div>
                            </div>
                            <div className="p-8">
                                <h3 className="font-display text-2xl font-bold text-[#5C2E0A] mb-3">Pescaria 🎉</h3>
                                <p className="text-[#7a5235] text-sm leading-relaxed mb-6">
                                    A clássica pescaria do Arraiá! Compre sua ficha antecipada e garanta sua prenda. Diversão garantida para todas as idades.
                                </p>
                                <div className="flex items-center gap-3 py-3 px-4 bg-red-50 rounded-2xl border border-red-100 mb-6">
                                    <span className="text-red-500">⚠️</span>
                                    <p className="text-[10px] text-red-700 font-bold uppercase tracking-tight">Não inclusa no Passaporte da Alegria</p>
                                </div>
                                <a href="#comprar">
                                    <button className="w-full bg-[#5C2E0A] text-[#EDD68A] py-4 rounded-2xl font-bold hover:bg-[#A84B18] transition-colors">ADICIONAR À COMPRA</button>
                                </a>
                            </div>
                        </div>

                        {/* Brinquedos Individuais Card */}
                        <div className="bg-[#FDF6EC] rounded-[40px] overflow-hidden border-2 border-[#D9981F]/20 hover:border-[#D9981F] transition-all group shadow-sm hover:shadow-2xl">
                            <div className="h-80 overflow-hidden relative">
                                <img 
                                    src="/images/brinquedos.png" 
                                    alt="Brinquedos" 
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-[#1C0C04]/60 to-transparent"></div>
                                <div className="absolute bottom-6 left-6 right-6 flex justify-between items-end">
                                    <div className="bg-[#D9981F] text-[#1C0C04] px-4 py-1 rounded-full text-[10px] font-black tracking-widest uppercase">Uso Único</div>
                                    <div className="font-display text-4xl font-black text-white drop-shadow-lg">R$ 10</div>
                                </div>
                            </div>
                            <div className="p-8">
                                <h3 className="font-display text-2xl font-bold text-[#5C2E0A] mb-3">Brinquedo Individual 🎪</h3>
                                <p className="text-[#7a5235] text-sm leading-relaxed mb-6">
                                    Acesso único a qualquer um dos brinquedos do parque (Touro Mecânico, Tobogã, etc). Ideal para crianças acima de 12 anos ou diversão rápida.
                                </p>
                                <div className="flex items-center gap-3 py-3 px-4 bg-red-50 rounded-2xl border border-red-100 mb-6">
                                    <span className="text-red-500">⚠️</span>
                                    <p className="text-[10px] text-red-700 font-bold uppercase tracking-tight">Não incluso no Passaporte da Alegria</p>
                                </div>
                                <a href="#comprar">
                                    <button className="w-full bg-[#5C2E0A] text-[#EDD68A] py-4 rounded-2xl font-bold hover:bg-[#A84B18] transition-colors">ADICIONAR À COMPRA</button>
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Pricing / Buy Section */}
            <section id="comprar" className="py-24 bg-[#F0DFBB]" style={{ scrollMarginTop: '80px' }}>
                <div className="container mx-auto px-6 max-w-6xl">
                    <div className="text-center mb-16">
                        <span className="text-[#A84B18] text-xs font-bold tracking-[0.2em] uppercase mb-2 block">Garanta seu lugar</span>
                        <h2 className="font-display text-4xl md:text-6xl font-bold text-[#5C2E0A] mb-6">Preços & Lotes</h2>
                        <p className="text-[#A84B18] font-bold">⚠️ Apenas 300 ingressos disponíveis. Esgotando rápido!</p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mt-12">
                        {/* Summary of Batches / Lotes */}
                        <div className="space-y-4">
                            <div className="bg-white rounded-3xl p-8 border-2 border-[#D9981F] shadow-xl relative scale-105 z-10 animate-fade-in">
                                <div className="absolute top-0 right-10 bg-[#D9981F] text-[#1C0C04] px-4 py-1 rounded-b-xl text-[10px] font-black tracking-widest">
                                    LOTE ATUAL
                                </div>
                                <h3 className="font-display text-2xl font-bold text-[#5C2E0A] mb-6">
                                    1º Lote
                                </h3>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center border-b border-dashed border-[#5C2E0A]/20 pb-2">
                                        <span className="text-[#7a5235]">Ingresso Geral</span>
                                        <span className="font-display text-2xl font-bold text-[#5C2E0A]">R$ 20</span>
                                    </div>
                                    <div className="flex justify-between items-center border-b border-dashed border-[#5C2E0A]/20 pb-2">
                                        <span className="text-[#7a5235]">Passaporte Kids</span>
                                        <span className="font-display text-2xl font-bold text-[#5C2E0A]">R$ 20</span>
                                    </div>
                                    <div className="flex justify-between items-center border-b border-dashed border-[#5C2E0A]/20 pb-2">
                                        <span className="text-[#7a5235]">Meia (6 a 12 anos)</span>
                                        <span className="font-display text-2xl font-bold text-[#5C2E0A]">R$ 10</span>
                                    </div>
                                    <div className="bg-gradient-to-r from-[#A84B18] to-[#E85D2F] p-4 rounded-xl flex justify-between items-center text-white">
                                        <span className="font-bold">Combo (Geral + Kids + Meia)</span>
                                        <span className="font-display text-2xl font-bold">R$ 50</span>
                                    </div>
                                </div>
                            </div>
                            {/* Future Lotes Grayscale */}
                            <div className="bg-white/50 backdrop-blur-sm rounded-3xl p-8 border border-black/5 opacity-60">
                                <h3 className="font-display text-xl font-bold text-[#5C2E0A]/60 mb-2">2º Lote</h3>
                                <div className="space-y-2 text-xs">
                                    <div className="flex justify-between">
                                        <span>Geral</span>
                                        <span>R$ 25</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Kids</span>
                                        <span>R$ 25</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Meia (6-12)</span>
                                        <span>R$ 12</span>
                                    </div>
                                    <div className="flex justify-between font-bold border-t border-black/10 pt-1">
                                        <span>Combo</span>
                                        <span>R$ 62</span>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white/50 backdrop-blur-sm rounded-3xl p-8 border border-black/5 opacity-60">
                                <h3 className="font-display text-xl font-bold text-[#5C2E0A]/60 mb-2">3º Lote</h3>
                                <div className="space-y-2 text-xs">
                                    <div className="flex justify-between">
                                        <span>Geral</span>
                                        <span>R$ 30</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Kids</span>
                                        <span>R$ 25</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Meia (6-12)</span>
                                        <span>R$ 15</span>
                                    </div>
                                    <div className="flex justify-between font-bold border-t border-black/10 pt-1">
                                        <span>Combo</span>
                                        <span>R$ 70</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Checkout Form */}
                        <form id="checkout-form" onSubmit={handlePurchase} className="bg-[#1C0C04] text-[#EDD68A] p-10 rounded-[40px] shadow-2xl space-y-6" style={{ scrollMarginTop: '100px' }}>
                            <h3 className="font-display text-3xl font-bold mb-6">Seus Dados</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-[10px] uppercase font-bold tracking-widest mb-2 opacity-60">Nome Completo</label>
                                    <input 
                                        type="text" required
                                        className="w-full bg-white/5 border border-white/20 rounded-2xl p-4 text-[#EDD68A] focus:border-[#D9981F] transition-all"
                                        placeholder="Seu nome"
                                        value={formData.name}
                                        onChange={e => setFormData(f => ({ ...f, name: e.target.value }))}
                                    />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] uppercase font-bold tracking-widest mb-2 opacity-60">E-mail</label>
                                        <input 
                                            type="email" required
                                            className="w-full bg-white/5 border border-white/20 rounded-2xl p-4 text-[#EDD68A] focus:border-[#D9981F] transition-all"
                                            placeholder="seu@email.com"
                                            value={formData.email}
                                            onChange={e => setFormData(f => ({ ...f, email: e.target.value }))}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] uppercase font-bold tracking-widest mb-2 opacity-60">WhatsApp</label>
                                        <input 
                                            type="tel" required
                                            className="w-full bg-white/5 border border-white/20 rounded-2xl p-4 text-[#EDD68A] focus:border-[#D9981F] transition-all"
                                            placeholder="(61) 99635-1010"
                                            value={formData.phone}
                                            onChange={e => setFormData(f => ({ ...f, phone: e.target.value }))}
                                        />
                                    </div>
                                </div>

                                <div className="pt-4 space-y-4">
                                    <label className="block text-[10px] uppercase font-bold tracking-widest mb-2 opacity-60">Escolha a quantidade</label>
                                    
                                    {[
                                        { id: 'geral', label: 'Geral', price: currentPrices.geral },
                                        { id: 'meia', label: 'Meia-Entrada (6-12 anos)', price: currentPrices.meia },
                                        { id: 'passaporte', label: 'Passaporte Kids', price: currentPrices.passaporte },
                                        { id: 'combo', label: 'Combo (Geral + Kids + Meia)', price: currentPrices.combo },
                                        { id: 'pescaria', label: 'Pescaria', price: currentPrices.pescaria },
                                        { id: 'brinquedos', label: 'Brinquedo Individual', price: currentPrices.brinquedos }
                                    ].map(item => (
                                        <div key={item.id} className="flex items-center justify-between bg-white/5 p-4 rounded-2xl border border-white/10">
                                            <div>
                                                <p className="font-bold text-sm">{item.label}</p>
                                                <p className="text-xs text-[#D9981F]">R$ {item.price}</p>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <button type="button" onClick={() => handleQtyChange(item.id as any, -1)} 
                                                        className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center hover:bg-white/10">
                                                    −
                                                </button>
                                                <span className="font-display font-bold text-xl min-w-[20px] text-center">{(qty as any)[item.id]}</span>
                                                <button type="button" onClick={() => handleQtyChange(item.id as any, 1)}
                                                        disabled={(item.id === 'pescaria' || item.id === 'brinquedos') && (qty as any)[item.id] >= 5}
                                                        className={`w-8 h-8 rounded-full border border-white/20 flex items-center justify-center hover:bg-white/10 ${(item.id === 'pescaria' || item.id === 'brinquedos') && (qty as any)[item.id] >= 5 ? 'opacity-20 cursor-not-allowed' : ''}`}>
                                                    +
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="pt-10 border-t border-white/10 mt-6">
                                <div className="flex justify-between items-center mb-6">
                                    <span className="font-display text-xl">Total do Pedido</span>
                                    <span className="font-display text-3xl font-black text-[#D9981F]">R$ {total.toFixed(2)}</span>
                                </div>
                                {purchaseError && <p className="text-red-400 text-xs mb-4">{purchaseError}</p>}
                                    <div className="bg-red-500/10 border border-red-500/30 p-5 rounded-2xl mb-6 flex flex-col gap-2">
                                        <div className="flex items-center gap-2 text-red-500 mb-1">
                                            <span className="material-symbols-outlined text-sm">warning</span>
                                            <span className="text-[10px] uppercase font-black tracking-widest">Política de Cancelamento</span>
                                        </div>
                                        <p className="text-[11px] leading-relaxed opacity-90 text-white/80 italic">
                                            ⚠️ <strong>Devoluções:</strong> Aceitas somente até <strong>30/05</strong> (7 dias antes).<br/>
                                            🔄 <strong>Transferência:</strong> Via WhatsApp mediante taxa de R$ 5,00.<br/>
                                            ❌ <strong>Pós-Prazo:</strong> Não há reembolso após o dia 30/05.
                                        </p>
                                    </div>
                                    <button 
                                        type="submit" 
                                        disabled={isSubmitting || total === 0}
                                        className="w-full bg-[#D9981F] hover:bg-[#E85D2F] text-[#1C0C04] py-5 rounded-2xl font-black text-lg transition-all transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isSubmitting ? '⏳ GERANDO PIX...' : '⚡ GERAR PIX — R$ ' + total.toFixed(2).replace('.', ',')}
                                    </button>
                                    <p className="text-center mt-4 text-[10px] opacity-40 uppercase tracking-widest">
                                        🔒 Pagamento seguro via PIX · Mercado Pago
                                    </p>
                                </div>
                        </form>
                    </div>
                </div>
            </section>

            {/* ===== FAQ Section ===== */}
            <Section id="faq" variant="white" className="py-24">
                <div className="max-w-3xl mx-auto">
                    <div className="text-center mb-16 animate-fade-in">
                        <span className="text-[#A84B18] text-xs font-bold tracking-[0.2em] uppercase mb-2 block">Dúvidas Frequentes</span>
                        <h2 className="font-display text-4xl md:text-6xl font-bold text-[#5C2E0A]">Perguntas &amp; Respostas</h2>
                    </div>

                    <FaqAccordion items={[
                        {
                            q: 'Qual é a diferença entre Ingresso Geral e Passaporte da Alegria?',
                            a: 'O Ingresso Geral dá acesso ao evento, aos shows das bandas e à praça de alimentação. O Passaporte é um complemento exclusivo para crianças, com acesso ilimitado a 6 brinquedos (Pula-pula, Ping Pong, Touro Mecânico, Escalada, Airgame e Tobogã). O Combo já inclui os dois.'
                        },
                        {
                            q: 'Crianças pagam entrada?',
                            a: 'Crianças até 5 anos entram gratuitas. De 6 a 12 anos pagam meia-entrada. O Passaporte da Alegria é recomendado para crianças de 3 a 12 anos e é adquirido separadamente.'
                        },
                        {
                            q: 'Como funciona o acesso no dia do evento?',
                            a: 'Após a confirmação do pagamento, seu nome e os detalhes da compra são incluídos automaticamente em nossa lista oficial. Você receberá um comprovante com seu número da lista (ex: ARRAIA-XXX) por e-mail e WhatsApp. Na portaria do evento, basta informar seu nome e apresentar o número da lista para conferência e liberação da entrada.'
                        },
                        {
                            q: 'Posso transferir ou devolver meu ingresso?',
                            a: 'Devoluções são aceitas até 7 dias antes do evento (até 30/05). Transferência de titularidade está disponível via nosso WhatsApp mediante taxa de R$ 5,00. Após o prazo (30/05), não há reembolso.'
                        },
                        {
                            q: 'Qual é o horário do evento?',
                            a: 'O evento começa às 20h do dia 06 de junho. A entrada antecipada a partir das 19h30 para quem tiver ingresso.'
                        },
                        {
                            q: 'O local é coberto?',
                            a: 'O Quintal da Fafá conta com área coberta e área externa. A festa acontece em ambiente misto, ideal para o clima agradável de junho no Cerrado.'
                        },
                        {
                            q: 'O que são os Serviços Adicionais (Pescaria e Brinquedos)?',
                            a: 'A Pescaria e o uso individual de Brinquedos são serviços opcionais vendidos por unidade (R$ 10,00). Eles são ideais para quem não quer comprar o Passaporte ilimitado ou para adultos que querem apenas brincar uma vez. Importante: estes itens NÃO estão inclusos no Passaporte da Alegria.'
                        },
                    ]} />
                </div>
            </Section>

            {/* Local Section Placeholder */}
            <Section id="local" variant="soft" className="py-24">
                <div className="container mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                    <div>
                        <span className="text-[#A84B18] text-xs font-bold tracking-[0.2em] uppercase mb-2 block">Onde ficamos</span>
                        <h2 className="font-display text-4xl font-bold text-[#5C2E0A] mb-6">Planaltina - DF</h2>
                        <p className="text-[#6b4226] mb-8">Localizado no Núcleo Rural Rio Preto. Um ambiente rústico e acolhedor preparado especialmente para o nosso Arraiá.</p>
                        <div className="space-y-4">
                            <div className="bg-white/50 p-6 rounded-3xl border border-[#D9981F]/20 shadow-sm">
                                <div className="flex items-start gap-4 text-[#5C2E0A] mb-4">
                                    <span className="material-symbols-outlined text-[#D9981F]">location_on</span>
                                    <div>
                                        <p className="font-bold text-lg">Endereço do Evento</p>
                                        <p className="opacity-80">Núcleo Rural Rio Preto Agrovila sede, Planaltina - DF</p>
                                    </div>
                                </div>
                                <div className="flex flex-wrap gap-3">
                                    <button 
                                        onClick={() => window.open('https://www.google.com/maps/place/15%C2%B045\'44.1%22S+47%C2%B029\'34.9%22W/@-15.7622386,-47.4955887,17z', '_blank')}
                                        className="flex-1 bg-[#4285F4] text-white py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-[#3367D6] transition-colors"
                                    >
                                        <img src="https://www.google.com/images/branding/product/ico/maps15_64dp.png" className="w-5 h-5 invert" alt="GMaps" />
                                        GOOGLE MAPS
                                    </button>
                                    <button 
                                        onClick={() => window.open('https://waze.com/ul?ll=-15.7622386,-47.4955887&navigate=yes', '_blank')}
                                        className="flex-1 bg-[#33CCFF] text-[#1C0C04] py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-[#2BBEEB] transition-colors"
                                    >
                                        <img src="https://upload.wikimedia.org/wikipedia/commons/e/e1/Waze_icon.png" className="w-5 h-5" alt="Waze" />
                                        WAZE
                                    </button>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 text-[#5C2E0A] p-4 font-bold">
                                <span className="material-symbols-outlined text-[#D9981F]">whatsapp</span>
                                <span>Dúvidas no caminho? (61) 99635-1010</span>
                            </div>
                        </div>
                    </div>
                    <div className="h-[400px] bg-[#F0DFBB] rounded-[40px] flex items-center justify-center border-2 border-white/50 text-[#5C2E0A]/30 flex-col gap-4 overflow-hidden relative group cursor-pointer"
                         onClick={() => window.open('https://www.google.com/maps/place/15%C2%B045\'44.1%22S+47%C2%B029\'34.9%22W/@-15.7622386,-47.4955887,17z', '_blank')}>
                         <img src="https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" alt="Map" className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:scale-110 transition-transform duration-700" />
                         <span className="material-symbols-outlined text-6xl relative z-10 text-[#5C2E0A]">map</span>
                         <span className="font-bold text-sm uppercase tracking-widest relative z-10 text-[#5C2E0A]">Ver no Google Maps</span>
                    </div>
                </div>
            </Section>

            <Footer />
            
            <ArraiaMenu 
                isOpen={menuType !== null} 
                type={menuType || 'gastronomia'}
                onClose={() => setMenuType(null)} 
            />
        </div>
    );
};

export default Arraia2026;
