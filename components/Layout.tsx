import React from 'react';
import { ViewState } from '../types';

interface LayoutProps {
    children: React.ReactNode;
    currentView: ViewState;
    onChangeView: (view: ViewState) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, currentView, onChangeView }) => {
    return (
        <div className="w-full max-w-md mx-auto bg-background-light dark:bg-background-dark min-h-screen flex flex-col relative shadow-2xl overflow-hidden">
            {/* Main Content Area */}
            <main className="flex-1 overflow-y-auto no-scrollbar pb-24">
                {children}
            </main>

            {/* Bottom Navigation */}
            <nav className="absolute bottom-0 w-full bg-white dark:bg-surface-dark border-t border-gray-100 dark:border-gray-800 px-4 pb-6 pt-3 z-40">
                <div className="flex justify-between items-center">
                    <button 
                        onClick={() => onChangeView(ViewState.DASHBOARD)}
                        className={`flex flex-1 flex-col items-center justify-end gap-1 transition-colors ${currentView === ViewState.DASHBOARD ? 'text-primary' : 'text-text-secondary dark:text-gray-400 hover:text-primary'}`}
                    >
                        <div className="flex h-6 items-center justify-center">
                            <span className={`material-symbols-outlined ${currentView === ViewState.DASHBOARD ? 'filled' : ''}`}>dashboard</span>
                        </div>
                        <p className={`text-[10px] font-medium leading-normal tracking-wide ${currentView === ViewState.DASHBOARD ? 'font-bold' : ''}`}>Início</p>
                    </button>

                    <button 
                         onClick={() => onChangeView(ViewState.CALENDAR)}
                         className={`flex flex-1 flex-col items-center justify-end gap-1 transition-colors ${currentView === ViewState.CALENDAR ? 'text-primary' : 'text-text-secondary dark:text-gray-400 hover:text-primary'}`}
                    >
                        <div className="flex h-6 items-center justify-center">
                            <span className={`material-symbols-outlined ${currentView === ViewState.CALENDAR ? 'filled' : ''}`}>calendar_month</span>
                        </div>
                        <p className={`text-[10px] font-medium leading-normal tracking-wide ${currentView === ViewState.CALENDAR ? 'font-bold' : ''}`}>Agenda</p>
                    </button>

                    {/* Floating Add Button Placeholder - visual center */}
                    <div className="w-12"></div> 

                    <button 
                         onClick={() => onChangeView(ViewState.FINANCIAL)}
                         className={`flex flex-1 flex-col items-center justify-end gap-1 transition-colors ${currentView === ViewState.FINANCIAL ? 'text-primary' : 'text-text-secondary dark:text-gray-400 hover:text-primary'}`}
                    >
                        <div className="flex h-6 items-center justify-center">
                            <span className={`material-symbols-outlined ${currentView === ViewState.FINANCIAL ? 'filled' : ''}`}>attach_money</span>
                        </div>
                        <p className={`text-[10px] font-medium leading-normal tracking-wide ${currentView === ViewState.FINANCIAL ? 'font-bold' : ''}`}>Fluxo</p>
                    </button>

                    <button 
                         onClick={() => onChangeView(ViewState.LEADS)}
                         className={`flex flex-1 flex-col items-center justify-end gap-1 transition-colors ${currentView === ViewState.LEADS ? 'text-primary' : 'text-text-secondary dark:text-gray-400 hover:text-primary'}`}
                    >
                        <div className="flex h-6 items-center justify-center">
                            <span className={`material-symbols-outlined ${currentView === ViewState.LEADS ? 'filled' : ''}`}>person</span>
                        </div>
                        <p className={`text-[10px] font-medium leading-normal tracking-wide ${currentView === ViewState.LEADS ? 'font-bold' : ''}`}>Leads</p>
                    </button>
                </div>
            </nav>

            {/* Central Floating Action Button */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-50">
                <button className="bg-primary hover:bg-primary-dark text-white rounded-full w-14 h-14 flex items-center justify-center shadow-lg shadow-primary/40 transition-all active:scale-95">
                    <span className="material-symbols-outlined text-3xl">add</span>
                </button>
            </div>
        </div>
    );
};

export default Layout;