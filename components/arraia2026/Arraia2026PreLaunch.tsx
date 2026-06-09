import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useGallery, GalleryItem } from '../../lib/hooks/useGallery';
import { Link } from 'react-router-dom';

const Arraia2026PreLaunch: React.FC = () => {
    const [timeLeft, setTimeLeft] = useState<{ days: number, hours: number, minutes: number, seconds: number }>({
        days: 0, hours: 0, minutes: 0, seconds: 0
    });

    const [formData, setFormData] = useState({ name: '', email: '', phone: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error' | 'duplicate'>('idle');
    const [vipCount, setVipCount] = useState<number | null>(null);

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

    const [galleryPreview, setGalleryPreview] = useState<GalleryItem[]>([]);

    const eventDate = new Date('2026-07-18T00:00:00-03:00').getTime();

    useEffect(() => {
        const loadPreview = async () => {
            try {
                const { data, error } = await supabase
                    .from('gallery_images')
                    .select('*')
                    .order('created_at', { ascending: false })
                    .limit(6);

                if (error) throw error;
                if (data) {
                    setGalleryPreview(data as GalleryItem[]);
                }
            } catch (err) {
                console.error('Error fetching gallery preview:', err);
                // Não repete loop, tela não quebra, mantemos o fallback
            }
        };
        loadPreview();
    }, []);

    useEffect(() => {
        const timer = setInterval(() => {
            const now = new Date().getTime();
            const dist = eventDate - now;
            if (dist <= 0) { 
                clearInterval(timer); 
                setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
                return; 
            }
            setTimeLeft({
                days: Math.floor(dist / (1000 * 60 * 60 * 24)),
                hours: Math.floor((dist % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
                minutes: Math.floor((dist % (1000 * 60 * 60)) / (1000 * 60)),
                seconds: Math.floor((dist % (1000 * 60)) / 1000)
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [eventDate]);

    const handleVipSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setSubmitStatus('idle');

        try {
            const { error } = await supabase
                .from('vip_waitlist')
                .insert([{
                    nome: formData.name,
                    email: formData.email,
                    telefone: formData.phone,
                    origem: 'site_2edicao'
                }]);

            if (error) {
                if (error.code === '23505') {
                    setSubmitStatus('duplicate');
                    return;
                }
                throw error;
            }
            setSubmitStatus('success');
            setFormData({ name: '', email: '', phone: '' });
        } catch (error) {
            console.error('Erro ao cadastrar na lista VIP:', error);
            setSubmitStatus('error');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="font-body w-full flex-1 flex flex-col bg-[#1B3B22]">
            {/* Topbar Amarela */}
            <div className="bg-[#FFD54F] text-[#3B0964] py-2 px-4 text-center z-[60] relative flex flex-wrap items-center justify-center gap-4 shadow-md">
                <span className="hidden md:inline text-xs md:text-sm font-black tracking-widest uppercase flex items-center gap-2">
                    <span className="text-lg">📢</span> NOVIDADE! A MAIOR FESTA JUNINA DA REGIÃO ESTÁ DE VOLTA! <span className="text-lg">🎉</span>
                </span>
                <span className="md:hidden text-[11px] font-black uppercase">🎉 2ª EDIÇÃO CONFIRMADA!</span>
                <a href="#lista-vip" className="bg-[#5a189a] text-white px-4 py-1.5 rounded-md text-[11px] md:text-xs font-black hover:bg-[#3B0964] transition-all shadow-sm">
                    🔔 QUERO SER AVISADO!
                </a>
            </div>

            {/* Navigation */}
            <nav className="bg-[#1B3B22] py-4 px-4 md:px-8 flex justify-between items-center border-b border-white/10 sticky top-0 z-50 shadow-md">
                <Link to="/" className="flex items-center gap-2 text-white">
                    <div className="flex flex-col items-center">
                        <span className="font-display font-bold text-2xl text-[#FFD54F]">Quintal da Fafá</span>
                        <span className="text-[9px] uppercase tracking-[0.3em] opacity-80">Festa Junina</span>
                    </div>
                </Link>
                <div className="hidden lg:flex items-center gap-6 text-white text-sm font-bold">
                    <Link to="/" className="bg-white/10 px-3 py-1.5 rounded-md hover:bg-white/20 transition-all flex items-center gap-1"><span className="material-symbols-outlined text-sm">home</span> Início</Link>
                    <Link to="/#espaco" className="hover:text-[#FFD54F] transition-colors flex items-center gap-1"><span className="material-symbols-outlined text-sm">location_on</span> O Espaço</Link>
                    <Link to="/galeria" className="hover:text-[#FFD54F] transition-colors flex items-center gap-1"><span className="material-symbols-outlined text-sm">photo_library</span> Galeria</Link>
                    <a href="#hero" className="text-[#FFD54F] flex items-center gap-1"><span className="material-symbols-outlined text-sm">celebration</span> 2ª Edição</a>
                    <a href="#lista-vip" className="hover:text-[#FFD54F] transition-colors flex items-center gap-1"><span className="material-symbols-outlined text-sm">list_alt</span> Lista VIP</a>
                    <a href="#contato" className="hover:text-[#FFD54F] transition-colors flex items-center gap-1"><span className="material-symbols-outlined text-sm">mail</span> Contato</a>
                </div>
                <a href="#lista-vip" className="hidden sm:block">
                    <button className="bg-[#FFD54F] hover:bg-[#ffb703] text-[#3B0964] px-5 py-2.5 rounded-md font-black text-sm transition-all shadow-[4px_4px_0px_#5a189a] hover:shadow-none hover:translate-x-[4px] hover:translate-y-[4px]">
                        🔔 QUERO SER AVISADO!
                    </button>
                </a>
            </nav>

            {/* Hero Section */}
            <section id="hero" className="relative pt-12 pb-24 md:pt-20 md:pb-32 px-4 overflow-hidden bg-gradient-to-br from-[#3B0964] to-[#1e0533]">
                {/* Decorative Elements */}
                <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-40 mix-blend-overlay" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/wood-pattern.png")' }}></div>
                
                {/* Bandeirinhas */}
                <div className="absolute top-0 left-0 w-full flex justify-around pointer-events-none drop-shadow-xl" style={{ transform: 'translateY(-10px)' }}>
                    {Array.from({ length: 15 }).map((_, i) => {
                        const colors = ['#FFD54F', '#4caf50', '#ff5722', '#e91e63', '#2196f3'];
                        return (
                            <div key={i} className="w-8 h-12 md:w-16 md:h-24" style={{ backgroundColor: colors[i % colors.length], clipPath: 'polygon(0 0, 100% 0, 100% 100%, 50% 75%, 0 100%)', transform: `rotate(${Math.sin(i) * 10}deg)` }}></div>
                        )
                    })}
                </div>

                <div className="container mx-auto max-w-[1400px] relative z-10 flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-16 mt-6 md:mt-10">
                    <div className="flex-1 text-center lg:text-left px-4 md:px-0">
                        <div className="relative inline-block mb-4">
                            <span className="text-5xl md:text-8xl font-display font-black text-white drop-shadow-[0_10px_10px_rgba(0,0,0,0.5)]">
                                2ª EDIÇÃO
                            </span>
                            <span className="absolute -top-8 -left-8 text-5xl rotate-[-20deg] drop-shadow-lg">👒</span>
                        </div>
                        
                        <div className="bg-[#FFD54F] text-[#3B0964] inline-block px-5 py-2 transform -rotate-2 font-display font-black text-2xl md:text-4xl shadow-[4px_4px_0px_rgba(0,0,0,0.2)] mb-6">
                            DO QUINTAL DA FAFÁ
                        </div>

                        <div className="flex flex-col gap-3 mb-8 max-w-sm mx-auto lg:mx-0">
                            <div className="flex items-center gap-4 bg-black/30 backdrop-blur-md rounded-xl p-3 border border-white/10">
                                <span className="material-symbols-outlined text-[#FFD54F] text-3xl">calendar_month</span>
                                <span className="text-white font-bold text-lg md:text-xl tracking-wide">18 DE JULHO DE 2026</span>
                            </div>
                            <div className="flex items-center gap-4 bg-black/30 backdrop-blur-md rounded-xl p-3 border border-white/10">
                                <span className="material-symbols-outlined text-[#FFD54F] text-3xl">location_on</span>
                                <span className="text-white font-bold text-lg md:text-xl tracking-wide">PLANALTINA - DF</span>
                            </div>
                        </div>

                        <p className="text-white text-base md:text-lg max-w-lg leading-relaxed mb-8 font-medium mx-auto lg:mx-0 drop-shadow-md">
                            A tradição continua e vem <strong className="text-[#FFD54F] underline decoration-wavy">ainda maior!</strong><br/><br/>
                            Estamos preparando uma experiência única com muita música, diversão, comidas típicas e aquele clima que só o Quintal da Fafá tem!
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                            <a href="#lista-vip">
                                <button className="w-full sm:w-auto bg-[#FFD54F] hover:bg-[#ffb703] text-[#3B0964] px-6 md:px-8 py-3 md:py-4 rounded-xl font-black text-base md:text-lg transition-all shadow-[4px_4px_0px_rgba(0,0,0,0.4)] hover:shadow-none hover:translate-x-[4px] hover:translate-y-[4px] flex items-center justify-center gap-2">
                                    <span className="text-2xl">🔔</span> QUERO SER AVISADO!
                                </button>
                            </a>
                            <Link to="/#espaco">
                                <button className="w-full sm:w-auto bg-transparent border-2 border-white text-white hover:bg-white hover:text-[#3B0964] px-6 md:px-8 py-3 md:py-4 rounded-xl font-bold text-base md:text-lg transition-all flex items-center justify-center gap-2">
                                    CONHEÇA O ESPAÇO <span className="material-symbols-outlined">arrow_forward</span>
                                </button>
                            </Link>
                        </div>
                    </div>

                    <div className="flex-1 flex justify-center lg:justify-end">
                        {/* Placa de madeira virtual */}
                        <div className="relative transform rotate-[4deg] hover:rotate-[2deg] transition-all duration-500 w-[90%] max-w-[340px] md:max-w-sm mx-auto lg:mx-0 mt-8 lg:mt-0">
                            <div className="absolute inset-0 bg-black/20 blur-xl rounded-full"></div>
                            <div className="relative bg-[#8B4513] border-[10px] border-[#5C2E0A] p-6 text-center shadow-xl rounded-sm" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/wood-pattern.png")' }}>
                                {/* Pregos */}
                                <div className="absolute top-2 left-2 w-4 h-4 rounded-full bg-zinc-800 shadow-inner"></div>
                                <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-zinc-800 shadow-inner"></div>
                                <div className="absolute bottom-2 left-2 w-4 h-4 rounded-full bg-zinc-800 shadow-inner"></div>
                                <div className="absolute bottom-2 right-2 w-4 h-4 rounded-full bg-zinc-800 shadow-inner"></div>
                                
                                <p className="font-display font-black text-[#FFD54F] text-xl md:text-2xl leading-snug drop-shadow-md">
                                    <span className="text-2xl">🌽</span> AS ATRAÇÕES, <br/>INGRESSOS E NOVIDADES <br/>SERÃO DIVULGADAS <br/><span className="text-white text-2xl md:text-3xl">EM BREVE!</span> <span className="text-2xl">🪗</span>
                                </p>
                            </div>
                            {/* Poste da placa */}
                            <div className="w-6 h-24 md:w-8 md:h-32 bg-[#5C2E0A] mx-auto shadow-2xl" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/wood-pattern.png")' }}></div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Grid 3 Colunas: Contador | Resumo | VIP */}
            <section className="relative z-20 px-4 max-w-7xl mx-auto -mt-20 mb-20">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
                    {/* 1. Contador */}
                    <div className="bg-[#FFF8E7] rounded-2xl p-6 shadow-2xl border-4 border-[#FFD54F] flex flex-col justify-center items-center text-center">
                        <div className="flex items-center gap-2 mb-6">
                            <span className="text-[#FFD54F] text-2xl">⭐</span>
                            <h3 className="font-display font-black text-xl md:text-2xl text-[#3B0964]">FALTA POUCO PARA A 2ª EDIÇÃO!</h3>
                            <span className="text-[#FFD54F] text-2xl">⭐</span>
                        </div>
                        
                        <div className="flex gap-1.5 md:gap-2 w-full justify-center lg:justify-between max-w-full lg:max-w-xs mx-auto">
                            <div className="bg-[#3B0964] text-white flex-1 py-2 md:py-4 rounded-xl shadow-lg border-b-4 border-[#1e0533] min-w-[65px]">
                                <span className="block font-display font-black text-2xl sm:text-3xl md:text-4xl">{timeLeft.days}</span>
                                <span className="text-[8px] sm:text-[10px] font-bold uppercase tracking-widest opacity-80">Dias</span>
                            </div>
                            <div className="bg-[#3B0964] text-white flex-1 py-2 md:py-4 rounded-xl shadow-lg border-b-4 border-[#1e0533] min-w-[65px]">
                                <span className="block font-display font-black text-2xl sm:text-3xl md:text-4xl">{timeLeft.hours}</span>
                                <span className="text-[8px] sm:text-[10px] font-bold uppercase tracking-widest opacity-80">Horas</span>
                            </div>
                            <div className="bg-[#3B0964] text-white flex-1 py-2 md:py-4 rounded-xl shadow-lg border-b-4 border-[#1e0533] min-w-[65px]">
                                <span className="block font-display font-black text-2xl sm:text-3xl md:text-4xl">{timeLeft.minutes}</span>
                                <span className="text-[8px] sm:text-[10px] font-bold uppercase tracking-widest opacity-80">Minutos</span>
                            </div>
                            <div className="bg-[#3B0964] text-white flex-1 py-2 md:py-4 rounded-xl shadow-lg border-b-4 border-[#1e0533] min-w-[65px]">
                                <span className="block font-display font-black text-2xl sm:text-3xl md:text-4xl">{timeLeft.seconds}</span>
                                <span className="text-[8px] sm:text-[10px] font-bold uppercase tracking-widest opacity-80">Segundos</span>
                            </div>
                        </div>
                        <div className="mt-6 text-4xl animate-bounce">🔥</div>
                    </div>

                    {/* 2. O que já sabemos */}
                    <div className="bg-[#FFF8E7] rounded-2xl p-6 shadow-2xl border border-black/10">
                        <div className="flex items-center justify-center gap-2 mb-6 text-center border-b border-black/5 pb-4">
                            <span className="text-xl">🌿</span>
                            <h3 className="font-display font-black text-xl text-[#3B0964]">O QUE JÁ SABEMOS</h3>
                            <span className="text-xl">🌿</span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-y-6 gap-x-2">
                            <div className="flex items-start gap-3">
                                <span className="text-2xl drop-shadow-sm">⭐</span>
                                <div>
                                    <p className="font-bold text-sm text-[#3B0964] leading-tight">2ª EDIÇÃO</p>
                                    <p className="text-xs text-[#5C2E0A]">Confirmada!</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <span className="text-2xl drop-shadow-sm">📅</span>
                                <div>
                                    <p className="font-bold text-sm text-[#3B0964] leading-tight">18 DE JULHO</p>
                                    <p className="text-xs text-[#5C2E0A]">de 2026</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <span className="text-2xl drop-shadow-sm">📍</span>
                                <div>
                                    <p className="font-bold text-sm text-[#3B0964] leading-tight">PLANALTINA - DF</p>
                                    <p className="text-xs text-[#5C2E0A]">Local confirmado</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <span className="text-2xl drop-shadow-sm">🎪</span>
                                <div>
                                    <p className="font-bold text-sm text-[#3B0964] leading-tight">ESTRUTURA AMPL</p>
                                    <p className="text-xs text-[#5C2E0A]">Mais conforto</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3 opacity-60">
                                <span className="text-2xl drop-shadow-sm grayscale">❓</span>
                                <div>
                                    <p className="font-bold text-sm text-[#3B0964] leading-tight">ATRAÇÕES</p>
                                    <p className="text-xs text-[#5C2E0A]">Em breve</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3 opacity-60">
                                <span className="text-2xl drop-shadow-sm grayscale">🎟️</span>
                                <div>
                                    <p className="font-bold text-sm text-[#3B0964] leading-tight">INGRESSOS</p>
                                    <p className="text-xs text-[#5C2E0A]">Em breve</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 3. Lista VIP */}
                    <div id="lista-vip" className="bg-[#3B0964] rounded-2xl p-6 shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl"></div>
                        <div className="absolute bottom-0 left-0 w-24 h-24 bg-[#FFD54F]/10 rounded-full blur-xl"></div>
                        
                        <div className="relative z-10">
                            <div className="flex items-center justify-center gap-2 mb-2 text-center">
                                <span className="text-[#FFD54F]">⇌</span>
                                <h3 className="font-display font-black text-2xl text-white">ENTRE NA LISTA VIP</h3>
                                <span className="text-[#FFD54F]">⇌</span>
                            </div>

                            {vipCount !== null && vipCount > 0 && (
                                <div className="flex justify-center mb-4 mt-2">
                                    <div className="bg-[#FFD54F]/20 border border-[#FFD54F]/50 px-4 py-1.5 rounded-full text-[#FFD54F] text-xs font-bold shadow-inner">
                                        🎉 Já somos {vipCount} pessoas aguardando a 2ª edição!
                                    </div>
                                </div>
                            )}

                            <p className="text-center text-white/80 text-xs mb-1">
                                Cadastre-se gratuitamente e receba em primeira mão:
                            </p>
                            <p className="text-center text-[#FFD54F] text-xs font-bold mb-4">
                                ⚡ Os membros da Lista VIP serão os primeiros a saber sobre atrações e abertura das vendas.
                            </p>
                            
                            <ul className="text-white text-xs space-y-1 mb-5 flex flex-col ml-2">
                                <li className="flex items-center gap-2"><span className="text-green-400">✔</span> Abertura das vendas</li>
                                <li className="flex items-center gap-2"><span className="text-green-400">✔</span> Divulgação das atrações</li>
                                <li className="flex items-center gap-2"><span className="text-green-400">✔</span> Promoções exclusivas</li>
                                <li className="flex items-center gap-2"><span className="text-green-400">✔</span> Sorteios e novidades</li>
                            </ul>

                            <form onSubmit={handleVipSubmit} className="space-y-3">
                                {submitStatus === 'success' ? (
                                    <div className="bg-green-500/10 border border-green-500/30 text-white text-center p-6 rounded-xl animate-fade-in flex flex-col items-center">
                                        <div className="text-4xl mb-3">🎉</div>
                                        <h4 className="font-bold text-lg mb-2 text-[#FFD54F]">Você agora faz parte da Lista VIP!</h4>
                                        <p className="text-sm mb-4">A partir de agora você receberá em primeira mão:</p>
                                        
                                        <ul className="text-xs text-left inline-block space-y-1 mb-6 bg-black/20 p-4 rounded-lg">
                                            <li className="flex items-center gap-2"><span className="text-green-400">✅</span> Divulgação das atrações</li>
                                            <li className="flex items-center gap-2"><span className="text-green-400">✅</span> Abertura do 1º lote</li>
                                            <li className="flex items-center gap-2"><span className="text-green-400">✅</span> Promoções especiais</li>
                                            <li className="flex items-center gap-2"><span className="text-green-400">✅</span> Sorteios exclusivos</li>
                                            <li className="flex items-center gap-2"><span className="text-green-400">✅</span> Novidades da 2ª edição</li>
                                        </ul>
                                        
                                        <a href="https://wa.me/5561998441333?text=Ol%C3%A1%21%20Acabei%20de%20entrar%20na%20Lista%20VIP%20da%202%C2%AA%20Edi%C3%A7%C3%A3o%20do%20Quintal%20da%20Faf%C3%A1%20e%20gostaria%20de%20acompanhar%20as%20novidades." target="_blank" rel="noopener noreferrer" className="w-full">
                                            <button className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white font-black py-4 rounded-xl text-base md:text-lg transition-all shadow-[4px_4px_0px_#1e0533] hover:shadow-none hover:translate-x-[4px] hover:translate-y-[4px] flex justify-center items-center gap-2">
                                                <span className="text-xl">📲</span> ENTRAR NO GRUPO VIP
                                            </button>
                                        </a>
                                    </div>
                                ) : (
                                    <>
                                        <div className="flex flex-col sm:flex-row gap-3">
                                            <input 
                                                type="text" 
                                                required placeholder="Seu nome"
                                                value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                                                className="w-full bg-white text-black px-4 py-3 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-[#FFD54F]"
                                            />
                                            <input 
                                                type="tel" 
                                                required placeholder="Seu WhatsApp"
                                                value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})}
                                                className="w-full bg-white text-black px-4 py-3 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-[#FFD54F]"
                                            />
                                        </div>
                                        <input 
                                            type="email" 
                                            required placeholder="Seu e-mail"
                                            value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})}
                                            className="w-full bg-white text-black px-4 py-3 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-[#FFD54F]"
                                        />
                                        
                                        {submitStatus === 'error' && <p className="text-red-400 text-xs text-center">Erro ao cadastrar. Tente novamente.</p>}
                                        {submitStatus === 'duplicate' && (
                                            <div className="bg-yellow-500/20 border border-yellow-500 text-white p-4 rounded-xl text-center mt-2">
                                                <p className="font-bold text-sm mb-1">⚠️ Você já está cadastrado na Lista VIP.</p>
                                                <p className="text-xs opacity-90">Fique tranquilo, entraremos em contato quando houver novidades da 2ª edição.</p>
                                            </div>
                                        )}

                                        <button 
                                            type="submit" disabled={isSubmitting}
                                            className="w-full bg-[#FFD54F] hover:bg-[#ffb703] text-[#3B0964] font-black py-4 rounded-xl text-base md:text-lg transition-all shadow-[4px_4px_0px_#1e0533] active:shadow-none active:translate-x-[4px] active:translate-y-[4px] mt-4 flex justify-center items-center gap-2"
                                        >
                                            <span className="text-xl">🚀</span> {isSubmitting ? 'ENVIANDO...' : 'ENTRAR NA LISTA VIP!'}
                                        </button>
                                        <p className="text-center text-[9px] text-white/50 mt-2 flex items-center justify-center gap-1">
                                            <span className="material-symbols-outlined text-[10px]">lock</span> Seus dados estão seguros e não serão compartilhados.
                                        </p>
                                    </>
                                )}
                            </form>
                        </div>
                    </div>
                </div>
            </section>

            {/* Galeria Destacada */}
            <section className="py-20 bg-[#152e1a] border-t border-white/10">
                <div className="container mx-auto px-4 text-center mb-10">
                    <div className="flex items-center justify-center gap-4 mb-4">
                        <span className="text-[#FFD54F]">⇌</span>
                        <h2 className="font-display font-black text-3xl md:text-4xl text-white tracking-wide">
                            REVIVA OS MELHORES MOMENTOS
                        </h2>
                        <span className="text-[#FFD54F]">⇌</span>
                    </div>
                    <p className="text-white/70 max-w-2xl mx-auto">
                        Veja um pouco do que rolou na 1ª Edição. Prepare-se, porque a próxima será inesquecível!
                    </p>
                </div>
                
                <div className="container mx-auto px-4">
                    {galleryPreview.length > 0 ? (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {galleryPreview.map((img) => (
                                <Link to="/galeria" key={img.id} className="group relative aspect-square overflow-hidden rounded-2xl border-4 border-[#FFD54F]/20 hover:border-[#FFD54F] transition-colors">
                                    <img src={img.url} alt="Galeria" className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700" />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <span className="text-white font-bold bg-[#3B0964]/80 px-4 py-2 rounded-full backdrop-blur-sm">Ampliar</span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div className="flex justify-center">
                            <div className="w-full max-w-4xl h-64 bg-black/20 rounded-2xl animate-pulse flex items-center justify-center border border-white/10">
                                <span className="text-white/50">Carregando memórias...</span>
                            </div>
                        </div>
                    )}
                    <div className="text-center mt-10">
                        <Link to="/galeria" className="inline-block bg-white text-[#152e1a] px-8 py-3 rounded-full font-bold hover:bg-[#FFD54F] hover:text-[#3B0964] transition-colors shadow-lg">
                            VER ÁLBUM COMPLETO DA 1ª EDIÇÃO
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Arraia2026PreLaunch;
