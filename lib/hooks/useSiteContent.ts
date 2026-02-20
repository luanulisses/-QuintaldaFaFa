import { useEffect, useState } from 'react';
import { supabase } from '../supabase';

export interface SiteContentItem {
    key: string;
    value: string;
    section: string;
    type: 'text' | 'image' | 'textarea' | 'metrics';
}

export const useSiteContent = () => {
    const [content, setContent] = useState<Record<string, string>>(() => {
        // Initialize from localStorage if available for instant load
        const cached = localStorage.getItem('site_content_cache');
        return cached ? JSON.parse(cached) : {};
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchContent = async () => {
        try {
            setLoading(true);

            const { data, error } = await supabase
                .from('site_content')
                .select('*');

            if (error) {
                // If table doesn't exist (42P01), it's okay, we use defaults
                if (error.code === '42P01') {
                    console.warn('site_content table not found. Using defaults.');
                    return;
                }
                throw error;
            }

            if (data) {
                const contentMap: Record<string, string> = {};
                data.forEach((item: SiteContentItem) => {
                    contentMap[item.key] = item.value;
                });
                setContent(contentMap);
                // Save to cache
                localStorage.setItem('site_content_cache', JSON.stringify(contentMap));
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
        const newContent = { ...content, [key]: value };
        setContent(newContent);
        localStorage.setItem('site_content_cache', JSON.stringify(newContent));

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
