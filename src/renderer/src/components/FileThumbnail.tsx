import React, { useState, useEffect } from 'react';

interface FileThumbnailProps {
    filePath: string;
    fileName: string;
}

const FileThumbnail: React.FC<FileThumbnailProps> = ({ filePath, fileName }) => {
    const [src, setSrc] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        let mounted = true;
        const load = async () => {
            const ext = filePath.split('.').pop()?.toLowerCase();
            // Extensive list of natively supported formats by Chromium
            if (['png', 'jpg', 'jpeg', 'webp', 'gif', 'bmp', 'svg', 'ico'].includes(ext || '')) {
                setSrc(`media:///${filePath.replace(/\\/g, '/')}`);
                setLoading(false);
            } else {
                // For TIFF, PDF, PSD, etc., request generated thumbnail
                try {
                    const res = await window.electronAPI.getThumbnail(filePath);
                    if (mounted) {
                        if (res.success && res.dataUrl) {
                            setSrc(res.dataUrl);
                        } else {
                            setError(true);
                        }
                    }
                } catch (e) {
                    console.error("Thumbnail load error:", e);
                    if (mounted) setError(true);
                } finally {
                    if (mounted) setLoading(false);
                }
            }
        };
        load();
        return () => { mounted = false; };
    }, [filePath]);

    if (loading) {
        return (
            <div className="file-thumbnail-placeholder loading">
                <span className="spinner-small"></span>
            </div>
        );
    }

    if (error || !src) {
        return (
            <div className="file-thumbnail-placeholder error">
                <span style={{ fontSize: '24px', opacity: 0.5 }}>📄</span>
            </div>
        );
    }

    return (
        <img
            src={src}
            alt={fileName}
            className="file-thumbnail"
            loading="lazy"
            onError={() => setError(true)}
        />
    );
};

export default FileThumbnail;
