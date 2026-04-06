import React from 'react';

export type MenuType = 'gastronomia' | 'bebidas';

interface ArraiaMenuProps {
    isOpen: boolean;
    onClose: () => void;
    type: MenuType;
}

const ArraiaMenu: React.FC<ArraiaMenuProps> = ({ isOpen, onClose, type }) => {
    if (!isOpen) return null;

    const foodSections = [
        {
            title: 'SALGADOS & PRATOS',
            icon: '🍽️',
            items: [
                { name: 'Pastel de Carne', desc: 'sequinho e crocante', price: 'R$ 10,00', icon: '🥟' },
                { name: 'Pastel de Queijo', desc: 'derretidinho por dentro', price: 'R$ 10,00', icon: '🥟' },
                { name: 'Churrasquinho', desc: '', price: 'R$ 12,00', icon: '🍢' },
                { name: 'Choripan', desc: '', price: 'R$ 15,00', icon: '🌭' },
                { name: 'Galinhada', desc: '', price: 'R$ 10,00', icon: '🍗' },
                { name: 'Carreteiro', desc: '', price: 'R$ 10,00', icon: '🍚' },
                { name: 'Caldo', desc: '', price: 'R$ 10,00', icon: '🥣' },
                { name: 'Cachorro-quente', desc: '', price: 'R$ 10,00', icon: '🌭' },
            ]
        },
        {
            title: 'DOCES TÍPICOS',
            icon: '🌽',
            items: [
                { name: 'Pamonha', desc: 'fresquinha, feita na hora', price: 'R$ 15,00', icon: '🌽' },
                { name: 'Canjica', desc: '', price: 'R$ 10,00', icon: '🌽' },
            ]
        },
        {
            title: 'BEBIDAS QUENTES',
            icon: '☕',
            items: [
                { name: 'Quentão', desc: 'canela, cravo e gengibre', price: 'R$ 10,00', icon: '🍶' },
                { name: 'Chocolate Quente', desc: '', price: 'R$ 10,00', icon: '☕' },
            ]
        }
    ];

    const drinkSections = [
        {
            title: 'CERVEJAS',
            icon: '🍺',
            items: [
                { name: 'Heineken', desc: 'long neck gelada', price: 'R$ 12,00', icon: '🟢' },
                { name: 'Heineken 0,0', desc: 'sem álcool', price: 'R$ 12,00', icon: '🟢' },
                { name: 'Brahma', desc: '', price: 'R$ 6,00', icon: '🟡' },
                { name: 'Amstel', desc: '', price: 'R$ 6,00', icon: '🔴' },
            ]
        },
        {
            title: 'NÃO ALCOÓLICOS',
            icon: '🥤',
            items: [
                { name: 'Refrigerante', desc: '', price: 'R$ 6,00', icon: '🥤' },
                { name: 'Suco caixa de 1 litro', desc: '', price: 'R$ 10,00', icon: '🧃' },
                { name: 'Red Bull', desc: 'energético', price: 'R$ 20,00', icon: '⚡' },
                { name: 'Água com gás', desc: '', price: 'R$ 5,00', icon: '💧' },
                { name: 'Água sem gás', desc: '', price: 'R$ 5,00', icon: '💧' },
            ]
        },
        {
            title: 'DRINKS & DESTILADOS',
            icon: '🥃',
            items: [
                { name: 'Paratudo', desc: 'drink da casa', price: 'R$ 35,00', icon: '🍹' },
                { name: 'Campari', desc: 'drinque especial', price: 'R$ 90,00', icon: '🍊' },
                { name: 'Whisky', desc: 'dose generosa', price: 'R$ 120,00', icon: '🥃' },
            ]
        }
    ];

    const currentSections = type === 'gastronomia' ? foodSections : drinkSections;
    const title = type === 'gastronomia' ? 'Cardápio do Arraiá' : 'Bebidas do Arraiá';
    const headerIcon = type === 'gastronomia' ? '🌽' : '🍺';

    return (
        <div className="fixed inset-0 z-[200] bg-[#1C0C04]/95 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
            <div className="relative bg-[#2D1606] border-2 border-[#D9981F]/30 rounded-[40px] max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-8 md:p-12 scrollbar-thin scrollbar-thumb-[#D9981F]/20">
                
                {/* Botão de Fechar */}
                <button 
                    onClick={onClose}
                    className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-[#EDD68A] hover:bg-[#D9981F] hover:text-[#1C0C04] transition-all transform active:scale-95"
                >
                    ✕
                </button>

                {/* Cabeçalho */}
                <div className="text-center mb-12">
                    <span className="text-4xl mb-4 block">{headerIcon}</span>
                    <h2 className="font-display text-4xl md:text-5xl font-bold text-[#EDD68A] uppercase tracking-tighter">
                        {title}
                    </h2>
                    <p className="text-[#D9981F] text-xs font-bold tracking-[0.3em] uppercase mt-2">
                        Quintal da Fafá · 06 de Junho de 2026
                    </p>
                    <div className="flex justify-center gap-1 mt-4">
                        {[...Array(9)].map((_, i) => (
                            <span key={i} className={`text-xl ${i % 2 === 0 ? 'text-[#8B1A1A]' : 'text-transparent opacity-20 border-l border-[#8B1A1A]'}`}>🚩</span>
                        ))}
                    </div>
                </div>

                {/* Conteúdo do Menu */}
                <div className="space-y-12">
                    {currentSections.map((section, idx) => (
                        <div key={idx} className="space-y-6">
                            <div className="flex items-center gap-3 border-b border-[#D9981F]/20 pb-2">
                                <span className="text-sm opacity-60 text-[#EDD68A] uppercase tracking-widest flex items-center gap-2">
                                    <span className="text-lg">{section.icon}</span> {section.title}
                                </span>
                                <div className="h-[1px] flex-1 bg-gradient-to-r from-[#D9981F]/20 to-transparent"></div>
                            </div>

                            <div className="grid grid-cols-1 gap-4">
                                {section.items.map((item, itemIdx) => (
                                    <div key={itemIdx} className="flex items-center justify-between group">
                                        <div className="flex items-center gap-4">
                                            <span className="text-2xl group-hover:scale-125 transition-transform">{item.icon}</span>
                                            <div>
                                                <h4 className="font-display text-lg font-bold text-[#EDD68A] group-hover:text-[#D9981F] transition-colors">{item.name}</h4>
                                                {item.desc && <p className="text-[#EDD68A]/50 text-xs italic">{item.desc}</p>}
                                            </div>
                                        </div>
                                        <div className="flex-1 mx-4 border-b border-dotted border-[#D9981F]/20 mb-2"></div>
                                        <span className="font-display font-bold text-[#D9981F]">
                                            {item.price}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Rodapé do Menu */}
                <div className="mt-16 text-center">
                    <div className="bg-[#1C0C04]/40 border border-[#D9981F]/20 p-6 rounded-2xl">
                        <p className="text-[#EDD68A]/70 text-xs leading-relaxed">
                            {type === 'bebidas' ? '🍺 Consumo responsável · Proibida a venda de álcool para menores de 18 anos' : '🔥 Todos os itens preparados na hora · Sujeito a disponibilidade'}
                            <br/>
                            <strong className="text-[#D9981F] uppercase mt-2 block tracking-widest">Aceitamos PIX, cartão e dinheiro</strong>
                        </p>
                    </div>
                    <p className="mt-8 text-[#EDD68A]/30 text-[10px] uppercase font-bold tracking-widest">
                        Quintal da Fafá ✦ 2026
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ArraiaMenu;
