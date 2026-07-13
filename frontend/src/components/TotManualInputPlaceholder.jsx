import React from 'react';
import { Calendar } from 'lucide-react';

const TotManualInputPlaceholder = ({ data }) => {
    if (!data || !data.card) return null;
    const { title, subtitle, state } = data.card;

    const isDisabled = state === 'disabled';

    return (
        <div className={`w-full h-[120px] rounded-[20px] border border-[var(--card-border)] flex flex-col items-center justify-center relative overflow-hidden group
        ${isDisabled ? 'opacity-60 cursor-not-allowed bg-[linear-gradient(180deg,rgba(11,18,32,0.8)_0%,rgba(15,26,46,0.9)_100%)]' : 'bg-[var(--card)]'}
    `}>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.05),transparent_70%)]"></div>

            <Calendar className="w-8 h-8 text-[var(--muted)] mb-3 opacity-30" />

            <h3 className="text-[16px] font-semibold text-[var(--text)] tracking-wide mb-1">
                {title}
            </h3>

            <span className="text-[11px] font-bold tracking-[0.2em] text-[var(--muted)] uppercase opacity-50">
                {subtitle}
            </span>
        </div>
    );
};

export default TotManualInputPlaceholder;
