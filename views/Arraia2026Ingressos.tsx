import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import ArraiaTicketCheckout from '../components/arraia2026/ArraiaTicketCheckout';

const Arraia2026Ingressos: React.FC = () => {
    // Scroll para o topo quando a página carregar
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    return (
        <div className="min-h-screen bg-[#1C053A] font-body flex flex-col">
            {/* Topo Simples */}
            <header className="bg-gradient-to-b from-[#2A0854] to-[#1C053A] pt-8 pb-12 px-4 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full opacity-30 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at top, #FFD54F 0%, transparent 50%)' }}></div>
                
                <div className="container mx-auto max-w-[800px] relative z-10">
                    <Link to="/arraia-2026" className="inline-flex items-center gap-2 text-[#FFD54F] border border-[#FFD54F]/30 hover:border-[#FFD54F] hover:bg-[#FFD54F]/10 px-4 py-2 rounded-lg font-bold text-sm transition-colors mb-8">
                        <span>←</span> VER DETALHES DO EVENTO
                    </Link>

                    <div className="text-center mb-10">
                        <div className="flex items-center justify-center gap-3 mb-4">
                            <span className="text-[#FFD54F] text-4xl transform -rotate-12">🎟️</span>
                            <h1 className="font-display font-black text-4xl md:text-5xl text-white drop-shadow-md">COMPRAR INGRESSO</h1>
                        </div>
                        <p className="text-white/80 text-lg md:text-xl font-medium max-w-lg mx-auto leading-relaxed">
                            Garanta seu ingresso para a 2ª edição da melhor festa junina de Planaltina!
                        </p>
                    </div>

                    <div className="flex flex-col md:flex-row items-stretch justify-center gap-4 text-white">
                        <div className="bg-[#2A0854] border border-white/10 rounded-xl p-4 flex items-center gap-4 flex-1">
                            <div className="w-12 h-12 rounded-lg bg-[#FFD54F]/10 flex items-center justify-center text-2xl text-[#FFD54F]">📅</div>
                            <div>
                                <span className="block font-bold text-sm">18 DE JULHO</span>
                                <span className="block text-xs text-white/60">DE 2026</span>
                            </div>
                        </div>
                        <div className="bg-[#2A0854] border border-white/10 rounded-xl p-4 flex items-center gap-4 flex-1">
                            <div className="w-12 h-12 rounded-lg bg-[#FFD54F]/10 flex items-center justify-center text-2xl text-[#FFD54F]">📍</div>
                            <div>
                                <span className="block font-bold text-sm uppercase">Planaltina</span>
                                <span className="block text-xs text-white/60 uppercase">DF</span>
                            </div>
                        </div>
                        <div className="bg-[#2A0854] border border-white/10 rounded-xl p-4 flex items-center gap-4 flex-[1.5]">
                            <div className="w-12 h-12 rounded-lg bg-[#FFD54F]/10 flex items-center justify-center text-2xl text-[#FFD54F]">🎵</div>
                            <div>
                                <span className="block font-bold text-sm uppercase">Lampião Elétrico</span>
                                <span className="block text-xs text-white/60 uppercase">+ Karlito Tremendão</span>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Conteúdo de Compra */}
            <main className="flex-1 bg-[#1C053A] px-4 pb-16 relative">
                <div className="container mx-auto max-w-[800px] relative z-10 -mt-6">
                    <ArraiaTicketCheckout />
                </div>
            </main>

            {/* Rodapé Simples / Indicadores */}
            <div className="bg-[#0B011A] pt-8 pb-12 px-4 border-t border-white/5">
                <div className="container mx-auto max-w-[800px]">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
                        <div className="flex flex-col items-center text-center gap-2">
                            <div className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center text-2xl">🛡️</div>
                            <span className="text-white font-bold text-xs uppercase tracking-wider">Compra Segura</span>
                            <span className="text-white/40 text-[10px]">Seus dados protegidos</span>
                        </div>
                        <div className="flex flex-col items-center text-center gap-2">
                            <div className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center text-2xl">📱</div>
                            <span className="text-white font-bold text-xs uppercase tracking-wider">Ingresso Digital</span>
                            <span className="text-white/40 text-[10px]">Receba por WhatsApp</span>
                        </div>
                        <div className="flex flex-col items-center text-center gap-2">
                            <div className="w-12 h-12 rounded-full border border-[#4CAF50]/30 text-[#4CAF50] flex items-center justify-center text-2xl">✅</div>
                            <span className="text-white font-bold text-xs uppercase tracking-wider">100% Garantido</span>
                            <span className="text-white/40 text-[10px]">Ambiente criptografado</span>
                        </div>
                        <div className="flex flex-col items-center text-center gap-2">
                            <div className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center text-2xl">🎧</div>
                            <span className="text-white font-bold text-xs uppercase tracking-wider">Suporte</span>
                            <span className="text-white/40 text-[10px]">Fale conosco</span>
                        </div>
                    </div>

                    <div className="bg-gradient-to-r from-[#2A0854] to-[#1C053A] border border-[#FFD54F]/20 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-center gap-6 justify-between">
                        <div className="flex items-center gap-6">
                            <span className="text-5xl drop-shadow-md">🔥</span>
                            <div>
                                <h4 className="text-[#FFD54F] font-bold text-lg mb-1">Quer saber tudo que vai rolar?</h4>
                                <p className="text-white/70 text-sm">Acesse a página completa do evento e confira atrações, cardápios, fotos da edição passada e muito mais!</p>
                            </div>
                        </div>
                        <Link to="/arraia-2026" className="w-full md:w-auto flex-shrink-0 bg-[#FFD54F] hover:bg-[#ffb703] text-[#3B0964] font-black px-6 py-3 rounded-xl transition-transform hover:scale-105 active:scale-95 text-center flex items-center justify-center gap-2">
                            VER PÁGINA COMPLETA <span>→</span>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Arraia2026Ingressos;
