import React from 'react';
import { Zap } from 'lucide-react';

const Superbreak = () => {
    return (
        <div className="flex-1 flex flex-col items-center justify-center p-10 h-full min-h-[600px]">
            <div className="dashboardCard p-12 max-w-2xl w-full text-center flex flex-col items-center">
                <div className="w-16 h-16 bg-yellow-500/10 border border-yellow-500/20 rounded-2xl flex items-center justify-center mb-6">
                    <Zap className="w-8 h-8 text-[var(--warning)]" />
                </div>
                <h1 className="text-3xl font-bold text-white mb-4">Superbreak</h1>
                <p className="text-[var(--muted)] text-lg mb-8">
                    La strategia **Superbreak** identifica le opportunità di break più probabili basandosi sull'intensità del momentum corrente.
                </p>
                <div className="w-full h-[1px] bg-[var(--card-border)] mb-8"></div>
                <div className="grid grid-cols-2 gap-4 w-full">
                    <div className="p-4 bg-[var(--bg-1)] border border-[var(--card-border)] rounded-xl text-left">
                        <div className="text-[10px] text-[var(--muted)] uppercase font-bold mb-1">Intensity</div>
                        <div className="text-white font-semibold">High</div>
                    </div>
                    <div className="p-4 bg-[var(--bg-1)] border border-[var(--card-border)] rounded-xl text-left">
                        <div className="text-[10px] text-[var(--muted)] uppercase font-bold mb-1">Confidence</div>
                        <div className="text-white font-semibold">92%</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Superbreak;
