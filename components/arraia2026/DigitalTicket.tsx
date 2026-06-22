import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';

interface DigitalTicketProps {
    listNumber: string;
    customerName: string;
    customerPhone?: string;
    itemsText: string;
    total: number;
    paymentStatus?: string;
    onClose?: () => void;
}

export const DigitalTicket: React.FC<DigitalTicketProps> = ({
    listNumber,
    customerName,
    customerPhone = '',
    itemsText,
    total,
    paymentStatus = 'approved',
    onClose
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [qrError, setQrError] = useState<string | null>(null);

    useEffect(() => {
        if (canvasRef.current && listNumber) {
            QRCode.toCanvas(
                canvasRef.current,
                listNumber,
                {
                    width: 220,
                    margin: 1.5,
                    color: {
                        dark: '#1C053A', // deep dark purple
                        light: '#FFFFFF' // white
                    }
                },
                (error) => {
                    if (error) {
                        console.error('Error generating QR Code', error);
                        setQrError('Erro ao gerar o QR Code');
                    }
                }
            );
        }
    }, [listNumber]);

    const handleDownload = () => {
        if (!canvasRef.current) return;
        try {
            const url = canvasRef.current.toDataURL('image/png');
            const link = document.createElement('a');
            link.href = url;
            link.download = `ingresso_${listNumber}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (err) {
            console.error('Error downloading QR Code', err);
        }
    };

    const handleShare = async () => {
        const text = `Meu ingresso para o Arraiá do Quintal da Fafá 2026!\nLista: ${listNumber}\nNome: ${customerName}\nItens: ${itemsText}`;
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'Ingresso Arraiá 2026',
                    text: text,
                    url: window.location.origin
                });
            } catch (err) {
                console.log('Share aborted or failed', err);
            }
        } else {
            try {
                await navigator.clipboard.writeText(text);
                alert('Informações do ingresso copiadas! Cole no WhatsApp para compartilhar.');
            } catch (err) {
                console.error('Failed to copy text', err);
            }
        }
    };

    return (
        <div className="bg-[#1C053A] border-2 border-[#FFD54F]/80 rounded-3xl p-6 shadow-[0_0_40px_rgba(255,213,79,0.15)] max-w-sm w-full text-center relative text-white select-none overflow-hidden mx-auto">
            {/* Header Event Info */}
            <div className="mb-4">
                <div className="text-3xl mb-1">🌽</div>
                <h3 className="text-[#FFD54F] font-black text-xl tracking-wider font-display uppercase">
                    ARRAIÁ DO QUINTAL DA FAFÁ
                </h3>
                <span className="bg-[#FFD54F] text-[#1C053A] text-[10px] font-black px-2 py-0.5 rounded tracking-widest">
                    2ª EDIÇÃO
                </span>
            </div>

            {/* Dotted separator */}
            <div className="border-t border-dashed border-white/20 my-4 relative">
                <div className="absolute -left-8 -top-2 w-4 h-4 bg-[#1C053A] rounded-full"></div>
                <div className="absolute -right-8 -top-2 w-4 h-4 bg-[#1C053A] rounded-full"></div>
            </div>

            {/* Main Ticket Info */}
            <div className="space-y-3 my-4 text-left px-2">
                <div>
                    <span className="text-white/40 text-[10px] font-bold tracking-widest block uppercase">Comprador</span>
                    <span className="text-white font-bold text-base block truncate">{customerName}</span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <span className="text-white/40 text-[10px] font-bold tracking-widest block uppercase">Data</span>
                        <span className="text-white font-bold text-sm block">18 de Julho, 2026</span>
                    </div>
                    <div>
                        <span className="text-white/40 text-[10px] font-bold tracking-widest block uppercase">Local</span>
                        <span className="text-white font-bold text-sm block">Planaltina - DF</span>
                    </div>
                </div>

                <div>
                    <span className="text-white/40 text-[10px] font-bold tracking-widest block uppercase">Ingressos</span>
                    <span className="text-white font-bold text-xs block truncate" title={itemsText}>{itemsText}</span>
                </div>

                <div className="flex justify-between items-center pt-1 border-t border-white/5">
                    <div>
                        <span className="text-white/40 text-[10px] font-bold tracking-widest block uppercase">Total Pago</span>
                        <span className="text-[#FFD54F] font-extrabold text-lg">R$ {total.toFixed(2).replace('.', ',')}</span>
                    </div>
                    <div>
                        <span className="text-white/40 text-[10px] font-bold tracking-widest block uppercase text-right">Status</span>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                            paymentStatus === 'approved' 
                                ? 'bg-[#4CAF50]/20 text-[#4CAF50]' 
                                : 'bg-[#FFD54F]/20 text-[#FFD54F]'
                        }`}>
                            {paymentStatus === 'approved' ? 'PAGO' : 'PENDENTE'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Dotted separator */}
            <div className="border-t border-dashed border-white/20 my-4 relative">
                <div className="absolute -left-8 -top-2 w-4 h-4 bg-[#1C053A] rounded-full"></div>
                <div className="absolute -right-8 -top-2 w-4 h-4 bg-[#1C053A] rounded-full"></div>
            </div>

            {/* QR Code Container */}
            <div className="my-5 flex flex-col items-center">
                <div className="bg-white p-3 rounded-2xl border-4 border-[#FFD54F] shadow-lg inline-block">
                    {qrError ? (
                        <div className="w-[220px] h-[220px] flex items-center justify-center text-red-600 font-bold bg-red-100 rounded-xl">
                            {qrError}
                        </div>
                    ) : (
                        <canvas ref={canvasRef} className="w-[220px] h-[220px] rounded-xl" />
                    )}
                </div>
                <div className="mt-3">
                    <span className="text-white/40 text-[9px] font-bold tracking-widest block uppercase">NÚMERO DA LISTA</span>
                    <span className="text-[#FFD54F] font-black text-3xl tracking-widest block mt-0.5">
                        {listNumber}
                    </span>
                </div>
            </div>

            {/* Footer Buttons */}
            <div className="mt-6 grid grid-cols-2 gap-3">
                <button
                    type="button"
                    onClick={handleDownload}
                    className="flex items-center justify-center gap-2 bg-[#FFD54F] hover:bg-[#ffc107] text-[#1C053A] font-bold py-3 px-2 rounded-xl text-xs transition-colors shadow-lg active:scale-95 cursor-pointer border-none"
                    title="Baixa o QR Code do Ingresso"
                >
                    <span>📥</span> Baixar QR Code
                </button>
                <button
                    type="button"
                    onClick={handleShare}
                    className="flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white font-bold py-3 px-2 rounded-xl text-xs transition-colors border border-white/10 active:scale-95 cursor-pointer"
                >
                    <span>📱</span> Compartilhar
                </button>
            </div>
            
            {onClose && (
                <button 
                    type="button"
                    onClick={onClose}
                    className="mt-5 text-xs text-white/50 hover:text-white underline cursor-pointer block mx-auto py-1 border-none bg-transparent"
                >
                    Fechar
                </button>
            )}

            {/* Note: downloading the full visual ticket layout will be supported in future updates via html2canvas/dom-to-image. For now, downloading the QR Code is provided. */}
        </div>
    );
};

export default DigitalTicket;
