import React from 'react';

const Financial: React.FC = () => {
    return (
        <>
            {/* Header */}
            <header className="px-5 pt-12 pb-4 bg-surface-light dark:bg-surface-dark flex items-center justify-between sticky top-0 z-20 shadow-sm">
                <button className="p-2 -ml-2 rounded-full hover:bg-background-light dark:hover:bg-background-dark text-text-main dark:text-white transition-colors">
                    <span className="material-symbols-outlined">arrow_back</span>
                </button>
                <div className="flex flex-col items-center">
                    <h1 className="text-lg font-bold">Fluxo de Caixa</h1>
                    <div className="flex items-center gap-1 text-sm text-text-secondary cursor-pointer">
                        <span>Outubro 2023</span>
                        <span className="material-symbols-outlined text-[16px]">expand_more</span>
                    </div>
                </div>
                <button className="p-2 -mr-2 rounded-full hover:bg-background-light dark:hover:bg-background-dark text-text-main dark:text-white transition-colors">
                    <span className="material-symbols-outlined">more_vert</span>
                </button>
            </header>

            {/* Summary Cards Carousel */}
            <div className="p-5 overflow-x-auto hide-scrollbar flex gap-4 snap-x snap-mandatory">
                {/* Balance Card */}
                <div className="snap-center shrink-0 w-full bg-gradient-to-br from-[#1e2a16] to-[#0f140b] text-white rounded-2xl p-6 shadow-soft relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
                    <div className="relative z-10">
                        <p className="text-sm font-medium text-gray-300 mb-1">Saldo Atual</p>
                        <h2 className="text-3xl font-bold tracking-tight mb-4">R$ 15.400,00</h2>
                        <div className="flex items-center gap-2">
                            <span className="bg-primary/20 text-primary px-2 py-0.5 rounded text-xs font-semibold">+12%</span>
                            <span className="text-xs text-gray-400">vs. mês anterior</span>
                        </div>
                    </div>
                </div>
                {/* Inflow Card */}
                <div className="snap-center shrink-0 w-[85%] bg-white dark:bg-surface-dark rounded-2xl p-6 shadow-card border border-gray-100 dark:border-gray-800">
                    <div className="flex items-start justify-between mb-4">
                        <div className="p-2 bg-primary/10 rounded-lg text-primary">
                            <span className="material-symbols-outlined">arrow_downward</span>
                        </div>
                        <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded-full">+8%</span>
                    </div>
                    <p className="text-sm font-medium text-text-secondary dark:text-gray-400">Entradas</p>
                    <h2 className="text-2xl font-bold text-text-main dark:text-white">R$ 20.000,00</h2>
                    <div className="w-full bg-gray-100 dark:bg-gray-700 h-1.5 rounded-full mt-3 overflow-hidden">
                        <div className="bg-primary h-full rounded-full" style={{ width: '75%' }}></div>
                    </div>
                </div>
                {/* Outflow Card */}
                <div className="snap-center shrink-0 w-[85%] bg-white dark:bg-surface-dark rounded-2xl p-6 shadow-card border border-gray-100 dark:border-gray-800">
                    <div className="flex items-start justify-between mb-4">
                        <div className="p-2 bg-danger/10 rounded-lg text-danger">
                            <span className="material-symbols-outlined">arrow_upward</span>
                        </div>
                        <span className="text-xs font-medium text-danger bg-danger/10 px-2 py-1 rounded-full">+2%</span>
                    </div>
                    <p className="text-sm font-medium text-text-secondary dark:text-gray-400">Saídas</p>
                    <h2 className="text-2xl font-bold text-text-main dark:text-white">R$ 4.600,00</h2>
                    <div className="w-full bg-gray-100 dark:bg-gray-700 h-1.5 rounded-full mt-3 overflow-hidden">
                        <div className="bg-danger h-full rounded-full" style={{ width: '25%' }}></div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="px-5 mb-4">
                <h3 className="text-lg font-bold text-text-main dark:text-white mb-3">Transações Recentes</h3>
                <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-2">
                    <button className="px-4 py-2 rounded-full bg-text-main text-white text-sm font-medium shadow-sm whitespace-nowrap">
                        Todos
                    </button>
                    <button className="px-4 py-2 rounded-full bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-700 text-text-secondary dark:text-gray-300 text-sm font-medium whitespace-nowrap">
                        Entradas
                    </button>
                    <button className="px-4 py-2 rounded-full bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-700 text-text-secondary dark:text-gray-300 text-sm font-medium whitespace-nowrap">
                        Saídas
                    </button>
                    <button className="px-4 py-2 rounded-full bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-700 text-text-secondary dark:text-gray-300 text-sm font-medium whitespace-nowrap">
                        Planejado
                    </button>
                </div>
            </div>

            {/* Transaction List */}
            <div className="px-5 flex flex-col gap-3 pb-8">
                {/* Date Group */}
                <div className="text-xs font-semibold text-text-secondary dark:text-gray-500 mt-2 mb-1 uppercase tracking-wider">Hoje</div>
                {/* Item 1: Revenue */}
                <div className="bg-white dark:bg-surface-dark p-4 rounded-xl shadow-card flex items-center justify-between group active:scale-[0.98] transition-transform">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                            <span className="material-symbols-outlined text-[20px]">point_of_sale</span>
                        </div>
                        <div>
                            <p className="font-semibold text-text-main dark:text-white text-sm">Vendas de Sábado</p>
                            <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-xs text-text-secondary dark:text-gray-400">Cartão</span>
                                <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                                <span className="text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20">REALIZADO</span>
                            </div>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="font-bold text-primary text-sm">+ R$ 3.200,00</p>
                        <p className="text-xs text-text-secondary dark:text-gray-400">14:30</p>
                    </div>
                </div>
                {/* Item 2: Expense */}
                <div className="bg-white dark:bg-surface-dark p-4 rounded-xl shadow-card flex items-center justify-between group active:scale-[0.98] transition-transform">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-600 dark:text-orange-400 shrink-0">
                            <span className="material-symbols-outlined text-[20px]">local_shipping</span>
                        </div>
                        <div>
                            <p className="font-semibold text-text-main dark:text-white text-sm">Fornecedor de Bebidas</p>
                            <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-xs text-text-secondary dark:text-gray-400">Pix</span>
                                <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                                <span className="text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20">REALIZADO</span>
                            </div>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="font-bold text-text-main dark:text-white text-sm">- R$ 450,00</p>
                        <p className="text-xs text-text-secondary dark:text-gray-400">09:15</p>
                    </div>
                </div>
                {/* Date Group */}
                <div className="text-xs font-semibold text-text-secondary dark:text-gray-500 mt-4 mb-1 uppercase tracking-wider">Amanhã</div>
                {/* Item 3: Planned Expense */}
                <div className="bg-white dark:bg-surface-dark p-4 rounded-xl shadow-card flex items-center justify-between opacity-80 group active:scale-[0.98] transition-transform border border-dashed border-gray-300 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                            <span className="material-symbols-outlined text-[20px]">storefront</span>
                        </div>
                        <div>
                            <p className="font-semibold text-text-main dark:text-white text-sm">Aluguel Espaço</p>
                            <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-xs text-text-secondary dark:text-gray-400">Boleto</span>
                                <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                                <span className="text-[10px] font-bold text-gray-500 bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded border border-gray-200 dark:border-gray-600">PLANEJADO</span>
                            </div>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="font-bold text-text-main dark:text-white text-sm">- R$ 2.000,00</p>
                        <p className="text-xs text-text-secondary dark:text-gray-400">Agendado</p>
                    </div>
                </div>
                {/* Item 4: Expense */}
                <div className="bg-white dark:bg-surface-dark p-4 rounded-xl shadow-card flex items-center justify-between group active:scale-[0.98] transition-transform">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400 shrink-0">
                            <span className="material-symbols-outlined text-[20px]">water_drop</span>
                        </div>
                        <div>
                            <p className="font-semibold text-text-main dark:text-white text-sm">Conta de Água</p>
                            <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-xs text-text-secondary dark:text-gray-400">Débito</span>
                                <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                                <span className="text-[10px] font-bold text-gray-500 bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded border border-gray-200 dark:border-gray-600">PLANEJADO</span>
                            </div>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="font-bold text-text-main dark:text-white text-sm">- R$ 120,00</p>
                        <p className="text-xs text-text-secondary dark:text-gray-400">Agendado</p>
                    </div>
                </div>
            </div>
        </>
    );
};

export default Financial;