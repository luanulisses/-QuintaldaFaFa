import React, { useState, useEffect } from 'react';
import { Link, Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { NotificationBell, UrgentEventBanner } from '../components/admin/EventAlerts';

const AdminLayout: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 768);

    useEffect(() => {
        const handleResize = () => setIsDesktop(window.innerWidth >= 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Close sidebar on route change (mobile)
    useEffect(() => {
        setIsSidebarOpen(false);
    }, [location.pathname]);

    const menuItems = [
        { name: 'Visão Geral', path: '/admin', icon: 'dashboard', end: true },
        { name: 'Orçamentos', path: '/admin/orcamentos', icon: 'request_quote' },
        { name: 'Agenda', path: '/admin/agenda', icon: 'calendar_month' },
        { name: 'Fluxo de Caixa', path: '/admin/financeiro', icon: 'payments' },
        { name: 'Relatórios', path: '/admin/relatorios', icon: 'analytics' },
        { name: 'Clientes', path: '/admin/clientes', icon: 'groups' },
        { name: 'Fornecedores', path: '/admin/fornecedores', icon: 'local_shipping' },
        { name: 'Conteúdo Site', path: '/admin/conteudo', icon: 'web' },
        { name: 'Galeria', path: '/admin/galeria', icon: 'photo_library' },
        { name: 'Depoimentos', path: '/admin/depoimentos', icon: 'reviews' },
        { name: 'Pacotes', path: '/admin/pacotes', icon: 'inventory_2' },
        { name: 'Configurações', path: '/admin/config', icon: 'settings' },
    ];

    const handleLogout = async () => {
        if (confirm('Deseja realmente sair?')) {
            await supabase.auth.signOut();
            localStorage.removeItem('admin_auth');
            navigate('/admin/login');
        }
    };

    const sidebarVisible = isDesktop || isSidebarOpen;

    return (
        <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#FAF7F5', fontFamily: 'inherit' }}>

            {/* Mobile overlay */}
            {!isDesktop && isSidebarOpen && (
                <div
                    onClick={() => setIsSidebarOpen(false)}
                    style={{
                        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
                        zIndex: 20, backdropFilter: 'blur(2px)'
                    }}
                />
            )}

            {/* Sidebar */}
            <aside style={{
                position: isDesktop ? 'relative' : 'fixed',
                top: 0, left: 0, bottom: 0,
                width: '256px',
                minWidth: '256px',
                background: '#fff',
                borderRight: '1px solid rgba(120,185,38,0.12)',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '2px 0 12px rgba(0,0,0,0.06)',
                zIndex: 30,
                transform: sidebarVisible ? 'translateX(0)' : 'translateX(-100%)',
                transition: 'transform 0.3s ease',
            }}>
                {/* Logo */}
                <div style={{ padding: '24px', borderBottom: '1px solid rgba(120,185,38,0.1)', textAlign: 'center' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ flex: 1 }}>
                            <h1 style={{ fontFamily: 'var(--font-display, Georgia)', fontSize: '22px', fontWeight: 700, color: '#78B926', margin: 0, lineHeight: 1.2 }}>
                                Quintal <br /><span style={{ color: '#5C6E56', fontSize: '18px' }}>da Fafá</span>
                            </h1>
                            <span style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '2px', color: '#8BA082', display: 'block', marginTop: '4px' }}>
                                Admin System
                            </span>
                        </div>
                        {!isDesktop && (
                            <button onClick={() => setIsSidebarOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#5C6E56' }}>
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Nav */}
                <nav style={{ flex: 1, overflowY: 'auto', padding: '16px 12px' }}>
                    {menuItems.map((item) => {
                        const isActive = item.end
                            ? location.pathname === item.path
                            : location.pathname.startsWith(item.path);
                        return (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                end={item.end}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    padding: '10px 16px',
                                    borderRadius: '12px',
                                    marginBottom: '4px',
                                    textDecoration: 'none',
                                    fontWeight: isActive ? 700 : 500,
                                    fontSize: '14px',
                                    color: isActive ? '#fff' : '#5C6E56',
                                    background: isActive ? '#78B926' : 'transparent',
                                    boxShadow: isActive ? '0 2px 8px rgba(120,185,38,0.3)' : 'none',
                                    transition: 'all 0.15s ease',
                                }}
                                onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = '#F0F7E8'; }}
                                onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                            >
                                <span className="material-symbols-outlined" style={{ fontSize: '20px', color: isActive ? '#fff' : '#78B926' }}>
                                    {item.icon}
                                </span>
                                <span>{item.name}</span>
                            </NavLink>
                        );
                    })}
                </nav>

                {/* Logout */}
                <div style={{ padding: '16px', borderTop: '1px solid rgba(120,185,38,0.1)' }}>
                    <button
                        onClick={handleLogout}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '12px',
                            width: '100%', padding: '10px 16px', borderRadius: '12px',
                            background: 'none', border: 'none', cursor: 'pointer',
                            color: '#e53e3e', fontSize: '14px', fontWeight: 600,
                            transition: 'background 0.15s',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.background = '#FFF5F5')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                    >
                        <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>logout</span>
                        Sair
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
                {/* Topbar */}
                <header style={{
                    background: 'rgba(255,255,255,0.9)',
                    backdropFilter: 'blur(10px)',
                    position: 'sticky', top: 0, zIndex: 10,
                    padding: '16px 24px',
                    borderBottom: '1px solid rgba(120,185,38,0.08)',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        {/* Hamburger (mobile only) */}
                        {!isDesktop && (
                            <button
                                onClick={() => setIsSidebarOpen(true)}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#78B926', padding: '4px' }}
                            >
                                <span className="material-symbols-outlined">menu</span>
                            </button>
                        )}
                        <h2 style={{ fontFamily: 'var(--font-display, Georgia)', fontSize: '20px', fontWeight: 700, color: '#2D3748', margin: 0 }}>
                            {menuItems.find(item =>
                                item.end ? location.pathname === item.path : location.pathname.startsWith(item.path)
                            )?.name || 'Dashboard'}
                        </h2>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Link
                            to="/"
                            target="_blank"
                            style={{
                                display: 'flex', alignItems: 'center', gap: '6px',
                                padding: '6px 14px', borderRadius: '20px',
                                color: '#5C6E56', textDecoration: 'none', fontSize: '13px', fontWeight: 700,
                                border: '1px solid rgba(120,185,38,0.2)',
                                background: 'transparent',
                                transition: 'all 0.15s',
                            }}
                        >
                            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>visibility</span>
                            Ver Site
                        </Link>
                        <NotificationBell />
                        <div style={{
                            width: '36px', height: '36px', borderRadius: '50%',
                            background: '#5C6E56', color: '#fff',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontWeight: 700, fontSize: '14px',
                        }}>A</div>
                    </div>
                </header>

                {/* Page Content */}
                <div style={{ padding: '24px 32px', flex: 1 }}>
                    <UrgentEventBanner />
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default AdminLayout;
