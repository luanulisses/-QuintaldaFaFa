import React, { useEffect, useState } from 'react';
import Button from './Button';
import { useGallery, GalleryItem, Gallery as GalleryType } from '../../lib/hooks/useGallery';
import { Link } from 'react-router-dom';

const Gallery: React.FC = () => {
    const { fetchGallery, fetchGalleries } = useGallery();
    const [items, setItems] = useState<GalleryItem[]>([]);
    const [galleries, setGalleries] = useState<GalleryType[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterId, setFilterId] = useState('all');

    useEffect(() => {
        const load = async () => {
            try {
                const [imgData, galData] = await Promise.all([
                    fetchGallery(),
                    fetchGalleries()
                ]);

                if (imgData && imgData.length > 0) {
                    setItems(imgData.filter(i => i.url && i.url.startsWith('http')));
                }
                setGalleries(galData || []);
            } catch (err) {
                console.error('Gallery Fetch Error:', err);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const filteredItems = (filterId === 'all'
        ? items
        : items.filter(item => item.gallery_id === filterId)).slice(0, 6);

    return (
        <div className="w-full">
            {/* Gallery/Album Filters */}
            <div className="flex flex-wrap justify-center gap-3 mb-10">
                <button
                    onClick={() => setFilterId('all')}
                    className={`px-4 py-2 rounded-full text-sm font-bold transition-all duration-300 ${filterId === 'all'
                        ? 'bg-primary text-white shadow-md'
                        : 'bg-white text-text-muted hover:bg-primary/10 border border-primary/20'
                        }`}
                >
                    Todos
                </button>
                {galleries.map(cat => (
                    <button
                        key={cat.id}
                        onClick={() => setFilterId(cat.id)}
                        className={`px-4 py-2 rounded-full text-sm font-bold transition-all duration-300 ${filterId === cat.id
                            ? 'bg-primary text-white shadow-md'
                            : 'bg-white text-text-muted hover:bg-primary/10 border border-primary/20'
                            }`}
                    >
                        {cat.name}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {items.length === 0 ? (
                        <div className="col-span-full py-20 text-center bg-white rounded-2xl border border-dashed border-primary/20">
                            <span className="material-symbols-outlined text-4xl text-primary/20 mb-2">image_not_supported</span>
                            <p className="text-text-muted font-medium italic">Nenhuma foto carregada na galeria oficial.</p>
                            <p className="text-xs text-text-muted/60 mt-1">Adicione fotos através do Painel Administrativo.</p>
                        </div>
                    ) : filteredItems.length === 0 ? (
                        <div className="col-span-full py-10 text-center text-text-muted">
                            Nenhuma foto neste álbum.
                        </div>
                    ) : (
                        filteredItems.map((item, idx) => (
                            <div key={item.id || idx} className="group relative overflow-hidden rounded-xl aspect-square shadow-sm cursor-pointer">
                                <img
                                    src={item.url}
                                    alt={item.caption || ''}
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                />
                                <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                    <p className="text-white text-xs font-bold drop-shadow-md">{item.caption || 'Ver Foto'}</p>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            <div className="mt-10 text-center">
                <Link to="/galeria">
                    <Button variant="outline" icon={<span className="material-symbols-outlined">collections</span>}>
                        Ver Galeria Completa
                    </Button>
                </Link>
            </div>
        </div>
    );
};

export default Gallery;
