import React, { useState } from 'react';

const Calendar: React.FC = () => {
    const [selectedDay, setSelectedDay] = useState<number>(23);

    const days = [
        { d: 20, w: 'S' }, { d: 21, w: 'S' }, { d: 22, w: 'D' }, 
        { d: 23, w: 'S' }, { d: 24, w: 'T' }, { d: 25, w: 'Q' }, 
        { d: 26, w: 'Q' }, { d: 27, w: 'S' }
    ];

    return (
        <div className="flex flex-col min-h-screen">
             <div className="sticky top-0 z-20 bg-surface-light/95 dark:bg-surface-dark/95 backdrop-blur-sm border-b border-slate-100 dark:border-slate-800 px-5 pt-12 pb-4 flex items-center justify-between">
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Agenda</h1>
                <button className="bg-primary hover:bg-primary-dark text-white rounded-full p-2 w-10 h-10 flex items-center justify-center transition-colors shadow-lg shadow-primary/30">
                    <span className="material-symbols-outlined text-[24px]">add</span>
                </button>
            </div>
            <div className="bg-surface-light dark:bg-surface-dark p-5 pb-2">
                <div className="flex items-center justify-between mb-4">
                    <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-600 dark:text-slate-400">
                        <span className="material-symbols-outlined">chevron_left</span>
                    </button>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">Outubro 2023</h2>
                    <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-600 dark:text-slate-400">
                        <span className="material-symbols-outlined">chevron_right</span>
                    </button>
                </div>
                
                {/* Calendar Grid Mockup - Simplified for visual match */}
                 <div className="grid grid-cols-7 gap-y-2 mb-2">
                    {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((day, i) => (
                        <div key={i} className="text-center text-xs font-semibold text-slate-400 uppercase tracking-wide py-2">{day}</div>
                    ))}
                    
                    {/* Previous month filler */}
                    {[28, 29, 30].map(d => (
                         <button key={d} className="h-9 w-9 mx-auto flex items-center justify-center rounded-full text-sm text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">{d}</button>
                    ))}

                    {/* Current month */}
                    {Array.from({length: 31}, (_, i) => i + 1).map(d => {
                        const isSelected = d === selectedDay;
                        const hasDot = [3, 8, 17, 24].includes(d);
                        
                        return (
                             <button 
                                key={d} 
                                onClick={() => setSelectedDay(d)}
                                className={`h-9 w-9 mx-auto flex items-center justify-center rounded-full text-sm font-medium transition-colors relative 
                                    ${isSelected ? 'bg-primary text-white shadow-md shadow-primary/30 font-bold' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                             >
                                {d}
                                {hasDot && !isSelected && <span className="absolute bottom-1 w-1 h-1 bg-primary rounded-full"></span>}
                            </button>
                        )
                    })}
                     <button className="h-9 w-9 mx-auto flex items-center justify-center rounded-full text-sm text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">1</button>
                </div>
                <div className="flex justify-center mt-2">
                    <div className="h-1 w-10 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
                </div>
            </div>

            <div className="flex-1 bg-background-light dark:bg-background-dark pt-2">
                <div className="px-5 py-3 overflow-x-auto no-scrollbar flex gap-2.5 sticky top-0 z-10 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-sm">
                    <button className="whitespace-nowrap px-4 py-1.5 rounded-full bg-slate-800 dark:bg-white text-white dark:text-slate-900 text-sm font-semibold shadow-sm transition-transform active:scale-95">Todos</button>
                    <button className="whitespace-nowrap px-4 py-1.5 rounded-full bg-white dark:bg-surface-dark text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-sm font-medium transition-transform active:scale-95">Visitas</button>
                    <button className="whitespace-nowrap px-4 py-1.5 rounded-full bg-white dark:bg-surface-dark text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-sm font-medium transition-transform active:scale-95">Eventos</button>
                    <button className="whitespace-nowrap px-4 py-1.5 rounded-full bg-white dark:bg-surface-dark text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-sm font-medium transition-transform active:scale-95">Interno</button>
                </div>
                
                <div className="px-5 pb-6 space-y-6">
                    <div className="animate-fade-in">
                        <div className="flex items-center gap-2 mb-3">
                            <h3 className="text-base font-bold text-slate-900 dark:text-white">Segunda, 23 de Out</h3>
                            <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-md">Hoje</span>
                        </div>
                        <div className="space-y-3 relative">
                            <div className="absolute left-[3.75rem] top-2 bottom-2 w-px bg-slate-200 dark:bg-slate-700 z-0 hidden sm:block"></div>
                            
                            {/* Event 1 */}
                            <div className="bg-surface-light dark:bg-surface-dark p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 relative z-10">
                                <div className="flex items-start gap-4">
                                    <div className="flex flex-col items-center min-w-[3.5rem] pt-1">
                                        <span className="text-sm font-bold text-slate-900 dark:text-white">10:00</span>
                                        <span className="text-[10px] text-slate-500 font-medium uppercase">AM</span>
                                    </div>
                                    <div className="w-px self-stretch bg-slate-100 dark:bg-slate-700 mx-1 hidden sm:block"></div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start mb-1">
                                            <h4 className="text-base font-bold text-slate-900 dark:text-white truncate pr-2">Maria Silva</h4>
                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-[#6d974e]/10 text-[#6d974e] dark:text-[#8ab866] dark:bg-[#6d974e]/20 border border-[#6d974e]/20">
                                                VISITA AGENDADA
                                            </span>
                                        </div>
                                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-2 truncate">Planejamento de Casamento - Primeira Visita</p>
                                        <div className="flex items-center gap-3 text-xs text-slate-400 dark:text-slate-500">
                                            <div className="flex items-center gap-1">
                                                <span className="material-symbols-outlined text-[14px]">schedule</span>
                                                <span>45 min</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <span className="material-symbols-outlined text-[14px]">person</span>
                                                <span>2 Convidados</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Event 2 */}
                             <div className="bg-surface-light dark:bg-surface-dark p-4 rounded-xl shadow-sm border-l-4 border-l-orange-400 border-t border-r border-b border-slate-100 dark:border-slate-800 relative z-10">
                                <div className="flex items-start gap-4">
                                    <div className="flex flex-col items-center min-w-[3.5rem] pt-1">
                                        <span className="text-sm font-bold text-slate-900 dark:text-white">14:00</span>
                                        <span className="text-[10px] text-slate-500 font-medium uppercase">PM</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start mb-1">
                                            <h4 className="text-base font-bold text-slate-900 dark:text-white truncate pr-2">João's 5th Birthday</h4>
                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border border-orange-200 dark:border-orange-800">
                                                RESERVADO
                                            </span>
                                        </div>
                                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-2 truncate">Salão Principal • Pacote Festa Infantil</p>
                                        <div className="flex items-center gap-3 text-xs text-slate-400 dark:text-slate-500">
                                            <div className="flex items-center gap-1">
                                                <span className="material-symbols-outlined text-[14px]">schedule</span>
                                                <span>4h 00m</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <span className="material-symbols-outlined text-[14px]">group</span>
                                                <span>50 Convidados</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Calendar;