
import React from 'react';

interface ConfirmationModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    onConfirm: () => void;
    onCancel: () => void;
    isDanger?: boolean;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ 
    isOpen, 
    title, 
    message, 
    confirmLabel = "Confirm", 
    cancelLabel = "Cancel", 
    onConfirm, 
    onCancel,
    isDanger = true
}) => {
    if (!isOpen) return null;

    return (
        <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
            <div className={`bg-slate-900 border-2 w-full max-w-sm shadow-[0_0_50px_rgba(0,0,0,0.8)] transform transition-all scale-100 ${isDanger ? 'border-red-600' : 'border-cyan-600'}`}>
                {/* Header */}
                <div className={`p-3 border-b flex items-center gap-2 ${isDanger ? 'bg-red-900/20 border-red-900' : 'bg-cyan-900/20 border-cyan-900'}`}>
                    <span className="text-xl">{isDanger ? '⚠️' : 'ℹ️'}</span>
                    <h3 className={`font-bold uppercase tracking-widest text-sm ${isDanger ? 'text-red-500' : 'text-cyan-500'}`}>
                        {title}
                    </h3>
                </div>

                {/* Body */}
                <div className="p-6">
                    <p className="text-white font-mono text-sm leading-relaxed text-center">
                        {message}
                    </p>
                </div>

                {/* Footer */}
                <div className="p-2 bg-slate-950 flex gap-2">
                    <button 
                        onClick={onCancel}
                        className="flex-1 py-3 border border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-white uppercase font-bold text-xs tracking-wider transition-colors"
                    >
                        {cancelLabel}
                    </button>
                    <button 
                        onClick={onConfirm}
                        className={`flex-1 py-3 border font-bold uppercase text-xs tracking-wider transition-all text-white
                            ${isDanger 
                                ? 'bg-red-700 border-red-500 hover:bg-red-600 shadow-[0_0_15px_rgba(220,38,38,0.4)]' 
                                : 'bg-cyan-700 border-cyan-500 hover:bg-cyan-600 shadow-[0_0_15px_rgba(6,182,212,0.4)]'}
                        `}
                    >
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmationModal;
