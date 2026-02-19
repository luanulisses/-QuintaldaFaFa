import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useGallery, GalleryItem, Gallery as GalleryType } from '../lib/hooks/useGallery';
import Footer from '../components/landing/Footer';
import Button from '../components/landing/Button';

const FullGallery: React.FC = () => {
    const { fetchGallery, fetchGalleries } = useGallery();
    const [items, setItems] = useState<GalleryItem[]>([]);
    const [galleries, setGalleries] = useState<GalleryType[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterId, setFilterId] = useState('all');

    useEffect(() => {
        window.scrollTo(0, 0);
        const load = async () => {
            try {
                const [imgData, galData] = await Promise.all([
                    fetchGallery(),
                    fetchGalleries()
                ]);
                setItems(imgData || []);
                setGalleries(galData || []);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const filteredItems = filterId === 'all'
        ? items
        : items.filter(item => item.gallery_id === filterId);

    return (
        <div className="min-h-screen bg-background flex flex-col animate-fade-in">
            {/* Header / Nav */}
            <nav className="bg-white/90 backdrop-blur-md shadow-sm py-4 sticky top-0 z-50 border-b border-primary/5">
                <div className="container mx-auto px-4 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-2 group">
                        <span className="material-symbols-outlined text-primary text-2xl group-hover:scale-110 transition-transform">local_florist</span>
                        <h1 className="font-display font-bold text-xl text-primary">Quintal da Fafá</h1>
                    </Link>
                    <Link to="/">
                        <Button variant="outline" size="sm">Voltar ao Início</Button>
                    </Link>
                </div>
            </nav>

            <main className="flex-1 container mx-auto px-4 py-12">
                <div className="text-center mb-12">
                    <h2 className="font-display text-4xl md:text-5xl font-bold text-text-main mb-4">Nossa Galeria Completa</h2>
                    <p className="text-text-muted text-lg max-w-2xl mx-auto">Explore todos os momentos inesquecíveis registrados no Quintal.</p>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap justify-center gap-3 mb-12">
                    <button
                        onClick={() => setFilterId('all')}
                        className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all duration-300 ${filterId === 'all'
                            ? 'bg-primary text-white shadow-lg scale-105'
                            : 'bg-white text-text-muted hover:bg-primary/10 border border-primary/10 shadow-sm'
                            }`}
                    >
                        Todos
                    </button>
                    {galleries.map(cat => (
                        <button
                            key={cat.id}
                            onClick={() => setFilterId(cat.id)}
                            className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all duration-300 ${filterId === cat.id
                                ? 'bg-primary text-white shadow-lg scale-105'
                                : 'bg-white text-text-muted hover:bg-primary/10 border border-primary/10 shadow-sm'
                                }`}
                        >
                            {cat.name}
                        </button>
                    ))}
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                        <p className="text-text-muted font-medium">Carregando fotos...</p>
                    </div>
                ) : items.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-primary/20">
                        <span className="material-symbols-outlined text-6xl text-primary/20 mb-4">image_not_supported</span>
                        <p className="text-text-muted text-lg">Ainda não há fotos nesta galeria.</p>
                        <Link to="/" className="text-primary font-bold mt-4 inline-block hover:underline">Voltar para a página inicial</Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filteredItems.map((item, idx) => (
                            <div
                                key={item.id || idx}
                                className="group relative overflow-hidden rounded-2xl aspect-square shadow-md bg-white animate-fade-in"
                                style={{ animationDelay: `${idx * 30}ms` }}
                            >
                                <img
                                    src={item.url}
                                    alt={item.caption || ''}
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                    loading="lazy"
                                />
                                <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                    <span className="text-white text-[10px] uppercase font-black tracking-widest bg-primary/80 px-2 py-1 rounded inline-block mb-1">
                                        {galleries.find(g => g.id === item.gallery_id)?.name || 'Geral'}
                                    </span>
                                    {item.caption && <p className="text-white text-sm font-medium line-clamp-2">{item.caption}</p>}
                                </div>
                            </div>
                        ))}
                        {filteredItems.length === 0 && (
                            <div className="col-span-full text-center py-12 text-text-muted italic bg-surface-cream rounded-2xl border border-dashed border-primary/10">
                                Nenhuma foto encontrada neste álbum.
                            </div>
                        )}
                    </div>
                )}
            </main>

            <Footer />
        </div>
    );
};

export default FullGallery;
