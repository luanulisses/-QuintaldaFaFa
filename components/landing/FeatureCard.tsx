import React from 'react';

interface FeatureCardProps {
    icon: string;
    title: string;
    description?: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, description }) => {
    return (
        <div className="group bg-white p-6 rounded-2xl border border-primary/10 hover:border-primary/30 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-full bg-secondary/20 text-secondary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <span className="material-symbols-outlined text-2xl">{icon}</span>
            </div>
            <h3 className="font-display text-lg font-bold text-text-main mb-2">{title}</h3>
            {description && (
                <p className="text-sm text-text-muted/80">{description}</p>
            )}
        </div>
    );
};

export default FeatureCard;
