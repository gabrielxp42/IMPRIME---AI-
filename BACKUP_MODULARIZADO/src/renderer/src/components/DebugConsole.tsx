import React, { useEffect, useState, useRef } from 'react';

const DebugConsole: React.FC = () => {
    const [logs, setLogs] = useState<{ time: string; type: string; msg: string }[]>([]);
    const [isVisible, setIsVisible] = useState(true);
    const logsEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Interceptar console.log
        const originalLog = console.log;
        const originalError = console.error;
        const originalWarn = console.warn;

        const addLog = (type: string, args: any[]) => {
            const time = new Date().toLocaleTimeString();
            const msg = args.map(arg =>
                typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
            ).join(' ');

            setLogs(prev => [...prev.slice(-49), { time, type, msg }]); // Manter últimos 50 logs
        };

        console.log = (...args) => {
            originalLog(...args);
            addLog('INFO', args);
        };

        console.error = (...args) => {
            originalError(...args);
            addLog('ERROR', args);
        };

        console.warn = (...args) => {
            originalWarn(...args);
            addLog('WARN', args);
        };

        // Capturar erros globais
        const handleError = (event: ErrorEvent) => {
            addLog('CRASH', [event.message, event.filename, event.lineno]);
        };

        const handleRejection = (event: PromiseRejectionEvent) => {
            addLog('PROMISE_FAIL', [event.reason]);
        };

        window.addEventListener('error', handleError);
        window.addEventListener('unhandledrejection', handleRejection);

        return () => {
            console.log = originalLog;
            console.error = originalError;
            console.warn = originalWarn;
            window.removeEventListener('error', handleError);
            window.removeEventListener('unhandledrejection', handleRejection);
        };
    }, []);

    // Auto-scroll
    useEffect(() => {
        logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [logs]);

    if (!isVisible) {
        return (
            <button
                onClick={() => setIsVisible(true)}
                style={{
                    position: 'fixed',
                    bottom: '10px',
                    left: '10px',
                    zIndex: 99999,
                    background: 'red',
                    color: 'white',
                    padding: '5px 10px',
                    borderRadius: '5px',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontFamily: 'monospace'
                }}
            >
                🐞 DEBUG
            </button>
        );
    }

    return (
        <div style={{
            position: 'fixed',
            bottom: '0',
            left: '0',
            width: '100%',
            height: '200px',
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            color: '#00ff00',
            fontFamily: 'Consolas, monospace',
            fontSize: '11px',
            zIndex: 99999,
            overflowY: 'auto',
            pointerEvents: 'auto',
            borderTop: '2px solid #333',
            display: 'flex',
            flexDirection: 'column'
        }}>
            <div style={{
                padding: '5px',
                background: '#222',
                borderBottom: '1px solid #444',
                display: 'flex',
                justifyContent: 'space-between',
                position: 'sticky',
                top: 0
            }}>
                <strong>🐞 MONITOR DE SISTEMA (Raio-X)</strong>
                <div>
                    <button onClick={() => setLogs([])} style={{ marginRight: '10px', cursor: 'pointer' }}>Limpar</button>
                    <button onClick={() => setIsVisible(false)} style={{ cursor: 'pointer' }}>Ocultar</button>
                </div>
            </div>
            <div style={{ padding: '10px', flex: 1 }}>
                {logs.map((log, index) => (
                    <div key={index} style={{
                        marginBottom: '4px',
                        borderBottom: '1px solid rgba(255,255,255,0.1)',
                        color: log.type === 'ERROR' || log.type === 'CRASH' ? '#ff5555' :
                            log.type === 'WARN' ? '#ffcc00' : '#00ff00'
                    }}>
                        <span style={{ color: '#666', marginRight: '8px' }}>[{log.time}]</span>
                        <span style={{ fontWeight: 'bold', marginRight: '8px' }}>{log.type}:</span>
                        <span style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{log.msg}</span>
                    </div>
                ))}
                <div ref={logsEndRef} />
            </div>
        </div>
    );
};

export default DebugConsole;
