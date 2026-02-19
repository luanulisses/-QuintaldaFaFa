import React from 'react';

interface SectionProps extends React.HTMLAttributes<HTMLElement> {
    variant?: 'default' | 'soft' | 'white' | 'texture';
    containerSize?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
    noPadding?: boolean;
}

const Section: React.FC<SectionProps> = ({
    children,
    variant = 'default',
    containerSize = 'lg',
    noPadding = false,
    className = '',
    ...props
}) => {
    const variants = {
        default: "bg-background",
        soft: "bg-surface-soft",
        white: "bg-white",
        texture: "bg-texture bg-primary/5", // Texture overlay on light primary
    };

    const sizes = {
        sm: "max-w-3xl",
        md: "max-w-5xl",
        lg: "max-w-7xl",
        xl: "max-w-[1400px]",
        full: "max-w-full",
    };

    return (
        <section
            className={`w-full ${variants[variant]} ${noPadding ? '' : 'py-16 md:py-24'} ${className}`}
            {...props}
        >
            <div className={`mx-auto px-4 md:px-6 ${sizes[containerSize]}`}>
                {children}
            </div>
        </section>
    );
};

export default Section;
