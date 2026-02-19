import { useEffect, useState } from 'react';
import { supabase } from '../supabase';

export interface SiteContentItem {
    key: string;
    value: string;
    section: string;
    type: 'text' | 'image' | 'textarea' | 'metrics';
}

export const useSiteContent = () => {
    const [content, setContent] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchContent = async () => {
        try {
            setLoading(true);
            // First check if table exists to avoid ugly errors in console if migration hasn't run
            const { error: checkError } = await supabase.from('site_content').select('key').limit(1);
            if (checkError && checkError.code === '42P01') {
                // Table doesn't exist
                console.warn('site_content table not found. Using defaults.');
                setLoading(false);
                return;
            }

            const { data, error } = await supabase
                .from('site_content')
                .select('*');

            if (error) throw error;

            if (data) {
                const contentMap: Record<string, string> = {};
                data.forEach((item: SiteContentItem) => {
                    contentMap[item.key] = item.value;
                });
                setContent(contentMap);
            }
        } catch (err: any) {
            console.error('Error fetching site content:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchContent();
    }, []);

    const updateContent = async (key: string, value: string, section?: string, type: 'text' | 'image' | 'textarea' = 'text') => {
        // Optimistic update
        setContent(prev => ({ ...prev, [key]: value }));

        const { error } = await supabase
            .from('site_content')
            .upsert(
                {
                    key,
                    value,
                    section: section || 'general',
                    type
                },
                { onConflict: 'key' }
            );

        if (error) {
            console.error(`Error updating ${key}:`, error.message, error.details, error.hint);
            throw new Error(`Erro ao salvar "${key}": ${error.message}`);
        }
    };

    // Helper to get with default fallback
    const getText = (key: string, defaultValue: string) => content[key] || defaultValue;

    return { content, loading, error, updateContent, getText, refresh: fetchContent };
};
