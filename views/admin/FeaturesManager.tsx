import React, { useEffect, useState } from 'react';
import { useFeatures } from '../../lib/hooks/useFeatures';

const FeaturesManager: React.FC = () => {
    const { fetchFeatures, addFeature, deleteFeature } = useFeatures();
    const [features, setFeatures] = useState<any[]>([]);
    const [newItem, setNewItem] = useState({ title: '', icon: 'star', content: '' });

    useEffect(() => {
        loadFeatures();
    }, []);

    const loadFeatures = async () => {
        const data = await fetchFeatures();
        setFeatures(data || []);
    };

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        await addFeature(newItem);
        setNewItem({ title: '', icon: 'star', content: '' });
        loadFeatures();
    };

    const handleDelete = async (id: string) => {
        await deleteFeature(id);
        loadFeatures();
    };

    return (
        <div className="space-y-6">
            <h1 className="font-display text-2xl font-bold text-text-main">Gerenciar Estrutura (Features)</h1>

            {/* Form */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-primary/10">
                <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    <div>
                        <label className="block text-xs font-bold uppercase text-text-muted mb-1">Título</label>
                        <input className="input-field w-full px-4 py-2 border rounded-lg" value={newItem.title} onChange={e => setNewItem({ ...newItem, title: e.target.value })} required />
                    </div>
                    <div>
                        <label className="block text-xs font-bold uppercase text-text-muted mb-1">Ícone (Material Symbol)</label>
                        <input className="input-field w-full px-4 py-2 border rounded-lg" value={newItem.icon} onChange={e => setNewItem({ ...newItem, icon: e.target.value })} required />
                    </div>
                    <div>
                        <button type="submit" className="bg-primary text-white font-bold py-2 px-6 rounded-lg">Adicionar</button>
                    </div>
                </form>
            </div>

            {/* List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {features.map(f => (
                    <div key={f.id} className="bg-white p-6 rounded-2xl shadow-sm border border-primary/10 flex flex-col items-center text-center relative">
                        <button onClick={() => handleDelete(f.id)} className="absolute top-2 right-2 text-red-400 hover:text-red-600">
                            <span className="material-symbols-outlined text-sm">delete</span>
                        </button>
                        <div className="w-12 h-12 rounded-full bg-secondary/20 text-secondary flex items-center justify-center mb-4">
                            <span className="material-symbols-outlined text-2xl">{f.icon}</span>
                        </div>
                        <h3 className="font-display text-lg font-bold text-text-main mb-2">{f.title}</h3>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default FeaturesManager;
