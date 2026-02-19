import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTestimonials, TestimonialItem } from '../../lib/hooks/useTestimonials';

const TestimonialsManager: React.FC = () => {
    const { fetchTestimonials, addTestimonial, deleteTestimonial, updateTestimonial } = useTestimonials();
    const [testimonials, setTestimonials] = useState<TestimonialItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [newItem, setNewItem] = useState({ name: '', role: '', content: '', image_url: 'https://randomuser.me/api/portraits/women/42.jpg', rating: 5, is_active: true });

    const loadTestimonials = async () => {
        setLoading(true);
        try {
            const data = await fetchTestimonials();
            setTestimonials(data || []);
        } catch (error) {
            console.error('Error loading testimonials:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadTestimonials();
    }, []);

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await addTestimonial(newItem);
            setNewItem({ name: '', role: '', content: '', image_url: 'https://randomuser.me/api/portraits/women/42.jpg', rating: 5, is_active: true });
            loadTestimonials();
        } catch (error) {
            console.error('Error adding testimonial:', error);
            alert('Erro ao adicionar depoimento');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir?')) return;
        try {
            await deleteTestimonial(id);
            loadTestimonials();
        } catch (error) {
            console.error('Error deleting testimonial:', error);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <div className="flex items-center gap-4">
                    <Link
                        to="/admin"
                        className="p-2 bg-white border border-primary/10 rounded-lg text-secondary hover:text-primary hover:bg-surface-soft transition-all shadow-sm flex items-center justify-center"
                        title="Voltar ao Painel"
                    >
                        <span className="material-symbols-outlined">arrow_back</span>
                    </Link>
                    <div>
                        <h1 className="font-display text-2xl font-bold text-text-main leading-tight">Gerenciar Depoimentos</h1>
                        <p className="text-xs text-text-muted">Ajuste o que os clientes dizem sobre o Quintal</p>
                    </div>
                </div>

                <Link
                    to="/"
                    target="_blank"
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-primary/20 text-primary rounded-xl text-sm font-bold shadow-sm hover:bg-surface-soft transition-all"
                >
                    <span className="material-symbols-outlined text-lg">visibility</span>
                    Ver Site
                </Link>
            </div>

            {/* Add Form */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-primary/10">
                <h2 className="font-bold text-lg mb-4 text-primary">Adicionar Novo Depoimento</h2>
                <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold uppercase text-text-muted mb-1">Nome do Cliente</label>
                        <input className="input-field w-full px-4 py-2 border rounded-lg" type="text" value={newItem.name} onChange={e => setNewItem({ ...newItem, name: e.target.value })} required />
                    </div>
                    <div>
                        <label className="block text-xs font-bold uppercase text-text-muted mb-1">Evento (Role)</label>
                        <input className="input-field w-full px-4 py-2 border rounded-lg" type="text" value={newItem.role} onChange={e => setNewItem({ ...newItem, role: e.target.value })} placeholder="Ex: Casamento" required />
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-xs font-bold uppercase text-text-muted mb-1">Depoimento</label>
                        <textarea className="input-field w-full px-4 py-2 border rounded-lg" value={newItem.content} onChange={e => setNewItem({ ...newItem, content: e.target.value })} required rows={3} />
                    </div>
                    <div>
                        <label className="block text-xs font-bold uppercase text-text-muted mb-1">URL Avatar (Opcional)</label>
                        <input className="input-field w-full px-4 py-2 border rounded-lg" type="text" value={newItem.image_url} onChange={e => setNewItem({ ...newItem, image_url: e.target.value })} />
                    </div>
                    <div className="flex items-end">
                        <button type="submit" className="bg-primary text-white font-bold py-2 px-6 rounded-lg hover:bg-primary-dark transition-colors">Adicionar</button>
                    </div>
                </form>
            </div>

            {/* List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {testimonials.map(item => (
                    <div key={item.id} className="bg-white p-6 rounded-2xl shadow-sm border border-primary/10 relative">
                        <button onClick={() => handleDelete(item.id)} className="absolute top-4 right-4 text-red-400 hover:text-red-600">
                            <span className="material-symbols-outlined">delete</span>
                        </button>
                        <div className="flex items-center gap-4 mb-4">
                            <img src={item.image_url} alt={item.name} className="w-12 h-12 rounded-full object-cover" />
                            <div>
                                <h3 className="font-bold text-text-main">{item.name}</h3>
                                <p className="text-xs text-secondary font-bold uppercase">{item.role}</p>
                            </div>
                        </div>
                        <p className="text-text-muted text-sm italic">"{item.content}"</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default TestimonialsManager;
