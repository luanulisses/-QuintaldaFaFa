import { useEffect, useState } from 'react';
import { supabase } from '../supabase';

// Types matching DB tables
export interface GalleryImage {
    id: string;
    url: string;
    caption: string; // Used as alt
    category: string;
    order_index: number;
}

export interface Testimonial {
    id: string;
    name: string;
    role: string; // Used as 'event' type in UI
    content: string;
    image_url: string;
    rating: number;
    is_active: boolean;
}

export interface SiteSectionItem {
    id: string;
    section_key: string;
    title: string;
    subtitle?: string;
    content?: string; // Description
    image_url?: string;
    icon?: string;
    order_index: number;
}

export const useCollections = () => {

    // Generic fetcher
    const fetchCollection = async <T>(table: string, orderBy = 'created_at', ascending = false, filter?: { column: string, value: string }) => {
        let query = supabase.from(table).select('*');
        if (filter) {
            query = query.eq(filter.column, filter.value);
        }

        // Handle sorting. Note: 'order_index' is special for manual sorting
        if (orderBy === 'order_index') {
            query = query.order('order_index', { ascending: true });
        } else {
            query = query.order(orderBy, { ascending });
        }

        const { data, error } = await query;
        if (error) throw error;
        return data as T[];
    };

    // Generic display items (CRUD wrappers could be added here or in components)
    // For simplicity, we'll return raw fetch functions and data states for specific collections

    return {
        fetchGallery: () => fetchCollection<GalleryImage>('gallery_images', 'created_at', false),
        fetchTestimonials: () => fetchCollection<Testimonial>('testimonials', 'created_at', false),
        fetchFeatures: () => fetchCollection<SiteSectionItem>('site_sections', 'order_index', true, { column: 'section_key', value: 'structure' }),

        // CRUD Operations
        add: async (table: string, item: any) => {
            const { data, error } = await supabase.from(table).insert([item]).select();
            if (error) throw error;
            return data[0];
        },
        update: async (table: string, id: string, updates: any) => {
            const { data, error } = await supabase.from(table).update(updates).eq('id', id).select();
            if (error) throw error;
            return data[0];
        },
        remove: async (table: string, id: string) => {
            const { error } = await supabase.from(table).delete().eq('id', id);
            if (error) throw error;
        }
    };
};
