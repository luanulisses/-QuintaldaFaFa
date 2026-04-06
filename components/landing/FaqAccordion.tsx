import React, { useState } from 'react';

interface FaqItem {
    q: string;
    a: string;
}

interface FaqAccordionProps {
    items: FaqItem[];
}

const FaqAccordion: React.FC<FaqAccordionProps> = ({ items }) => {
    const [openIndex, setOpenIndex] = useState<number | null>(null);

    return (
        <div className="divide-y divide-[#5C2E0A]/10">
            {items.map((item, i) => {
                const isOpen = openIndex === i;
                return (
                    <div key={i} className="py-5">
                        <button
                            onClick={() => setOpenIndex(isOpen ? null : i)}
                            className="w-full flex justify-between items-center text-left group"
                            aria-expanded={isOpen}
                        >
                            <span className={`font-display font-bold text-base md:text-lg transition-colors ${isOpen ? 'text-[#A84B18]' : 'text-[#5C2E0A] group-hover:text-[#A84B18]'}`}>
                                {item.q}
                            </span>
                            <span
                                className="ml-4 flex-shrink-0 w-8 h-8 rounded-full border-2 border-[#D9981F]/50 flex items-center justify-center text-[#D9981F] transition-transform duration-300"
                                style={{ transform: isOpen ? 'rotate(45deg)' : 'rotate(0deg)' }}
                            >
                                +
                            </span>
                        </button>

                        <div
                            style={{
                                maxHeight: isOpen ? '400px' : '0',
                                overflow: 'hidden',
                                transition: 'max-height 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
                            }}
                        >
                            <p className="mt-4 text-[#6b4226] text-sm md:text-base leading-relaxed">
                                {item.a}
                            </p>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default FaqAccordion;
