import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
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

    const [selectedItem, setSelectedItem] = useState<GalleryItem | null>(null);
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

    const openLightbox = (item: GalleryItem) => {
        console.log('Opening lightbox for:', item.url);
        setSelectedItem(item);
        setZoom(1);
        setOffset({ x: 0, y: 0 });
        document.body.style.overflow = 'hidden';
    };

    const closeLightbox = () => {
        setSelectedItem(null);
        document.body.style.overflow = 'auto';
    };

    const nextPhoto = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        if (selectedItem) {
            const currentIdx = filteredItems.findIndex(i => i.id === selectedItem.id);
            const nextIdx = (currentIdx + 1) % filteredItems.length;
            setSelectedItem(filteredItems[nextIdx]);
            setZoom(1);
            setOffset({ x: 0, y: 0 });
        }
    };

    const prevPhoto = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        if (selectedItem) {
            const currentIdx = filteredItems.findIndex(i => i.id === selectedItem.id);
            const prevIdx = (currentIdx - 1 + filteredItems.length) % filteredItems.length;
            setSelectedItem(filteredItems[prevIdx]);
            setZoom(1);
            setOffset({ x: 0, y: 0 });
        }
    };

    const handleZoom = (e: React.MouseEvent) => {
        e.stopPropagation();
        setZoom(prev => prev === 1 ? 2 : 1);
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
                                onClick={() => openLightbox(item)}
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
            {/* Lightbox Modal - Bulletproof Structure with React Portals */}
            {selectedItem && createPortal(
                <div 
                    className="fixed inset-0 z-[99999]" 
                    style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, margin: 0, padding: 0 }}
                >
                    {/* Dark Background */}
                    <div 
                        className="absolute inset-0 bg-black/95 backdrop-blur-md cursor-pointer"
                        onClick={closeLightbox}
                    ></div>

                    {/* Close Button */}
                    <button 
                        className="absolute top-4 right-4 sm:top-8 sm:right-8 z-[100000] text-white/80 hover:text-white p-2"
                        onClick={closeLightbox}
                    >
                        <span className="material-symbols-outlined text-4xl sm:text-5xl drop-shadow-lg">close</span>
                    </button>

                    {/* Prev Button */}
                    <button 
                        className="absolute left-2 sm:left-8 top-1/2 -translate-y-1/2 z-[100000] text-white/80 hover:text-white p-2 bg-black/20 rounded-full hover:bg-black/40"
                        onClick={prevPhoto}
                    >
                        <span className="material-symbols-outlined text-4xl sm:text-6xl drop-shadow-lg">chevron_left</span>
                    </button>

                    {/* Next Button */}
                    <button 
                        className="absolute right-2 sm:right-8 top-1/2 -translate-y-1/2 z-[100000] text-white/80 hover:text-white p-2 bg-black/20 rounded-full hover:bg-black/40"
                        onClick={nextPhoto}
                    >
                        <span className="material-symbols-outlined text-4xl sm:text-6xl drop-shadow-lg">chevron_right</span>
                    </button>

                    {/* Centered Content Wrapper (pointer-events-none allows clicking background) */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-[100000] p-4 sm:p-12 overflow-hidden">
                        
                        {/* The Frame (pointer-events-auto to catch clicks) */}
                        <div 
                            className="bg-white p-3 sm:p-5 pb-16 sm:pb-24 shadow-2xl relative pointer-events-auto"
                            style={{
                                transform: `scale(${zoom}) translate(${offset.x}px, ${offset.y}px)`,
                                transition: zoom === 1 ? 'transform 0.3s ease-out' : 'none',
                                cursor: zoom > 1 ? 'grab' : 'zoom-in',
                                border: '1px solid #ddd'
                            }}
                            onDoubleClick={handleZoom}
                            onMouseDown={(e) => { if (zoom > 1) setDragStart({ x: e.clientX, y: e.clientY }); }}
                            onMouseMove={(e) => {
                                if (zoom > 1 && e.buttons === 1) {
                                    const dx = (e.clientX - dragStart.x) / zoom;
                                    const dy = (e.clientY - dragStart.y) / zoom;
                                    setOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }));
                                    setDragStart({ x: e.clientX, y: e.clientY });
                                }
                            }}
                            onWheel={(e) => {
                                e.stopPropagation();
                                if (e.deltaY < 0) setZoom(z => Math.min(z + 0.2, 4));
                                if (e.deltaY > 0) setZoom(z => Math.max(z - 0.2, 1));
                            }}
                        >
                            {/* The Image */}
                            <img 
                                src={selectedItem.url} 
                                alt={selectedItem.caption || 'Foto do evento'} 
                                className="max-w-[85vw] max-h-[65vh] object-contain border border-gray-100"
                                draggable={false}
                                loading="eager"
                                style={{ display: 'block' }}
                            />
                            
                            {/* Legend Area */}
                            <div className="absolute bottom-0 left-0 right-0 h-16 sm:h-24 flex items-center justify-between px-4 sm:px-8 bg-white">
                                <div className="flex flex-col">
                                    <span className="font-display italic text-[#4a2a10] text-lg sm:text-2xl font-bold">
                                        {selectedItem.caption || 'Arraiá da Fafá'}
                                    </span>
                                    <span className="text-[10px] sm:text-xs text-[#a84b18] uppercase tracking-widest font-semibold mt-1">
                                        Momento Inesquecível
                                    </span>
                                </div>
                                <div className="text-[#4a2a10]/30 font-black text-2xl sm:text-4xl italic">
                                    {filteredItems.findIndex(i => i.id === selectedItem.id) + 1}
                                </div>
                            </div>
                        </div>

                    </div>

                    {/* Interaction Tips */}
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-6 text-white/50 text-[10px] sm:text-xs uppercase font-bold tracking-widest z-[100000] pointer-events-none">
                        <span className="hidden sm:flex items-center gap-1"><span className="material-symbols-outlined text-sm">zoom_in</span> 2x Clique: Zoom</span>
                        <span className="hidden sm:flex items-center gap-1"><span className="material-symbols-outlined text-sm">pan_tool</span> Arraste p/ Mover</span>
                    </div>

                </div>,
                document.body
            )}

            <Footer />
        </div>
    );
};

export default FullGallery;
