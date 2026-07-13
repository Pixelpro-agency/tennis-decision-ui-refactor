export const MarketEvidenceBadge = ({ children, type }) => {
    const styles = {
        back: 'bg-blue-900/30 text-blue-400 border-blue-800/40',
        lay: 'bg-red-900/30 text-red-400 border-red-800/40',
        neutral: 'bg-gray-800 text-gray-400 border-gray-700',
        warning: 'bg-orange-900/30 text-orange-400 border-orange-800/40',
        success: 'bg-green-900/30 text-green-400 border-green-800/40',
        historical: 'bg-purple-900/30 text-purple-400 border-purple-800/40'
    };
    return (
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${styles[type] || styles.neutral}`}>
            {children}
        </span>
    );
};

export const MarketEvidenceRow = ({ label, value, muted = false, hint = null }) => (
    <div className="flex items-center justify-between text-sm py-0.5">
        <span className="text-gray-500">{label}</span>
        <div className="flex items-center gap-2">
            {hint && <span className="text-[10px] text-orange-400/80 font-mono">{hint}</span>}
            <span className={`font-mono font-medium ${muted ? 'text-gray-600' : 'text-white'}`}>{value}</span>
        </div>
    </div>
);
