import React from 'react';
import Button from './Button';

interface PricingCardProps {
    title: string;
    price: string;
    features: string[];
    recommended?: boolean;
}

const PricingCard: React.FC<PricingCardProps> = ({ title, price, features, recommended = false }) => {
    return (
        <div className={`relative p-8 rounded-3xl transition-transform duration-300 hover:-translate-y-2 flex flex-col h-full ${recommended
                ? 'bg-white border-2 border-accent shadow-xl ring-4 ring-accent/10 z-10'
                : 'bg-white border border-secondary/20 shadow-lg'
            }`}>
            {recommended && (
                <div className="absolute top-0 right-0 bg-accent text-white text-xs font-bold px-4 py-1.5 rounded-bl-xl rounded-tr-2xl uppercase tracking-wider">
                    Mais Popular
                </div>
            )}

            <div className="mb-6">
                <h3 className="font-display text-2xl font-bold text-text-main mb-2">{title}</h3>
                <div className="flex items-baseline gap-1">
                    <span className="text-sm text-text-muted">A partir de</span>
                    <span className="text-3xl font-bold text-primary">{price}</span>
                </div>
            </div>

            <ul className="space-y-4 mb-8 flex-1">
                {features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-text-muted text-sm">
                        <span className="material-symbols-outlined text-secondary text-[20px] shrink-0">check_circle</span>
                        <span>{feature}</span>
                    </li>
                ))}
            </ul>

            <Button
                variant={recommended ? 'primary' : 'outline'}
                fullWidth
            >
                Solicitar Proposta
            </Button>
        </div>
    );
};

export default PricingCard;
