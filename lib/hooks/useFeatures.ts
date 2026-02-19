import { supabase } from '../supabase';

export interface SiteSection {
    id: string;
    section_key: string;
    title: string;
    subtitle?: string;
    content?: string;
    image_url?: string;
    icon?: string;
    order_index: number;
}

export const useFeatures = () => {
    const fetchFeatures = async () => {
        const { data, error } = await supabase
            .from('site_sections')
            .select('*')
            .eq('section_key', 'structure')
            .order('order_index', { ascending: true }); // Use order_index for features

        if (error) throw error;
        return data as SiteSection[];
    };

    const addFeature = async (feature: Omit<SiteSection, 'id' | 'created_at'>) => {
        const { data, error } = await supabase
            .from('site_sections')
            .insert([{ ...feature, section_key: 'structure' }])
            .select();

        if (error) throw error;
        return data[0];
    };

    const updateFeature = async (id: string, updates: Partial<SiteSection>) => {
        const { data, error } = await supabase
            .from('site_sections')
            .update(updates)
            .eq('id', id)
            .select();

        if (error) throw error;
        return data[0];
    };

    const deleteFeature = async (id: string) => {
        const { error } = await supabase
            .from('site_sections')
            .delete()
            .eq('id', id);

        if (error) throw error;
    };

    return {
        fetchFeatures,
        addFeature,
        updateFeature,
        deleteFeature
    };
};
