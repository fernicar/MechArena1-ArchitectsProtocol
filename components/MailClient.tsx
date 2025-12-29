
import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { useGameStore } from '../store';
import { Mail } from '../types';
import ConfirmationModal from './common/ConfirmationModal';

interface MailClientProps {
  onClose: () => void;
  onViewReplay: (mail: Mail) => void;
}

const MailClient: React.FC<MailClientProps> = ({ onClose, onViewReplay }) => {
  const { mails, markMailRead: onRead, deleteMail: onDelete, markAllRead, deleteReadMails } = useGameStore();
  const [selectedMailId, setSelectedMailId] = useState<string | null>(null);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  const selectedMail = mails.find(m => m.id === selectedMailId);

  const handleSelect = (id: string) => {
    setSelectedMailId(id);
    onRead(id);
  };

  const handleMarkAllRead = () => {
      markAllRead();
  };

  const handleDeleteReadRequest = () => {
      setShowConfirmDelete(true);
  };

  const confirmDeleteRead = () => {
      setSelectedMailId(null);
      deleteReadMails();
      setShowConfirmDelete(false);
  };

  return (
    <div className="h-full w-full bg-slate-950 flex flex-col relative">
      <ConfirmationModal 
          isOpen={showConfirmDelete}
          title="DELETE MESSAGES"
          message="Delete all READ messages from the archive? This cannot be undone."
          confirmLabel="PURGE ARCHIVE"
          onConfirm={confirmDeleteRead}
          onCancel={() => setShowConfirmDelete(false)}
      />

      <header className="flex justify-between items-center p-4 bg-slate-900 border-b border-slate-700">
        <h1 className="text-2xl font-bold text-white tracking-widest flex items-center gap-2">
            <svg className="w-6 h-6 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
            MESSAGING SYSTEM
        </h1>
        <button onClick={onClose} className="px-4 py-2 border border-slate-600 text-slate-400 hover:bg-slate-800 uppercase text-xs">Close</button>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Mail List */}
        <div className="w-1/3 border-r border-slate-800 flex flex-col">
            <div className="flex-1 overflow-y-auto">
                {mails.length === 0 && (
                    <div className="p-8 text-center text-slate-600 text-sm font-mono">NO MESSAGES</div>
                )}
                {mails.map(mail => (
                    <div 
                        key={mail.id}
                        onClick={() => handleSelect(mail.id)}
                        className={`p-4 border-b border-slate-800 cursor-pointer hover:bg-slate-900 transition-colors ${selectedMailId === mail.id ? 'bg-slate-900 border-l-4 border-l-yellow-500' : 'border-l-4 border-l-transparent'} ${!mail.read ? 'bg-slate-900/50' : ''}`}
                    >
                        <div className="flex justify-between items-start mb-1">
                            <span className={`font-bold text-sm ${!mail.read ? 'text-white' : 'text-slate-400'}`}>{mail.sender}</span>
                            <span className="text-[10px] text-slate-500 font-mono">{mail.timestamp}</span>
                        </div>
                        <div className={`text-sm mb-1 ${!mail.read ? 'text-yellow-400 font-bold' : 'text-slate-300'}`}>{mail.subject}</div>
                        <div className="text-xs text-slate-500 truncate">{mail.preview}</div>
                    </div>
                ))}
            </div>
            
            {/* Bulk Actions Footer */}
            <div className="p-2 border-t border-slate-800 bg-slate-900 flex gap-2">
                <button 
                    type="button"
                    onClick={handleMarkAllRead}
                    disabled={mails.length === 0}
                    className="flex-1 py-2 text-xs uppercase border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-50"
                >
                    Mark All Read
                </button>
                <button 
                    type="button"
                    onClick={handleDeleteReadRequest}
                    disabled={mails.filter(m => m.read).length === 0}
                    className="flex-1 py-2 text-xs uppercase border border-slate-700 text-red-500 hover:bg-slate-800 hover:border-red-900 disabled:opacity-50"
                >
                    Delete Read
                </button>
            </div>
        </div>

        {/* Mail Content */}
        <div className="flex-1 bg-slate-900/50 relative">
            {selectedMail ? (
                <div className="p-8 h-full overflow-y-auto">
                    <div className="border-b border-slate-700 pb-4 mb-6">
                        <h2 className="text-2xl font-bold text-white mb-2">{selectedMail.subject}</h2>
                        <div className="flex justify-between text-sm font-mono text-slate-400">
                            <span>FROM: {selectedMail.sender}</span>
                            <span>{selectedMail.timestamp}</span>
                        </div>
                    </div>

                    <div className="prose prose-invert prose-sm max-w-none text-slate-300 font-mono leading-relaxed">
                        <ReactMarkdown>{selectedMail.body}</ReactMarkdown>
                    </div>

                    {selectedMail.battleResult && (
                        <div className="mt-8 p-4 bg-slate-800 border border-slate-600 rounded">
                            <h3 className="text-yellow-400 font-bold mb-2 text-sm uppercase">Battle Data Attached</h3>
                            <div className="flex gap-4">
                                <button 
                                    onClick={() => onViewReplay(selectedMail)}
                                    className="px-6 py-2 bg-cyan-600 text-white font-bold text-sm hover:bg-cyan-500 transition-colors uppercase"
                                >
                                    Initialize Replay
                                </button>
                                <div className="px-4 py-2 border border-slate-600 text-slate-400 text-sm">
                                    WINNER: {selectedMail.battleResult?.winner || 'UNKNOWN'}
                                </div>
                            </div>
                        </div>
                    )}
                    
                    <div className="mt-12 pt-4 border-t border-slate-800 flex justify-end">
                        <button 
                            type="button"
                            onClick={() => {
                                onDelete(selectedMail.id);
                                setSelectedMailId(null);
                            }}
                            className="text-red-500 text-xs uppercase hover:text-red-400"
                        >
                            Delete Message
                        </button>
                    </div>
                </div>
            ) : (
                <div className="absolute inset-0 flex items-center justify-center text-slate-600">
                    <div className="text-center">
                        <svg className="w-16 h-16 mx-auto mb-4 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                        <p className="uppercase tracking-widest text-xs">Select a message to decode</p>
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default MailClient;
