import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { toPng } from 'html-to-image';

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
    const ticketRef = useRef<HTMLDivElement>(null);
    const [qrError, setQrError] = useState<string | null>(null);
    const [downloadError, setDownloadError] = useState<string | null>(null);
    const [isDownloading, setIsDownloading] = useState(false);

    // Parse quantity and ticket type from itemsText (e.g. "1x Meia-Entrada (6-12 anos)")
    const parseItems = (text: string) => {
        const match = text.match(/^(\d+)x\s+(.+)$/i);
        if (match) {
            return {
                quantity: match[1],
                type: match[2]
            };
        }
        return {
            quantity: '1',
            type: text
        };
    };

    const { quantity, type: ticketType } = parseItems(itemsText);

    useEffect(() => {
        if (canvasRef.current && listNumber) {
            // Generate QR Code with high contrast and explicit white background/margin
            QRCode.toCanvas(
                canvasRef.current,
                listNumber,
                {
                    width: 220,
                    margin: 2,
                    color: {
                        dark: '#000000', // high contrast black
                        light: '#FFFFFF' // high contrast white
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

    // Plan A: Download complete ticket as PNG
    const handleDownload = async () => {
        if (!ticketRef.current) return;
        setDownloadError(null);
        setIsDownloading(true);

        try {
            // Wait a tiny moment for layout/rendering sync
            await new Promise((resolve) => setTimeout(resolve, 150));

            const dataUrl = await toPng(ticketRef.current, {
                pixelRatio: window.devicePixelRatio || 2,
                cacheBust: true,
                style: {
                    transform: 'scale(1)',
                    transformOrigin: 'top left',
                    width: ticketRef.current.offsetWidth + 'px',
                    height: ticketRef.current.offsetHeight + 'px'
                }
            });

            const link = document.createElement('a');
            link.download = `ingresso_${listNumber}.png`;
            link.href = dataUrl;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (err) {
            console.error('Error exporting ticket PNG', err);
            setDownloadError('Não foi possível gerar o ingresso completo. Tente novamente ou baixe o QR Code.');
        } finally {
            setIsDownloading(false);
        }
    };

    // Plan B: Fallback download of QR Code only
    const handleDownloadOnlyQR = () => {
        if (!canvasRef.current) return;
        try {
            const url = canvasRef.current.toDataURL('image/png');
            const link = document.createElement('a');
            link.href = url;
            link.download = `qrcode_${listNumber}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (err) {
            console.error('Error downloading QR Code only', err);
        }
    };

    // Share complete ticket image or text fallback
    const handleShare = async () => {
        if (!ticketRef.current) return;
        setDownloadError(null);

        try {
            // Generate ticket image
            const dataUrl = await toPng(ticketRef.current, {
                pixelRatio: window.devicePixelRatio || 2,
                cacheBust: true,
                style: {
                    transform: 'scale(1)',
                    transformOrigin: 'top left',
                    width: ticketRef.current.offsetWidth + 'px',
                    height: ticketRef.current.offsetHeight + 'px'
                }
            });

            // Convert image to blob and then file
            const res = await fetch(dataUrl);
            const blob = await res.blob();
            const file = new File([blob], `ingresso_${listNumber}.png`, { type: 'image/png' });

            if (navigator.canShare && navigator.canShare({ files: [file] })) {
                await navigator.share({
                    files: [file],
                    title: 'Ingresso Arraiá 2026',
                    text: 'Aqui está meu ingresso para o Arraiá do Quintal da Fafá 2026!'
                });
            } else if (navigator.share) {
                // Text fallback if files cannot be shared but navigator.share is supported
                await navigator.share({
                    title: 'Ingresso Arraiá 2026',
                    text: `Meu ingresso para o Arraiá do Quintal da Fafá 2026!\nLista: ${listNumber}\nNome: ${customerName}\nItens: ${itemsText}`,
                    url: window.location.origin
                });
            } else {
                alert('Seu navegador não permite compartilhamento direto. Use o botão Baixar Ingresso.');
            }
        } catch (err) {
            console.error('Error sharing ticket', err);
            alert('Seu navegador não permite compartilhamento direto. Use o botão Baixar Ingresso.');
        }
    };

    return (
        <div className="max-w-sm w-full mx-auto">
            {/* 1. Visually Exported Ticket Container */}
            <div 
                ref={ticketRef} 
                className="relative p-6 border-2 border-[#F4D35E] rounded-3xl bg-gradient-to-b from-[#1B0038] via-[#32005A] to-[#4A1270] shadow-2xl text-center text-white select-none w-full"
                style={{ fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}
            >
                {/* Background Watermark */}
                <div className="absolute inset-0 rounded-3xl overflow-hidden pointer-events-none z-0">
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div 
                            className="text-white font-black tracking-widest uppercase rotate-[-30deg] whitespace-nowrap select-none"
                            style={{ fontSize: '4.2rem', opacity: 0.05 }}
                        >
                            QUINTAL DA FAFÁ
                        </div>
                    </div>
                </div>

                {/* Event Header */}
                <div className="relative z-10 text-center mb-4">
                    <div className="text-3xl mb-1">🌽</div>
                    <h3 className="text-[#F4D35E] font-black text-xl tracking-wider uppercase font-display">
                        Arraiá do Quintal da Fafá
                    </h3>
                    <div className="inline-block bg-[#F4D35E] text-[#1B0038] text-[10px] font-black px-3 py-0.5 rounded tracking-widest mt-1 uppercase">
                        🏷️ 2ª Edição
                    </div>
                    
                    <div className="mt-3 space-y-0.5 text-xs text-white/90 font-medium">
                        <div className="flex items-center justify-center gap-1.5 font-bold">
                            <span>📅</span>
                            <span>18 de Julho de 2026</span>
                        </div>
                        <div className="flex items-center justify-center gap-1.5 font-semibold text-white/80">
                            <span>📍</span>
                            <span>Planaltina - DF</span>
                        </div>
                    </div>

                    <div className="mt-3.5 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-[#F4D35E] text-[11px] font-bold">
                        <span className="flex items-center gap-1">🎵 Lampião Elétrico</span>
                        <span className="text-white/30">•</span>
                        <span className="flex items-center gap-1">🎵 Karlito Tremendão</span>
                    </div>
                </div>

                {/* Dotted separator with ticket notches */}
                <div className="relative z-10 border-t border-dashed border-white/20 my-4">
                    <div className="absolute -left-8 -top-2 w-4 h-4 bg-[#1C053A] rounded-full"></div>
                    <div className="absolute -right-8 -top-2 w-4 h-4 bg-[#1C053A] rounded-full"></div>
                </div>

                {/* Participant & Purchase Info */}
                <div className="relative z-10 space-y-3.5 text-left px-2">
                    <div>
                        <span className="text-[#F4D35E] text-[10px] font-bold tracking-widest block uppercase">Comprador</span>
                        <span className="text-white font-black text-lg block truncate">{customerName}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <span className="text-[#F4D35E] text-[10px] font-bold tracking-widest block uppercase">Quantidade</span>
                            <span className="text-white font-extrabold text-sm block">
                                {quantity} {parseInt(quantity) === 1 ? 'ingresso' : 'ingressos'}
                            </span>
                        </div>
                        <div>
                            <span className="text-[#F4D35E] text-[10px] font-bold tracking-widest block uppercase">Tipo de Ingresso</span>
                            <span className="text-white font-extrabold text-sm block truncate" title={ticketType}>
                                {ticketType}
                            </span>
                        </div>
                    </div>

                    <div className="flex justify-between items-center pt-2.5 border-t border-white/5">
                        <div>
                            <span className="text-[#F4D35E] text-[10px] font-bold tracking-widest block uppercase">Valor Total</span>
                            <span className="text-white font-black text-xl">
                                R$ {total.toFixed(2).replace('.', ',')}
                            </span>
                        </div>
                        <div className="text-right">
                            <span className="text-[#F4D35E] text-[10px] font-bold tracking-widest block uppercase">Status</span>
                            <span className="inline-flex items-center gap-1 bg-[#22C55E]/15 text-[#22C55E] px-2.5 py-0.5 rounded-full text-xs font-black">
                                PAGO ✅
                            </span>
                        </div>
                    </div>

                    <div className="pt-2 border-t border-white/5">
                        <span className="text-[#F4D35E] text-[10px] font-bold tracking-widest block uppercase">Número da Lista</span>
                        <span className="text-[#F4D35E] font-black text-2xl tracking-wider block mt-0.5">
                            {listNumber}
                        </span>
                    </div>
                </div>

                {/* Dotted separator with ticket notches */}
                <div className="relative z-10 border-t border-dashed border-white/20 my-4">
                    <div className="absolute -left-8 -top-2 w-4 h-4 bg-[#1C053A] rounded-full"></div>
                    <div className="absolute -right-8 -top-2 w-4 h-4 bg-[#1C053A] rounded-full"></div>
                </div>

                {/* QR Code Container */}
                <div className="relative z-10 my-4 flex flex-col items-center">
                    <div className="bg-white p-3 rounded-2xl border-4 border-[#F4D35E] shadow-xl inline-block">
                        {qrError ? (
                            <div className="w-[220px] h-[220px] flex items-center justify-center text-red-600 font-bold bg-red-100 rounded-xl">
                                {qrError}
                            </div>
                        ) : (
                            <canvas ref={canvasRef} className="w-[220px] h-[220px] block" />
                        )}
                    </div>
                </div>

                {/* Footer Info */}
                <div className="relative z-10 text-[10px] text-white/50 leading-relaxed max-w-[280px] mx-auto mt-2 font-medium">
                    <p>Apresente este QR Code na entrada do evento.</p>
                    <p>Cada ingresso possui identificação única.</p>
                    <p className="text-[#F4D35E]/85 font-semibold mt-0.5">Após o check-in o QR será invalidado automaticamente.</p>
                </div>
            </div>

            {/* 2. Action Buttons (Outside ticketRef so they are not captured in PNG) */}
            <div className="mt-5 space-y-3">
                {downloadError && (
                    <div className="bg-red-500/10 border border-red-500/30 text-red-200 text-xs px-3 py-2.5 rounded-xl text-center font-medium">
                        {downloadError}
                    </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                    <button
                        type="button"
                        onClick={handleDownload}
                        disabled={isDownloading}
                        className="flex items-center justify-center gap-2 bg-[#F4D35E] hover:bg-[#e0c050] text-[#1B0038] font-black py-3 px-2 rounded-xl text-xs transition-colors shadow-lg active:scale-95 cursor-pointer border-none disabled:opacity-75 disabled:scale-100 w-full"
                        title="Baixar ingresso em PNG"
                    >
                        <span>📥</span> {isDownloading ? 'Gerando...' : 'Baixar Ingresso'}
                    </button>
                    <button
                        type="button"
                        onClick={handleShare}
                        className="flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white font-black py-3 px-2 rounded-xl text-xs transition-colors border border-white/10 active:scale-95 cursor-pointer w-full"
                        title="Compartilhar ingresso"
                    >
                        <span>📱</span> Compartilhar
                    </button>
                </div>

                {/* Fallback Option */}
                {downloadError && (
                    <button
                        type="button"
                        onClick={handleDownloadOnlyQR}
                        className="w-full flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-white/80 font-bold py-2.5 px-2 rounded-xl text-xs transition-colors border border-dashed border-white/20 cursor-pointer"
                        title="Baixar apenas o QR Code (Plano B)"
                    >
                        <span>🧩</span> Baixar apenas QR Code (Plano B)
                    </button>
                )}
                
                {onClose && (
                    <button 
                        type="button"
                        onClick={onClose}
                        className="text-xs text-white/50 hover:text-white underline cursor-pointer block mx-auto py-1 border-none bg-transparent"
                    >
                        Fechar
                    </button>
                )}
            </div>
        </div>
    );
};

export default DigitalTicket;
