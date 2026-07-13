import React from 'react';
import { Repeat } from 'lucide-react';

const BancaServizio = () => {
    return (
        <div className="flex-1 flex flex-col items-center justify-center p-10 h-full min-h-[600px]">
            <div className="dashboardCard p-12 max-w-2xl w-full text-center flex flex-col items-center">
                <div className="w-16 h-16 bg-orange-500/10 border border-orange-500/20 rounded-2xl flex items-center justify-center mb-6">
                    <Repeat className="w-8 h-8 text-[var(--danger)]" />
                </div>
                <h1 className="text-3xl font-bold text-white mb-4">Banca Servizio</h1>
                <p className="text-[var(--muted)] text-lg mb-8">
                    Modulo dedicato alla strategia **Banca Servizio**. Monitoraggio in tempo reale dei game al servizio e statistiche di break-point.
                </p>
                <div className="w-full h-[1px] bg-[var(--card-border)] mb-8"></div>
                <div className="grid grid-cols-2 gap-4 w-full">
                    <div className="p-4 bg-[var(--bg-1)] border border-[var(--card-border)] rounded-xl text-left">
                        <div className="text-[10px] text-[var(--muted)] uppercase font-bold mb-1">Status</div>
                        <div className="text-white font-semibold">Monitoring</div>
                    </div>
                    <div className="p-4 bg-[var(--bg-1)] border border-[var(--card-border)] rounded-xl text-left">
                        <div className="text-[10px] text-[var(--muted)] uppercase font-bold mb-1">Risk Level</div>
                        <div className="text-white font-semibold">Medium</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BancaServizio;
