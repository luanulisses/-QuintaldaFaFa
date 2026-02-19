import React, { useState } from 'react';

const Leads: React.FC = () => {
    const [filter, setFilter] = useState('Todos');

    const filters = [
        { name: 'Todos', count: null },
        { name: 'Novos', count: 3 },
        { name: 'Em negociação', count: null },
        { name: 'Proposta enviada', count: null },
        { name: 'Fechado', count: null },
    ];

    return (
        <div className="flex flex-col min-h-screen">
             <header className="flex-none pt-12 pb-2 px-4 bg-white dark:bg-[#1e2a16] border-b border-gray-100 dark:border-gray-800 shadow-sm z-10 sticky top-0">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white leading-tight">Orçamentos e Leads</h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Gerencie as solicitações recebidas</p>
                    </div>
                    <button className="flex items-center justify-center w-10 h-10 rounded-full bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/30 transition-all">
                        <span className="material-symbols-outlined font-bold">add</span>
                    </button>
                </div>
                <div className="relative mb-3">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="material-symbols-outlined text-slate-400">search</span>
                    </div>
                    <input className="block w-full pl-10 pr-3 py-2.5 border-none rounded-xl bg-slate-100 dark:bg-[#2a3820] text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow" placeholder="Buscar por nome, e-mail ou evento..." type="text"/>
                </div>
            </header>

            <div className="flex-none bg-white dark:bg-[#1e2a16] pb-3 px-4 border-b border-gray-50 dark:border-gray-800 overflow-x-auto hide-scrollbar">
                <div className="flex space-x-2">
                    {filters.map(f => (
                         <button 
                            key={f.name}
                            onClick={() => setFilter(f.name)}
                            className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors
                                ${filter === f.name 
                                    ? 'bg-primary text-white shadow-sm' 
                                    : 'bg-slate-100 dark:bg-[#2a3820] text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-[#354629] font-medium'}`}
                        >
                            {f.name}
                            {f.count && <span className="ml-1 bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full text-[10px]">{f.count}</span>}
                        </button>
                    ))}
                </div>
            </div>

            <main className="flex-1 overflow-y-auto p-4 pb-8 space-y-4">
                {/* Lead 1 */}
                <article className="bg-white dark:bg-[#1e2a16] rounded-xl p-4 shadow-sm border border-slate-100 dark:border-slate-800 relative group overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-orange-500 rounded-l-xl"></div>
                    <div className="flex justify-between items-start mb-3 pl-2">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-bold text-slate-900 dark:text-white text-lg">Maria Silva</h3>
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300 uppercase tracking-wide">
                                    Novos
                                </span>
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                <span className="material-symbols-outlined text-[14px] filled">schedule</span> Recebido há 2 horas
                            </p>
                        </div>
                        <button className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                            <span className="material-symbols-outlined">more_vert</span>
                        </button>
                    </div>
                    <div className="grid grid-cols-2 gap-y-3 gap-x-4 pl-2 mb-4">
                        <div className="flex items-start gap-2">
                            <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400">
                                <span className="material-symbols-outlined text-[18px]">celebration</span>
                            </div>
                            <div>
                                <p className="text-[10px] uppercase text-slate-400 font-semibold tracking-wider">Tipo de Evento</p>
                                <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Aniversário</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-2">
                            <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400">
                                <span className="material-symbols-outlined text-[18px]">calendar_month</span>
                            </div>
                            <div>
                                <p className="text-[10px] uppercase text-slate-400 font-semibold tracking-wider">Data</p>
                                <p className="text-sm font-medium text-slate-700 dark:text-slate-200">24 Out, 2023</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-2">
                            <div className="p-1.5 rounded-lg bg-pink-50 dark:bg-pink-900/20 text-pink-600 dark:text-pink-400">
                                <span className="material-symbols-outlined text-[18px]">group</span>
                            </div>
                            <div>
                                <p className="text-[10px] uppercase text-slate-400 font-semibold tracking-wider">Convidados</p>
                                <p className="text-sm font-medium text-slate-700 dark:text-slate-200">~50 Pessoas</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-2">
                             <div className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400">
                                <span className="material-symbols-outlined text-[18px]">attach_money</span>
                            </div>
                            <div>
                                <p className="text-[10px] uppercase text-slate-400 font-semibold tracking-wider">Orçamento</p>
                                <p className="text-sm font-medium text-slate-700 dark:text-slate-200">R$ 5k - 8k</p>
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-3 pl-2">
                        <button className="flex-1 flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20bd5a] text-white py-2.5 px-3 rounded-lg text-sm font-semibold transition-colors shadow-sm shadow-green-200 dark:shadow-none">
                            <span className="material-symbols-outlined text-[18px]">chat</span>
                            WhatsApp
                        </button>
                        <button className="flex-1 flex items-center justify-center gap-2 bg-slate-100 dark:bg-[#2a3820] hover:bg-slate-200 text-slate-700 dark:text-slate-200 py-2.5 px-3 rounded-lg text-sm font-semibold transition-colors border border-slate-200 dark:border-slate-700">
                            <span className="material-symbols-outlined text-[18px]">event_available</span>
                            Converter
                        </button>
                    </div>
                </article>

                {/* Lead 2 */}
                <article className="bg-white dark:bg-[#1e2a16] rounded-xl p-4 shadow-sm border border-slate-100 dark:border-slate-800 relative group overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-blue-500 rounded-l-xl"></div>
                    <div className="flex justify-between items-start mb-3 pl-2">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-bold text-slate-900 dark:text-white text-lg">Carlos Ferreira</h3>
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 uppercase tracking-wide">
                                    Proposta enviada
                                </span>
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                <span className="material-symbols-outlined text-[14px]">history</span> Atualizado ontem
                            </p>
                        </div>
                        <button className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                            <span className="material-symbols-outlined">more_vert</span>
                        </button>
                    </div>
                    <div className="grid grid-cols-2 gap-y-3 gap-x-4 pl-2 mb-4">
                         <div className="flex items-start gap-2">
                            <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400">
                                <span className="material-symbols-outlined text-[18px]">diversity_3</span>
                            </div>
                            <div>
                                <p className="text-[10px] uppercase text-slate-400 font-semibold tracking-wider">Tipo de Evento</p>
                                <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Casamento</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-2">
                            <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400">
                                <span className="material-symbols-outlined text-[18px]">calendar_month</span>
                            </div>
                            <div>
                                <p className="text-[10px] uppercase text-slate-400 font-semibold tracking-wider">Data</p>
                                <p className="text-sm font-medium text-slate-700 dark:text-slate-200">12 Nov, 2023</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-2">
                            <div className="p-1.5 rounded-lg bg-pink-50 dark:bg-pink-900/20 text-pink-600 dark:text-pink-400">
                                <span className="material-symbols-outlined text-[18px]">group</span>
                            </div>
                            <div>
                                <p className="text-[10px] uppercase text-slate-400 font-semibold tracking-wider">Convidados</p>
                                <p className="text-sm font-medium text-slate-700 dark:text-slate-200">120 Convidados</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-2">
                            <div className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400">
                                <span className="material-symbols-outlined text-[18px]">attach_money</span>
                            </div>
                            <div>
                                <p className="text-[10px] uppercase text-slate-400 font-semibold tracking-wider">Orçamento</p>
                                <p className="text-sm font-medium text-slate-700 dark:text-slate-200">R$ 15k+</p>
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-3 pl-2">
                        <button className="flex-1 flex items-center justify-center gap-2 bg-slate-100 dark:bg-[#2a3820] hover:bg-slate-200 text-slate-700 dark:text-slate-200 py-2.5 px-3 rounded-lg text-sm font-semibold transition-colors border border-slate-200 dark:border-slate-700">
                            <span className="material-symbols-outlined text-[18px]">chat</span>
                            Mensagem
                        </button>
                        <button className="flex-1 flex items-center justify-center gap-2 bg-primary/10 hover:bg-primary/20 text-primary dark:text-primary py-2.5 px-3 rounded-lg text-sm font-semibold transition-colors border border-primary/20">
                            <span className="material-symbols-outlined text-[18px]">visibility</span>
                            Ver Proposta
                        </button>
                    </div>
                </article>
            </main>
        </div>
    );
};

export default Leads;