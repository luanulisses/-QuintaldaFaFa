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
            {/* Lightbox Modal via Portal approach (manual since we don't have createPortal import yet, but we'll use fixed z-index at root level) */}
            {selectedItem && (
                <div 
                    className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/95 p-4 sm:p-10"
                    style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
                    onClick={closeLightbox}
                >
                    {/* Backdrop blur as a separate layer to avoid clipping issues */}
                    <div className="absolute inset-0 backdrop-blur-xl opacity-50 pointer-events-none"></div>

                    {/* Navigation Buttons - Force visibility with high z-index */}
                    <button 
                        className="absolute top-6 right-6 text-white/80 hover:text-white z-[10001] transition-transform hover:scale-110 active:scale-95"
                        onClick={closeLightbox}
                        title="Fechar"
                    >
                        <span className="material-symbols-outlined text-5xl">close</span>
                    </button>

                    <button 
                        className="absolute left-4 sm:left-10 top-1/2 -translate-y-1/2 w-12 h-12 sm:w-20 sm:h-20 rounded-full bg-white/5 hover:bg-white/10 text-white flex items-center justify-center z-[10001] transition-all"
                        onClick={prevPhoto}
                        title="Anterior"
                    >
                        <span className="material-symbols-outlined text-4xl sm:text-6xl">chevron_left</span>
                    </button>

                    <button 
                        className="absolute right-4 sm:right-10 top-1/2 -translate-y-1/2 w-12 h-12 sm:w-20 sm:h-20 rounded-full bg-white/5 hover:bg-white/10 text-white flex items-center justify-center z-[10001] transition-all"
                        onClick={nextPhoto}
                        title="Próximo"
                    >
                        <span className="material-symbols-outlined text-4xl sm:text-6xl">chevron_right</span>
                    </button>

                    {/* Main Content Area */}
                    <div 
                        className="relative z-[10000] flex flex-col items-center max-w-full max-h-full"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* The Polaroid Frame */}
                        <div 
                            className="bg-white p-2 sm:p-5 pb-12 sm:pb-24 rounded-sm shadow-[0_20px_50px_rgba(0,0,0,0.5)] transform-gpu transition-transform duration-300 ease-out"
                            style={{
                                transform: `scale(${zoom}) translate(${offset.x}px, ${offset.y}px)`,
                                cursor: zoom > 1 ? 'grab' : 'zoom-in'
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
                        >
                            <img 
                                src={selectedItem.url} 
                                alt="Foto do Arraiá" 
                                className="max-w-[85vw] max-h-[60vh] sm:max-h-[65vh] object-contain rounded-[1px]"
                                draggable={false}
                                loading="eager"
                            />
                            
                            {/* Polaroid Info */}
                            <div className="absolute bottom-0 left-0 right-0 h-12 sm:h-24 flex items-center justify-between px-6 sm:px-12">
                                <div className="flex flex-col">
                                    <span className="font-display italic text-[#4a2a10] text-sm sm:text-3xl leading-none mb-1">
                                        {selectedItem.caption || 'Arraiá da Fafá'}
                                    </span>
                                    <span className="text-[9px] sm:text-xs text-[#a84b18]/60 font-bold uppercase tracking-[0.3em]">
                                        Momento Eternizado
                                    </span>
                                </div>
                                <div className="text-[#4a2a10]/20 font-black text-xl sm:text-4xl italic">
                                    {filteredItems.findIndex(i => i.id === selectedItem.id) + 1}
                                </div>
                            </div>
                        </div>

                        {/* Interaction Tips - Simplified */}
                        <div className="mt-10 flex gap-10 text-white/20 text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] animate-pulse">
                            <span className="flex items-center gap-2"><span className="material-symbols-outlined text-sm">zoom_in</span> Double clique p/ Zoom</span>
                            <span className="flex items-center gap-2"><span className="material-symbols-outlined text-sm">open_with</span> Arraste p/ Mover</span>
                        </div>
                    </div>
                </div>
            )}

            <Footer />
        </div>
    );
};

export default FullGallery;
