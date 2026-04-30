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

    const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
    const [zoom, setZoom] = useState(1);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [offset, setOffset] = useState({ x: 0, y: 0 });

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

    const openLightbox = (idx: number) => {
        setSelectedIdx(idx);
        setZoom(1);
        setOffset({ x: 0, y: 0 });
        document.body.style.overflow = 'hidden';
    };

    const closeLightbox = () => {
        setSelectedIdx(null);
        document.body.style.overflow = 'auto';
    };

    const nextPhoto = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        if (selectedIdx !== null) {
            setSelectedIdx((selectedIdx + 1) % filteredItems.length);
            setZoom(1);
            setOffset({ x: 0, y: 0 });
        }
    };

    const prevPhoto = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        if (selectedIdx !== null) {
            setSelectedIdx((selectedIdx - 1 + filteredItems.length) % filteredItems.length);
            setZoom(1);
            setOffset({ x: 0, y: 0 });
        }
    };

    const handleZoom = (e: React.MouseEvent) => {
        e.stopPropagation();
        setZoom(prev => prev === 1 ? 2.5 : 1);
        setOffset({ x: 0, y: 0 });
    };

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
                                onClick={() => openLightbox(idx)}
                                className="group relative overflow-hidden rounded-2xl aspect-square shadow-md bg-white animate-fade-in cursor-zoom-in"
                                style={{ animationDelay: `${idx * 30}ms` }}
                            >
                                <img
                                    src={item.url}
                                    alt={item.caption || ''}
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                    loading="lazy"
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <span className="material-symbols-outlined text-white text-4xl">zoom_in</span>
                                </div>
                                <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                    <span className="text-white text-[10px] uppercase font-black tracking-widest bg-primary/80 px-2 py-1 rounded inline-block mb-1">
                                        {galleries.find(g => g.id === item.gallery_id)?.name || 'Geral'}
                                    </span>
                                    {item.caption && <p className="text-white text-sm font-medium line-clamp-2">{item.caption}</p>}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            {/* Lightbox Modal */}
            {selectedIdx !== null && (
                <div 
                    className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-sm flex items-center justify-center p-4 sm:p-8 transition-all animate-fade-in"
                    onClick={closeLightbox}
                    onWheel={(e) => {
                        if (e.deltaY < 0) setZoom(z => Math.min(z + 0.1, 4));
                        if (e.deltaY > 0) setZoom(z => Math.max(z - 0.1, 1));
                    }}
                >
                    {/* Close Button */}
                    <button 
                        className="absolute top-6 right-6 text-white/70 hover:text-white z-[110] transition-colors"
                        onClick={closeLightbox}
                    >
                        <span className="material-symbols-outlined text-4xl">close</span>
                    </button>

                    {/* Navigation Buttons */}
                    <button 
                        className="absolute left-4 sm:left-10 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center z-[110] transition-all backdrop-blur-md border border-white/10 group"
                        onClick={prevPhoto}
                    >
                        <span className="material-symbols-outlined text-3xl group-hover:-translate-x-1 transition-transform">chevron_left</span>
                    </button>
                    <button 
                        className="absolute right-4 sm:right-10 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center z-[110] transition-all backdrop-blur-md border border-white/10 group"
                        onClick={nextPhoto}
                    >
                        <span className="material-symbols-outlined text-3xl group-hover:translate-x-1 transition-transform">chevron_right</span>
                    </button>

                    {/* Image with Frame */}
                    <div 
                        className="relative max-w-full max-h-full flex flex-col items-center gap-4 transition-transform duration-300"
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            transform: `scale(${zoom}) translate(${offset.x}px, ${offset.y}px)`,
                            cursor: zoom > 1 ? 'grab' : 'default'
                        }}
                        onMouseDown={(e) => {
                            if (zoom > 1) {
                                setDragStart({ x: e.clientX, y: e.clientY });
                            }
                        }}
                        onMouseMove={(e) => {
                            if (zoom > 1 && e.buttons === 1) {
                                const dx = e.clientX - dragStart.x;
                                const dy = e.clientY - dragStart.y;
                                setOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }));
                                setDragStart({ x: e.clientX, y: e.clientY });
                            }
                        }}
                    >
                        <div className="bg-white p-3 sm:p-4 pb-12 sm:pb-16 rounded-sm shadow-2xl border-2 border-white/20 relative group">
                            <img 
                                src={filteredItems[selectedIdx].url} 
                                alt="Zoomed view" 
                                className="max-w-[90vw] max-h-[70vh] sm:max-h-[75vh] object-contain rounded-sm"
                                onDoubleClick={handleZoom}
                            />
                            {/* Legend in the frame */}
                            <div className="absolute bottom-2 sm:bottom-4 left-6 right-6 flex justify-between items-center opacity-80">
                                <span className="font-display italic text-[#5C2E0A] text-xs sm:text-lg">
                                    {filteredItems[selectedIdx].caption || 'Quintal da Fafá'}
                                </span>
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] sm:text-xs font-bold text-[#D9981F]">
                                        {selectedIdx + 1} / {filteredItems.length}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Controls Overlay */}
                        <div className="absolute -bottom-16 flex gap-4 text-white/50 text-xs items-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="flex items-center gap-1">
                                <span className="material-symbols-outlined text-sm">pinch</span>
                                <span>Scroll p/ Zoom</span>
                            </div>
                            <div className="w-1 h-1 bg-white/20 rounded-full"></div>
                            <div className="flex items-center gap-1">
                                <span className="material-symbols-outlined text-sm">ads_click</span>
                                <span>Double clique p/ Zoom Rápido</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <Footer />
        </div>
    );
};

export default FullGallery;
