import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSiteContent } from '../../lib/hooks/useSiteContent';
import FeaturesManager from './FeaturesManager';
import FileUploader from '../../components/admin/FileUploader';

const SiteContent: React.FC = () => {
    // ... (existing hooks)
    const { content, loading, error, updateContent } = useSiteContent();
    const [formData, setFormData] = useState<Record<string, string>>({});
    const [saving, setSaving] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    useEffect(() => {
        if (content) {
            setFormData(content);
        }
    }, [content]);

    const handleChange = (key: string, value: string) => {
        setFormData(prev => ({ ...prev, [key]: value }));
    };

    const handleSave = async (key: string, section: string, type: 'text' | 'image' | 'textarea' = 'text') => {
        setSaving(true);
        try {
            await updateContent(key, formData[key] || '', section, type);
            setSuccessMessage(`Salvo: ${key}`);
            setTimeout(() => setSuccessMessage(''), 2000);
        } catch (err: any) {
            console.error(err);
            alert(`Erro ao salvar: ${err?.message || 'Erro desconhecido. Verifique o console.'}`);
        } finally {
            setSaving(false);
        }
    };

    // ... (rest of logic)

    if (loading) return <div>Carregando...</div>;

    const sections = [
        {
            title: 'Identidade Visual',
            items: [
                { key: 'site_logo', label: 'Logo da Marca', type: 'image' },
                { key: 'site_name', label: 'Nome da Marca (Texto)', type: 'text' },
            ]
        },
        {
            title: 'Hero (Topo do Site)',
            items: [
                { key: 'hero_title', label: 'Título Principal', type: 'text' },
                { key: 'hero_subtitle', label: 'Subtítulo', type: 'textarea' },
                { key: 'hero_bg_image', label: 'Imagem/Vídeo de Fundo', type: 'image' },
            ]
        },
        {
            title: 'O Espaço',
            items: [
                { key: 'about_title', label: 'Título da Seção', type: 'text' },
                { key: 'about_subtitle', label: 'Subtítulo / Descrição', type: 'textarea' },
                { key: 'about_img_main', label: 'Foto Principal (grande)', type: 'image' },
                { key: 'about_img_2', label: 'Foto 2 (menor, direita)', type: 'image' },
                { key: 'about_img_3', label: 'Foto 3 (menor, direita)', type: 'image' },
                { key: 'about_feat_capacity', label: 'Destaque: Capacidade', type: 'text' },
                { key: 'about_feat_parking', label: 'Destaque: Estacionamento', type: 'text' },
                { key: 'about_feat_kitchen', label: 'Destaque: Cozinha', type: 'text' },
                { key: 'about_feat_ambience', label: 'Destaque: Ambiente', type: 'text' },
            ]
        },
        {
            title: 'Tipos de Evento (Cards)',
            items: [
                { key: 'event_wedding_title', label: 'Título (Casamentos)', type: 'text' },
                { key: 'event_wedding_desc', label: 'Descrição (Casamentos)', type: 'textarea' },
                { key: 'event_wedding_img', label: 'Imagem (Casamentos)', type: 'image' },

                { key: 'event_birthday_title', label: 'Título (Aniversários)', type: 'text' },
                { key: 'event_birthday_desc', label: 'Descrição (Aniversários)', type: 'textarea' },
                { key: 'event_birthday_img', label: 'Imagem (Aniversários)', type: 'image' },

                { key: 'event_corporate_title', label: 'Título (Corporativo)', type: 'text' },
                { key: 'event_corporate_desc', label: 'Descrição (Corporativo)', type: 'textarea' },
                { key: 'event_corporate_img', label: 'Imagem (Corporativo)', type: 'image' },
            ]
        },
        {
            title: 'Contato',
            items: [
                { key: 'contact_phone', label: 'WhatsApp / Telefone', type: 'text' },
                { key: 'contact_email', label: 'E-mail de Contato', type: 'text' },
            ]
        },
        {
            title: 'Rodapé',
            items: [
                { key: 'footer_text', label: 'Texto do Rodapé', type: 'text' },
            ]
        }
    ];

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
                        <h1 className="font-display text-2xl font-bold text-text-main leading-tight">Gerenciar Conteúdo</h1>
                        <p className="text-xs text-text-muted">Ajuste os textos e imagens da página inicial</p>
                    </div>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                    <Link
                        to="/"
                        target="_blank"
                        className="flex-1 md:flex-initial flex items-center justify-center gap-2 px-4 py-2 bg-white border border-primary/20 text-primary rounded-xl text-sm font-bold shadow-sm hover:bg-surface-soft transition-all"
                    >
                        <span className="material-symbols-outlined text-lg">visibility</span>
                        Ver Site
                    </Link>

                    {successMessage && (
                        <div className="bg-green-100 text-green-800 px-4 py-2 rounded-lg text-sm font-bold animate-fade-in shadow-sm border border-green-200">
                            {successMessage}
                        </div>
                    )}
                </div>
            </div>

            {error && <div className="bg-red-100 text-red-800 p-4 rounded-lg mb-6 border-l-4 border-red-500">
                <p className="font-bold">Erro ao carregar dados:</p>
                <p>{error}</p>
                <p className="mt-2 text-sm">Se o erro for "relation public.site_content does not exist", execute o script de migração no Supabase.</p>
            </div>}

            <div className="grid grid-cols-1 gap-8">
                {sections.map(section => (
                    <div key={section.title} className="bg-white p-6 rounded-2xl shadow-sm border border-primary/10">
                        <h2 className="font-display text-xl font-bold text-primary mb-4 border-b border-primary/5 pb-2">
                            {section.title}
                        </h2>
                        <div className="space-y-6">
                            {section.items.map(item => (
                                <div key={item.key} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start border-b border-dashed border-gray-100 pb-6 last:border-0 last:pb-0">
                                    <div className="md:col-span-3">
                                        <label className="block text-sm font-bold text-text-main mb-1">
                                            {item.label}
                                        </label>
                                        <div className="text-xs text-text-muted font-mono">{item.key}</div>
                                    </div>
                                    <div className="md:col-span-7">
                                        {item.type === 'image' ? (
                                            <FileUploader
                                                label=""
                                                onUpload={async (url) => {
                                                    handleChange(item.key, url);
                                                    // Auto-save após upload
                                                    if (url) {
                                                        try {
                                                            await updateContent(item.key, url, section.title.toLowerCase(), 'image');
                                                            setSuccessMessage(`Imagem salva: ${item.label}`);
                                                            setTimeout(() => setSuccessMessage(''), 3000);
                                                        } catch (err: any) {
                                                            alert(`Erro ao salvar imagem: ${err?.message}`);
                                                        }
                                                    }
                                                }}
                                                currentUrl={formData[item.key]}
                                            />
                                        ) : item.type === 'textarea' ? (
                                            <textarea
                                                className="w-full px-4 py-2 rounded-lg bg-surface-cream border border-primary/10 focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none transition-all resize-y min-h-[100px]"
                                                value={formData[item.key] || ''}
                                                onChange={(e) => handleChange(item.key, e.target.value)}
                                            />
                                        ) : (
                                            <input
                                                type="text"
                                                className="w-full px-4 py-2 rounded-lg bg-surface-cream border border-primary/10 focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none transition-all"
                                                value={formData[item.key] || ''}
                                                onChange={(e) => handleChange(item.key, e.target.value)}
                                            />
                                        )}
                                    </div>
                                    {/* Botão Salvar só aparece para campos não-imagem */}
                                    <div className="md:col-span-2 flex justify-end">
                                        {item.type !== 'image' ? (
                                            <button
                                                onClick={() => handleSave(item.key, section.title.toLowerCase(), item.type as any)}
                                                disabled={saving}
                                                className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold shadow-sm hover:bg-primary-dark transition-colors disabled:opacity-50"
                                            >
                                                Salvar
                                            </button>
                                        ) : (
                                            <span className="text-xs text-text-muted/60 italic text-right leading-tight">
                                                Salvo<br />automaticamente
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-12 pt-12 border-t border-primary/10">
                <FeaturesManager />
            </div>
        </div>
    );
};

export default SiteContent;
