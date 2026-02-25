import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import Button from '../../components/landing/Button';
import { supabase } from '../../lib/supabase';

interface ClientData {
    name: string;
    document: string;
    email: string;
    phone: string;
}

interface ServiceData {
    eventType: string;
    eventDate: string;
    description: string;
    serviceCode: string;
    numGuests: number;
    valuePerGuest: number;
    issAliquot: number;
    operationType: string;
    extraObs: string;
}

interface ReceiptData {
    number: string;
    value: number;
    date: string;
    type: string;
    method: string;
    isQuittance: boolean; // Novo campo para identificar se é recibo final
}

const NotaFiscal: React.FC = () => {
    const [activeTab, setActiveTab] = useState('dados');
    const [searchParams] = useSearchParams();

    // Dados de Pagamento (Extrato)
    const [paymentInfo, setPaymentInfo] = useState({
        depositValue: 0,
        depositDate: '',
        totalValue: 0,
        contractId: ''
    });

    // Aba 1 - Dados
    const [client, setClient] = useState<ClientData>({
        name: '',
        document: '',
        email: '',
        phone: ''
    });

    const [service, setService] = useState<ServiceData>({
        eventType: '',
        eventDate: '',
        description: '',
        serviceCode: '17.11',
        numGuests: 0,
        valuePerGuest: 0,
        issAliquot: 2,
        operationType: '1 - Tributação no Município',
        extraObs: ''
    });

    // Aba 3 - Recibo
    const [receipt, setReceipt] = useState<ReceiptData>({
        number: `001/${new Date().getFullYear()}`,
        value: 0,
        date: new Date().toISOString().split('T')[0],
        type: 'Sinal / Entrada',
        method: 'PIX',
        isQuittance: false
    });

    const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
    const [isImported, setIsImported] = useState(false);
    const [receiptHistory, setReceiptHistory] = useState<any[]>([]);
    const [globalReceipts, setGlobalReceipts] = useState<any[]>([]);
    const [globalReceiptsError, setGlobalReceiptsError] = useState<string | null>(null);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);

    // Fórmulas
    const totalValue = service.numGuests * service.valuePerGuest;
    const issValue = (totalValue * service.issAliquot) / 100;

    // Carregar histórico de recibos do contrato
    const loadReceiptHistory = async (contractId: string) => {
        if (!contractId) return;
        setIsLoadingHistory(true);
        try {
            const { data, error } = await supabase
                .from('receipt_logs')
                .select('*')
                .eq('contract_id', contractId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setReceiptHistory(data || []);
        } catch (err) {
            console.error('Erro ao carregar histórico:', err);
        } finally {
            setIsLoadingHistory(false);
        }
    };

    // Carregar todos os recibos (Gestão Global)
    const loadGlobalReceipts = async () => {
        setIsLoadingHistory(true);
        setGlobalReceiptsError(null);
        try {
            const { data, error } = await supabase
                .from('receipt_logs')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) {
                if (error.code === '42P01') {
                    // Tabela não existe
                    setGlobalReceiptsError('A tabela de recibos não foi criada no banco de dados. Execute o arquivo create_receipt_logs_table.sql no Supabase.');
                } else {
                    setGlobalReceiptsError(`Erro ao carregar recibos: ${error.message}`);
                }
                return;
            }
            setGlobalReceipts(data || []);
        } catch (err: any) {
            console.error('Erro ao carregar gestão global:', err);
            setGlobalReceiptsError('Erro de conexão ao carregar os recibos.');
        } finally {
            setIsLoadingHistory(false);
        }
    };

    // Buscar detalhes do contrato no banco para preencher campos faltantes
    const loadContractById = async (contractId: string) => {
        if (!contractId) return;
        try {
            const { data, error } = await supabase
                .from('contracts')
                .select('*')
                .eq('id', contractId)
                .single();

            if (error) throw error;
            if (data) {
                // Mesclar dados do banco com o que já temos (parâmetros da URL têm prioridade)
                setPaymentInfo(prev => ({
                    ...prev,
                    depositValue: prev.depositValue || Number(data.contract_data?.payment?.deposit) || 0,
                    depositDate: prev.depositDate || data.contract_data?.payment?.depositDate || '',
                    totalValue: prev.totalValue || Number(data.total_value) || 0,
                }));

                setClient(prev => ({
                    ...prev,
                    name: prev.name || data.client_name || data.contract_data?.client?.name || '',
                    document: prev.document || data.client_cpf || data.contract_data?.client?.cpf || '',
                    email: prev.email || data.contract_data?.client?.email || '',
                    phone: prev.phone || data.contract_data?.client?.phone || ''
                }));

                setService(prev => {
                    const eventType = prev.eventType || data.contract_data?.event?.type || '';
                    const eventDate = prev.eventDate || data.event_date || data.contract_data?.event?.date || '';
                    const numGuests = prev.numGuests || Number(data.contract_data?.event?.guests) || 0;
                    const valuePerGuest = prev.valuePerGuest || Number(data.contract_data?.payment?.pricePerPerson) || 0;

                    return {
                        ...prev,
                        eventType,
                        eventDate,
                        numGuests,
                        valuePerGuest
                    };
                });

                // Atualizar o recibo se necessário
                setReceipt(prev => {
                    const depositVal = Number(data.contract_data?.payment?.deposit) || 0;
                    const totalVal = Number(data.total_value) || 0;
                    return {
                        ...prev,
                        value: prev.value || (depositVal > 0 ? depositVal : totalVal),
                        type: prev.type || (depositVal > 0 ? 'Sinal / Entrada' : 'Quitação Total')
                    };
                });
            }
        } catch (err) {
            console.error('Erro ao buscar contrato pelo ID:', err);
        }
    };

    // Excluir recibo
    const handleDeleteReceipt = async (id: string, number: string) => {
        if (!confirm(`Tem certeza que deseja excluir o Recibo Nº ${number}? Esta ação também removerá o lançamento correspondente no financeiro. Esta ação não pode ser desfeita.`)) return;

        try {
            // 1. Buscar dados do recibo para limpar o financeiro
            const { data: receiptData } = await supabase
                .from('receipt_logs')
                .select('client_name')
                .eq('id', id)
                .single();

            // 2. Excluir do log de recibos
            const { error } = await supabase
                .from('receipt_logs')
                .delete()
                .eq('id', id);

            if (error) throw error;

            // 3. Tentar excluir do financeiro (baseado na descrição padronizada)
            if (receiptData) {
                await supabase
                    .from('financial_movements')
                    .delete()
                    .eq('description', `Recibo ${number} - ${receiptData.client_name}`);
            }

            // 4. Atualiza as listas removendo o item localmente
            setGlobalReceipts(prev => prev.filter(r => r.id !== id));
            setReceiptHistory(prev => prev.filter(r => r.id !== id));

            console.log('Recibo e lançamento financeiro excluídos com sucesso.');
        } catch (err) {
            console.error('Erro ao excluir recibo:', err);
            alert('Erro ao excluir o recibo. Tente novamente.');
        }
    };

    // Buscar próximo número de recibo (sequencial global por ano)
    const fetchNextReceiptNumber = async () => {
        const year = new Date().getFullYear();
        try {
            const { count, error } = await supabase
                .from('receipt_logs')
                .select('*', { count: 'exact', head: true })
                .filter('number', 'ilike', `%/${year}%`);

            if (error) throw error;

            const nextNum = (count || 0) + 1;
            const formattedNum = `${String(nextNum).padStart(3, '0')}/${year}`;
            setReceipt(prev => ({ ...prev, number: formattedNum }));
        } catch (err) {
            console.error('Erro ao buscar próximo número:', err);
        }
    };

    // Salvar recibo no banco de dados
    const handleSaveReceipt = async () => {
        if (!paymentInfo.contractId && !confirm('Este recibo não está vinculado a um contrato. Deseja salvar mesmo assim?')) return;

        try {
            const { error } = await supabase.from('receipt_logs').insert([{
                contract_id: paymentInfo.contractId || null,
                number: receipt.number,
                value: receipt.value,
                date: receipt.date,
                type: receipt.type,
                method: receipt.method,
                client_name: client.name
            }]);

            if (error) throw error;

            // 2. Integrar com o Fluxo de Caixa (Financeiro)
            await supabase.from('financial_movements').insert([{
                type: 'Receita',
                description: `Recibo ${receipt.number} - ${client.name}`,
                amount: receipt.value,
                date: receipt.date,
                category: receipt.isQuittance ? 'Pagamento Final' : 'Sinal'
            }]);

            console.log('Recibo registrado com sucesso e enviado ao financeiro!');
            if (paymentInfo.contractId) loadReceiptHistory(paymentInfo.contractId);
        } catch (err) {
            console.error('Erro ao salvar recibo:', err);
        }
    };

    // Efeito para buscar parâmetros da URL (Integração com Contratos)
    useEffect(() => {
        const client_name = searchParams.get('client_name');
        const cId = searchParams.get('contract_id') || '';

        if (client_name || cId) {
            // 1. Priorizar dados da URL se existirem
            setClient({
                name: client_name || '',
                document: searchParams.get('client_document') || '',
                email: searchParams.get('client_email') || '',
                phone: searchParams.get('client_phone') || ''
            });

            setService(prev => ({
                ...prev,
                eventType: searchParams.get('event_type') || '',
                eventDate: searchParams.get('event_date') || '',
                numGuests: Number(searchParams.get('num_guests')) || 0,
                valuePerGuest: Number(searchParams.get('value_per_guest')) || 0,
                extraObs: searchParams.get('source') === 'contract' ? 'Dados importados do contrato.' : ''
            }));

            const depositVal = Number(searchParams.get('deposit_value')) || 0;
            const totalVal = Number(searchParams.get('total_value')) || 0;

            setPaymentInfo({
                depositValue: depositVal,
                depositDate: searchParams.get('deposit_date') || '',
                totalValue: totalVal,
                contractId: cId
            });

            // 2. Carregar do Banco se tiver ID (Fallback para campos vazios e carregar Histórico)
            if (cId) {
                loadContractById(cId);
                loadReceiptHistory(cId);
            }

            // 3. Configurações Iniciais do Recibo
            setReceipt(prev => ({
                ...prev,
                value: depositVal > 0 ? depositVal : totalVal,
                type: (depositVal > 0 && !prev.isQuittance) ? 'Sinal / Entrada' : prev.type,
            }));

            if (searchParams.get('source') === 'contract' || cId) {
                setIsImported(true);
            }

            fetchNextReceiptNumber();
        } else {
            // Se não veio de contrato nem tem ID, exibe gestão global por padrão
            setActiveTab('historico_global');
            fetchNextReceiptNumber();
            loadGlobalReceipts();
        }
    }, [searchParams]);

    // Atualizar descrição auto
    useEffect(() => {
        if (service.eventType && service.eventDate) {
            const formattedDate = new Date(service.eventDate).toLocaleDateString('pt-BR');
            const desc = `Prestação de serviços de buffet e estrutura para evento de ${service.eventType} realizado em ${formattedDate}, incluindo espaço, mesas, cadeiras, tendas e alimentação para ${service.numGuests} pessoas.`;
            setService(prev => ({ ...prev, description: desc }));
        }
    }, [service.eventType, service.eventDate, service.numGuests]);

    const handleCopy = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        const el = document.getElementById(`copy-feedback-${id}`);
        if (el) {
            el.style.opacity = '1';
            setTimeout(() => { el.style.opacity = '0'; }, 2000);
        }
    };

    const renderTabContent = () => {
        switch (activeTab) {
            case 'historico_global':
                return (
                    <div className="space-y-6 animate-fade-in">
                        <div className="flex justify-between items-center bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                            <div>
                                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">GESTÃO GERAL DE RECIBOS</h3>
                                <p className="text-xs text-gray-500">Histórico de todos os pagamentos registrados no sistema.</p>
                            </div>
                            <Button
                                onClick={() => {
                                    // Limpa quaisquer dados de contrato anterior e vai para o formulário
                                    setPaymentInfo({ depositValue: 0, depositDate: '', totalValue: 0, contractId: '' });
                                    setClient({ name: '', document: '', email: '', phone: '' });
                                    setService(prev => ({ ...prev, eventType: '', eventDate: '', description: '', numGuests: 0, valuePerGuest: 0 }));
                                    setIsImported(false);
                                    setActiveTab('dados'); // ← vai para o formulário completo
                                }}
                                className="bg-[#78B926] hover:bg-[#68A020] text-white flex items-center gap-2"
                            >
                                <span className="material-symbols-outlined">add</span> Novo Recibo Avulso
                            </Button>
                        </div>

                        {globalReceiptsError && (
                            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3 text-red-700 text-sm">
                                <span className="material-symbols-outlined mt-0.5">error</span>
                                <div>
                                    <p className="font-bold">Erro ao carregar recibos</p>
                                    <p className="text-xs mt-1">{globalReceiptsError}</p>
                                    <a
                                        href="https://supabase.com/dashboard/project/glfcxeaxztqymagxjvra/sql/new"
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex items-center gap-1 mt-2 text-xs font-bold underline text-red-700 hover:text-red-900"
                                    >
                                        <span className="material-symbols-outlined text-sm">open_in_new</span>
                                        Abrir SQL Editor do Supabase
                                    </a>
                                </div>
                            </div>
                        )}

                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="text-xs text-gray-400 bg-gray-50 uppercase tracking-wider">
                                            <th className="px-6 py-4 font-bold border-b border-gray-100">Nº Recibo</th>
                                            <th className="px-6 py-4 font-bold border-b border-gray-100">Data</th>
                                            <th className="px-6 py-4 font-bold border-b border-gray-100">Cliente</th>
                                            <th className="px-6 py-4 font-bold border-b border-gray-100">Tipo</th>
                                            <th className="px-6 py-4 font-bold border-b border-gray-100 text-right">Valor</th>
                                            <th className="px-6 py-4 font-bold border-b border-gray-100"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-sm divide-y divide-gray-50">
                                        {isLoadingHistory ? (
                                            <tr><td colSpan={6} className="px-6 py-10 text-center text-gray-400">Carregando...</td></tr>
                                        ) : globalReceiptsError ? (
                                            <tr><td colSpan={6} className="px-6 py-6 text-center text-gray-300 text-xs italic">Não foi possível carregar os dados.</td></tr>
                                        ) : globalReceipts.length === 0 ? (
                                            <tr><td colSpan={6} className="px-6 py-10 text-center text-gray-400">Nenhum recibo encontrado. Gere seu primeiro recibo na aba "Recibo ao Cliente".</td></tr>
                                        ) : (
                                            globalReceipts.map((r, i) => (
                                                <tr key={i} className="hover:bg-gray-50 transition-colors group">
                                                    <td className="px-6 py-4 font-bold text-[#5A2D0C]">{r.number}</td>
                                                    <td className="px-6 py-4 text-gray-500">{new Date(r.date + 'T00:00:00').toLocaleDateString('pt-BR')}</td>
                                                    <td className="px-6 py-4 font-medium text-gray-700">{r.client_name || '--'}</td>
                                                    <td className="px-6 py-4">
                                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${r.type?.includes('Quitação') ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                                                            {r.type}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right font-bold text-secondary">
                                                        R$ {Number(r.value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <button
                                                            onClick={() => handleDeleteReceipt(r.id, r.number)}
                                                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                                                            title="Excluir recibo"
                                                        >
                                                            <span className="material-symbols-outlined text-lg">delete</span>
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                );
            case 'dados':
                return (
                    <div className="space-y-6 animate-fade-in">
                        {isImported && (
                            <div className="bg-[#78B926]/10 border border-[#78B926]/30 rounded-lg p-4 flex items-center justify-between text-[#1D7142] text-sm animate-bounce-subtle">
                                <div className="flex items-center gap-3">
                                    <span className="material-symbols-outlined">auto_awesome</span>
                                    <span><strong>Dados importados!</strong> As informações do cliente e do evento foram preenchidas com base no contrato.</span>
                                </div>
                                <button onClick={() => setIsImported(false)} className="hover:opacity-70">
                                    <span className="material-symbols-outlined text-lg">close</span>
                                </button>
                            </div>
                        )}
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center gap-3 text-blue-700 text-sm">
                            <span className="material-symbols-outlined">info</span>
                            Preencha os dados abaixo. Depois clique em "Gerar Rascunho" para ver tudo organizado pronto para copiar no portal de nota fiscal.
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Prestador */}
                            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm relative">
                                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-lg">house</span> PRESTADOR (VOCÊ)
                                </h3>
                                <div className="space-y-4 text-sm">
                                    <div>
                                        <label className="block font-semibold text-gray-700 mb-1">Razão Social</label>
                                        <input disabled value="Maria de Fatima Bezerra Trindade Muniz" className="w-full p-2 bg-gray-50 border border-gray-200 rounded-md" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block font-semibold text-gray-700 mb-1">CNPJ</label>
                                            <input disabled value="50.736.345/0001-86" className="w-full p-2 bg-gray-50 border border-gray-200 rounded-md" />
                                        </div>
                                        <div>
                                            <label className="block font-semibold text-gray-700 mb-1">Inscrição Municipal</label>
                                            <input disabled placeholder="Nº da IM" className="w-full p-2 bg-gray-50 border border-gray-200 rounded-md" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block font-semibold text-gray-700 mb-1">Endereço</label>
                                        <input disabled value="Núcleo Rural Rio Preto, Chácara 08, Planaltina – DF" className="w-full p-2 bg-gray-50 border border-gray-200 rounded-md" />
                                    </div>
                                </div>
                            </div>

                            {/* Tomador */}
                            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                                        <span className="material-symbols-outlined text-lg">person</span> TOMADOR (CLIENTE)
                                    </h3>
                                    <Button variant="ghost" size="sm" className="text-primary p-1"><span className="material-symbols-outlined">person_search</span></Button>
                                </div>
                                <div className="space-y-4 text-sm">
                                    <div>
                                        <label className="block font-semibold text-gray-700 mb-1">Nome Completo</label>
                                        <input
                                            value={client.name}
                                            onChange={e => setClient({ ...client, name: e.target.value })}
                                            placeholder="Nome do cliente"
                                            className="w-full p-2 border border-gray-200 rounded-md"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block font-semibold text-gray-700 mb-1">CPF / CNPJ</label>
                                            <input
                                                value={client.document}
                                                onChange={e => setClient({ ...client, document: e.target.value })}
                                                placeholder="000.000.000-00"
                                                className="w-full p-2 border border-gray-200 rounded-md"
                                            />
                                        </div>
                                        <div>
                                            <label className="block font-semibold text-gray-700 mb-1">Telefone / WhatsApp</label>
                                            <input
                                                value={client.phone}
                                                onChange={e => setClient({ ...client, phone: e.target.value })}
                                                placeholder="(61) 99635-1010"
                                                className="w-full p-2 border border-gray-200 rounded-md"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block font-semibold text-gray-700 mb-1">E-mail</label>
                                        <input
                                            value={client.email}
                                            onChange={e => setClient({ ...client, email: e.target.value })}
                                            placeholder="email@cliente.com"
                                            className="w-full p-2 border border-gray-200 rounded-md"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Detalhes do Serviço */}
                        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">DETALHES DO SERVIÇO</h3>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm mb-6">
                                <div className="md:col-span-3">
                                    <label className="block font-semibold text-gray-700 mb-1">Tipo de Evento</label>
                                    <input
                                        value={service.eventType}
                                        onChange={e => setService({ ...service, eventType: e.target.value })}
                                        placeholder="Ex: Aniversário, Casamento..."
                                        className="w-full p-2 border border-gray-200 rounded-md"
                                    />
                                </div>
                                <div>
                                    <label className="block font-semibold text-gray-700 mb-1">Data do Evento</label>
                                    <input
                                        type="date"
                                        value={service.eventDate}
                                        onChange={e => setService({ ...service, eventDate: e.target.value })}
                                        className="w-full p-2 border border-gray-200 rounded-md"
                                    />
                                </div>
                                <div className="md:col-span-4">
                                    <label className="block font-semibold text-gray-700 mb-1">Descrição do Serviço (para a NF)</label>
                                    <textarea
                                        value={service.description}
                                        onChange={e => setService({ ...service, description: e.target.value })}
                                        rows={3}
                                        className="w-full p-2 border border-gray-200 rounded-md h-24"
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block font-semibold text-gray-700 mb-1">Código do Serviço (LC 116)</label>
                                    <input
                                        value={service.serviceCode}
                                        onChange={e => setService({ ...service, serviceCode: e.target.value })}
                                        className="w-full p-2 border border-gray-200 rounded-md"
                                    />
                                    <span className="text-[10px] text-gray-400">Buffet/Alimentação: 17.11</span>
                                </div>
                                <div>
                                    <label className="block font-semibold text-gray-700 mb-1">Número de Pessoas</label>
                                    <input
                                        type="number"
                                        value={service.numGuests}
                                        onChange={e => setService({ ...service, numGuests: Number(e.target.value) })}
                                        className="w-full p-2 border border-gray-200 rounded-md"
                                    />
                                </div>
                                <div>
                                    <label className="block font-semibold text-gray-700 mb-1">Valor por Pessoa (R$)</label>
                                    <input
                                        type="number"
                                        value={service.valuePerGuest}
                                        onChange={e => setService({ ...service, valuePerGuest: Number(e.target.value) })}
                                        className="w-full p-2 border border-gray-200 rounded-md"
                                    />
                                </div>
                                <div>
                                    <label className="block font-semibold text-gray-700 mb-1">Alíquota ISS (%)</label>
                                    <input
                                        type="number"
                                        value={service.issAliquot}
                                        onChange={e => setService({ ...service, issAliquot: Number(e.target.value) })}
                                        className="w-full p-2 border border-gray-200 rounded-md"
                                    />
                                    <span className="text-[10px] text-gray-400">Verificar na prefeitura de Brasília</span>
                                </div>
                                <div className="md:col-span-3">
                                    <label className="block font-semibold text-gray-700 mb-1">Natureza da Operação</label>
                                    <select
                                        value={service.operationType}
                                        onChange={e => setService({ ...service, operationType: e.target.value })}
                                        className="w-full p-2 border border-gray-200 rounded-md"
                                    >
                                        <option>1 - Tributação no Município</option>
                                        <option>2 - Tributação Fora do Município</option>
                                        <option>3 - Isenção</option>
                                    </select>
                                </div>
                                <div className="md:col-span-4">
                                    <label className="block font-semibold text-gray-700 mb-1">Observações adicionais na NF</label>
                                    <input
                                        value={service.extraObs}
                                        onChange={e => setService({ ...service, extraObs: e.target.value })}
                                        placeholder="Ex: Referente ao contrato nº 001/2026."
                                        className="w-full p-2 border border-gray-200 rounded-md"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <Button onClick={() => setActiveTab('rascunho')} className="bg-[#78B926] hover:bg-[#68A020] text-white flex items-center gap-2">
                                <span className="material-symbols-outlined">description</span> Gerar Rascunho da NF
                            </Button>
                            <Button onClick={() => {
                                setActiveTab('recibo');
                                const suggestedValue = paymentInfo.contractId ? (paymentInfo.totalValue - paymentInfo.depositValue) : totalValue;
                                setReceipt({ ...receipt, value: suggestedValue > 0 ? suggestedValue : totalValue });
                            }} variant="outline" className="border-[#8F4114] text-[#8F4114] hover:bg-[#8F4114] hover:text-white flex items-center gap-2">
                                <span className="material-symbols-outlined">receipt</span> Prévio do Recibo
                            </Button>
                        </div>
                    </div>
                );
            case 'rascunho':
                const copyFields = {
                    PRESTADOR: [
                        { label: 'CNPJ', value: '50.736.345/0001-86' },
                        { label: 'Razão Social', value: 'Maria de Fatima Bezerra Trindade Muniz' }
                    ],
                    TOMADOR: [
                        { label: 'Nome / Razão Social', value: client.name },
                        { label: 'CPF / CNPJ', value: client.document },
                        { label: 'E-mail', value: client.email }
                    ],
                    SERVIÇO: [
                        { label: 'Código do Serviço (LC 116)', value: service.serviceCode },
                        { label: 'Discriminação do Serviço', value: service.description },
                        { label: 'Natureza da Operação', value: service.operationType }
                    ],
                    VALORES: [
                        { label: 'Valor do Serviço (R$)', value: totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) },
                        { label: 'Alíquota ISS (%)', value: service.issAliquot.toString() }
                    ]
                };

                return (
                    <div className="space-y-6 animate-fade-in">
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-center gap-3 text-yellow-800 text-sm">
                            <span className="material-symbols-outlined">content_paste</span>
                            <strong>Como usar:</strong> Copie cada campo abaixo e cole no portal da sua nota fiscal (NFSe Nacional ou portal da sua prefeitura). Use o botão "Copiar" em cada campo.
                        </div>

                        {Object.entries(copyFields).map(([section, fields]) => (
                            <div key={section} className="bg-[#FFF6F0] border-2 border-dashed border-[#EDB660]/30 rounded-xl p-6">
                                <h3 className="text-sm font-bold text-gray-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    {section === 'PRESTADOR' && <span className="material-symbols-outlined text-gray-500">account_balance</span>}
                                    {section === 'TOMADOR' && <span className="material-symbols-outlined text-gray-500">person</span>}
                                    {section === 'SERVIÇO' && <span className="material-symbols-outlined text-gray-500">design_services</span>}
                                    {section === 'VALORES' && <span className="material-symbols-outlined text-gray-500">payments</span>}
                                    {section}
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {fields.map((f, i) => (
                                        <div key={i} className="bg-white border border-gray-200 rounded-lg p-3 group relative hover:border-[#EDB660]/50 transition-colors">
                                            <div className="text-[10px] text-gray-400 uppercase font-bold mb-1">{f.label}</div>
                                            <div className="text-sm font-medium pr-8 truncate">{f.value || '--'}</div>
                                            <button
                                                onClick={() => handleCopy(f.value, `${section}-${i}`)}
                                                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-secondary p-1"
                                                title="Copiar"
                                            >
                                                <span className="material-symbols-outlined text-lg">content_copy</span>
                                            </button>
                                            <div id={`copy-feedback-${section}-${i}`} className="absolute top-0 right-0 bg-[#78B926] text-white text-[10px] px-1.5 py-0.5 rounded opacity-0 transition-opacity pointer-events-none">
                                                Copiado!
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}

                        <div className="flex flex-wrap gap-4 pt-4">
                            <Button className="bg-[#1D7142] hover:bg-[#155a33] text-white flex items-center gap-2">
                                <span className="material-symbols-outlined">library_add</span> Copiar Tudo (texto único)
                            </Button>
                            <Button className="bg-[#2563EB] hover:bg-[#1d4ed8] text-white flex items-center gap-2">
                                <span className="material-symbols-outlined">launch</span> Abrir Portal NFSe Nacional
                            </Button>
                            <Button variant="outline" className="border-[#8F4114] text-[#8F4114] hover:bg-[#8F4114] hover:text-white flex items-center gap-2">
                                <span className="material-symbols-outlined">language</span> Portal SEF-DF
                            </Button>
                        </div>
                    </div>
                );
            case 'recibo':
                return (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
                        <div className="lg:col-span-2 space-y-6">
                            <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3 text-green-700 text-sm">
                                <span className="material-symbols-outlined">verified</span>
                                O recibo abaixo é um <strong>comprovante de pagamento</strong> para enviar ao cliente via WhatsApp ou Imprimir, <strong>enquanto você emite a NF oficial no portal</strong>. Ele não substitui a nota fiscal.
                            </div>

                            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">CONFIGURAR RECIBO</h3>
                                    <span className="material-symbols-outlined text-gray-300">receipt_long</span>
                                </div>
                                <div className="space-y-4 text-sm">
                                    <div>
                                        <label className="block font-semibold text-gray-700 mb-1">Nº do Recibo</label>
                                        <input
                                            value={receipt.number}
                                            onChange={e => setReceipt({ ...receipt, number: e.target.value })}
                                            className="w-full p-2 border border-gray-200 rounded-md"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block font-semibold text-gray-700 mb-1">Valor Pago (R$)</label>
                                            <input
                                                type="number"
                                                value={receipt.value}
                                                onChange={e => setReceipt({ ...receipt, value: Number(e.target.value) })}
                                                className="w-full p-2 border border-gray-200 rounded-md"
                                            />
                                        </div>
                                        <div>
                                            <label className="block font-semibold text-gray-700 mb-1">Data do Pagamento</label>
                                            <input
                                                type="date"
                                                value={receipt.date}
                                                onChange={e => setReceipt({ ...receipt, date: e.target.value })}
                                                className="w-full p-2 border border-gray-200 rounded-md"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block font-semibold text-gray-700 mb-2 font-display uppercase tracking-widest text-[10px]">Momento do Recibo</label>
                                        <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100 rounded-lg">
                                            <button
                                                onClick={() => setReceipt({ ...receipt, type: 'Sinal / Entrada', isQuittance: false })}
                                                className={`py-2 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all ${!receipt.isQuittance ? 'bg-white text-[#5A2D0C] shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                                            >
                                                Sinal / Reserva
                                            </button>
                                            <button
                                                onClick={() => setReceipt({ ...receipt, type: 'Quitação Total', isQuittance: true })}
                                                className={`py-2 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all ${receipt.isQuittance ? 'bg-white text-[#5A2D0C] shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                                            >
                                                Quitação Final
                                            </button>
                                        </div>
                                    </div>

                                    {receipt.isQuittance && (
                                        <div className="bg-[#FFF9F5] border border-orange-100 rounded-lg p-3 space-y-2 text-[11px] animate-fade-in">
                                            <div className="flex justify-between text-gray-400 font-bold uppercase tracking-widest text-[9px]">
                                                <span>Extrato do Contrato</span>
                                                <span className="material-symbols-outlined text-[14px]">history_edu</span>
                                            </div>
                                            <div className="flex justify-between border-b border-dashed border-orange-200/50 pb-1">
                                                <span className="text-gray-500">Valor Total Contratado:</span>
                                                <span className="font-bold text-gray-700">R$ {paymentInfo.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                            </div>
                                            <div className="flex justify-between border-b border-dashed border-orange-200/50 pb-1">
                                                <span className="text-gray-500">Sinal Recebido ({paymentInfo.depositDate ? new Date(paymentInfo.depositDate).toLocaleDateString('pt-BR') : '--'}):</span>
                                                <span className="font-bold text-green-600">R$ {paymentInfo.depositValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                            </div>
                                            <div className="flex justify-between pt-1">
                                                <span className="text-gray-700 font-bold">Saldo para Quitar:</span>
                                                <span className="font-bold text-[#8F4114]">R$ {(paymentInfo.totalValue - paymentInfo.depositValue).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                            </div>
                                        </div>
                                    )}
                                    <div>
                                        <label className="block font-semibold text-gray-700 mb-1">Forma de Pagamento</label>
                                        <select
                                            value={receipt.method}
                                            onChange={e => setReceipt({ ...receipt, method: e.target.value })}
                                            className="w-full p-2 border border-gray-200 rounded-md"
                                        >
                                            <option>PIX</option>
                                            <option>Cartão de Crédito</option>
                                            <option>Cartão de Débito</option>
                                            <option>Dinheiro</option>
                                            <option>Transferência</option>
                                        </select>
                                    </div>
                                    <Button onClick={() => {
                                        handleSaveReceipt();
                                        setIsReceiptModalOpen(true);
                                    }} className="bg-[#5A2D0C] hover:bg-[#401D06] text-white w-full py-3 flex items-center justify-center gap-2">
                                        <span className="material-symbols-outlined">visibility</span> Ver Recibo
                                    </Button>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm h-fit space-y-4">
                                <div className="flex justify-between items-center mb-2">
                                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">HISTÓRICO DE RECIBOS</h3>
                                    <span className="material-symbols-outlined text-blue-500">history</span>
                                </div>
                                <div className="text-sm">
                                    {isLoadingHistory ? (
                                        <div className="text-center py-4 text-gray-400">Carregando histórico...</div>
                                    ) : receiptHistory.length > 0 ? (
                                        <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 no-scrollbar">
                                            {receiptHistory.map((h, i) => (
                                                <div key={i} className="p-3 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors group">
                                                    <div className="flex justify-between items-start mb-1">
                                                        <span className="font-bold text-[#5A2D0C]">{h.number}</span>
                                                        <div className="flex items-center gap-1">
                                                            <span className="text-[10px] bg-gray-100 px-1.5 py-0.5 rounded text-gray-500">{h.type.split(' ')[0]}</span>
                                                            <button
                                                                onClick={() => handleDeleteReceipt(h.id, h.number)}
                                                                className="text-gray-300 hover:text-red-500 p-0.5 rounded transition-colors"
                                                                title="Excluir recibo"
                                                            >
                                                                <span className="material-symbols-outlined text-[16px]">delete</span>
                                                            </button>
                                                        </div>
                                                    </div>
                                                    <div className="flex justify-between text-[11px] text-gray-400">
                                                        <span>{new Date(h.date).toLocaleDateString('pt-BR')}</span>
                                                        <span className="font-bold text-secondary">R$ {Number(h.value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-4 text-gray-400 italic text-xs">Nenhum recibo registrado para este contrato.</div>
                                    )}
                                </div>
                            </div>

                            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm h-fit space-y-4">
                                <div className="flex justify-between items-center mb-2">
                                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">DICAS DE ENVIO</h3>
                                    <span className="material-symbols-outlined text-yellow-500">lightbulb</span>
                                </div>
                                <div className="text-sm space-y-5">
                                    <div className="bg-green-50/50 p-3 rounded-lg border border-green-100">
                                        <div className="flex items-center gap-2 font-bold text-green-700 mb-2">
                                            <span className="material-symbols-outlined text-lg">share</span> Passo a Passo de Envio:
                                        </div>
                                        <ol className="space-y-3 text-xs text-green-800 ml-1">
                                            <li className="flex gap-2">
                                                <span className="font-bold">1.</span>
                                                <span>Clique em <b>"Ver Recibo"</b> e depois em <b>"Gerar PDF"</b> para baixar o arquivo.</span>
                                            </li>
                                            <li className="flex gap-2">
                                                <span className="font-bold">2.</span>
                                                <div>
                                                    <button
                                                        onClick={() => {
                                                            const message = `Olá ${client.name || 'Cliente'}! Segue o seu recibo de ${receipt.isQuittance ? '*QUITAÇÃO*' : '*SINAL*'} do Quintal da Fafá:\n\n*Recibo:* ${receipt.number}\n*Evento:* ${service.eventType}\n*Data:* ${service.eventDate ? new Date(service.eventDate).toLocaleDateString('pt-BR') : '--'}\n*Valor:* R$ ${receipt.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n*Forma de Pgto:* ${receipt.method}${receipt.isQuittance ? '\n\n*CONTRATO QUITADO*' : ''}\n\n_Favor conferir o PDF em anexo._`;
                                                            const phone = client.phone.replace(/\D/g, '');
                                                            window.open(`https://wa.me/${phone ? '55' + phone : ''}?text=${encodeURIComponent(message)}`, '_blank');
                                                        }}
                                                        className="font-bold underline hover:text-green-600 flex items-center gap-1 inline"
                                                    >
                                                        Clique aqui para enviar no WhatsApp
                                                    </button>
                                                    <span> e depois anexe o PDF que você baixou.</span>
                                                </div>
                                            </li>
                                        </ol>
                                        <p className="mt-3 text-[10px] text-green-600/70 italic">* O WhatsApp não permite anexar arquivos automaticamente por segurança.</p>
                                    </div>
                                    <div>
                                        <div className="font-bold text-gray-700 flex items-center gap-1"><span className="material-symbols-outlined text-lg">print</span> Imprimir</div>
                                        <p className="text-gray-500 text-xs">Use o botão Imprimir no recibo — o cabeçalho e botões somem automaticamente.</p>
                                    </div>
                                    <div>
                                        <div className="font-bold text-gray-700 flex items-center gap-1"><span className="material-symbols-outlined text-lg">fact_check</span> NF Oficial</div>
                                        <p className="text-gray-500 text-xs">Após emitir no portal, anote o número da NF aqui nas observações e guarde o PDF.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            case 'guia':
                const steps = [
                    { title: 'Identifique seu portal', desc: 'Se você é MEI em Brasília-DF, provavelmente usa o NFSe Nacional (nfse.gov.br) ou o portal da SEF-DF. Dúvida? Pergunte ao seu contador.' },
                    { title: 'Preencha os dados na aba "Dados da NF"', desc: 'Insira os dados do cliente (tomador), descrição do serviço, valor e data. Depois clique em "Gerar Rascunho".' },
                    { title: 'Abra o portal e faça login', desc: 'Clique em "Abrir Portal NFSe Nacional" na aba Rascunho. Faça login com seu CNPJ e senha (ou gov.br).' },
                    { title: 'Copie os dados do rascunho', desc: 'Use os botões "Copiar" ao lado de cada campo na aba Rascunho e cole nos campos do portal. Leva menos de 2 minutos.' },
                    { title: 'Emita a nota e baixe o PDF', desc: 'Confirme os dados no portal e clique em emitir. Baixe o PDF e envie ao cliente junto com o recibo.' },
                    { title: 'Gere o recibo para o cliente', desc: 'Na aba "Recibo ao Cliente", configure o valor pago e gere o comprovante para enviar via WhatsApp ou imprimir.' }
                ];
                return (
                    <div className="space-y-6 animate-fade-in">
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center gap-3 text-blue-700 text-sm">
                            <span className="material-symbols-outlined">menu_book</span>
                            Passo a passo para emitir sua NFS-e. Não sabe em qual portal você usa? Siga o passo 1 — a maioria dos MEI usa o <strong>NFSe Nacional</strong>.
                        </div>

                        <div className="space-y-3">
                            {steps.map((step, i) => (
                                <div key={i} className="flex gap-4 p-4 bg-white border border-gray-100 rounded-lg items-center group hover:border-[#78B926]/30 transition-colors">
                                    <div className="w-8 h-8 min-w-[32px] rounded-full bg-[#1D7142] text-white flex items-center justify-center font-bold text-sm">
                                        {i + 1}
                                    </div>
                                    <div>
                                        <div className="font-bold text-gray-700 text-sm">{step.title}</div>
                                        <p className="text-xs text-gray-500">{step.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="pt-6 border-t border-gray-100">
                            <h4 className="text-[10px] font-bold text-gray-400 tracking-widest uppercase mb-4">LINKS ÚTEIS</h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <a href="https://www.nfse.gov.br/EmissaoNacional" target="_blank" rel="noreferrer" className="bg-[#2563EB] text-white p-3 rounded-lg flex items-center justify-center gap-2 text-sm font-bold hover:bg-[#1d4ed8] transition-colors">
                                    <span className="material-symbols-outlined">description</span> NFSe Nacional
                                </a>
                                <a href="https://dec.fazenda.df.gov.br/" target="_blank" rel="noreferrer" className="bg-white border-2 border-[#8F4114] text-[#8F4114] p-3 rounded-lg flex items-center justify-center gap-2 text-sm font-bold hover:bg-gray-50 transition-colors">
                                    <span className="material-symbols-outlined">language</span> SEF-DF / Nota DF
                                </a>
                                <a href="https://www.gov.br/empresas-e-negocios/pt-br/empreendedor" target="_blank" rel="noreferrer" className="bg-gray-100 text-gray-600 p-3 rounded-lg flex items-center justify-center gap-2 text-sm font-bold hover:bg-gray-200 transition-colors">
                                    <span className="material-symbols-outlined">person</span> Portal MEI
                                </a>
                            </div>
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    const handlePrintReceipt = () => {
        // Registrar o recibo no banco de dados antes de imprimir
        handleSaveReceipt();

        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        const formattedDate = service.eventDate ? new Date(service.eventDate).toLocaleDateString('pt-BR') : '--';
        const todayDate = new Date().toLocaleDateString('pt-BR');
        const formattedTotal = receipt.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 });

        printWindow.document.write(`
                                <html>
                                    <head>
                                        <title>Recibo - Quintal da Fafá</title>
                                        <style>
                                            body {font - family: sans-serif; padding: 40px; color: #2D2420; }
                                            .header {text - align: center; margin-bottom: 30px; }
                                            .company-name {font - size: 28px; font-weight: bold; color: #8F4114; margin: 0; }
                                            .subtitle {font - size: 10px; letter-spacing: 4px; color: #999; margin: 5px 0; }
                                            .badge {display: inline-block; background: #F0F7E8; color: #1D7142; padding: 6px 15px; border-radius: 20px; font-size: 12px; font-weight: bold; border: 1px solid #1D714233; margin-top: 10px; }
                                            .info-bar {background: #FAF7F5; border: 1px solid #EEE; padding: 15px; border-radius: 8px; font-size: 12px; margin: 20px 0; }
                                            .section {margin - bottom: 25px; border-bottom: 1px solid #EEE; padding-bottom: 15px; }
                                            .section-title {font - size: 10px; font-weight: bold; color: #BC6E2E; letter-spacing: 1px; margin-bottom: 10px; }
                                            .grid {display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 14px; }
                                            .label {color: #999; }
                                            .value {text - align: right; font-weight: bold; }
                                            .total-box {background: #5A2D0C; color: white; padding: 25px; border-radius: 12px; display: flex; justify-content: space-between; align-items: center; margin-top: 30px; }
                                            .total-label {font - size: 10px; opacity: 0.7; font-weight: bold; }
                                            .total-value {font - size: 28px; font-weight: bold; }
                                            .statement-box {border: 2px dashed #EEE; border-radius: 12px; padding: 15px; margin-top: 20px; font-size: 13px; color: #555; }
                                            .statement-item {display: flex; justify-content: space-between; margin-bottom: 5px; }
                                            .statement-item.final {border - top: 1px solid #EEE; padding-top: 5px; margin-top: 5px; color: #000; font-weight: bold; }
                                            .stamp {display: inline-block; border: 3px solid #1D7142; color: #1D7142; padding: 5px 15px; border-radius: 5px; font-family: sans-serif; font-weight: 900; font-size: 18px; text-transform: uppercase; transform: rotate(-10deg); margin: 20px auto; opacity: 0.8; }
                                            .footer {text - align: center; font-size: 10px; color: #999; margin-top: 50px; }
                                            @media print {body {padding: 0; } }
                                        </style>
                                    </head>
                                    <body>
                                        <div class="header">
                                            <h1 class="company-name">Quintal da Fafá</h1>
                                            <p class="subtitle">BUFFET & EVENTOS</p>
                                            <div class="badge">RECIBO DE PAGAMENTO</div>
                                            <p style="font-size: 11px; color: #999; margin-top: 10px;">Nº ${receipt.number} | Emitido em: ${todayDate}</p>
                                        </div>

                                        <div class="info-bar">
                                            Este recibo é um <b>comprovante de pagamento</b>. A Nota Fiscal Eletrônica de Serviços (NFS-e) será emitida separadamente pelo prestador.
                                        </div>

                                        <div class="section">
                                            <div class="section-title">DADOS DO PRESTADOR</div>
                                            <div class="grid">
                                                <span class="label">Empresa</span><span class="value">Quintal da Fafá</span>
                                                <span class="label">CNPJ</span><span class="value">50.736.345/0001-86</span>
                                            </div>
                                        </div>

                                        <div class="section">
                                            <div class="section-title">DADOS DO CLIENTE</div>
                                            <div class="grid">
                                                <span class="label">Nome</span><span class="value">${client.name || '--'}</span>
                                                <span class="label">CPF / CNPJ</span><span class="value">${client.document || '--'}</span>
                                            </div>
                                        </div>

                                        <div class="section">
                                            <div class="section-title">SERVIÇO PRESTADO</div>
                                            <div class="grid">
                                                <span class="label">Evento</span><span class="value">${service.eventType || '--'}</span>
                                                <span class="label">Data do Evento</span><span class="value">${formattedDate}</span>
                                            </div>
                                        </div>

                                        ${receipt.isQuittance ? `
                    <div class="statement-box">
                        <div style="font-size: 10px; font-weight: bold; color: #BC6E2E; letter-spacing: 1px; margin-bottom: 10px; text-transform: uppercase;">Extrato de Pagamentos</div>
                        <div class="statement-item">
                            <span>Valor Total Contratado:</span>
                            <span>R$ ${paymentInfo.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div class="statement-item">
                            <span>Sinal recebido em ${paymentInfo.depositDate ? new Date(paymentInfo.depositDate).toLocaleDateString('pt-BR') : '--'}:</span>
                            <span style="color: #1D7142;">R$ ${paymentInfo.depositValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div class="statement-item final">
                            <span>Saldo Quitado em ${todayDate}:</span>
                            <span>R$ ${receipt.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        </div>
                    </div>
                    <div style="text-align: center;">
                        <div class="stamp">CONTRATO QUITADO</div>
                    </div>
                    ` : ''}

                                        <div class="total-box">
                                            <div>
                                                <div class="total-label">${receipt.type}</div>
                                                <div class="total-value">R$ ${formattedTotal}</div>
                                            </div>
                                            <div style="text-align: right">
                                                <div class="total-label">FORMA DE PGTO.</div>
                                                <div style="font-weight: bold; letter-spacing: 1px;">${receipt.method}</div>
                                            </div>
                                        </div>

                                        <div class="footer">
                                            Quintal da Fafá — CNPJ 50.736.345/0001-86<br>
                                                Este recibo não substitui a Nota Fiscal de Serviços Eletrônica (NFS-e)
                                        </div>

                                        <script>
                                            window.onload = function() {
                                                window.print();
                                            window.onafterprint = function() {window.close(); };
                        };
                                        </script>
                                    </body>
                                </html>
                                `);
        printWindow.document.close();
    };

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2 text-[#2D2420]">
                        Nota Fiscal
                    </h1>
                    <p className="text-gray-500 text-sm">Prepare os dados e gere o recibo para o cliente</p>
                </div>
                <div className="bg-[#FFF6F0] border border-[#EDB660]/30 px-4 py-2 rounded-full text-[#BC6E2E] text-[10px] sm:text-xs font-bold uppercase flex items-center gap-2 shadow-sm">
                    <span className="material-symbols-outlined text-sm">auto_awesome</span> Preencha e copie para o portal
                </div>
            </header>

            {/* Tabs */}
            <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
                <div className="flex border-b border-gray-100 bg-gray-50/50 overflow-x-auto no-scrollbar">
                    <button
                        onClick={() => setActiveTab('dados')}
                        className={`flex items-center gap-2 px-6 py-4 text-xs font-bold uppercase tracking-wider transition-all border-b-2 whitespace-nowrap ${activeTab === 'dados' ? 'border-[#78B926] text-[#78B926] bg-white' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                    >
                        <span className="material-symbols-outlined text-lg">edit_note</span> Dados da NF
                    </button>
                    <button
                        onClick={() => setActiveTab('rascunho')}
                        className={`flex items-center gap-2 px-6 py-4 text-xs font-bold uppercase tracking-wider transition-all border-b-2 whitespace-nowrap ${activeTab === 'rascunho' ? 'border-[#78B926] text-[#78B926] bg-white' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                    >
                        <span className="material-symbols-outlined text-lg">inventory</span> Rascunho Pronto
                    </button>
                    <button
                        onClick={() => setActiveTab('recibo')}
                        className={`flex items-center gap-2 px-6 py-4 text-xs font-bold uppercase tracking-wider transition-all border-b-2 whitespace-nowrap ${activeTab === 'recibo' ? 'border-[#78B926] text-[#78B926] bg-white' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                    >
                        <span className="material-symbols-outlined text-lg">receipt_long</span> Recibo ao Cliente
                    </button>
                    <button
                        onClick={() => { setActiveTab('historico_global'); loadGlobalReceipts(); }}
                        className={`flex items-center gap-2 px-6 py-4 text-xs font-bold uppercase tracking-wider transition-all border-b-2 whitespace-nowrap ${activeTab === 'historico_global' ? 'border-[#78B926] text-[#78B926] bg-white' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                    >
                        <span className="material-symbols-outlined text-lg">history</span> Todos os Recibos
                    </button>
                    <button
                        onClick={() => setActiveTab('guia')}
                        className={`flex items-center gap-2 px-6 py-4 text-xs font-bold uppercase tracking-wider transition-all border-b-2 whitespace-nowrap ${activeTab === 'guia' ? 'border-[#78B926] text-[#78B926] bg-white' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                    >
                        <span className="material-symbols-outlined text-lg">help</span> Como Emitir
                    </button>
                </div>

                <div className="p-6 md:p-8 bg-[#FAF7F5]/30">
                    {renderTabContent()}
                </div>
            </div>

            {/* Receipt Modal (UI only) */}
            {isReceiptModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white w-full max-w-2xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-fade-in">
                        <div className="p-4 border-b border-gray-100 flex justify-between items-center no-print">
                            <div className="flex gap-2">
                                <Button onClick={handlePrintReceipt} className="bg-[#1D7142] hover:bg-[#155a33] text-white flex items-center gap-2">
                                    <span className="material-symbols-outlined">print</span> Gerar PDF / Imprimir
                                </Button>
                            </div>
                            <Button variant="ghost" onClick={() => setIsReceiptModalOpen(false)} className="text-gray-400 hover:text-primary">
                                <span className="material-symbols-outlined">close</span> Fechar
                            </Button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-8 sm:p-12 print:p-0">
                            {/* Receipt Body (Visual only) */}
                            <div className="max-w-xl mx-auto space-y-8 bg-white">
                                {/* Header */}
                                <div className="text-center space-y-2">
                                    <h2 className="text-2xl sm:text-3xl font-bold text-[#8F4114] font-display">Quintal da Fafá</h2>
                                    <p className="text-[10px] uppercase tracking-[4px] text-gray-400 font-bold">BUFFET & EVENTOS</p>
                                    <div className="inline-flex items-center gap-2 bg-[#F0F7E8] text-[#1D7142] px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border border-[#1D7142]/20">
                                        <span className="material-symbols-outlined text-sm">check_circle</span> RECIBO DE PAGAMENTO
                                    </div>
                                    <div className="text-[11px] text-gray-400 pt-2">
                                        Nº {receipt.number} | Emitido em: {new Date().toLocaleDateString('pt-BR')}
                                    </div>
                                </div>

                                <hr className="border-gray-100" />

                                <div className="bg-[#FAF7F5] border border-gray-200 rounded-lg p-4 flex gap-3 text-[11px] leading-relaxed">
                                    <span className="material-symbols-outlined text-yellow-600 text-lg">warning</span>
                                    <p className="text-gray-600">Este recibo é um <strong>comprovante de pagamento</strong>. A Nota Fiscal Eletrônica de Serviços (NFS-e) será emitida separadamente pelo prestador.</p>
                                </div>

                                {/* Sections */}
                                <div className="space-y-6">
                                    {/* Prestador */}
                                    <section>
                                        <h4 className="text-[10px] font-bold text-[#BC6E2E] uppercase tracking-widest mb-3">DADOS DO PRESTADOR</h4>
                                        <div className="grid grid-cols-[1fr_2fr] gap-y-2 border-b border-gray-100 pb-3 text-sm">
                                            <span className="text-gray-400">Empresa</span>
                                            <span className="text-right font-bold text-gray-800">Quintal da Fafá</span>
                                            <span className="text-gray-400 border-t border-dashed border-gray-100 pt-2">CNPJ</span>
                                            <span className="text-right font-bold text-gray-800 border-t border-dashed border-gray-100 pt-2">50.736.345/0001-86</span>
                                            <span className="text-gray-400 border-t border-dashed border-gray-100 pt-2">Endereço</span>
                                            <span className="text-right font-medium text-gray-600 border-t border-dashed border-gray-100 pt-2">Núcleo Rural Rio Preto, Chácara 08, Planaltina – DF</span>
                                        </div>
                                    </section>

                                    {/* Cliente */}
                                    <section>
                                        <h4 className="text-[10px] font-bold text-[#BC6E2E] uppercase tracking-widest mb-3">DADOS DO CLIENTE</h4>
                                        <div className="grid grid-cols-[1fr_2fr] gap-y-2 border-b border-gray-100 pb-3 text-sm">
                                            <span className="text-gray-400">Nome</span>
                                            <span className="text-right font-bold text-gray-800">{client.name || '--'}</span>
                                            <span className="text-gray-400 border-t border-dashed border-gray-100 pt-2">CPF / CNPJ</span>
                                            <span className="text-right font-bold text-gray-800 border-t border-dashed border-gray-100 pt-2">{client.document || '--'}</span>
                                        </div>
                                    </section>

                                    {/* Serviço */}
                                    <section>
                                        <h4 className="text-[10px] font-bold text-[#BC6E2E] uppercase tracking-widest mb-3">SERVIÇO PRESTADO</h4>
                                        <div className="grid grid-cols-[1fr_2fr] gap-y-2 border-b border-gray-100 pb-3 text-sm">
                                            <span className="text-gray-400">Evento</span>
                                            <span className="text-right font-bold text-gray-800">{service.eventType || '--'}</span>
                                            <span className="text-gray-400 border-t border-dashed border-gray-100 pt-2">Data do Evento</span>
                                            <span className="text-right font-bold text-gray-800 border-t border-dashed border-gray-100 pt-2">{service.eventDate ? new Date(service.eventDate).toLocaleDateString('pt-BR') : '--'}</span>
                                        </div>
                                    </section>
                                </div>

                                {receipt.isQuittance && (
                                    <div className="bg-[#FAF7F5] border-2 border-dashed border-gray-100 rounded-xl p-5 space-y-3 animate-fade-in relative overflow-hidden">
                                        <h4 className="text-[10px] font-bold text-[#BC6E2E] uppercase tracking-widest mb-1">Extrato de Pagamentos</h4>
                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between items-center text-gray-400">
                                                <span>Valor Total Contratado</span>
                                                <span className="font-bold text-gray-700">R$ {paymentInfo.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                            </div>
                                            <div className="flex justify-between items-center text-gray-400">
                                                <span>Sinal recebido em {paymentInfo.depositDate ? new Date(paymentInfo.depositDate).toLocaleDateString('pt-BR') : '--'}</span>
                                                <span className="font-bold text-green-600">R$ {paymentInfo.depositValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                            </div>
                                            <div className="flex justify-between items-center pt-2 border-t border-dashed border-gray-200 font-bold text-gray-800">
                                                <span>Saldo Quitado HOJE</span>
                                                <span className="text-secondary text-lg">R$ {receipt.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                            </div>
                                        </div>
                                        {/* Stamp Effect */}
                                        <div className="absolute -right-4 -bottom-4 opacity-10 pointer-events-none transform -rotate-12 translate-y-4">
                                            <span className="material-symbols-outlined text-8xl text-green-800">verified</span>
                                        </div>
                                    </div>
                                )}

                                {receipt.isQuittance && (
                                    <div className="flex justify-center py-4">
                                        <div className="border-4 border-green-700/40 text-green-700/60 px-6 py-2 rounded-lg font-black text-2xl uppercase tracking-[10px] transform -rotate-6 border-double">
                                            Quitado
                                        </div>
                                    </div>
                                )}

                                {/* Totals Box */}
                                <div className="bg-[#5A2D0C] text-white rounded-xl p-6 flex justify-between items-center shadow-lg relative z-10">
                                    <div>
                                        <div className="text-[10px] uppercase font-bold text-white/60 mb-1">{receipt.type}</div>
                                        <div className="text-3xl font-bold">R$ {receipt.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-[10px] uppercase font-bold text-white/60 mb-1">Forma de Pgto.</div>
                                        <div className="font-bold tracking-widest">{receipt.method}</div>
                                    </div>
                                </div>

                                {/* Bottom Info */}
                                <div className="text-center space-y-1 text-[9px] text-gray-400 uppercase tracking-wider pt-8">
                                    <div>Quintal da Fafá — CNPJ 50.736.345/0001-86</div>
                                    <div>Núcleo Rural Rio Preto, Chácara 08, Planaltina - DF, Brasília</div>
                                    <div className="font-bold text-gray-300">Este recibo não substitui a Nota Fiscal de Serviços Eletrônica (NFS-e)</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotaFiscal;
