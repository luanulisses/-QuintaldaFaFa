import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';

interface ContractData {
    client: {
        name: string;
        cpf: string;
        phone: string;
        email: string;
        address: string;
        neighborhood: string;
        city: string;
        state: string;
        zipCode: string;
    };
    event: {
        type: string;
        date: string;
        startTime: string;
        endTime: string;
        guests: number | string;
        location: string;
        structure: string[];
    };
    menu: {
        mainDish: string;
        sides: string[];
        dessert: string[];
        drinks: string;
        observations: string;
    };
    payment: {
        pricePerPerson: number | string;
        baseGuests: number | string;
        deposit: number | string;
        depositDate: string;
        balanceDate: string;
        method: string;
        pixKey: string;
        observations: string;
    };
}

const INITIAL_DATA: ContractData = {
    client: { name: '', cpf: '', phone: '', email: '', address: '', neighborhood: '', city: '', state: 'DF', zipCode: '' },
    event: {
        type: '',
        date: '',
        startTime: '12:00',
        endTime: '17:00',
        guests: '',
        location: 'Quintal da Fafá',
        structure: ['Espaço', 'Mesas e Cadeiras', 'Tendas']
    },
    menu: {
        mainDish: 'Galeto Assado',
        sides: ['Arroz', 'Macarrão', 'Salada'],
        dessert: [],
        drinks: 'Não incluídas (por conta do cliente)',
        observations: ''
    },
    payment: {
        pricePerPerson: '',
        baseGuests: '',
        deposit: '',
        depositDate: '',
        balanceDate: '',
        method: 'PIX',
        pixKey: '000.000.000-00',
        observations: ''
    }
};

const STEPS = [
    { id: 'client', label: 'Cliente', icon: 'person' },
    { id: 'event', label: 'Evento', icon: 'celebration' },
    { id: 'menu', label: 'Cardápio', icon: 'restaurant' },
    { id: 'payment', label: 'Pagamento', icon: 'payments' },
    { id: 'review', label: 'Revisão', icon: 'visibility' },
];

