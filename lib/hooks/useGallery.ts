import { supabase } from '../supabase';

export interface Gallery {
    id: string;
    name: string;
    description?: string;
    created_at?: string;
}

export interface GalleryItem {
    id: string;
    url: string;
    caption?: string;
    category?: string;
    gallery_id?: string;
    order_index?: number;
}

export const useGallery = () => {
    // Gallery (Album) Operations
    const fetchGalleries = async () => {
        // Try to get from cache first
        const cached = localStorage.getItem('galleries_cache');
        if (cached) {
            // Background update
            supabase.from('galleries').select('*').order('name', { ascending: true }).then(({ data }) => {
                if (data) localStorage.setItem('galleries_cache', JSON.stringify(data));
            });
            return JSON.parse(cached) as Gallery[];
        }

        const { data, error } = await supabase
            .from('galleries')
            .select('*')
            .order('name', { ascending: true });

        if (error) throw error;
        if (data) localStorage.setItem('galleries_cache', JSON.stringify(data));
        return data as Gallery[];
    };

    const createGallery = async (gallery: Omit<Gallery, 'id' | 'created_at'>) => {
        const { data, error } = await supabase
            .from('galleries')
            .insert([gallery])
            .select()
            .single();

        if (error) throw error;
        // Invalidate cache
        localStorage.removeItem('galleries_cache');
        return data as Gallery;
    };

    const deleteGallery = async (id: string) => {
        const { error } = await supabase
            .from('galleries')
            .delete()
            .eq('id', id);

        if (error) throw error;
        // Invalidate cache
        localStorage.removeItem('galleries_cache');
    };

    // Image Operations
    const fetchGalleryImages = async (galleryId?: string) => {
        const cacheKey = `gallery_images_cache_${galleryId || 'all'}`;
        const cached = localStorage.getItem(cacheKey);

        if (cached) {
            // Background update
            let bgQuery = supabase.from('gallery_images').select('*');
            if (galleryId) bgQuery = bgQuery.eq('gallery_id', galleryId);
            bgQuery.order('created_at', { ascending: false }).then(({ data }) => {
                if (data) localStorage.setItem(cacheKey, JSON.stringify(data));
            });
            return JSON.parse(cached) as GalleryItem[];
        }

        let query = supabase.from('gallery_images').select('*');

        if (galleryId) {
            query = query.eq('gallery_id', galleryId);
        }

        const { data, error } = await query.order('created_at', { ascending: false });

        if (error) throw error;
        if (data) localStorage.setItem(cacheKey, JSON.stringify(data));
        return data as GalleryItem[];
    };

    // Backward compatibility for old calls
    const fetchGallery = async () => fetchGalleryImages();

    const addGalleryItem = async (item: Omit<GalleryItem, 'id' | 'created_at'>) => {
        const { data, error } = await supabase
            .from('gallery_images')
            .insert([item])
            .select()
            .single();

        if (error) throw error;
        return data as GalleryItem;
    };

    const deleteGalleryItem = async (id: string) => {
        const { error } = await supabase
            .from('gallery_images')
            .delete()
            .eq('id', id);

        if (error) throw error;
    };

    return {
        fetchGalleries,
        createGallery,
        deleteGallery,
        fetchGalleryImages,
        fetchGallery, // alias
        addGalleryItem,
        deleteGalleryItem
    };
};
