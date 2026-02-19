import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { supabase } from '../../lib/supabase';

const AdminLogin: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) throw error;

            if (data.session) {
                localStorage.setItem('admin_auth', 'true'); // Keep for legacy checks if any
                navigate('/admin');
            }
        } catch (err: any) {
            console.error('Login error:', err);
            setError('Falha no login. Verifique suas credenciais.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-primary/10">
                <div className="text-center mb-8">
                    <h1 className="font-display text-3xl font-bold text-primary mb-2">Quintal <span className="text-secondary">da Fafá</span></h1>
                    <p className="text-text-muted text-sm uppercase tracking-widest">Acesso Administrativo</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-6">
                    <div>
                        <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-2">E-mail</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl bg-surface-cream border border-primary/10 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-text-main font-bold tracking-widest"
                            placeholder="admin@quintaldafafa.com"
                            autoFocus
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-2">Senha</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => {
                                setPassword(e.target.value);
                                setError('');
                            }}
                            className="w-full px-4 py-3 rounded-xl bg-surface-cream border border-primary/10 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-text-main font-bold tracking-widest"
                            placeholder="••••••••"
                        />
                        {error && <p className="text-red-500 text-xs mt-2 font-bold flex items-center gap-1"><span className="material-symbols-outlined text-sm">error</span> {error}</p>}
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-3 rounded-xl shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Entrando...' : (
                            <>
                                <span className="material-symbols-outlined">lock_open</span>
                                Entrar no Sistema
                            </>
                        )}
                    </button>
                </form>

                <div className="mt-8 text-center">
                    <a href="/" className="text-text-muted/50 hover:text-text-main text-xs transition-colors flex items-center justify-center gap-1">
                        <span className="material-symbols-outlined text-sm">arrow_back</span>
                        Voltar para o site
                    </a>
                </div>
            </div>
        </div>
    );
};

export default AdminLogin;
