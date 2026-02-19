import React, { useState, useRef, useCallback } from 'react';
import { supabase } from '../../lib/supabase';

interface FileUploaderProps {
    label?: string;
    onUpload?: (url: string) => void;
    onUploads?: (urls: string[]) => void;
    currentUrl?: string;
    accept?: string;
    bucket?: string;
    multiple?: boolean;
}

const fileIsVideo = (url: string) => /\.(mp4|webm|ogg|mov)$/i.test(url);

const FileUploader: React.FC<FileUploaderProps> = ({
    label,
    onUpload,
    onUploads,
    currentUrl,
    accept = 'image/*,video/*',
    bucket = 'site_assets',
    multiple = false,
}) => {
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [dragging, setDragging] = useState(false);
    const [showUrlInput, setShowUrlInput] = useState(false);
    const [manualUrl, setManualUrl] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    const uploadFiles = useCallback(async (files: FileList | File[]) => {
        setError(null);
        setUploading(true);
        setProgress(0);

        const urls: string[] = [];
        const totalFiles = files.length;

        try {
            const filesArray = Array.from(files);
            for (let i = 0; i < filesArray.length; i++) {
                const file = filesArray[i];
                if (!file || !file.name) continue;

                const fileExt = file.name.split('.').pop()?.toLowerCase();
                const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;

                const { error: uploadError } = await supabase.storage
                    .from(bucket)
                    .upload(fileName, file, { upsert: true });

                if (uploadError) throw uploadError;

                const { data } = supabase.storage
                    .from(bucket)
                    .getPublicUrl(fileName);

                urls.push(data.publicUrl);
                setProgress(Math.round(((i + 1) / filesArray.length) * 100));
            }

            if (multiple && onUploads) {
                onUploads(urls);
            } else if (onUpload) {
                onUpload(urls[0]);
            }

            setTimeout(() => setProgress(0), 800);
        } catch (err: any) {
            setError(err.message || 'Erro ao enviar arquivo(s).');
            setProgress(0);
        } finally {
            setUploading(false);
        }
    }, [bucket, onUpload, onUploads, multiple]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            uploadFiles(files);
        }
        e.target.value = '';
    };

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setDragging(false);
        const files = e.dataTransfer.files;
        if (files && files.length > 0) {
            uploadFiles(files);
        }
    }, [uploadFiles]);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setDragging(true);
    };

    const handleDragLeave = () => setDragging(false);

    const handleRemove = () => {
        if (onUpload) onUpload('');
        setError(null);
    };

    const handleManualUrlSave = () => {
        if (manualUrl.trim()) {
            if (multiple && onUploads) {
                onUploads([manualUrl.trim()]);
            } else if (onUpload) {
                onUpload(manualUrl.trim());
            }
            setManualUrl('');
            setShowUrlInput(false);
        }
    };

    const isVideo = currentUrl ? fileIsVideo(currentUrl) : false;

    return (
        <div className="w-full space-y-2">
            {label && (
                <label className="block text-xs font-bold uppercase text-text-muted">
                    {label}
                </label>
            )}

            <div
                className={`relative border-2 border-dashed rounded-xl transition-all duration-200 ${dragging
                    ? 'border-primary bg-primary/5 scale-[1.01]'
                    : 'border-primary/20 bg-surface-cream hover:border-primary/40 hover:bg-primary/5'
                    }`}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
            >
                {uploading && progress > 0 && (
                    <div className="absolute top-0 left-0 right-0 h-1 bg-primary/10 rounded-t-xl overflow-hidden">
                        <div
                            className="h-full bg-primary transition-all duration-300 ease-out"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                )}

                <div className="flex items-start gap-4 p-4">
                    {!multiple && (
                        <div className="relative flex-shrink-0">
                            <div className="w-24 h-24 rounded-lg overflow-hidden bg-white border border-primary/10 flex items-center justify-center">
                                {currentUrl ? (
                                    isVideo ? (
                                        <video src={currentUrl} className="w-full h-full object-cover" muted />
                                    ) : (
                                        <img src={currentUrl} alt="Preview" className="w-full h-full object-cover" />
                                    )
                                ) : (
                                    <span className="material-symbols-outlined text-secondary/30 text-4xl">
                                        {accept.includes('video') ? 'perm_media' : 'image'}
                                    </span>
                                )}
                            </div>
                            {currentUrl && (
                                <button
                                    onClick={handleRemove}
                                    className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center shadow hover:bg-red-600 transition-colors"
                                >
                                    <span className="material-symbols-outlined text-xs" style={{ fontSize: '12px' }}>close</span>
                                </button>
                            )}
                        </div>
                    )}

                    <div className="flex-1 min-w-0">
                        {uploading ? (
                            <div className="flex flex-col items-center justify-center py-4 gap-2">
                                <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
                                <p className="text-sm text-primary font-medium">Enviando {multiple ? 'arquivos' : 'arquivo'}... {progress}%</p>
                            </div>
                        ) : (
                            <>
                                <button
                                    type="button"
                                    onClick={() => inputRef.current?.click()}
                                    className="w-full flex flex-col items-center justify-center gap-1 py-3 rounded-lg border border-dashed border-primary/30 hover:border-primary hover:bg-primary/5 transition-all cursor-pointer group"
                                >
                                    <span className="material-symbols-outlined text-primary/50 group-hover:text-primary transition-colors text-3xl">
                                        {multiple ? 'library_add' : 'cloud_upload'}
                                    </span>
                                    <span className="text-sm font-semibold text-text-main group-hover:text-primary transition-colors">
                                        {multiple ? 'Selecionar várias fotos' : 'Clique para selecionar arquivo'}
                                    </span>
                                    <span className="text-xs text-text-muted">
                                        ou arraste e solte aqui
                                    </span>
                                </button>

                                <input
                                    ref={inputRef}
                                    type="file"
                                    accept={accept}
                                    onChange={handleFileChange}
                                    multiple={multiple}
                                    disabled={uploading}
                                    className="hidden"
                                />

                                {currentUrl && !multiple && (
                                    <div className="mt-2 flex items-center gap-1 text-xs text-text-muted/60">
                                        <span className="material-symbols-outlined text-xs" style={{ fontSize: '12px' }}>link</span>
                                        <span className="truncate max-w-[240px]">{currentUrl}</span>
                                    </div>
                                )}

                                <div className="mt-2">
                                    {!showUrlInput ? (
                                        <button
                                            type="button"
                                            onClick={() => setShowUrlInput(true)}
                                            className="text-xs text-primary/60 hover:text-primary underline underline-offset-2 transition-colors"
                                        >
                                            {multiple ? 'Ou adicione por URL' : 'Ou cole uma URL diretamente'}
                                        </button>
                                    ) : (
                                        <div className="flex gap-2 mt-1">
                                            <input
                                                type="url"
                                                value={manualUrl}
                                                onChange={(e) => setManualUrl(e.target.value)}
                                                placeholder="https://..."
                                                className="flex-1 text-xs px-3 py-1.5 rounded-lg border border-primary/20 bg-white focus:border-primary outline-none"
                                                onKeyDown={(e) => e.key === 'Enter' && handleManualUrlSave()}
                                                autoFocus
                                            />
                                            <button
                                                type="button"
                                                onClick={handleManualUrlSave}
                                                className="px-3 py-1.5 bg-primary text-white text-xs rounded-lg font-bold hover:bg-primary-dark transition-colors"
                                            >
                                                OK
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => { setShowUrlInput(false); setManualUrl(''); }}
                                                className="px-2 py-1.5 text-text-muted text-xs rounded-lg hover:bg-gray-100 transition-colors"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {error && (
                <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                    <span className="material-symbols-outlined text-sm">error</span>
                    <span>{error}</span>
                </div>
            )}
        </div>
    );
};

export default FileUploader;
