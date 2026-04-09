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
      try {
        setLoading(true);
        setError(false);

        // Para PDF, PNG, TIFF, PSD, etc., agora usamos SEMPRE o backend.
        // O backend (Sharp) é muito mais eficiente para arquivos gigantes
        // e evita que o Renderer (navegador) tente carregar arquivos de centenas de megas na RAM.
        
        let actualPath = filePath;
        // Detectar se é um PDF explodido com ::page
        if (filePath.includes('::')) {
            // getThumbnail no main.ts já sabe lidar com o formato filePath::page
        }

        try {
          const res = await window.electronAPI.getThumbnail(filePath);
          if (mounted) {
            if (res.success && res.dataUrl) {
              setSrc(res.dataUrl);
            } else {
              console.warn("Falha ao obter miniatura do backend para:", filePath, res.error);
              setError(true);
            }
          }
        } catch (e) {
          console.error("Thumbnail load error:", e);
          if (mounted) setError(true);
        }
      } catch (e) {
        console.error("Thumbnail logic error:", e);
        if (mounted) setError(true);
      } finally {
        if (mounted) setLoading(false);
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
      onError={() => {
          console.error("Erro ao carregar imagem da miniatura:", src);
          setError(true);
      }}
    />
  );
};

export default FileThumbnail;
