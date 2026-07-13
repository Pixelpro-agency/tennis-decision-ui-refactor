import React from 'react';
import { Code, ChevronDown, ChevronUp } from 'lucide-react';

const DebugPanel = ({ data, isVisible, onToggle }) => {
    if (!data) return null;

    return (
        <div className="mt-6 border-t border-gray-800 pt-6">
            <button
                onClick={onToggle}
                className="flex items-center gap-2 text-sm font-bold text-gray-400 hover:text-white transition mb-4"
            >
                <Code className="w-4 h-4" />
                DEBUG MODE
                {isVisible ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {isVisible && (
                <div className="dashboardCard p-6 bg-gray-950 border-gray-800">
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Raw JSON Response</h3>
                    <pre className="text-xs text-gray-300 overflow-auto max-h-[500px] bg-black/30 p-4 rounded border border-gray-800 font-mono">
                        {JSON.stringify(data, null, 2)}
                    </pre>
                    <div className="mt-4 text-xs text-gray-600 flex items-center gap-4">
                        <span>Fetched at: {new Date().toISOString()}</span>
                        <span className="w-1 h-1 rounded-full bg-gray-700"></span>
                        <span>Strategy Version: 1.0.0</span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DebugPanel;
