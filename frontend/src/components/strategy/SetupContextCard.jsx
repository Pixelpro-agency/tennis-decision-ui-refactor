import React from 'react';

const isUnavailable = (item) => {
    if (item?.available === false) return true;
    if (item?.value == null) return true;
    if (item?.value === '—') return true;
    return false;
};

const SetupContextCard = ({ context }) => {
    if (!context || context.length === 0) return null;

    return (
        <div className="bg-[#1a2332] rounded-xl border border-gray-800 p-5">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Setup Context</h3>
            <div className="space-y-3">
                {context.map((item, idx) => {
                    const unavailable = isUnavailable(item);
                    return (
                        <div
                            key={idx}
                            className={`flex items-start gap-2 text-sm ${unavailable ? 'opacity-45 grayscale cursor-not-allowed' : ''}`}
                            title={unavailable ? item?.reason || 'Not available' : undefined}
                        >
                            <span className="text-gray-500 shrink-0">•</span>
                            <div className="flex-1">
                                <span className="text-gray-400">{item.label}:</span>
                                <span className="text-white font-medium ml-1">
                                    {unavailable ? '—' : item.value}
                                </span>
                                {unavailable && item.reason && (
                                    <span className="block text-[10px] text-gray-500 mt-0.5 font-mono">
                                        {item.reason}
                                    </span>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default SetupContextCard;
