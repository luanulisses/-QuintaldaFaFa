import React from 'react';

const Dashboard: React.FC = () => {
    return (
        <>
            {/* Top App Bar */}
            <header className="sticky top-0 z-50 flex items-center justify-between px-4 py-3 bg-white/80 dark:bg-background-dark/80 backdrop-blur-md border-b border-earth-200 dark:border-earth-800">
                <button className="p-2 -ml-2 rounded-full hover:bg-earth-100 dark:hover:bg-earth-800 text-earth-800 dark:text-white transition-colors">
                    <span className="material-symbols-outlined">menu</span>
                </button>
                <h1 className="text-lg font-bold text-earth-800 dark:text-white tracking-tight">Quintal da Fafá</h1>
                <button className="relative p-2 -mr-2 rounded-full hover:bg-earth-100 dark:hover:bg-earth-800 text-earth-800 dark:text-white transition-colors">
                    <span className="material-symbols-outlined">notifications</span>
                    <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 border-2 border-white dark:border-background-dark rounded-full"></span>
                </button>
            </header>

            {/* Welcome Header */}
            <div className="px-5 pt-6 pb-4">
                <p className="text-earth-600 dark:text-earth-200 text-sm font-medium mb-1">Visão Geral</p>
                <h2 className="text-3xl font-extrabold text-earth-800 dark:text-white leading-tight">Bom dia, <span className="text-primary">Fafá</span></h2>
            </div>

            {/* KPI Horizontal Scroll */}
            <div className="w-full overflow-x-auto no-scrollbar pb-6 pl-5 pr-5">
                <div className="flex gap-4 w-max">
                    {/* Card 1: New Leads */}
                    <div className="bg-white dark:bg-earth-800/50 p-5 rounded-2xl shadow-sm border border-earth-200 dark:border-earth-800 w-[260px] flex flex-col justify-between h-[160px] relative overflow-hidden group">
                        <div className="absolute right-0 top-0 p-4 opacity-10">
                            <span className="material-symbols-outlined text-6xl text-primary">groups</span>
                        </div>
                        <div className="flex justify-between items-start z-10">
                            <div className="p-2 bg-primary/10 rounded-lg text-primary">
                                <span className="material-symbols-outlined">person_add</span>
                            </div>
                            <span className="bg-primary/10 text-primary text-xs font-bold px-2 py-1 rounded-full">+16%</span>
                        </div>
                        <div className="z-10">
                            <p className="text-3xl font-bold text-earth-800 dark:text-white mb-1">12</p>
                            <p className="text-sm text-earth-600 dark:text-earth-200 font-medium">Novos Leads</p>
                            <p className="text-xs text-earth-500 dark:text-earth-400 mt-1">+2 essa semana</p>
                        </div>
                    </div>
                    {/* Card 2: Confirmed Events */}
                    <div className="bg-white dark:bg-earth-800/50 p-5 rounded-2xl shadow-sm border border-earth-200 dark:border-earth-800 w-[260px] flex flex-col justify-between h-[160px] relative overflow-hidden">
                        <div className="absolute right-0 top-0 p-4 opacity-10">
                            <span className="material-symbols-outlined text-6xl text-orange-500">event_available</span>
                        </div>
                        <div className="flex justify-between items-start z-10">
                            <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg text-orange-600 dark:text-orange-400">
                                <span className="material-symbols-outlined">celebration</span>
                            </div>
                        </div>
                        <div className="z-10">
                            <p className="text-3xl font-bold text-earth-800 dark:text-white mb-1">4</p>
                            <p className="text-sm text-earth-600 dark:text-earth-200 font-medium">Eventos Confirmados</p>
                            <p className="text-xs text-earth-500 dark:text-earth-400 mt-1">Este mês</p>
                        </div>
                    </div>
                    {/* Card 3: Cash Flow */}
                    <div className="bg-white dark:bg-earth-800/50 p-5 rounded-2xl shadow-sm border border-earth-200 dark:border-earth-800 w-[260px] flex flex-col justify-between h-[160px] relative overflow-hidden">
                        <div className="absolute right-0 top-0 p-4 opacity-10">
                            <span className="material-symbols-outlined text-6xl text-blue-500">payments</span>
                        </div>
                        <div className="flex justify-between items-start z-10">
                            <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
                                <span className="material-symbols-outlined">attach_money</span>
                            </div>
                        </div>
                        <div className="z-10">
                            <p className="text-3xl font-bold text-earth-800 dark:text-white mb-1">R$ 15k</p>
                            <p className="text-sm text-earth-600 dark:text-earth-200 font-medium">Receita Estimada</p>
                            <p className="text-xs text-earth-500 dark:text-earth-400 mt-1">Despesas: R$ 4k</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Alert Section */}
            <div className="px-5 mb-8">
                <div className="bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-900/30 rounded-xl p-4 flex items-start gap-3 shadow-sm">
                    <div className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-500 p-2 rounded-full shrink-0">
                        <span className="material-symbols-outlined text-[20px]">warning</span>
                    </div>
                    <div className="flex-1">
                        <h3 className="text-earth-800 dark:text-white font-bold text-sm mb-1">Atenção Financeira</h3>
                        <p className="text-earth-600 dark:text-earth-300 text-sm leading-relaxed mb-3">Existem <span className="font-bold text-earth-800 dark:text-white">2 pagamentos pendentes</span> para eventos confirmados em Outubro.</p>
                        <button className="text-xs font-bold text-earth-800 bg-white border border-earth-200 px-3 py-1.5 rounded-lg shadow-sm active:scale-95 transition-transform">Ver Detalhes</button>
                    </div>
                </div>
            </div>

            {/* Upcoming Schedule */}
            <div className="px-5 pb-8">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-earth-800 dark:text-white">Agenda Próxima</h3>
                    <button className="text-primary text-sm font-semibold hover:underline">Ver tudo</button>
                </div>
                <div className="flex flex-col gap-3">
                    {/* Event Item 1 */}
                    <div className="group bg-white dark:bg-earth-800/40 rounded-xl p-4 border border-earth-100 dark:border-earth-800 shadow-sm flex gap-4 items-center">
                        <div className="flex flex-col items-center justify-center bg-earth-100 dark:bg-earth-800 w-14 h-14 rounded-lg shrink-0">
                            <span className="text-xs font-bold text-earth-500 uppercase">Hoje</span>
                            <span className="text-lg font-extrabold text-earth-800 dark:text-white">14</span>
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-[10px] font-bold uppercase tracking-wide">Visita Técnica</span>
                            </div>
                            <h4 className="text-earth-900 dark:text-white font-bold truncate">Casamento Maria & João</h4>
                            <div className="flex items-center gap-1 text-earth-500 dark:text-earth-400 text-xs mt-1">
                                <span className="material-symbols-outlined text-[14px]">schedule</span>
                                <span>14:00 - 15:30</span>
                            </div>
                        </div>
                        <button className="text-earth-400 hover:text-primary transition-colors">
                            <span className="material-symbols-outlined">chevron_right</span>
                        </button>
                    </div>
                    {/* Event Item 2 */}
                    <div className="group bg-white dark:bg-earth-800/40 rounded-xl p-4 border border-earth-100 dark:border-earth-800 shadow-sm flex gap-4 items-center">
                        <div className="flex flex-col items-center justify-center bg-earth-100 dark:bg-earth-800 w-14 h-14 rounded-lg shrink-0">
                            <span className="text-xs font-bold text-earth-500 uppercase">Amanhã</span>
                            <span className="text-lg font-extrabold text-earth-800 dark:text-white">16</span>
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary-dark dark:text-primary text-[10px] font-bold uppercase tracking-wide">Evento</span>
                            </div>
                            <h4 className="text-earth-900 dark:text-white font-bold truncate">Aniversário Pedro 5 Anos</h4>
                            <div className="flex items-center gap-1 text-earth-500 dark:text-earth-400 text-xs mt-1">
                                <span className="material-symbols-outlined text-[14px]">schedule</span>
                                <span>16:00 - 20:00</span>
                            </div>
                        </div>
                        <button className="text-earth-400 hover:text-primary transition-colors">
                            <span className="material-symbols-outlined">chevron_right</span>
                        </button>
                    </div>
                    {/* Event Item 3 */}
                    <div className="group bg-white dark:bg-earth-800/40 rounded-xl p-4 border border-earth-100 dark:border-earth-800 shadow-sm flex gap-4 items-center opacity-80">
                        <div className="flex flex-col items-center justify-center bg-earth-100 dark:bg-earth-800 w-14 h-14 rounded-lg shrink-0">
                            <span className="text-xs font-bold text-earth-500 uppercase">Sáb</span>
                            <span className="text-lg font-extrabold text-earth-800 dark:text-white">21</span>
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-[10px] font-bold uppercase tracking-wide">Degustação</span>
                            </div>
                            <h4 className="text-earth-900 dark:text-white font-bold truncate">Noivos Lucas e Ana</h4>
                            <div className="flex items-center gap-1 text-earth-500 dark:text-earth-400 text-xs mt-1">
                                <span className="material-symbols-outlined text-[14px]">schedule</span>
                                <span>11:00 - 12:30</span>
                            </div>
                        </div>
                        <button className="text-earth-400 hover:text-primary transition-colors">
                            <span className="material-symbols-outlined">chevron_right</span>
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default Dashboard;