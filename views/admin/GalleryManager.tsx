import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useGallery, GalleryItem, Gallery } from '../../lib/hooks/useGallery';
import FileUploader from '../../components/admin/FileUploader';

const GalleryManager: React.FC = () => {
    const {
        fetchGalleries, createGallery, deleteGallery,
        fetchGalleryImages, addGalleryItem, deleteGalleryItem
    } = useGallery();

    // States
    const [galleries, setGalleries] = useState<Gallery[]>([]);
    const [images, setImages] = useState<GalleryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Forms
    const [newGalleryName, setNewGalleryName] = useState('');
    const [pendingUrls, setPendingUrls] = useState<string[]>([]);
    const [newImage, setNewImage] = useState({ gallery_id: '', caption: '' });
    const [filterGalleryId, setFilterGalleryId] = useState<string>('all');

    const loadData = async () => {
        setLoading(true);
        try {
            const [gals, imgs] = await Promise.all([
                fetchGalleries(),
                fetchGalleryImages()
            ]);
            setGalleries(gals || []);
            setImages(imgs || []);
        } catch (error: any) {
            console.error('Error loading data:', error);
            if (error.code === '42P01') {
                alert('Tabela "galleries" não encontrada. Por favor, execute o script SQL de reparo no seu Dashboard do Supabase.');
            } else {
                alert('Erro ao carregar dados: ' + error.message);
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    // Sincroniza o seletor de álbum quando o usuário clica na lateral
    useEffect(() => {
        if (filterGalleryId !== 'all') {
            setNewImage(prev => ({ ...prev, gallery_id: filterGalleryId }));
        } else {
            setNewImage(prev => ({ ...prev, gallery_id: '' }));
        }
    }, [filterGalleryId]);

    // Gallery Actions
    const handleCreateGallery = async (e: React.FormEvent) => {
        e.preventDefault();
        const name = newGalleryName.trim();
        if (!name) return;

        setSaving(true);
        try {
            const saved = await createGallery({ name });
            setNewGalleryName('');
            await loadData();
            alert(`Álbum "${name}" criado com sucesso!`);
        } catch (error: any) {
            console.error('Erro detalhado:', error);
            alert('Erro ao criar álbum: ' + (error.hint || error.message));
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteGallery = async (id: string, name: string) => {
        if (!confirm(`Tem certeza que deseja excluir o álbum "${name}"? Todas as fotos vinculadas a ele também serão excluídas.`)) return;
        try {
            await deleteGallery(id);
            if (filterGalleryId === id) setFilterGalleryId('all');
            await loadData();
        } catch (error: any) {
            alert('Erro ao excluir álbum: ' + error.message);
        }
    };

    // Img Actions
    const handleAddImages = async (e: React.FormEvent) => {
        e.preventDefault();
        if (pendingUrls.length === 0) {
            alert('Por favor, selecione as fotos primeiro.');
            return;
        }

        setSaving(true);
        try {
            const albumName = newImage.gallery_id
                ? galleries.find(g => g.id === newImage.gallery_id)?.name
                : 'Geral';

            // Salva todas as imagens em paralelo
            await Promise.all(pendingUrls.map(url =>
                addGalleryItem({
                    url,
                    gallery_id: newImage.gallery_id || null,
                    caption: newImage.caption,
                    category: albumName
                })
            ));

            setPendingUrls([]);
            setNewImage(prev => ({ ...prev, caption: '' }));
            await loadData();
            alert(`${pendingUrls.length} fotos adicionadas com sucesso!`);
        } catch (error: any) {
            alert('Erro ao salvar algumas imagens: ' + error.message);
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteImage = async (id: string) => {
        if (!confirm('Excluir esta foto?')) return;
        try {
            await deleteGalleryItem(id);
            await loadData();
        } catch (error: any) {
            alert('Erro ao excluir: ' + error.message);
        }
    };

    const filteredImages = filterGalleryId === 'all'
        ? images
        : images.filter(img => img.gallery_id === filterGalleryId);

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-4">
                    <Link to="/admin" className="p-2 bg-white border border-primary/10 rounded-lg text-secondary hover:text-primary transition-all shadow-sm">
                        <span className="material-symbols-outlined">arrow_back</span>
                    </Link>
                    <div>
                        <h1 className="font-display text-2xl font-bold text-text-main">Gerenciar Galeria</h1>
                        <p className="text-sm text-text-muted">Suba várias fotos de uma vez para seus álbuns.</p>
                    </div>
                </div>
                <button onClick={loadData} className="p-2 bg-white border border-primary/20 text-primary rounded-xl hover:bg-surface-soft">
                    <span className="material-symbols-outlined">refresh</span>
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Column 1: Manage Albums */}
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-primary/10">
                        <h2 className="font-bold text-lg mb-4 text-primary flex items-center gap-2">
                            <span className="material-symbols-outlined">folder</span>
                            Meus Álbuns
                        </h2>

                        <form onSubmit={handleCreateGallery} className="flex gap-2 mb-6">
                            <input
                                type="text"
                                placeholder="Novo álbum..."
                                value={newGalleryName}
                                onChange={e => setNewGalleryName(e.target.value)}
                                className="flex-1 px-4 py-2 rounded-xl bg-surface-cream border border-primary/10 focus:border-primary outline-none text-sm"
                            />
                            <button type="submit" disabled={saving || !newGalleryName.trim()} className="bg-primary text-white p-2 rounded-xl hover:bg-primary-dark disabled:opacity-50">
                                <span className="material-symbols-outlined">add</span>
                            </button>
                        </form>

                        <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                            <button
                                onClick={() => setFilterGalleryId('all')}
                                className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-between ${filterGalleryId === 'all' ? 'bg-primary text-white shadow-md' : 'bg-surface-cream text-text-muted hover:bg-primary/5'}`}
                            >
                                <span>Tudo</span>
                                <span className="text-xs opacity-60">{images.length}</span>
                            </button>

                            {galleries.map(gal => (
                                <div key={gal.id} className="group flex items-center gap-2">
                                    <button
                                        onClick={() => setFilterGalleryId(gal.id)}
                                        className={`flex-1 text-left px-4 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-between ${filterGalleryId === gal.id ? 'bg-primary text-white shadow-md' : 'bg-white border border-primary/5 text-text-muted hover:bg-primary/5'}`}
                                    >
                                        <span className="truncate">{gal.name}</span>
                                        <span className="text-xs opacity-60">
                                            {images.filter(i => i.gallery_id === gal.id).length}
                                        </span>
                                    </button>
                                    <button onClick={() => handleDeleteGallery(gal.id, gal.name)} className="p-2 text-red-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <span className="material-symbols-outlined text-sm">delete</span>
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Column 2 & 3: Upload & Feed */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Multi Upload Form */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-primary/10">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="font-bold text-lg text-primary flex items-center gap-2">
                                <span className="material-symbols-outlined">library_add</span>
                                Upload em Massa
                            </h2>
                            {pendingUrls.length > 0 && (
                                <button onClick={() => setPendingUrls([])} className="text-xs text-red-500 hover:underline">Limpar Seleção</button>
                            )}
                        </div>

                        <form onSubmit={handleAddImages} className="space-y-6">
                            <div className="bg-surface-cream border border-primary/10 rounded-2xl p-4">
                                <FileUploader
                                    multiple={true}
                                    label="Selecione ou Arraste suas fotos"
                                    onUploads={urls => setPendingUrls(prev => [...prev, ...urls])}
                                />

                                {pendingUrls.length > 0 && (
                                    <div className="mt-4 grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                                        {pendingUrls.map((url, i) => (
                                            <div key={i} className="aspect-square rounded-lg overflow-hidden border border-primary/20 relative group">
                                                <img src={url} className="w-full h-full object-cover" />
                                                <button
                                                    type="button"
                                                    onClick={() => setPendingUrls(prev => prev.filter((_, idx) => idx !== i))}
                                                    className="absolute top-0 right-0 bg-red-500 text-white p-0.5 rounded-bl-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <span className="material-symbols-outlined text-xs">close</span>
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                                <div>
                                    <label className="block text-xs font-bold uppercase text-text-muted mb-1">Álbum de Destino</label>
                                    <select
                                        className="w-full px-4 py-2.5 rounded-xl bg-surface-cream border border-primary/10 focus:border-primary outline-none text-sm"
                                        value={newImage.gallery_id}
                                        onChange={e => setNewImage({ ...newImage, gallery_id: e.target.value })}
                                    >
                                        <option value="">(Sem Álbum / Geral)</option>
                                        {galleries.map(gal => (
                                            <option key={gal.id} value={gal.id}>{gal.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase text-text-muted mb-1">Legenda para estas fotos</label>
                                    <input
                                        type="text"
                                        placeholder="Ex: Decoração da mesa..."
                                        value={newImage.caption}
                                        onChange={e => setNewImage({ ...newImage, caption: e.target.value })}
                                        className="w-full px-4 py-2.5 rounded-xl bg-surface-cream border border-primary/10 focus:border-primary outline-none text-sm"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={saving || pendingUrls.length === 0}
                                className="w-full bg-primary text-white font-bold py-4 rounded-2xl hover:bg-primary-dark disabled:opacity-50 transition-all shadow-lg flex items-center justify-center gap-3 text-lg"
                            >
                                {saving ? <span className="material-symbols-outlined animate-spin">sync</span> : <span className="material-symbols-outlined">done_all</span>}
                                {saving ? 'Salvando fotos no banco...' : `Salvar ${pendingUrls.length} fotos no álbum`}
                            </button>
                        </form>
                    </div>

                    {/* Image Grid */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-primary/10">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="font-bold text-lg text-primary flex items-center gap-2">
                                <span className="material-symbols-outlined">photo_library</span>
                                {filterGalleryId === 'all' ? 'Todas as Fotos' : `Fotos em ${galleries.find(g => g.id === filterGalleryId)?.name || 'Álbum Selecionado'}`}
                            </h2>
                            <span className="px-3 py-1 bg-primary/5 text-primary rounded-full text-xs font-black">{filteredImages.length} FOTOS</span>
                        </div>

                        {loading ? (
                            <div className="flex justify-center py-20"><span className="material-symbols-outlined animate-spin text-4xl text-primary">sync</span></div>
                        ) : filteredImages.length === 0 ? (
                            <div className="py-20 text-center bg-surface-cream rounded-2xl border border-dashed border-primary/10">
                                <span className="material-symbols-outlined text-4xl text-primary/20 mb-2">image_not_supported</span>
                                <p className="text-text-muted text-sm italic">Nenhuma foto neste álbum.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                                {filteredImages.map(img => (
                                    <div key={img.id} className="relative group aspect-square rounded-xl overflow-hidden shadow-sm bg-surface-cream">
                                        <img src={img.url} alt={img.caption || 'Gallery'} className="w-full h-full object-cover" />
                                        <div className="absolute inset-x-0 bottom-0 bg-black/60 p-2 text-white text-[10px] font-bold truncate">
                                            {img.caption || galleries.find(g => g.id === img.gallery_id)?.name || 'Geral'}
                                        </div>
                                        <button
                                            onClick={() => handleDeleteImage(img.id)}
                                            className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:scale-110"
                                        >
                                            <span className="material-symbols-outlined text-sm">delete</span>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GalleryManager;
