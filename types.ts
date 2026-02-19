export enum ViewState {
    LANDING = 'LANDING',
    DASHBOARD = 'DASHBOARD',
    CALENDAR = 'CALENDAR',
    FINANCIAL = 'FINANCIAL',
    LEADS = 'LEADS',
}

export interface Lead {
    id: number;
    name: string;
    type: 'Novos' | 'Proposta enviada' | 'Em negociação' | 'Fechado';
    eventType: string;
    date: string;
    guests: string;
    budget: string;
    timeAgo?: string;
}

export interface Transaction {
    id: number;
    title: string;
    category: string;
    amount: number;
    type: 'income' | 'expense';
    status: 'REALIZADO' | 'PLANEJADO';
    date: string;
    time: string;
    method: string;
}

export interface CalendarEvent {
    id: number;
    title: string;
    time: string;
    type: 'VISITA AGENDADA' | 'RESERVADO' | 'INTERNO' | 'CONFIRMADO';
    description: string;
    details: string[];
    date: number; // Day of month
}