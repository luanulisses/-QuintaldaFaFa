import React, { useState, useRef, useEffect } from 'react';

const MusicPlayer: React.FC = () => {
    const [isPlaying, setIsPlaying] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const togglePlay = () => {
        if (audioRef.current) {
            if (isPlaying) {
                audioRef.current.pause();
            } else {
                audioRef.current.play().catch(err => {
                    console.error("Erro ao tocar música:", err);
                });
            }
            setIsPlaying(!isPlaying);
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-[60] flex items-center gap-3">
            {/* Som Bars Animation */}
            {isPlaying && (
                <div className="flex items-end gap-[2px] h-4 mb-1">
                    {[1, 2, 3, 4].map(i => (
                        <div 
                            key={i}
                            className="w-[3px] bg-[#D9981F] rounded-full"
                            style={{ 
                                animation: `music-bar-grow ${0.5 + Math.random()}s ease-in-out infinite`,
                                animationDelay: `${i * 0.1}s`
                            }}
                        />
                    ))}
                </div>
            )}

            <button
                onClick={togglePlay}
                className={`w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all transform hover:scale-110 active:scale-95 border-2 ${
                    isPlaying 
                    ? 'bg-[#D9981F] border-[#EDD68A] text-[#1C0C04]' 
                    : 'bg-[#1C0C04]/80 backdrop-blur-md border-[#D9981F]/40 text-[#EDD68A]'
                }`}
                title={isPlaying ? "Pausar música" : "Tocar música junina"}
            >
                {isPlaying ? (
                    <span className="material-symbols-outlined text-3xl">volume_up</span>
                ) : (
                    <span className="material-symbols-outlined text-3xl">volume_off</span>
                )}
            </button>

            <audio 
                ref={audioRef}
                src="https://cdn.pixabay.com/audio/2022/05/27/audio_10f0f5b5f5.mp3" 
                loop
                preload="auto"
                crossOrigin="anonymous"
            />
        </div>
    );
};

export default MusicPlayer;
