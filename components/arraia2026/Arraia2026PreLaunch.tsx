import ArraiaTicketCheckout from './ArraiaTicketCheckout';
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { supabase } from '../../lib/supabase';
import { useGallery, GalleryItem } from '../../lib/hooks/useGallery';
import ArraiaMenu, { MenuType } from '../landing/ArraiaMenu';
import { Link } from 'react-router-dom';

const Arraia2026PreLaunch: React.FC = () => {
    

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

    

    

    return (
        <div className="font-body w-full flex-1 flex flex-col bg-[#F5ECD5] text-[#3B0964]">
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

                <Link to="/arraia-2026/ingressos" className="hidden md:block">
                    <button className="bg-[#FFD54F] hover:bg-[#ffb703] text-[#3B0964] px-6 py-3 rounded-md font-black text-sm transition-all shadow-md flex items-center gap-2">
                        <span>🏷️</span> COMPRAR INGRESSO
                    </button>
                </Link>
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

                        <Link to="/arraia-2026/ingressos" className="inline-block w-full sm:w-auto">
                            <button className="w-full sm:w-auto bg-[#4CAF50] hover:bg-[#388E3C] text-white px-8 py-4 rounded-xl font-black text-lg md:text-xl transition-all shadow-[0_4px_15px_rgba(76,175,80,0.5)] flex items-center justify-center gap-3">
                                🎟️ GARANTA SEU INGRESSO AGORA!
                            </button>
                        </Link>

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
                    <div id="checkout-form" className={`mt-16 max-w-3xl mx-auto transition-all duration-500 ${highlightForm ? 'scale-[1.02]' : ''}`}>
                        <ArraiaTicketCheckout />
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

                    <Link to="/arraia-2026/ingressos" className="inline-block relative group">
                        <div className="absolute inset-0 bg-[#4CAF50] rounded-2xl blur-lg opacity-60 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <button className="relative bg-gradient-to-b from-[#4CAF50] to-[#388E3C] border-2 border-white/20 hover:border-white/50 text-white px-12 py-6 rounded-2xl font-black text-xl md:text-2xl transition-all shadow-[0_8px_30px_rgba(76,175,80,0.5)] group-hover:-translate-y-2 flex items-center justify-center gap-4">
                            <span className="text-3xl">🎟️</span> GARANTIR MEU INGRESSO AGORA
                        </button>
                    </Link>
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
