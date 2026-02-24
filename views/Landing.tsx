import React, { useState, useEffect } from 'react';
import Section from '../components/landing/Section';
import Button from '../components/landing/Button';
import FeatureCard from '../components/landing/FeatureCard';
import Gallery from '../components/landing/Gallery';
import TestimonialCarousel from '../components/landing/TestimonialCarousel';
import PricingCard from '../components/landing/PricingCard';
import ContactForm from '../components/landing/ContactForm';
import Footer from '../components/landing/Footer';
import { useSiteContent } from '../lib/hooks/useSiteContent';
import { useFeatures, SiteSection } from '../lib/hooks/useFeatures';

const Landing: React.FC = () => {
    const { getText, loading: contentLoading } = useSiteContent();
    const { fetchFeatures } = useFeatures();
    const [scrolled, setScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [features, setFeatures] = useState<SiteSection[]>([]);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 50);
        };
        window.addEventListener('scroll', handleScroll);

        // Fetch features
        fetchFeatures().then(data => {
            if (data && data.length > 0) setFeatures(data);
        }).catch(err => console.error(err));

        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const scrollToSection = (id: string) => {
        setMobileMenuOpen(false);
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    };

    // Fallback features if DB is empty
    const defaultFeatures = [
        { id: '1', title: 'Cozinha Industrial', icon: 'soup_kitchen' },
        { id: '2', title: 'Piscina Aquecida', icon: 'pool' },
        { id: '3', title: 'Área Coberta', icon: 'roofing' },
        { id: '4', title: 'Ampla Área Verde', icon: 'park' },
    ];

    const displayFeatures = features.length > 0 ? features : defaultFeatures;

    return (
        <div className="font-body text-text-main bg-background w-full flex-1 flex flex-col">
            {/* Navigation */}
            <nav className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${scrolled ? 'bg-white/90 backdrop-blur-md shadow-sm py-3' : 'bg-transparent py-6'}`}>
                {/* ... existing nav content ... */}
                <div className="container mx-auto px-4 md:px-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        {getText('site_logo', '') ? (
                            <img
                                src={getText('site_logo', '')}
                                alt="Logo"
                                className="h-10 md:h-12 w-auto object-contain"
                            />
                        ) : (
                            <span className="material-symbols-outlined text-primary text-3xl">local_florist</span>
                        )}
                        <h1 className={`font-display font-bold text-2xl tracking-tight ${scrolled ? 'text-primary' : 'text-primary md:text-white'}`}>
                            {getText('site_name', 'Quintal da Fafá')}
                        </h1>
                    </div>

                    {/* Desktop Menu */}
                    <div className={`hidden md:flex items-center gap-8 font-medium text-sm ${scrolled ? 'text-text-main' : 'text-white'}`}>
                        <button onClick={() => scrollToSection('home')} className="hover:text-accent transition-colors">Início</button>
                        <button onClick={() => scrollToSection('about')} className="hover:text-accent transition-colors">O Espaço</button>
                        <button onClick={() => scrollToSection('gallery')} className="hover:text-accent transition-colors">Galeria</button>
                        <button onClick={() => scrollToSection('plans')} className="hover:text-accent transition-colors">Pacotes</button>
                        <button onClick={() => scrollToSection('contact')}>
                            <Button variant={scrolled ? 'primary' : 'outline'} size="sm" className={!scrolled ? 'border-white text-white hover:bg-white/20' : ''}>
                                Solicitar Orçamento
                            </Button>
                        </button>
                    </div>

                    {/* Mobile Toggle */}
                    <button
                        className={`md:hidden p-2 ${scrolled ? 'text-primary' : 'text-primary'}`}
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    >
                        <span className="material-symbols-outlined text-3xl">menu</span>
                    </button>
                </div>

                {/* Mobile Menu */}
                <div className={`md:hidden absolute top-full left-0 w-full bg-white shadow-lg transition-all duration-300 overflow-hidden ${mobileMenuOpen ? 'max-h-screen py-6' : 'max-h-0'}`}>
                    <div className="flex flex-col items-center gap-6 font-medium text-text-main">
                        <button onClick={() => scrollToSection('home')}>Início</button>
                        <button onClick={() => scrollToSection('about')}>O Espaço</button>
                        <button onClick={() => scrollToSection('gallery')}>Galeria</button>
                        <button onClick={() => scrollToSection('plans')}>Pacotes</button>
                        <button onClick={() => scrollToSection('contact')}>
                            <Button size="sm">Solicitar Orçamento</Button>
                        </button>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section id="home" className="relative h-screen min-h-[750px] md:min-h-[600px] flex items-center justify-center text-center px-4">
                <div className="absolute inset-0 z-0">
                    {getText('hero_bg_image', 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80').match(/\.(mp4|webm|ogg)$/i) ? (
                        <video
                            autoPlay
                            muted
                            loop
                            playsInline
                            className="w-full h-full object-cover"
                        >
                            <source src={getText('hero_bg_image', '')} type="video/mp4" />
                        </video>
                    ) : (
                        <img
                            src={getText('hero_bg_image', 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80')}
                            alt="Quintal da Fafá Hero"
                            className="w-full h-full object-cover"
                        />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-background/20"></div>
                </div>

                <div className="relative z-10 max-w-4xl mx-auto space-y-6 animate-fade-in pt-20">
                    <span className="inline-block py-1 px-4 rounded-full bg-white/20 backdrop-blur-sm text-white text-sm font-bold tracking-widest uppercase border border-white/30">
                        {getText('hero_location', 'Planaltina - DF')}
                    </span>
                    <h1 className="font-display text-4xl md:text-7xl font-bold text-white leading-tight drop-shadow-lg whitespace-pre-line">
                        {getText('hero_title', 'Seu evento com \nclima rústico e moderno')}
                    </h1>
                    <p className="text-base md:text-xl text-white/90 max-w-2xl mx-auto font-medium leading-relaxed drop-shadow-md px-2">
                        {getText('hero_subtitle', 'O espaço ideal para casamentos e confraternizações inesquecíveis.')}
                    </p>
                    <div className="flex flex-col md:flex-row gap-3 md:gap-4 justify-center mt-6 md:mt-8">
                        <Button size="lg" className="bg-primary hover:bg-primary-dark text-white border-none shadow-lg transform hover:scale-105 transition-all text-sm md:text-base py-3 md:py-4" onClick={() => scrollToSection('contact')}>
                            Agendar Visita
                        </Button>
                        <Button variant="outline" size="lg" className="bg-white text-text-main border-white hover:bg-white/90 shadow-lg transform hover:scale-105 transition-all text-sm md:text-base py-3 md:py-4" onClick={() => scrollToSection('gallery')}>
                            Ver Galeria
                        </Button>
                        <a
                            href="https://www.google.com/maps/place/15%C2%B045'44.1%22S+47%C2%B029'34.9%22W/@-15.7622386,-47.4955887,17z/data=!3m1!4b1!4m4!3m3!8m2!3d-15.7622386!4d-47.4930138?hl=pt-BR&entry=ttu&g_ep=EgoyMDI2MDIxOC4wIKXMDSoASAFQAw%3D%3D"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-block"
                        >
                            <Button size="lg" className="w-full bg-primary hover:bg-primary-dark text-white border-none shadow-lg transform hover:scale-105 transition-all text-sm md:text-base py-3 md:py-4 flex items-center justify-center gap-2">
                                <span className="material-symbols-outlined text-sm md:text-base">location_on</span>
                                Como chegar
                            </Button>
                        </a>
                    </div>
                </div>


            </section>
            {/* ===== O ESPAÇO Section ===== */}
            <section id="about" className="py-20 bg-white relative z-10">
                <div className="container mx-auto px-4 md:px-6">

                    {/* Header */}
                    <div className="text-center mb-14">
                        <span className="text-primary text-sm font-bold tracking-widest uppercase mb-2 block">Conheça o Local</span>
                        <h2 className="font-display text-4xl md:text-5xl font-bold text-text-main mb-4">
                            {getText('about_title', 'Um espaço feito para celebrar')}
                        </h2>
                        <p className="text-text-muted text-lg max-w-2xl mx-auto">
                            {getText('about_subtitle', 'Ambiente rústico, acolhedor e completo para tornar o seu evento inesquecível.')}
                        </p>
                    </div>

                    {/* Image Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-14">
                        {/* Imagem principal grande */}
                        <div className="md:col-span-2 rounded-3xl overflow-hidden shadow-md aspect-[4/3] md:aspect-auto">
                            <img
                                src={getText('about_img_main', 'https://images.unsplash.com/photo-1587271407850-8d4389188bf4?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80')}
                                alt="Espaço principal"
                                className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                                loading="lazy"
                            />
                        </div>
                        {/* Coluna com 2 fotos menores */}
                        <div className="flex flex-col gap-4">
                            <div className="rounded-3xl overflow-hidden shadow-md flex-1 min-h-[180px]">
                                <img
                                    src={getText('about_img_2', 'https://images.unsplash.com/photo-1519741497674-611481863552?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80')}
                                    alt="Área do espaço"
                                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                                    loading="lazy"
                                />
                            </div>
                            <div className="rounded-3xl overflow-hidden shadow-md flex-1 min-h-[180px]">
                                <img
                                    src={getText('about_img_3', 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80')}
                                    alt="Decoração do espaço"
                                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                                    loading="lazy"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Destaques */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        {[
                            { icon: 'groups', label: 'Capacidade', value: getText('about_feat_capacity', 'Até 300 Pessoas') },
                            { icon: 'local_parking', label: 'Estacionamento', value: getText('about_feat_parking', '50 vagas privativas') },
                            { icon: 'restaurant', label: 'Cozinha', value: getText('about_feat_kitchen', 'Industrial completa') },
                            { icon: 'wb_twilight', label: 'Ambiente', value: getText('about_feat_ambience', 'Coberto + Ar Livre') },
                        ].map((item) => (
                            <div key={item.label} className="bg-[#F9FDF5] rounded-2xl p-5 flex flex-col items-center text-center border border-primary/10 hover:border-primary/30 hover:shadow-md transition-all">
                                <span className="material-symbols-outlined text-primary text-3xl mb-2">{item.icon}</span>
                                <span className="text-xs font-bold uppercase tracking-widest text-text-muted mb-1">{item.label}</span>
                                <span className="font-bold text-text-main text-sm">{item.value}</span>
                            </div>
                        ))}
                    </div>

                    {/* CTA */}
                    <div className="text-center mt-12">
                        <Button size="lg" onClick={() => scrollToSection('contact')}>
                            Solicitar Orçamento
                        </Button>
                    </div>
                </div>
            </section>

            {/* Event Types Section — OCULTO temporariamente */}
            {/* <section className="py-20 bg-background relative z-10">
                <div className="container mx-auto px-4 md:px-6">
                    <div className="mb-12 border-l-4 border-primary pl-4">
                        <h2 className="font-display text-3xl font-bold text-text-main">Faça seu evento aqui</h2>
                    </div>

                    <div className="space-y-12">
                        <div className="bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow border border-gray-100 flex flex-col md:flex-row">
                            <div className="md:w-1/2 p-8 md:p-12 flex flex-col justify-center">
                                <span className="text-primary text-sm font-bold tracking-widest uppercase mb-2">O Grande Dia</span>
                                <h3 className="font-display text-3xl font-bold text-text-main mb-4">{getText('event_wedding_title', 'Casamentos')}</h3>
                                <p className="text-text-muted mb-6 text-lg">
                                    {getText('event_wedding_desc', 'Cerimônias ao ar livre com nosso famoso pergolado rústico. O cenário perfeito para o seu "sim".')}
                                </p>
                                <button onClick={() => scrollToSection('contact')} className="text-primary font-bold hover:underline self-start flex items-center gap-1">
                                    Saiba mais <span className="material-symbols-outlined text-sm">arrow_forward</span>
                                </button>
                            </div>
                            <div className="md:w-1/2 h-64 md:h-auto">
                                <img src={getText('event_wedding_img', 'https://images.unsplash.com/photo-1519225421980-715cb0202128?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80')} alt="Casamentos" className="w-full h-full object-cover" />
                            </div>
                        </div>

                        <div className="bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow border border-gray-100 flex flex-col md:flex-row-reverse">
                            <div className="md:w-1/2 p-8 md:p-12 flex flex-col justify-center">
                                <span className="text-primary text-sm font-bold tracking-widest uppercase mb-2">Celebração</span>
                                <h3 className="font-display text-3xl font-bold text-text-main mb-4">{getText('event_birthday_title', 'Aniversários')}</h3>
                                <p className="text-text-muted mb-6 text-lg">
                                    {getText('event_birthday_desc', 'Espaço amplo para festas infantis, debutantes e comemorações especiais.')}
                                </p>
                                <button onClick={() => scrollToSection('contact')} className="text-primary font-bold hover:underline self-start flex items-center gap-1">
                                    Saiba mais <span className="material-symbols-outlined text-sm">arrow_forward</span>
                                </button>
                            </div>
                            <div className="md:w-1/2 h-64 md:h-auto">
                                <img src={getText('event_birthday_img', 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80')} alt="Aniversários" className="w-full h-full object-cover" />
                            </div>
                        </div>

                        <div className="bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow border border-gray-100 flex flex-col md:flex-row">
                            <div className="md:w-1/2 p-8 md:p-12 flex flex-col justify-center">
                                <span className="text-primary text-sm font-bold tracking-widest uppercase mb-2">Empresas</span>
                                <h3 className="font-display text-3xl font-bold text-text-main mb-4">{getText('event_corporate_title', 'Corporativo')}</h3>
                                <p className="text-text-muted mb-6 text-lg">
                                    {getText('event_corporate_desc', 'Confraternizações de fim de ano, workshops e treinamentos em meio à natureza.')}
                                </p>
                                <button onClick={() => scrollToSection('contact')} className="text-primary font-bold hover:underline self-start flex items-center gap-1">
                                    Saiba mais <span className="material-symbols-outlined text-sm">arrow_forward</span>
                                </button>
                            </div>
                            <div className="md:w-1/2 h-64 md:h-auto">
                                <img src={getText('event_corporate_img', 'https://images.unsplash.com/photo-1511578314322-379afb476865?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80')} alt="Corporativo" className="w-full h-full object-cover" />
                            </div>
                        </div>
                    </div>
                </div>
            </section> */}

            {/* Structure Section */}
            <Section id="features" variant="soft" className="relative z-20">
                <div className="mb-12">
                    <h2 className="font-display text-3xl font-bold text-text-main">Nossa Estrutura</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {displayFeatures.map((feature: any) => (
                        <FeatureCard
                            key={feature.id}
                            icon={feature.icon}
                            title={feature.title}
                        />
                    ))}
                </div>
            </Section>

            {/* Gallery Section */}
            <Section id="gallery" variant="white">
                <div className="mb-8">
                    <h2 className="font-display text-3xl font-bold text-text-main">Galeria de Fotos</h2>
                </div>
                <Gallery />
            </Section>

            {/* How it Works Section */}
            <Section id="steps" variant="soft">
                <div className="text-center mb-16">
                    <h2 className="font-display text-3xl font-bold text-text-main">Como Funciona</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-5xl mx-auto">
                    {/* Step 1 */}
                    <div className="flex flex-col items-center text-center relative">
                        <div className="w-16 h-16 rounded-full bg-primary text-white flex items-center justify-center font-bold text-2xl mb-4 shadow-lg z-10">1</div>
                        <h3 className="font-bold text-xl mb-2 text-text-main">Solicite Orçamento</h3>
                        <p className="text-text-muted text-sm">
                            Preencha o formulário abaixo ou nos chame no WhatsApp.
                        </p>
                        <div className="hidden lg:block absolute top-8 left-1/2 w-full h-0.5 bg-gray-200 -z-0"></div>
                    </div>

                    {/* Step 2 */}
                    <div className="flex flex-col items-center text-center relative">
                        <div className="w-16 h-16 rounded-full bg-white text-primary border-2 border-primary flex items-center justify-center font-bold text-2xl mb-4 shadow-sm z-10">
                            <span className="material-symbols-outlined">calendar_month</span>
                        </div>
                        <h3 className="font-bold text-xl mb-2 text-text-main">Agende uma Visita</h3>
                        <p className="text-text-muted text-sm">
                            Venha conhecer pessoalmente nosso espaço encantador.
                        </p>
                        <div className="hidden lg:block absolute top-8 left-1/2 w-full h-0.5 bg-gray-200 -z-0"></div>
                    </div>

                    {/* Step 3 */}
                    <div className="flex flex-col items-center text-center relative">
                        <div className="w-16 h-16 rounded-full bg-white text-primary border-2 border-primary flex items-center justify-center font-bold text-2xl mb-4 shadow-sm z-10">
                            <span className="material-symbols-outlined">verified</span>
                        </div>
                        <h3 className="font-bold text-xl mb-2 text-text-main">Reserve a Data</h3>
                        <p className="text-text-muted text-sm">
                            Garanta a sua disponibilidade de pagamento.
                        </p>
                        <div className="hidden lg:block absolute top-8 left-1/2 w-full h-0.5 bg-gray-200 -z-0"></div>
                    </div>

                    {/* Step 4 */}
                    <div className="flex flex-col items-center text-center relative">
                        <div className="w-16 h-16 rounded-full bg-white text-primary border-2 border-primary flex items-center justify-center font-bold text-2xl mb-4 shadow-sm z-10">
                            <span className="material-symbols-outlined">celebration</span>
                        </div>
                        <h3 className="font-bold text-xl mb-2 text-text-main">Celebre!</h3>
                        <p className="text-text-muted text-sm">
                            Aproveite seu evento com tranquilidade e alegria.
                        </p>
                    </div>
                </div>
            </Section>



            {/* Testimonials Section — OCULTO temporariamente */}
            {/* <Section id="testimonials" variant="white">
                <div className="mb-12 border-l-4 border-primary pl-4">
                    <h2 className="font-display text-3xl font-bold text-text-main">O que dizem os clientes</h2>
                </div>
                <TestimonialCarousel />
            </Section> */}

            {/* Contact Section */}
            <ContactForm />

            {/* Footer */}
            <Footer />
        </div>
    );
};

export default Landing;