const ContractGenerator: React.FC = () => {
    const [step, setStep] = useState(0);
    const [data, setData] = useState<ContractData>(INITIAL_DATA);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [newContractId, setNewContractId] = useState<string | null>(null);
    const [searchParams] = useSearchParams();

    // Menu Dynamic Options State
    const [mainDishOptions, setMainDishOptions] = useState(['Galeto Assado', 'Churrasco', 'Frango Grelhado', 'Porco Assado']);
    const [sidesOptions, setSidesOptions] = useState(['Arroz', 'Macarrão', 'Salada', 'Farofa', 'Feijão', 'Vinagrete', 'Batata Frita']);
    const [dessertOptions, setDessertOptions] = useState(['Bolo', 'Pudim', 'Docinhos', 'Frutas']);
    const [drinksOptions, setDrinksOptions] = useState(['Não incluídas (por conta do cliente)', 'Água + Refrigerante', 'Open Bar']);

    const printRef = useRef<HTMLDivElement>(null);
    const { id } = useParams();
    const navigate = useNavigate();

    useEffect(() => {
        if (id && id !== 'novo') {
            const fetchContract = async () => {
                const { data: contract, error } = await supabase
                    .from('contracts')
                    .select('contract_data')
                    .eq('id', id)
                    .single();

                if (contract && contract.contract_data) {
                    setData(contract.contract_data as ContractData);

                    // Go to review step if print is requested, but don't auto-open dialog
                    if (searchParams.get('print') === 'true') {
                        setStep(STEPS.length - 1);
                    }
                }
            };
            fetchContract();
        }
    }, [id, searchParams]);

    const totalValue = Math.max(Number(data.event.guests || 0), Number(data.payment.baseGuests || 0)) * Number(data.payment.pricePerPerson || 0);
    const balanceValue = totalValue - Number(data.payment.deposit || 0);

    const handleNext = () => setStep(s => Math.min(s + 1, STEPS.length - 1));
    const handleBack = () => setStep(s => Math.max(s - 1, 0));

    const updateData = (section: keyof ContractData, field: string, value: any) => {
        setData(prev => ({
            ...prev,
            [section]: {
                ...prev[section],
                [field]: value
            }
        }));
    };

    const toggleArrayItem = (section: keyof ContractData, field: string, item: string) => {
        const currentArr = (data[section] as any)[field] as string[];
        const newArr = currentArr.includes(item)
            ? currentArr.filter(i => i !== item)
            : [...currentArr, item];
        updateData(section, field, newArr);
    };

    const handlePrint = () => {
        window.print();
    };

    const resetForm = () => {
        setData(INITIAL_DATA);
        setStep(0);
        setSaveSuccess(false);
        navigate('/admin/contratos/novo');
    };

    const addMenuOption = (category: 'main' | 'sides' | 'dessert' | 'drinks') => {
        const newItem = window.prompt('Digite o nome da nova opção:');
        if (!newItem || newItem.trim() === '') return;

        const cleanItem = newItem.trim();

        if (category === 'main') {
            if (!mainDishOptions.includes(cleanItem)) {
                setMainDishOptions(prev => [...prev, cleanItem]);
                updateData('menu', 'mainDish', cleanItem);
            }
        } else if (category === 'sides') {
            if (!sidesOptions.includes(cleanItem)) {
                setSidesOptions(prev => [...prev, cleanItem]);
                toggleArrayItem('menu', 'sides', cleanItem);
            }
        } else if (category === 'dessert') {
            if (!dessertOptions.includes(cleanItem)) {
                setDessertOptions(prev => [...prev, cleanItem]);
                toggleArrayItem('menu', 'dessert', cleanItem);
            }
        } else if (category === 'drinks') {
            if (!drinksOptions.includes(cleanItem)) {
                setDrinksOptions(prev => [...prev, cleanItem]);
                updateData('menu', 'drinks', cleanItem);
            }
        }
    };

    const handleSave = async () => {
        if (!data.client.name) {
            alert('Por favor, preencha pelo menos o nome do cliente.');
            setStep(0);
            return;
        }

        setIsSaving(true);
        try {
            // 1. Salvar ou Atualizar no Cadastro de Cliente (leads)
            const clientPayload = {
                name: data.client.name,
                phone: data.client.phone,
                contact: data.client.phone || data.client.email,
                status: 'Fechado',
                notes: `Contrato gerado para ${data.event.type} em ${data.event.date}. ${data.payment.observations}`,
                contract_value: totalValue,
                event_date: data.event.date
            };

            // Tenta localizar o lead por telefone ou nome antes de criar/atualizar
            let { data: leadData } = await supabase
                .from('leads')
                .select('id')
                .or(`phone.eq.${data.client.phone},name.eq.${data.client.name}`)
                .maybeSingle();

            if (leadData) {
                // Atualiza lead existente
                await supabase.from('leads').update(clientPayload).eq('id', leadData.id);
            } else {
                // Cria novo lead
                const { data: nData } = await supabase.from('leads').insert([clientPayload]).select('id').maybeSingle();
                leadData = nData;
            }

            const finalLeadId = leadData?.id;

            // 2. Salvar na parte de Contratos
            const contractPayload: any = {
                lead_id: finalLeadId,
                client_name: data.client.name,
                client_cpf: data.client.cpf,
                event_date: data.event.date,
                total_value: totalValue,
                contract_data: data
            };

            if (id && id !== 'novo') {
                contractPayload.id = id;
            } else {
                // Fallback: se o banco não tiver default, geramos aqui para evitar erro de 'null id'
                contractPayload.id = crypto.randomUUID();
            }

            const { data: savedContract, error: contractError } = await supabase
                .from('contracts')
                .upsert([contractPayload])
                .select()
                .single();

            if (contractError) {
                alert(`Erro ao salvar na tabela de contratos: ${contractError.message}\nVerifique se o SQL foi executado corretamente.`);
                console.error('Erro contratos:', contractError);
                setIsSaving(false);
                return;
            } else {
                if (savedContract) {
                    setNewContractId(savedContract.id);
                }
                // 3. Alimentar Agenda (Eventos)
                try {
                    const agendaTypeRaw = data.event.type.toLowerCase();
                    let agendaType = 'other';
                    if (agendaTypeRaw.includes('aniver') || agendaTypeRaw.includes('infantil')) agendaType = 'birthday';
                    else if (agendaTypeRaw.includes('casa')) agendaType = 'wedding';
                    else if (agendaTypeRaw.includes('corp')) agendaType = 'corporate';

                    const eventDate = data.event.date; // YYYY-MM-DD
                    const startTime = data.event.startTime || '12:00';
                    const endTime = data.event.endTime || '17:00';
                    const eventTitle = `${data.event.type} - ${data.client.name}`;

                    const agendaPayload = {
                        title: eventTitle,
                        start_date: `${eventDate}T${startTime}:00`,
                        end_date: `${eventDate}T${endTime}:00`,
                        type: agendaType,
                        status: 'confirmed',
                        client_id: finalLeadId,
                        description: `Contrato: ${data.event.type}\nConvidados: ${data.event.guests}\nLocal: ${data.event.location}`
                    };

                    // Verifica se já existe um evento similar para evitar duplicatas sem depender de constraint unique
                    const { data: existingEvent } = await supabase
                        .from('events')
                        .select('id')
                        .eq('title', eventTitle)
                        .eq('start_date', `${eventDate}T${startTime}:00`)
                        .maybeSingle();

                    if (existingEvent) {
                        const { error: updateErr } = await supabase.from('events').update(agendaPayload).eq('id', existingEvent.id);
                        if (updateErr) console.error('Erro ao atualizar na agenda:', updateErr);
                    } else {
                        const { error: insertErr } = await supabase.from('events').insert([agendaPayload]);
                        if (insertErr) {
                            console.error('Erro ao inserir na agenda:', insertErr);
                            // Se falhar o insert por causa do constraint de enum, tentamos com 'other'
                            if (insertErr.message?.includes('check constraint')) {
                                await supabase.from('events').insert([{ ...agendaPayload, type: 'other' }]);
                            } else {
                                alert(`Atenção: Contrato salvo, mas não foi possível sincronizar com a agenda: ${insertErr.message}`);
                            }
                        }
                    }
                } catch (agendaErr) {
                    console.error('Erro crítico ao alimentar agenda:', agendaErr);
                }

                // 4. Alimentar Fluxo de Caixa (Financeiro)
                // Só adicionamos movimentos financeiros se for um novo contrato para evitar duplicidade
                if (!id || id === 'novo') {
                    const financialMovements = [];

                    // Entrada do Sinal
                    const depositAmt = Number(data.payment.deposit || 0);
                    if (depositAmt > 0) {
                        financialMovements.push({
                            type: 'Receita',
                            description: `Sinal - Contrato ${data.client.name} (${data.event.type})`,
                            amount: depositAmt,
                            date: data.payment.depositDate || new Date().toISOString().split('T')[0],
                            category: 'Sinal'
                        });
                    }

                    // Entrada do Saldo (Pendência futura)
                    if (balanceValue > 0) {
                        financialMovements.push({
                            type: 'Receita',
                            description: `Saldo - Contrato ${data.client.name} (${data.event.type})`,
                            amount: balanceValue,
                            date: data.payment.balanceDate || data.event.date,
                            category: 'Pagamento Final'
                        });
                    }

                    if (financialMovements.length > 0) {
                        const { error: finError } = await supabase
                            .from('financial_movements')
                            .insert(financialMovements);

                        if (finError) {
                            console.error('Erro ao alimentar financeiro:', finError);
                        }
                    }
                }

                setSaveSuccess(true);
                // Removido o alert e o navigate automático para mostrar a nova tela de sucesso
            }

        } catch (err) {
            console.error('Erro geral ao salvar:', err);
            alert('Erro ao salvar no sistema. Verifique a conexão com o banco.');
        } finally {
            setIsSaving(false);
        }
    };

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
    };

    const formatDate = (dateStr: string) => {
        if (!dateStr) return '__/__/____';
        const [y, m, d] = dateStr.split('-');
        return `${d}/${m}/${y}`;
    };

    return (
        <div className="flex flex-col h-full bg-[#FAF7F5] -m-8">
            {/* Header Sticky */}
            <div className="bg-[#5C2A0A] text-white p-4 flex items-center justify-between shadow-lg sticky top-0 z-20">
                <div className="flex items-center gap-3">
                    <div className="flex flex-col">
                        <h1 className="font-display text-xl font-bold leading-none">Quintal da Fafá</h1>
                        <span className="text-[10px] uppercase tracking-widest opacity-80">Buffet & Eventos</span>
                    </div>
                    <div className="h-8 w-px bg-white/20 mx-2" />
                    <h2 className="text-sm font-medium opacity-90 uppercase tracking-wider">Gerador de Contrato</h2>
                </div>

                {/* Step Indicators */}
                <div className="flex items-center gap-2 md:gap-8 overflow-x-auto no-scrollbar">
                    {STEPS.map((s, i) => (
                        <div key={s.id} className="flex items-center gap-2 shrink-0">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${i <= step ? 'bg-[#78B926] text-white shadow-[0_0_10px_rgba(120,185,38,0.4)]' : 'bg-white/10 text-white/50 border border-white/20'
                                }`}>
                                {i + 1}
                            </div>
                            <span className={`text-[11px] font-bold uppercase tracking-tight hidden sm:block ${i <= step ? 'text-white' : 'text-white/40'
                                }`}>
                                {s.label}
                            </span>
                            {i < STEPS.length - 1 && <div className="hidden md:block w-4 h-px bg-white/20" />}
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex flex-1 overflow-hidden">
                {/* Form Area */}
                <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
                    <div className="max-w-2xl mx-auto pb-20">
                        {step === 0 && (
                            <div className="animate-fade-in">
                                <h3 className="text-3xl font-display text-[#2D2420] mb-2">Dados do Cliente</h3>
                                <p className="text-[#5A2D0C] opacity-60 mb-8 border-b border-[#5A2D0C]/10 pb-4">Informações pessoais do contratante</p>

                                <div className="space-y-6">
                                    <div className="group">
                                        <label className="block text-[10px] font-bold uppercase tracking-wider text-[#5A2D0C] mb-1 group-focus-within:text-[#78B926] transition-colors">Nome Completo *</label>
                                        <input
                                            type="text"
                                            placeholder="Ex: João da Silva"
                                            className="w-full bg-white border border-[#E2DED0] rounded-xl px-4 py-3 outline-none focus:border-[#78B926] focus:ring-4 focus:ring-[#78B926]/5 transition-all"
                                            value={data.client.name}
                                            onChange={(e) => updateData('client', 'name', e.target.value)}
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="group">
                                            <label className="block text-[10px] font-bold uppercase tracking-wider text-[#5A2D0C] mb-1 group-focus-within:text-[#78B926]">CPF / CNPJ *</label>
                                            <input
                                                type="text"
                                                placeholder="000.000.000-00"
                                                className="w-full bg-white border border-[#E2DED0] rounded-xl px-4 py-3 outline-none focus:border-[#78B926] focus:ring-4 focus:ring-[#78B926]/5 transition-all"
                                                value={data.client.cpf}
                                                onChange={(e) => updateData('client', 'cpf', e.target.value)}
                                            />
                                        </div>
                                        <div className="group">
                                            <label className="block text-[10px] font-bold uppercase tracking-wider text-[#5A2D0C] mb-1 group-focus-within:text-[#78B926]">Telefone / WhatsApp *</label>
                                            <input
                                                type="text"
                                                placeholder="(61) 99635-1010"
                                                className="w-full bg-white border border-[#E2DED0] rounded-xl px-4 py-3 outline-none focus:border-[#78B926] focus:ring-4 focus:ring-[#78B926]/5 transition-all"
                                                value={data.client.phone}
                                                onChange={(e) => updateData('client', 'phone', e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    <div className="group">
                                        <label className="block text-[10px] font-bold uppercase tracking-wider text-[#5A2D0C] mb-1 group-focus-within:text-[#78B926]">E-mail</label>
                                        <input
                                            type="email"
                                            placeholder="email@exemplo.com"
                                            className="w-full bg-white border border-[#E2DED0] rounded-xl px-4 py-3 outline-none focus:border-[#78B926] focus:ring-4 focus:ring-[#78B926]/5 transition-all"
                                            value={data.client.email}
                                            onChange={(e) => updateData('client', 'email', e.target.value)}
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="group">
                                            <label className="block text-[10px] font-bold uppercase tracking-wider text-[#5A2D0C] mb-1 group-focus-within:text-[#78B926] transition-colors">Logradouro (Rua, Nº, Compl.)</label>
                                            <input
                                                type="text"
                                                placeholder="Ex: Rua das Flores, 12, Bloco A"
                                                className="w-full bg-white border border-[#E2DED0] rounded-xl px-4 py-3 outline-none focus:border-[#78B926] focus:ring-4 focus:ring-[#78B926]/5 transition-all"
                                                value={data.client.address}
                                                onChange={(e) => updateData('client', 'address', e.target.value)}
                                            />
                                        </div>
                                        <div className="group">
                                            <label className="block text-[10px] font-bold uppercase tracking-wider text-[#5A2D0C] mb-1 group-focus-within:text-[#78B926] transition-colors">Bairro</label>
                                            <input
                                                type="text"
                                                placeholder="Ex: Setor Central"
                                                className="w-full bg-white border border-[#E2DED0] rounded-xl px-4 py-3 outline-none focus:border-[#78B926] focus:ring-4 focus:ring-[#78B926]/5 transition-all"
                                                value={data.client.neighborhood}
                                                onChange={(e) => updateData('client', 'neighborhood', e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <div className="group col-span-1 md:col-span-1">
                                            <label className="block text-[10px] font-bold uppercase tracking-wider text-[#5A2D0C] mb-1 group-focus-within:text-[#78B926] transition-colors">CEP</label>
                                            <input
                                                type="text"
                                                placeholder="00000-000"
                                                className="w-full bg-white border border-[#E2DED0] rounded-xl px-4 py-3 outline-none focus:border-[#78B926] focus:ring-4 focus:ring-[#78B926]/5 transition-all"
                                                value={data.client.zipCode}
                                                onChange={(e) => updateData('client', 'zipCode', e.target.value)}
                                            />
                                        </div>
                                        <div className="group col-span-1 md:col-span-2">
                                            <label className="block text-[10px] font-bold uppercase tracking-wider text-[#5A2D0C] mb-1 group-focus-within:text-[#78B926] transition-colors">Cidade</label>
                                            <input
                                                type="text"
                                                placeholder="Cidade"
                                                className="w-full bg-white border border-[#E2DED0] rounded-xl px-4 py-3 outline-none focus:border-[#78B926] focus:ring-4 focus:ring-[#78B926]/5 transition-all"
                                                value={data.client.city}
                                                onChange={(e) => updateData('client', 'city', e.target.value)}
                                            />
                                        </div>
                                        <div className="group col-span-2 md:col-span-1">
                                            <label className="block text-[10px] font-bold uppercase tracking-wider text-[#5A2D0C] mb-1 group-focus-within:text-[#78B926] transition-colors">UF</label>
                                            <input
                                                type="text"
                                                placeholder="UF"
                                                maxLength={2}
                                                className="w-full bg-white border border-[#E2DED0] rounded-xl px-4 py-3 outline-none focus:border-[#78B926] focus:ring-4 focus:ring-[#78B926]/5 transition-all uppercase"
                                                value={data.client.state}
                                                onChange={(e) => updateData('client', 'state', e.target.value.toUpperCase())}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {step === 1 && (
                            <div className="animate-fade-in">
                                <h3 className="text-3xl font-display text-[#2D2420] mb-2">Dados do Evento</h3>
                                <p className="text-[#5A2D0C] opacity-60 mb-8 border-b border-[#5A2D0C]/10 pb-4">Detalhes do dia e local do evento</p>

                                <div className="space-y-6">
                                    <div className="group">
                                        <label className="block text-[10px] font-bold uppercase tracking-wider text-[#5A2D0C] mb-1">Tipo / Nome do Evento *</label>
                                        <input
                                            type="text"
                                            placeholder="Ex: Aniversário 50 anos, Casamento, Formatura..."
                                            className="w-full bg-white border border-[#E2DED0] rounded-xl px-4 py-3 outline-none focus:border-[#78B926] focus:ring-4 focus:ring-[#78B926]/5 transition-all"
                                            value={data.event.type}
                                            onChange={(e) => updateData('event', 'type', e.target.value)}
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="group">
                                            <label className="block text-[10px] font-bold uppercase tracking-wider text-[#5A2D0C] mb-1">Data do Evento *</label>
                                            <input
                                                type="date"
                                                className="w-full bg-white border border-[#E2DED0] rounded-xl px-4 py-3 outline-none focus:border-[#78B926] transition-all"
                                                value={data.event.date}
                                                onChange={(e) => updateData('event', 'date', e.target.value)}
                                            />
                                        </div>
                                        <div className="group">
                                            <label className="block text-[10px] font-bold uppercase tracking-wider text-[#5A2D0C] mb-1">Horário Início *</label>
                                            <input
                                                type="time"
                                                className="w-full bg-white border border-[#E2DED0] rounded-xl px-4 py-3 outline-none focus:border-[#78B926] transition-all"
                                                value={data.event.startTime}
                                                onChange={(e) => updateData('event', 'startTime', e.target.value)}
                                            />
                                        </div>
                                        <div className="group">
                                            <label className="block text-[10px] font-bold uppercase tracking-wider text-[#5A2D0C] mb-1">Horário Término *</label>
                                            <input
                                                type="time"
                                                className="w-full bg-white border border-[#E2DED0] rounded-xl px-4 py-3 outline-none focus:border-[#78B926] transition-all"
                                                value={data.event.endTime}
                                                onChange={(e) => updateData('event', 'endTime', e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="group">
                                            <label className="block text-[10px] font-bold uppercase tracking-wider text-[#5A2D0C] mb-1">Nº de Convidados *</label>
                                            <input
                                                type="number"
                                                className="w-full bg-white border border-[#E2DED0] rounded-xl px-4 py-3 outline-none focus:border-[#78B926] transition-all"
                                                value={data.event.guests}
                                                onFocus={(e) => e.target.select()}
                                                onChange={(e) => {
                                                    const val = e.target.value === '' ? '' : parseInt(e.target.value);
                                                    setData(prev => ({
                                                        ...prev,
                                                        event: { ...prev.event, guests: val },
                                                        payment: { ...prev.payment, baseGuests: val }
                                                    }));
                                                }}
                                            />
                                        </div>
                                        <div className="group">
                                            <label className="block text-[10px] font-bold uppercase tracking-wider text-[#5A2D0C] mb-1">Local do Evento</label>
                                            <input
                                                type="text"
                                                placeholder="Endereço ou nome do espaço"
                                                className="w-full bg-white border border-[#E2DED0] rounded-xl px-4 py-3 outline-none focus:border-[#78B926] transition-all"
                                                value={data.event.location}
                                                onChange={(e) => updateData('event', 'location', e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    <div className="group">
                                        <label className="block text-[10px] font-bold uppercase tracking-wider text-[#5A2D0C] mb-3">Estrutura Inclusa</label>
                                        <div className="flex flex-wrap gap-2">
                                            {['Espaço', 'Mesas e Cadeiras', 'Tendas', 'Palco', 'Gerador', 'Decoração', 'Som'].map(item => (
                                                <button
                                                    key={item}
                                                    onClick={() => toggleArrayItem('event', 'structure', item)}
                                                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${data.event.structure.includes(item)
                                                        ? 'bg-[#78B926] text-white border-[#78B926] shadow-md transform scale-105'
                                                        : 'bg-white text-[#5A2D0C] border-[#E2DED0] hover:border-[#78B926]'
                                                        }`}
                                                >
                                                    {data.event.structure.includes(item) ? '✓ ' : ''}{item}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {step === 2 && (
                            <div className="animate-fade-in">
                                <h3 className="text-3xl font-display text-[#2D2420] mb-2">Cardápio</h3>
                                <p className="text-[#5A2D0C] opacity-60 mb-8 border-b border-[#5A2D0C]/10 pb-4">Defina as opções de comida e bebida</p>

                                <div className="space-y-8">
                                    <div className="group">
                                        <div className="flex items-center justify-between mb-3">
                                            <label className="block text-[10px] font-bold uppercase tracking-wider text-[#5A2D0C]">Prato Principal *</label>
                                            <button
                                                onClick={() => addMenuOption('main')}
                                                className="w-8 h-8 rounded-lg bg-[#5C2A0A]/10 text-[#5C2A0A] flex items-center justify-center hover:bg-[#5C2A0A] hover:text-white transition-all shadow-sm group/btn"
                                                title="Adicionar outra opção"
                                            >
                                                <span className="material-symbols-outlined text-xl font-bold">add</span>
                                            </button>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {mainDishOptions.map(item => (
                                                <button
                                                    key={item}
                                                    onClick={() => updateData('menu', 'mainDish', item)}
                                                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${data.menu.mainDish === item
                                                        ? 'bg-[#5C2A0A] text-white border-[#5C2A0A] shadow-md transform scale-105'
                                                        : 'bg-white text-[#5A2D0C] border-[#E2DED0] hover:border-[#5C2A0A]'
                                                        }`}
                                                >
                                                    {data.menu.mainDish === item ? '✓ ' : ''}{item}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="group">
                                        <div className="flex items-center justify-between mb-3">
                                            <label className="block text-[10px] font-bold uppercase tracking-wider text-[#5A2D0C]">Acompanhamentos</label>
                                            <button
                                                onClick={() => addMenuOption('sides')}
                                                className="w-8 h-8 rounded-lg bg-[#BC6E2E]/10 text-[#BC6E2E] flex items-center justify-center hover:bg-[#BC6E2E] hover:text-white transition-all shadow-sm"
                                                title="Adicionar outra opção"
                                            >
                                                <span className="material-symbols-outlined text-xl font-bold">add</span>
                                            </button>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {sidesOptions.map(item => (
                                                <button
                                                    key={item}
                                                    onClick={() => toggleArrayItem('menu', 'sides', item)}
                                                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${data.menu.sides.includes(item)
                                                        ? 'bg-[#BC6E2E] text-white border-[#BC6E2E] shadow-sm'
                                                        : 'bg-white text-[#5A2D0C] border-[#E2DED0]'
                                                        }`}
                                                >
                                                    {item}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="group">
                                        <div className="flex items-center justify-between mb-3">
                                            <label className="block text-[10px] font-bold uppercase tracking-wider text-[#5A2D0C]">Sobremesa</label>
                                            <button
                                                onClick={() => addMenuOption('dessert')}
                                                className="w-8 h-8 rounded-lg bg-[#EDB660]/10 text-[#EDB660] flex items-center justify-center hover:bg-[#EDB660] hover:text-white transition-all shadow-sm"
                                                title="Adicionar outra opção"
                                            >
                                                <span className="material-symbols-outlined text-xl font-bold">add</span>
                                            </button>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {dessertOptions.map(item => (
                                                <button
                                                    key={item}
                                                    onClick={() => toggleArrayItem('menu', 'dessert', item)}
                                                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${data.menu.dessert.includes(item)
                                                        ? 'bg-[#EDB660] text-white border-[#EDB660]'
                                                        : 'bg-white text-[#5A2D0C] border-[#E2DED0]'
                                                        }`}
                                                >
                                                    {item}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="group">
                                        <div className="flex items-center justify-between mb-3">
                                            <label className="block text-[10px] font-bold uppercase tracking-wider text-[#5A2D0C]">Bebidas (incluídas no contrato?)</label>
                                            <button
                                                onClick={() => addMenuOption('drinks')}
                                                className="w-8 h-8 rounded-lg bg-[#78B926]/10 text-[#78B926] flex items-center justify-center hover:bg-[#78B926] hover:text-white transition-all shadow-sm"
                                                title="Adicionar outra opção"
                                            >
                                                <span className="material-symbols-outlined text-xl font-bold">add</span>
                                            </button>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {drinksOptions.map(item => (
                                                <button
                                                    key={item}
                                                    onClick={() => updateData('menu', 'drinks', item)}
                                                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${data.menu.drinks === item
                                                        ? 'bg-[#78B926] text-white border-[#78B926]'
                                                        : 'bg-white text-[#5A2D0C] border-[#E2DED0]'
                                                        }`}
                                                >
                                                    {item}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="group">
                                        <label className="block text-[10px] font-bold uppercase tracking-wider text-[#5A2D0C] mb-1">Observações do Cardápio</label>
                                        <textarea
                                            placeholder="Restrições alimentares, pedidos especiais, etc."
                                            className="w-full bg-white border border-[#E2DED0] rounded-xl px-4 py-3 outline-none focus:border-[#78B926] transition-all h-24 resize-none"
                                            value={data.menu.observations}
                                            onChange={(e) => updateData('menu', 'observations', e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {step === 3 && (
                            <div className="animate-fade-in">
                                <h3 className="text-3xl font-display text-[#2D2420] mb-2">Valores e Pagamento</h3>
                                <p className="text-[#5A2D0C] opacity-60 mb-8 border-b border-[#5A2D0C]/10 pb-4">Defina os valores e condições de pagamento</p>

                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="group">
                                            <label className="block text-[10px] font-bold uppercase tracking-wider text-[#5A2D0C] mb-1">Valor por pessoa (R$) *</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                className="w-full bg-white border border-[#E2DED0] rounded-xl px-4 py-3 outline-none focus:border-[#78B926] transition-all font-bold text-lg"
                                                value={data.payment.pricePerPerson}
                                                onFocus={(e) => e.target.select()}
                                                onChange={(e) => updateData('payment', 'pricePerPerson', e.target.value === '' ? '' : parseFloat(e.target.value))}
                                            />
                                        </div>
                                        <div className="group">
                                            <label className="block text-[10px] font-bold uppercase tracking-wider text-[#5A2D0C] mb-1">Pacote Base (Nº Pessoas)</label>
                                            <input
                                                type="number"
                                                className="w-full bg-white border border-[#E2DED0] rounded-xl px-4 py-3 outline-none focus:border-[#78B926] transition-all"
                                                value={data.payment.baseGuests}
                                                onFocus={(e) => e.target.select()}
                                                onChange={(e) => updateData('payment', 'baseGuests', e.target.value === '' ? '' : parseInt(e.target.value))}
                                            />
                                            <p className="text-[10px] text-[#5A2D0C]/60 mt-1 italic">Acima deste número: {formatCurrency(data.payment.pricePerPerson)} por excedente</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="group">
                                            <label className="block text-[10px] font-bold uppercase tracking-wider text-[#5A2D0C] mb-1">Valor do Sinal (R$) *</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                className="w-full bg-white border border-[#E2DED0] rounded-xl px-4 py-3 outline-none focus:border-[#78B926] transition-all"
                                                value={data.payment.deposit}
                                                onFocus={(e) => e.target.select()}
                                                onChange={(e) => updateData('payment', 'deposit', e.target.value === '' ? '' : parseFloat(e.target.value))}
                                            />
                                        </div>
                                        <div className="group">
                                            <label className="block text-[10px] font-bold uppercase tracking-wider text-[#5A2D0C] mb-1">Data do Sinal</label>
                                            <input
                                                type="date"
                                                className="w-full bg-white border border-[#E2DED0] rounded-xl px-4 py-3 outline-none focus:border-[#78B926] transition-all"
                                                value={data.payment.depositDate}
                                                onChange={(e) => updateData('payment', 'depositDate', e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="group">
                                            <label className="block text-[10px] font-bold uppercase tracking-wider text-[#5A2D0C] mb-1">Forma de Pagamento</label>
                                            <select
                                                className="w-full bg-white border border-[#E2DED0] rounded-xl px-4 py-3 outline-none focus:border-[#78B926] transition-all"
                                                value={data.payment.method}
                                                onChange={(e) => updateData('payment', 'method', e.target.value)}
                                            >
                                                <option value="PIX">PIX</option>
                                                <option value="Dinheiro">Dinheiro</option>
                                                <option value="Cartão de Crédito">Cartão de Crédito</option>
                                                <option value="Transferência">Transferência Bancária</option>
                                            </select>
                                        </div>
                                        <div className="group">
                                            <label className="block text-[10px] font-bold uppercase tracking-wider text-[#5A2D0C] mb-1">Data Pagamento Saldo</label>
                                            <input
                                                type="date"
                                                className="w-full bg-white border border-[#E2DED0] rounded-xl px-4 py-3 outline-none focus:border-[#78B926] transition-all"
                                                value={data.payment.balanceDate}
                                                onChange={(e) => updateData('payment', 'balanceDate', e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    <div className="group">
                                        <label className="block text-[10px] font-bold uppercase tracking-wider text-[#5A2D0C] mb-1">Chave PIX / Dados Bancários</label>
                                        <input
                                            type="text"
                                            placeholder="CPF: 000.000.000-00 ou banco/agência/conta"
                                            className="w-full bg-white border border-[#E2DED0] rounded-xl px-4 py-3 outline-none focus:border-[#78B926] transition-all"
                                            value={data.payment.pixKey}
                                            onChange={(e) => updateData('payment', 'pixKey', e.target.value)}
                                        />
                                    </div>

                                    <div className="group">
                                        <label className="block text-[10px] font-bold uppercase tracking-wider text-[#5A2D0C] mb-1">Observações de Pagamento</label>
                                        <textarea
                                            placeholder="Parcelamentos, condições especiais..."
                                            className="w-full bg-white border border-[#E2DED0] rounded-xl px-4 py-3 outline-none focus:border-[#78B926] transition-all h-24 resize-none"
                                            value={data.payment.observations}
                                            onChange={(e) => updateData('payment', 'observations', e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {step === 4 && (
                            <div className="animate-fade-in">
                                <h3 className="text-3xl font-display text-[#2D2420] mb-2">Revisão Final</h3>
                                <p className="text-[#5A2D0C] opacity-60 mb-8 border-b border-[#5A2D0C]/10 pb-4">Confirme os dados antes de gerar o contrato</p>

                                <div className="space-y-4">
                                    <div className="bg-white/50 border border-[#E2DED0] rounded-2xl p-6">
                                        <h4 className="flex items-center gap-2 text-[#5A2D0C] font-bold text-xs uppercase tracking-widest mb-4">
                                            <span className="material-symbols-outlined text-sm">person</span> Cliente
                                        </h4>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 text-sm">
                                            <p><span className="font-bold opacity-60">Nome:</span> {data.client.name || '—'}</p>
                                            <p><span className="font-bold opacity-60">CPF/CNPJ:</span> {data.client.cpf || '—'}</p>
                                            <p><span className="font-bold opacity-60">Tel:</span> {data.client.phone || '—'}</p>
                                            <p><span className="font-bold opacity-60">Email:</span> {data.client.email || '—'}</p>
                                            <p className="sm:col-span-2"><span className="font-bold opacity-60">Endereço:</span> {data.client.address || '—'}</p>
                                        </div>
                                    </div>

                                    <div className="bg-white/50 border border-[#E2DED0] rounded-2xl p-6">
                                        <h4 className="flex items-center gap-2 text-[#5A2D0C] font-bold text-xs uppercase tracking-widest mb-4">
                                            <span className="material-symbols-outlined text-sm">celebration</span> Evento
                                        </h4>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 text-sm">
                                            <p className="sm:col-span-2"><span className="font-bold opacity-60">Título:</span> {data.event.type || '—'}</p>
                                            <p><span className="font-bold opacity-60">Data:</span> {formatDate(data.event.date)}</p>
                                            <p><span className="font-bold opacity-60">Horário:</span> {data.event.startTime} às {data.event.endTime}</p>
                                            <p><span className="font-bold opacity-60">Convidados:</span> {data.event.guests}</p>
                                            <p><span className="font-bold opacity-60">Local:</span> {data.event.location}</p>
                                            <p className="sm:col-span-2"><span className="font-bold opacity-60">Estrutura:</span> {data.event.structure.join(', ')}</p>
                                        </div>
                                    </div>

                                    <div className="bg-white/50 border border-[#E2DED0] rounded-2xl p-6">
                                        <h4 className="flex items-center gap-2 text-[#5A2D0C] font-bold text-xs uppercase tracking-widest mb-4">
                                            <span className="material-symbols-outlined text-sm">restaurant</span> Cardápio
                                        </h4>
                                        <div className="grid grid-cols-1 gap-y-2 text-sm">
                                            <p><span className="font-bold opacity-60">Principal:</span> {data.menu.mainDish}</p>
                                            <p><span className="font-bold opacity-60">Acomp:</span> {data.menu.sides.join(', ') || 'Não selecionada'}</p>
                                            <p><span className="font-bold opacity-60">Sobremesa:</span> {data.menu.dessert.join(', ') || 'Não selecionada'}</p>
                                            <p><span className="font-bold opacity-60">Bebidas:</span> {data.menu.drinks}</p>
                                        </div>
                                    </div>

                                    <div className="bg-[#78B926]/5 border border-[#78B926]/20 rounded-2xl p-6">
                                        <h4 className="flex items-center gap-2 text-[#78B926] font-bold text-xs uppercase tracking-widest mb-4">
                                            <span className="material-symbols-outlined text-sm">payments</span> Pagamento
                                        </h4>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 text-sm">
                                            <p className="text-lg font-bold text-[#5A2D0C]">Total: {formatCurrency(totalValue)}</p>
                                            <p><span className="font-bold opacity-60">Forma:</span> {data.payment.method}</p>
                                            <p><span className="font-bold opacity-60">Sinal:</span> {formatCurrency(data.payment.deposit)} em {formatDate(data.payment.depositDate)}</p>
                                            <p><span className="font-bold opacity-60">Saldo:</span> {formatCurrency(balanceValue)} até {formatDate(data.payment.balanceDate)}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Preview Panel */}
                <div className="hidden lg:flex w-[400px] bg-white border-l border-[#E2DED0] flex-col shadow-2xl relative z-10">
                    <div className="p-6 border-b border-[#E2DED0] flex items-center justify-between bg-[#FAF7F5]">
                        <h3 className="font-display text-[#5A2D0C] font-bold flex items-center gap-2">
                            <span className="material-symbols-outlined text-[#78B926]">description</span>
                            Resumo em tempo real
                        </h3>
                        {/* Status bar */}
                        <div className="h-1.5 w-24 bg-[#E2DED0] rounded-full overflow-hidden">
                            <div
                                className="h-full bg-[#78B926] transition-all duration-500"
                                style={{ width: `${(step + 1) * 20}%` }}
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-white">
                        <div className="space-y-8 animate-fade-in">
                            {/* Section: Cliente */}
                            <div className="space-y-3">
                                <span className="text-[10px] font-bold uppercase tracking-[.2em] text-[#78B926]">Cliente</span>
                                <div className="pl-4 border-l-2 border-[#78B926]/20 space-y-1">
                                    <p className="text-[11px] font-bold text-[#5A2D0C] uppercase tracking-wider opacity-60">Nome</p>
                                    <p className="text-sm font-medium text-[#2D2420]">{data.client.name || '—'}</p>

                                    <p className="text-[11px] font-bold text-[#5A2D0C] uppercase tracking-wider opacity-60 mt-3">CPF/CNPJ</p>
                                    <p className="text-sm font-medium text-[#2D2420]">{data.client.cpf || '—'}</p>

                                    <p className="text-[11px] font-bold text-[#5A2D0C] uppercase tracking-wider opacity-60 mt-3">Telefone</p>
                                    <p className="text-sm font-medium text-[#2D2420]">{data.client.phone || '—'}</p>

                                    <p className="text-[11px] font-bold text-[#5A2D0C] uppercase tracking-wider opacity-60 mt-3">E-Mail</p>
                                    <p className="text-sm font-medium text-[#2D2420]">{data.client.email || '—'}</p>
                                </div>
                            </div>

                            <hr className="border-t border-dashed border-[#E2DED0]" />

                            {/* Section: Evento */}
                            <div className="space-y-3">
                                <span className="text-[10px] font-bold uppercase tracking-[.2em] text-[#BC6E2E]">Evento</span>
                                <div className="pl-4 border-l-2 border-[#BC6E2E]/20 space-y-1">
                                    <p className="text-[11px] font-bold text-[#5A2D0C] uppercase tracking-wider opacity-60">Evento</p>
                                    <p className="text-sm font-medium text-[#2D2420]">{data.event.type || '—'}</p>

                                    <p className="text-[11px] font-bold text-[#5A2D0C] uppercase tracking-wider opacity-60 mt-3">Data</p>
                                    <p className="text-sm font-medium text-[#2D2420]">{formatDate(data.event.date)}</p>

                                    <p className="text-[11px] font-bold text-[#5A2D0C] uppercase tracking-wider opacity-60 mt-3">Horário</p>
                                    <p className="text-sm font-bold text-[#2D2420]">{data.event.startTime} às {data.event.endTime}</p>

                                    <p className="text-[11px] font-bold text-[#5A2D0C] uppercase tracking-wider opacity-60 mt-3">Convidados</p>
                                    <p className="text-sm font-medium text-[#2D2420]">{data.event.guests}</p>

                                    <p className="text-[11px] font-bold text-[#5A2D0C] uppercase tracking-wider opacity-60 mt-3">Estrutura</p>
                                    <p className="text-[11px] leading-relaxed text-[#2D2420]">{data.event.structure.join(', ')}</p>
                                </div>
                            </div>

                            <hr className="border-t border-dashed border-[#E2DED0]" />

                            {/* Section: Cardápio */}
                            <div className="space-y-3">
                                <span className="text-[10px] font-bold uppercase tracking-[.2em] text-[#BC6E2E]">Cardápio</span>
                                <div className="pl-4 border-l-2 border-[#BC6E2E]/20 space-y-1">
                                    <p className="text-[11px] font-bold text-[#5A2D0C] uppercase tracking-wider opacity-60">Prato Principal</p>
                                    <p className="text-sm font-bold text-[#5C2A0A]">{data.menu.mainDish}</p>

                                    <p className="text-[11px] font-bold text-[#5A2D0C] uppercase tracking-wider opacity-60 mt-3">Acompanhamentos</p>
                                    <p className="text-[11px] leading-relaxed text-[#2D2420]">{data.menu.sides.join(', ')}</p>

                                    <p className="text-[11px] font-bold text-[#5A2D0C] uppercase tracking-wider opacity-60 mt-3">Bebidas</p>
                                    <p className="text-[11px] leading-relaxed text-[#2D2420]">{data.menu.drinks}</p>
                                </div>
                            </div>

                            <hr className="border-t border-dashed border-[#E2DED0]" />

                            {/* Section: Pagamento */}
                            <div className="space-y-3 pb-8">
                                <span className="text-[10px] font-bold uppercase tracking-[.2em] text-[#BC6E2E]">Pagamento</span>
                                <div className="pl-4 border-l-2 border-[#BC6E2E]/20 space-y-1">
                                    <p className="text-[11px] font-bold text-[#5A2D0C] uppercase tracking-wider opacity-60">Valor/Pessoa</p>
                                    <p className="text-sm font-bold text-[#2D2420]">{formatCurrency(data.payment.pricePerPerson)}</p>

                                    <p className="text-[11px] font-bold text-[#5A2D0C] uppercase tracking-wider opacity-60 mt-3">Sinal</p>
                                    <p className="text-sm font-medium text-[#2D2420]">{formatCurrency(data.payment.deposit) || '—'}</p>

                                    <p className="text-[11px] font-bold text-[#5A2D0C] uppercase tracking-wider opacity-60 mt-3">Forma</p>
                                    <p className="text-sm font-bold text-[#78B926]">{data.payment.method}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Quick Stats Footer */}
                    <div className="p-6 bg-[#5C2A0A] text-white">
                        <div className="flex justify-between items-end">
                            <div>
                                <p className="text-[10px] uppercase tracking-widest opacity-60">Valor Total Estimado</p>
                                <h4 className="text-3xl font-display font-bold leading-none">{formatCurrency(totalValue)}</h4>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] uppercase tracking-widest opacity-60">Saldo Aberto</p>
                                <p className="text-lg font-bold text-[#78B926]">{formatCurrency(balanceValue)}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Sticky Action Footer */}
            <div className="bg-white border-t border-[#E2DED0] p-4 flex items-center justify-center gap-4 fixed bottom-0 left-0 right-0 z-30 lg:pr-[400px]">
                {step > 0 && (
                    <button
                        onClick={handleBack}
                        className="px-8 py-3 rounded-xl border-2 border-[#5C2A0A] text-[#5C2A0A] font-bold text-sm flex items-center gap-2 hover:bg-[#5C2A0A]/5 transition-all"
                    >
                        ← Voltar
                    </button>
                )}

                {step < STEPS.length - 1 ? (
                    <button
                        onClick={handleNext}
                        disabled={step === 0 && !data.client.name}
                        className="px-12 py-3 rounded-xl bg-[#5C2A0A] text-white font-bold text-sm flex items-center gap-2 hover:bg-[#3D1C07] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-[#5C2A0A]/20"
                    >
                        Próximo →
                    </button>
                ) : (
                    <div className="flex flex-col sm:flex-row gap-3">
                        {saveSuccess ? (
                            <button
                                onClick={resetForm}
                                className="px-8 py-3 rounded-xl bg-[#BC6E2E] text-white font-bold text-sm flex items-center gap-2 hover:bg-[#8F4114] transition-all shadow-xl shadow-[#BC6E2E]/20 animate-pulse"
                            >
                                <span className="material-symbols-outlined text-lg">add_circle</span>
                                Criar Novo Contrato
                            </button>
                        ) : (
                            <button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="px-8 py-3 rounded-xl bg-[#5C2A0A] text-white font-bold text-sm flex items-center gap-2 hover:bg-[#3D1C07] transition-all shadow-xl shadow-[#5C2A0A]/20 disabled:opacity-50"
                            >
                                <span className="material-symbols-outlined text-lg">save</span>
                                {isSaving ? 'Salvando...' : 'Salvar no Sistema'}
                            </button>
                        )}
                        <button
                            onClick={handlePrint}
                            className="px-8 py-3 rounded-xl bg-[#78B926] text-white font-bold text-sm flex items-center gap-2 hover:bg-[#5D8F1D] transition-all shadow-xl shadow-[#78B926]/20"
                        >
                            <span className="material-symbols-outlined text-lg">description</span>
                            Gerar Contrato (PDF)
                        </button>

                        <button
                            onClick={() => {
                                const params = new URLSearchParams({
                                    client_name: data.client.name,
                                    client_document: data.client.cpf,
                                    client_email: data.client.email,
                                    client_phone: data.client.phone,
                                    event_type: data.event.type,
                                    event_date: data.event.date,
                                    num_guests: data.event.guests.toString(),
                                    value_per_guest: data.payment.pricePerPerson.toString(),
                                    deposit_value: data.payment.deposit.toString(),
                                    deposit_date: data.payment.depositDate || '',
                                    total_value: String(totalValue),
                                    contract_id: newContractId || id || '',
                                    source: 'contract'
                                });
                                navigate(`/admin/nota-fiscal?${params.toString()}`);
                            }}
                            className="px-8 py-3 rounded-xl bg-[#EDB660] text-white font-bold text-sm flex items-center gap-2 hover:bg-[#D9A550] transition-all shadow-xl shadow-[#EDB660]/20"
                        >
                            <span className="material-symbols-outlined text-lg">receipt</span>
                            Emitir Nota Fiscal
                        </button>
                    </div>
                )}
            </div>

            {/* PRINT ONLY VIEW */}
            <div className="hidden print:block fixed inset-0 bg-white z-[9999] p-0 m-0 overflow-visible" id="contract-print">
                <div className="max-w-[700px] mx-auto p-12 text-[#2D2420] text-justify leading-relaxed font-serif">
                    {/* Header */}
                    <div className="flex flex-col items-center mb-6 border-b-2 border-[#5C2A0A] pb-6">
                        <h1 className="text-3xl font-bold uppercase tracking-tighter text-[#5C2A0A] text-center">Instrumento Particular de Prestação de Serviços</h1>
                        <p className="text-lg mt-2 font-bold">QUINTAL DA FAFÁ - BUFFET E EVENTOS</p>
                    </div>

                    {/* Identificação do Contrato */}
                    <div className="mb-6 text-xs text-right text-[#5C2A0A]/70">
                        <p>Brasília – DF, {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                    </div>

                    <div className="space-y-6 text-sm">
                        <h3 className="font-bold text-base uppercase border-b border-black pb-1">Das Partes</h3>

                        <p>
                            <strong>CONTRATANTE:</strong> {data.client.name || '_________________________________'}, portador(a) do CPF/CNPJ nº {data.client.cpf || '______________'},
                            residente em {data.client.address || '_____________________________'},
                            {data.client.neighborhood ? ' ' + data.client.neighborhood + ',' : ' ________________,'}{' '}
                            {data.client.city || '_______________'}-{(data.client.state || '__').toUpperCase()}, CEP: {data.client.zipCode || '_____-___'},
                            telefone/WhatsApp: {data.client.phone || '(__) _____-____'}{data.client.email ? `, e-mail: ${data.client.email}` : ''}.
                        </p>

                        <p>
                            <strong>CONTRATADA:</strong> Quintal da Fafá – Maria de Fatima Bezerra Trindade Muniz, inscrita no CNPJ sob o nº 50.736.345/0001-86, estabelecida no Núcleo Rural Rio Preto, Chácara 08, Térreo, Agrovila, Planaltina – DF, Brasília.
                        </p>


                        <h3 className="font-bold text-base uppercase border-b border-black pt-4">Cláusula 1ª – DO OBJETO DO CONTRATO</h3>
                        <p>
                            O presente contrato tem por objeto a prestação de serviços de buffet e locação de espaço para o evento denominado
                            <strong> {data.event.type}</strong>, a realizar-se no dia <strong>{formatDate(data.event.date)}</strong>,
                            com início às <strong>{data.event.startTime}</strong> e término às <strong>{data.event.endTime}</strong>,
                            no local: <strong>{data.event.location}</strong>. A estrutura inclusa compreende: {data.event.structure.join(', ')}.
                        </p>

                        <h3 className="font-bold text-base uppercase border-b border-black pt-4">Cláusula 2ª – DO CARDÁPIO E QUANTIDADE DE CONVIDADOS</h3>
                        <p>
                            O presente contrato é celebrado com base na quantidade de <strong>{data.event.guests} pessoas</strong> definida na seção de Dados do Evento, ao valor de <strong>{formatCurrency(data.payment.pricePerPerson)} por pessoa</strong> acordado.
                            O valor total contratado é fixo e não sofrerá qualquer redução, independentemente do número de convidados efetivamente presentes no dia do evento — caso compareçam menos pessoas do que o contratado, o valor permanece integralmente devido.
                            Caso o número de convidados venha a ser superior ao estabelecido, será acrescido ao valor total o montante correspondente às pessoas excedentes, calculado ao mesmo valor por pessoa fechado neste contrato. O cardápio poderá ser personalizado mediante solicitação prévia e acordo entre as partes.
                        </p>
                        <p>
                            <strong>Resumo do Cardápio:</strong> Prato Principal: {data.menu.mainDish}; Acompanhamentos: {data.menu.sides.join(', ')}; Sobremesas: {data.menu.dessert.join(', ') || 'Nenhuma selecionada'}; Bebidas: {data.menu.drinks}.
                        </p>
                        {data.menu.observations && (
                            <p><strong>Observações:</strong> {data.menu.observations}</p>
                        )}

                        <h3 className="font-bold text-base uppercase border-b border-black pt-4">Cláusula 3ª – DOS VALORES E CONDIÇÕES DE PAGAMENTO</h3>
                        <p>
                            O valor total estimado para o evento é de <strong>{formatCurrency(totalValue)}</strong>.
                        </p>
                        <p>
                            <strong>Sinal:</strong> Pago no valor de {formatCurrency(data.payment.deposit)} em {formatDate(data.payment.depositDate)}.
                        </p>
                        <p>
                            <strong>Saldo Devedor:</strong> {formatCurrency(balanceValue)} a ser quitado até {formatDate(data.payment.balanceDate)} via {data.payment.method}.
                        </p>
                        {data.payment.observations && (
                            <p><strong>Condições Adicionais:</strong> {data.payment.observations}</p>
                        )}

                        <h3 className="font-bold text-base uppercase border-b border-black pt-4">Cláusula 4ª – DO CANCELAMENTO E REAGENDAMENTO</h3>
                        <p>
                            Em caso de cancelamento pelo CONTRATANTE com menos de 15 dias de antecedência, o sinal pago não será restituído. Reagendamentos poderão ser realizados com pelo menos 30 dias de antecedência, sujeitos à disponibilidade da CONTRATADA.
                        </p>

                        <h3 className="font-bold text-base uppercase border-b border-black pt-4">Cláusula 5ª – DAS RESPONSABILIDADES</h3>
                        <p>
                            A CONTRATADA se responsabiliza pela qualidade e pontualidade dos serviços prestados. O CONTRATANTE é responsável pelo comportamento dos convidados e por eventuais danos causados ao espaço.
                        </p>

                        <h3 className="font-bold text-base uppercase border-b border-black pt-4">Cláusula 6ª – DO FORO</h3>
                        <p>
                            Fica eleito o foro da Comarca de Brasília – DF para dirimir quaisquer controvérsias oriundas deste contrato, com renúncia expressa a qualquer outro, por mais privilegiado que seja.
                        </p>

                        <div className="pt-20 space-y-12">
                            <div className="grid grid-cols-2 gap-20">
                                <div className="text-center">
                                    <div className="border-t border-black mb-1"></div>
                                    <p className="font-bold uppercase text-[10px]">Contratante: {data.client.name}</p>
                                </div>
                                <div className="text-center">
                                    <div className="border-t border-black mb-1"></div>
                                    <p className="font-bold uppercase text-[10px]">Contratada: Quintal da Fafá</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-20">
                                <div className="text-center">
                                    <div className="border-t border-black mb-1"></div>
                                    <p className="font-bold uppercase text-[10px]">Testemunha 1</p>
                                </div>
                                <div className="text-center">
                                    <div className="border-t border-black mb-1"></div>
                                    <p className="font-bold uppercase text-[10px]">Testemunha 2</p>
                                </div>
                            </div>
                        </div>

                        <p className="text-center pt-8 text-xs opacity-60">Brasília, {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                    </div>
                </div>
            </div>

            {/* SUCCESS MODAL */}
            {saveSuccess && (
                <div className="fixed inset-0 bg-[#5C2A0A]/60 backdrop-blur-md z-[50] flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-white rounded-[32px] p-8 max-w-md w-full shadow-2xl text-center space-y-6 transform animate-scale-up">
                        <div className="w-20 h-20 bg-[#78B926] rounded-full flex items-center justify-center mx-auto shadow-lg shadow-[#78B926]/30">
                            <span className="material-symbols-outlined text-white text-4xl">check_circle</span>
                        </div>

                        <div className="space-y-2">
                            <h2 className="text-3xl font-display font-bold text-[#2D2420]">Contrato Salvo!</h2>
                            <p className="text-[#5A2D0C]/70">O contrato foi registrado com sucesso no sistema e na agenda.</p>
                        </div>

                        <div className="flex flex-col gap-3 pt-4">
                            <button
                                onClick={() => navigate('/admin/contratos')}
                                className="w-full py-4 rounded-2xl bg-[#78B926] text-white font-bold flex items-center justify-center gap-2 hover:bg-[#5D8F1D] transition-all shadow-lg shadow-[#78B926]/20"
                            >
                                <span className="material-symbols-outlined">list_alt</span>
                                Voltar para a Lista
                            </button>

                            <button
                                onClick={() => {
                                    const params = new URLSearchParams({
                                        client_name: data.client.name,
                                        client_document: data.client.cpf,
                                        client_email: data.client.email,
                                        client_phone: data.client.phone,
                                        event_type: data.event.type,
                                        event_date: data.event.date,
                                        num_guests: data.event.guests.toString(),
                                        value_per_guest: data.payment.pricePerPerson.toString(),
                                        deposit_value: data.payment.deposit.toString(),
                                        deposit_date: data.payment.depositDate || '',
                                        total_value: String(totalValue),
                                        contract_id: newContractId || id || '',
                                        source: 'contract'
                                    });
                                    navigate(`/admin/nota-fiscal?${params.toString()}`);
                                }}
                                className="w-full py-4 rounded-2xl bg-[#EDB660] text-white font-bold flex items-center justify-center gap-2 hover:bg-[#D9A550] transition-all shadow-lg shadow-[#EDB660]/20"
                            >
                                <span className="material-symbols-outlined">receipt</span>
                                Emitir Nota Fiscal
                            </button>

                            <button
                                onClick={resetForm}
                                className="w-full py-4 rounded-2xl bg-[#5C2A0A] text-white font-bold flex items-center justify-center gap-2 hover:bg-[#3D1C07] transition-all shadow-lg shadow-[#5C2A0A]/20"
                            >
                                <span className="material-symbols-outlined">add_circle</span>
                                Fazer Novo Contrato
                            </button>

                            <button
                                onClick={() => setSaveSuccess(false)}
                                className="w-full py-4 rounded-2xl border-2 border-[#E2DED0] text-[#5A2D0C] font-bold flex items-center justify-center gap-2 hover:bg-[#FAF7F5] transition-all"
                            >
                                <span className="material-symbols-outlined">visibility</span>
                                Continuar Visualizando
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes scale-up {
                    from { opacity: 0; transform: scale(0.9); }
                    to { opacity: 1; transform: scale(1); }
                }
                .animate-scale-up {
                    animation: scale-up 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }
                @media print {
                    body * {
                        visibility: hidden;
                    }
                    #contract-print, #contract-print * {
                        visibility: visible;
                    }
                    #contract-print {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                    }
                }
                .no-scrollbar::-webkit-scrollbar {
                    display: none;
                }
                .no-scrollbar {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}</style>
        </div>
    );
};

export default ContractGenerator;
