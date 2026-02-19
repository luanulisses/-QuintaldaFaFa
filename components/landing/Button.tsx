import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'outline' | 'text';
    size?: 'sm' | 'md' | 'lg';
    fullWidth?: boolean;
    icon?: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
    children,
    variant = 'primary',
    size = 'md',
    fullWidth = false,
    className = '',
    icon,
    ...props
}) => {
    const baseStyles = "inline-flex items-center justify-center rounded-full font-bold transition-all duration-300 font-body tracking-wide active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed";

    const variants = {
        primary: "bg-primary text-white hover:bg-primary-dark shadow-md hover:shadow-lg border border-transparent",
        secondary: "bg-secondary text-white hover:bg-secondary/90 shadow-md hover:shadow-lg border border-transparent",
        outline: "bg-transparent text-primary border-2 border-primary hover:bg-primary/5",
        text: "bg-transparent text-primary hover:text-primary-dark hover:bg-primary/5 px-2",
    };

    const sizes = {
        sm: "text-xs px-4 py-2 gap-1.5",
        md: "text-sm px-6 py-3 gap-2",
        lg: "text-base px-8 py-4 gap-2.5",
    };

    return (
        <button
            className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
            {...props}
        >
            {children}
            {icon && <span className="material-symbols-outlined text-[1.2em]">{icon}</span>}
        </button>
    );
};

export default Button;
