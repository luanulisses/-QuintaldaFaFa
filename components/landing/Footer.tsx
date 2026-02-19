import React from 'react';

const Footer: React.FC = () => {
    return (
        <footer className="bg-primary-dark text-white pt-20 pb-10 relative overflow-hidden">
            {/* Decor */}
            <div className="absolute top-0 left-0 w-full h-2 bg-accent opacity-50"></div>

            <div className="container mx-auto px-4 md:px-6">
                <div className="grid md:grid-cols-4 gap-12 mb-16">
                    {/* Brand */}
                    <div className="col-span-1 md:col-span-1">
                        <h2 className="font-display text-3xl mb-4">Quintal da Fafá</h2>
                        <p className="text-primary-100/80 text-sm leading-relaxed mb-6">
                            Um espaço rústico e acolhedor onde a natureza abraça seu momento especial.
                        </p>
                    </div>

                    {/* Links */}
                    <div>
                        <h4 className="font-bold text-accent mb-6 uppercase text-sm tracking-wider">Navegação</h4>
                        <ul className="space-y-3 text-sm text-white/80">
                            <li><a href="#" className="hover:text-white transition-colors">Início</a></li>
                            <li><a href="#espaco" className="hover:text-white transition-colors">O Espaço</a></li>
                            <li><a href="#galeria" className="hover:text-white transition-colors">Galeria</a></li>
                            <li><a href="#planos" className="hover:text-white transition-colors">Planos</a></li>
                        </ul>
                    </div>

                    {/* Contact */}
                    <div>
                        <h4 className="font-bold text-accent mb-6 uppercase text-sm tracking-wider">Contato</h4>
                        <ul className="space-y-3 text-sm text-white/80">
                            <li className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-accent text-lg">call</span>
                                (11) 99999-9999
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-accent text-lg">mail</span>
                                contato@quintaldafafa.com.br
                            </li>
                        </ul>
                    </div>

                    {/* Hours */}
                    <div>
                        <h4 className="font-bold text-accent mb-6 uppercase text-sm tracking-wider">Atendimento</h4>
                        <p className="text-sm text-white/80 mb-2">Segunda a Sexta</p>
                        <p className="font-bold text-white mb-4">09:00 - 18:00</p>
                        <p className="text-sm text-white/80 mb-2">Sábado</p>
                        <p className="font-bold text-white">09:00 - 13:00</p>
                    </div>
                </div>

                <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-white/40">
                    <p>&copy; {new Date().getFullYear()} Quintal da Fafá. Todos os direitos reservados.</p>
                    <div className="flex items-center gap-4">
                        <p>Desenvolvido com carinho.</p>
                        <a href="/admin" className="text-secondary hover:text-white transition-colors flex items-center gap-1 bg-white/5 px-2 py-1 rounded-md" title="Área Administrativa">
                            <span className="material-symbols-outlined text-sm">settings</span>
                            <span>Admin</span>
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
