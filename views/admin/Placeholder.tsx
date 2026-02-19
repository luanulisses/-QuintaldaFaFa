import React from 'react';

interface Props {
    title: string;
}

const PlaceholderView: React.FC<Props> = ({ title }) => {
    return (
        <div className="flex flex-col items-center justify-center h-96 text-center">
            <span className="material-symbols-outlined text-6xl text-secondary/20 mb-4">construction</span>
            <h2 className="font-display text-2xl font-bold text-text-main mb-2">{title}</h2>
            <p className="text-text-muted text-sm max-w-md">
                Esta funcionalidade está em desenvolvimento. Em breve você poderá gerenciar {title.toLowerCase()} aqui.
            </p>
        </div>
    );
};

export default PlaceholderView;
