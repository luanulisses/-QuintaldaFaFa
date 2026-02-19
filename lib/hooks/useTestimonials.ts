import { supabase } from '../supabase';

export interface TestimonialItem {
    id: string;
    name: string;
    role: string;
    content: string;
    image_url: string;
    rating: number;
    is_active: boolean;
}

export const useTestimonials = () => {
    const fetchTestimonials = async () => {
        const { data, error } = await supabase
            .from('testimonials')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data as TestimonialItem[];
    };

    const addTestimonial = async (item: Omit<TestimonialItem, 'id' | 'created_at'>) => {
        const { data, error } = await supabase
            .from('testimonials')
            .insert([item] as any)
            .select();

        if (error) throw error;
        return data[0];
    };

    const updateTestimonial = async (id: string, updates: Partial<TestimonialItem>) => {
        const { data, error } = await supabase
            .from('testimonials')
            .update(updates)
            .eq('id', id)
            .select();

        if (error) throw error;
        return data[0];
    };

    const deleteTestimonial = async (id: string) => {
        const { error } = await supabase
            .from('testimonials')
            .delete()
            .eq('id', id);

        if (error) throw error;
    };

    return {
        fetchTestimonials,
        addTestimonial,
        updateTestimonial,
        deleteTestimonial
    };
};
