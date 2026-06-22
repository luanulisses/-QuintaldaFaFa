import { useState, useEffect } from 'react';
import { supabase } from '../supabase';

export interface TicketBatch {
    id: string;
    name: string;
    price_geral: number;
    price_passaporte: number;
    active: boolean;
    max_tickets: number;
    current_sold: number;
}

export interface PurchaseData {
    customer_name: string;
    customer_email: string;
    customer_phone: string;
    total_amount: number;
    payment_method: string;
    items: {
        geral: number;
        passaporte: number;
    };
}

export function useTickets() {
    const [batches, setBatches] = useState<TicketBatch[]>([]);
    const [activeBatch, setActiveBatch] = useState<TicketBatch | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchBatches = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('arraia_ticket_batches')
                .select('*')
                .order('created_at', { ascending: true });

            if (error) throw error;
            
            setBatches(data || []);
            const active = data?.find(b => b.active);
            setActiveBatch(active || null);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const createPurchase = async (purchase: PurchaseData) => {
        try {
            const { data, error } = await supabase.functions.invoke('mercadopago-checkout', {
                body: purchase
            });

            if (error) throw error;
            return data;
        } catch (err: any) {
            console.error('Error creating purchase:', err.message);
            throw err;
        }
    };

    useEffect(() => {
        fetchBatches();
    }, []);

    return {
        batches,
        activeBatch,
        loading,
        error,
        createPurchase,
        refreshBatches: fetchBatches
    };
}
