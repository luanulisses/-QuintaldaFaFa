import React, { useState, useEffect } from 'react';
import { useTestimonials, TestimonialItem } from '../../lib/hooks/useTestimonials';

const fallbackTestimonials: TestimonialItem[] = [
    {
        id: '1',
        name: "Ana & Lucas",
        role: "Casamento",
        content: "O lugar é mágico! Exatamente como sonhamos. A equipe foi super atenciosa e o pôr do sol nas fotos ficou incrível. Recomendo de olhos fechados!",
        image_url: "https://randomuser.me/api/portraits/women/42.jpg",
        rating: 5,
        is_active: true
    },
    {
        id: '2',
        name: "Patricia Gomes",
        role: "Aniversário 40 anos",
        content: "Estrutura impecável. A cozinha é ótima para o buffet e os banheiros são super acessíveis e limpos. Meus convidados amaram o espaço.",
        image_url: "https://randomuser.me/api/portraits/women/68.jpg",
        rating: 5,
        is_active: true
    },
    {
        id: '3',
        name: "Empresa TechSolution",
        role: "Confraternização",
        content: "Realizamos nosso evento de fim de ano e foi um sucesso. O ambiente rústico trouxe um clima muito acolhedor que fugiu do padrão corporativo frio.",
        image_url: "https://randomuser.me/api/portraits/men/32.jpg",
        rating: 5,
        is_active: true
    }
];

const TestimonialCarousel: React.FC = () => {
    const { fetchTestimonials } = useTestimonials();
    const [testimonials, setTestimonials] = useState<TestimonialItem[]>(fallbackTestimonials);
    const [current, setCurrent] = useState(0);

    useEffect(() => {
        const load = async () => {
            try {
                const data = await fetchTestimonials();
                if (data && data.length > 0) {
                    setTestimonials(data);
                }
            } catch (err) {
                console.error(err);
            }
        };
        load();
    }, []);

    const next = () => setCurrent((prev) => (prev + 1) % testimonials.length);
    const prev = () => setCurrent((prev) => (prev - 1 + testimonials.length) % testimonials.length);

    useEffect(() => {
        const timer = setInterval(next, 5000);
        return () => clearInterval(timer);
    }, [testimonials.length]);

    if (!testimonials.length) return null;

    return (
        <div className="relative max-w-4xl mx-auto">
            {/* Main Card */}
            <div className="bg-white rounded-3xl p-8 md:p-12 shadow-lg border border-primary/10 relative overflow-hidden transition-all duration-500">
                <span className="material-symbols-outlined absolute top-6 left-6 text-6xl text-primary/10 select-none">format_quote</span>

                <div className="relative z-10 flex flex-col md:flex-row gap-8 items-center md:items-start text-center md:text-left">
                    <img
                        src={testimonials[current].image_url}
                        alt={testimonials[current].name}
                        className="w-20 h-20 rounded-full border-4 border-surface-soft shadow-md object-cover"
                    />
                    <div>
                        <p className="font-display text-lg md:text-xl text-text-main italic mb-6 leading-relaxed">
                            "{testimonials[current].content}"
                        </p>
                        <div>
                            <h4 className="font-bold text-primary text-lg">{testimonials[current].name}</h4>
                            <span className="text-secondary text-sm font-medium tracking-wide bg-secondary/10 px-2 py-0.5 rounded-md">
                                {testimonials[current].role}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Controls */}
            <div className="flex justify-center gap-4 mt-8">
                <button
                    onClick={prev}
                    className="p-3 rounded-full bg-white text-primary border border-primary/20 hover:bg-primary hover:text-white transition-all shadow-sm"
                >
                    <span className="material-symbols-outlined block">arrow_back</span>
                </button>
                <div className="flex gap-2 items-center">
                    {testimonials.map((_, idx) => (
                        <button
                            key={idx}
                            onClick={() => setCurrent(idx)}
                            className={`w-2.5 h-2.5 rounded-full transition-all ${current === idx ? 'bg-primary w-6' : 'bg-primary/30'
                                }`}
                        />
                    ))}
                </div>
                <button
                    onClick={next}
                    className="p-3 rounded-full bg-white text-primary border border-primary/20 hover:bg-primary hover:text-white transition-all shadow-sm"
                >
                    <span className="material-symbols-outlined block">arrow_forward</span>
                </button>
            </div>
        </div>
    );
};

export default TestimonialCarousel;
