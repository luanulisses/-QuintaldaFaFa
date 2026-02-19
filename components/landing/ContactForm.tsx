import React, { useState, useMemo } from 'react';
import Button from './Button';
import { supabase } from '../../lib/supabase';

// Formata o número de telefone para (XX) XXXXX-XXXX
const formatPhone = (value: string): string => {
    // Remove tudo que não é dígito e limita a 11 dígitos
    const digits = value.replace(/\D/g, '').slice(0, 11);
    if (digits.length === 0) return '';
    if (digits.length <= 2) return `(${digits}`;
    if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
    // 11 dígitos: celular (XX) XXXXX-XXXX
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
};

// Retorna a data mínima permitida (hoje + 7 dias) no formato yyyy-MM-dd (fuso local)
const getMinDate = (): string => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    // Usa fuso horário local para evitar bug de UTC
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

// ⚠️ Número de WhatsApp do Quintal da Fafá (somente dígitos, com DDI 55)
const WHATSAPP_NUMBER = '5561998274390';

const ContactForm: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [phoneError, setPhoneError] = useState('');
    const [dateError, setDateError] = useState('');
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        date: '',
        guests: '100'
    });

    // useMemo: calcula apenas uma vez ao montar o componente
    const minDate = useMemo(() => getMinDate(), []);

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const formatted = formatPhone(e.target.value);
        setFormData({ ...formData, phone: formatted });

        const digits = formatted.replace(/\D/g, '');
        if (digits.length > 0 && digits.length < 10) {
            setPhoneError('Número incompleto. Use o formato (61) 99999-9999');
        } else if (digits.length === 0) {
            setPhoneError('');
        } else {
            setPhoneError('');
        }
    };

    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selected = e.target.value;
        setFormData({ ...formData, date: selected });
        if (selected && selected < minDate) {
            setDateError('A data deve ser com pelo menos 7 dias de antecedência.');
        } else {
            setDateError('');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const digits = formData.phone.replace(/\D/g, '');
        if (digits.length < 10) {
            setPhoneError('Por favor, informe um número de WhatsApp válido.');
            return;
        }
        if (formData.date && formData.date < minDate) {
            setDateError('A data deve ser com pelo menos 7 dias de antecedência.');
            return;
        }

        setLoading(true);

        try {
            const { error } = await supabase
                .from('leads')
                .insert([
                    {
                        name: formData.name,
                        phone: formData.phone,
                        event_date: formData.date || null,
                        guests: parseInt(formData.guests),
                        status: 'Novo',
                        source: 'Site'
                    }
                ]);

            if (error) throw error;

            setSuccess(true);
            setFormData({ name: '', phone: '', date: '', guests: '100' });
            setPhoneError('');
            setDateError('');
            setTimeout(() => setSuccess(false), 5000);

            // Abre WhatsApp do Quintal com mensagem personalizada
            const dataFormatada = formData.date
                ? new Date(formData.date + 'T12:00:00').toLocaleDateString('pt-BR')
                : 'a definir';
            const mensagem = [
                `Olá! 👋 Meu nome é *${formData.name}* e acabei de solicitar um orçamento pelo site do *Quintal da Fafá*.`,
                ``,
                `📅 *Data prevista:* ${dataFormatada}`,
                `👥 *Nº de convidados:* ${formData.guests}`,
                ``,
                `Aguardo o contato! 🎉`,
            ].join('\n');
            const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(mensagem)}`;
            window.open(url, '_blank');
        } catch (error) {
            console.error('Erro ao enviar:', error);
            alert('Ocorreu um erro ao enviar. Tente novamente ou nos chame no WhatsApp.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <section id="contact" className="w-full py-20 bg-[#F9FDF5] relative">
            <div className="container mx-auto px-4 md:px-6 relative z-10 flex justify-center">
                <div className="bg-surface-soft p-8 md:p-12 rounded-[2rem] shadow-sm max-w-xl w-full border border-secondary/20">
                    <div className="text-center mb-8">
                        <h2 className="font-display text-3xl font-bold text-secondary mb-2">Vamos conversar?</h2>
                        <p className="text-muted text-sm">
                            Receba um orçamento personalizado para o seu evento.
                        </p>
                    </div>

                    {success ? (
                        <div className="bg-green-100 border border-green-200 text-green-800 p-6 rounded-xl text-center">
                            <span className="material-symbols-outlined text-4xl mb-2 text-green-600">check_circle</span>
                            <h3 className="font-bold text-lg">Solicitação Enviada!</h3>
                            <p className="text-sm mt-1">Em breve entraremos em contato pelo WhatsApp.</p>
                            <button onClick={() => setSuccess(false)} className="mt-4 text-sm font-bold underline hover:text-green-900">Enviar outro</button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-[#5C6E56] uppercase tracking-wider ml-1">Nome Completo</label>
                                <input
                                    required
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl bg-white border border-[#D9EBC6] focus:border-[#78B926] focus:ring-2 focus:ring-[#78B926]/20 outline-none transition-all placeholder:text-gray-400"
                                    placeholder="Ex: Ana Souza"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-[#5C6E56] uppercase tracking-wider ml-1">WhatsApp</label>
                                <input
                                    required
                                    type="tel"
                                    value={formData.phone}
                                    onChange={handlePhoneChange}
                                    onBlur={() => {
                                        const digits = formData.phone.replace(/\D/g, '');
                                        if (digits.length > 0 && digits.length < 10) {
                                            setPhoneError('Número incompleto. Use o formato (61) 99999-9999');
                                        }
                                    }}
                                    className={`w-full px-4 py-3 rounded-xl bg-white border ${phoneError ? 'border-red-400 focus:border-red-500 focus:ring-red-200' : 'border-[#D9EBC6] focus:border-[#78B926] focus:ring-[#78B926]/20'} focus:ring-2 outline-none transition-all placeholder:text-gray-400`}
                                    placeholder="(61) 99999-9999"
                                    maxLength={15}
                                    inputMode="numeric"
                                />
                                {phoneError && (
                                    <p className="text-xs text-red-500 mt-1 ml-1">⚠️ {phoneError}</p>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-[#5C6E56] uppercase tracking-wider ml-1">Data Prevista</label>
                                    <input
                                        type="date"
                                        value={formData.date}
                                        min={minDate}
                                        onChange={handleDateChange}
                                        onBlur={(e) => {
                                            if (e.target.value && e.target.value < minDate) {
                                                setDateError('Mínimo 7 dias de antecedência.');
                                            }
                                        }}
                                        className={`w-full px-4 py-3 rounded-xl bg-white border ${dateError ? 'border-red-400 focus:border-red-500 focus:ring-red-200' : 'border-[#D9EBC6] focus:border-[#78B926] focus:ring-[#78B926]/20'} focus:ring-2 outline-none transition-all text-gray-600`}
                                    />
                                    {dateError && (
                                        <p className="text-xs text-red-500 mt-1 ml-1">⚠️ {dateError}</p>
                                    )}
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-[#5C6E56] uppercase tracking-wider ml-1">Nº Convidados</label>
                                    <select
                                        value={formData.guests}
                                        onChange={(e) => setFormData({ ...formData, guests: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl bg-white border border-[#D9EBC6] focus:border-[#78B926] focus:ring-2 focus:ring-[#78B926]/20 outline-none transition-all text-gray-600"
                                    >
                                        <option value="100">100</option>
                                        <option value="150">150</option>
                                        <option value="200">200</option>
                                        <option value="250">250</option>
                                        <option value="300">300</option>
                                    </select>
                                </div>
                            </div>

                            <div className="pt-2">
                                <Button
                                    fullWidth
                                    size="lg"
                                    type="submit"
                                    disabled={loading}
                                    className="bg-primary hover:bg-primary-dark text-white font-bold py-4 shadow-lg active:scale-95 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                                >
                                    {loading ? 'Enviando...' : (
                                        <>Solicitar Orçamento Grátis <span className="material-symbols-outlined ml-2 text-sm">arrow_forward</span></>
                                    )}
                                </Button>
                            </div>

                            <p className="text-center text-xs text-[#8BA082] mt-4">
                                Prometemos não enviar spam. Seus dados estão seguros.
                            </p>
                        </form>
                    )}
                </div>
            </div>
        </section>
    );
};

export default ContactForm;
