import React, { useState, useEffect, useCallback } from 'react';
import {
  Link2, ShieldCheck, ShieldAlert, RefreshCw, Hash,
  Clock, CheckCircle2, XCircle, ChevronRight, Loader2,
  Lock, ArrowRight
} from 'lucide-react';
import { blockchainApi, BlockchainBlock, ChainVerifyResult } from '../services/api';
import { useNotifications } from '../context/NotificationContext';

export const BlockchainLedgerPage: React.FC = () => {
  const [blocks, setBlocks] = useState<BlockchainBlock[]>([]);
  const [chainLength, setChainLength] = useState(0);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState<ChainVerifyResult | null>(null);
  const { addNotification } = useNotifications();

  const loadChain = useCallback(async () => {
    setLoading(true);
    setVerifyResult(null);
    try {
      const data = await blockchainApi.getChain();
      setBlocks(data.blocks);
      setChainLength(data.length);
    } catch {
      addNotification('Ledger Unavailable', 'Could not load the blockchain audit ledger. Ensure the backend is running.', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadChain(); }, [loadChain]);

  const handleVerify = async () => {
    setVerifying(true);
    setVerifyResult(null);
    try {
      const result = await blockchainApi.verifyChain();
      setVerifyResult(result);
      addNotification(
        result.valid ? 'Chain Verified' : 'Chain Integrity Failure',
        result.message,
        result.valid ? 'success' : 'error'
      );
    } catch {
      addNotification('Verification Failed', 'Could not contact the backend for chain verification.', 'error');
    } finally {
      setVerifying(false);
    }
  };

  const truncateHash = (hash: string, len = 16) =>
    hash.length > len ? `${hash.slice(0, len)}…` : hash;

  const formatTs = (ts: string) => {
    try {
      return new Date(ts).toLocaleString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit'
      });
    } catch { return ts; }
  };

  return (
    <div className="space-y-8 pb-16 font-sans">

      {/* Header */}
      <div className="bg-[#0B0F19] border border-slate-800 p-6 sm:p-8 rounded-3xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs font-semibold uppercase tracking-wider mb-2">
            <Link2 className="w-4 h-4" />
            <span>Tamper-Evident Audit Ledger • NIST AU-10 / ISO 27001 A.12.4</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Blockchain Audit Chain
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Every assessment is automatically anchored as a cryptographically-linked block.
            Each block's SHA-256 hash covers the assessment score, finding count, and
            timestamp — and is chained to the previous block, making silent tampering
            mathematically detectable.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={loadChain}
            disabled={loading}
            title="Refresh chain"
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-700 hover:border-slate-600 text-slate-400 hover:text-white transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={handleVerify}
            disabled={verifying || chainLength === 0}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs shadow-lg shadow-cyan-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {verifying ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
            <span>{verifying ? 'Verifying…' : 'Verify Chain Integrity'}</span>
          </button>
        </div>
      </div>

      {/* Verification Result Banner */}
      {verifyResult && (
        <div className={`flex items-start gap-4 p-5 rounded-2xl border ${
          verifyResult.valid
            ? 'bg-emerald-950/30 border-emerald-700/60'
            : 'bg-rose-950/30 border-rose-700/60'
        }`}>
          {verifyResult.valid
            ? <CheckCircle2 className="w-5 h-5 text-emerald-400 mt-0.5 shrink-0" />
            : <XCircle className="w-5 h-5 text-rose-400 mt-0.5 shrink-0" />}
          <div>
            <p className={`text-sm font-bold ${verifyResult.valid ? 'text-emerald-300' : 'text-rose-300'}`}>
              {verifyResult.valid ? 'Chain Integrity Verified' : 'Chain Integrity Failure Detected'}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">{verifyResult.message}</p>
            {!verifyResult.valid && verifyResult.first_invalid_index !== null && (
              <p className="text-xs text-rose-400 font-mono mt-1">
                First tampered block: #{verifyResult.first_invalid_index}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Chain Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Blocks', value: chainLength.toString(), icon: Hash, color: 'text-cyan-400' },
          { label: 'Algorithm', value: 'SHA-256', icon: Lock, color: 'text-indigo-400' },
          { label: 'Storage', value: 'SQLite (Local)', icon: ShieldCheck, color: 'text-emerald-400' },
          { label: 'Compliance', value: 'NIST AU-10', icon: CheckCircle2, color: 'text-amber-400' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="p-5 rounded-2xl bg-[#0B0F19] border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>{label}</span>
              <Icon className={`w-4 h-4 ${color}`} />
            </div>
            <p className={`text-xl font-black font-mono ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Blockchain Visual */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
          <p className="text-xs font-mono">Loading audit ledger…</p>
        </div>
      ) : blocks.length === 0 ? (
        <div className="p-12 rounded-3xl bg-[#0B0F19] border border-dashed border-slate-700 text-center space-y-3">
          <Link2 className="w-10 h-10 text-slate-600 mx-auto" />
          <p className="text-slate-300 font-semibold">No blocks yet</p>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Run your first audit from <strong>New Audit</strong> — the assessment will be automatically anchored to the ledger.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white">Audit Chain</h2>
            <span className="text-xs font-mono text-slate-500">
              Genesis → Block #{blocks[blocks.length - 1]?.index ?? 0} (tip)
            </span>
          </div>

          {/* Blocks rendered tip-first so newest appears at top */}
          {[...blocks].reverse().map((block, revIdx) => {
            const isGenesis = block.index === 0;
            const isInvalid = verifyResult && !verifyResult.valid
              && verifyResult.first_invalid_index !== null
              && block.index >= verifyResult.first_invalid_index;

            return (
              <div key={block.index} className="relative">
                {/* Connector line between blocks */}
                {revIdx < blocks.length - 1 && (
                  <div className="absolute left-8 top-full w-0.5 h-3 bg-slate-700 z-10" />
                )}

                <div className={`p-5 rounded-2xl border transition-all ${
                  isGenesis
                    ? 'bg-indigo-950/20 border-indigo-700/50'
                    : isInvalid
                    ? 'bg-rose-950/20 border-rose-700/50'
                    : 'bg-[#0B0F19] border-slate-800 hover:border-slate-700'
                }`}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">

                    {/* Block index badge */}
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black font-mono text-sm shrink-0 ${
                        isGenesis
                          ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                          : isInvalid
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                          : 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/30'
                      }`}>
                        #{block.index}
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-bold ${isGenesis ? 'text-indigo-300' : 'text-slate-200'}`}>
                            {isGenesis ? '⬡ Genesis Block' : `Assessment Block`}
                          </span>
                          {isGenesis && (
                            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-indigo-900/50 text-indigo-300 border border-indigo-700/60">
                              CHAIN ORIGIN
                            </span>
                          )}
                          {isInvalid && (
                            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-rose-900/50 text-rose-300 border border-rose-700/60 flex items-center gap-1">
                              <XCircle className="w-3 h-3" /> TAMPERED
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-slate-500 font-mono">
                          <Clock className="w-3 h-3" />
                          <span>{formatTs(block.timestamp)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Hash info */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-[10px] font-mono">
                      <div className="space-y-1">
                        <p className="text-slate-500 uppercase tracking-wider font-bold">Block Hash</p>
                        <p className="text-cyan-300 bg-slate-900/60 px-2 py-1 rounded" title={block.block_hash}>
                          {truncateHash(block.block_hash, 20)}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-slate-500 uppercase tracking-wider font-bold">Prev Hash</p>
                        <p className={`${isGenesis ? 'text-indigo-300' : 'text-slate-400'} bg-slate-900/60 px-2 py-1 rounded`} title={block.previous_hash}>
                          {isGenesis ? '(genesis sentinel)' : truncateHash(block.previous_hash, 20)}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-slate-500 uppercase tracking-wider font-bold">Data Hash</p>
                        <p className="text-amber-300 bg-slate-900/60 px-2 py-1 rounded" title={block.data_hash}>
                          {truncateHash(block.data_hash, 20)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Assessment ID footer */}
                  <div className="mt-3 pt-3 border-t border-slate-800/60 flex items-center justify-between text-[10px] font-mono text-slate-500">
                    <span>Assessment ID: <span className="text-slate-400">{block.assessment_id}</span></span>
                    {isInvalid
                      ? <span className="text-rose-400 flex items-center gap-1"><ShieldAlert className="w-3 h-3" /> Hash mismatch detected</span>
                      : <span className="text-emerald-400 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Cryptographically linked</span>
                    }
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* How it works explainer */}
      <div className="p-6 rounded-3xl bg-[#0B0F19] border border-slate-800 space-y-4">
        <h3 className="text-sm font-bold text-white">How the Audit Chain Works</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-slate-400 leading-relaxed">
          {[
            {
              step: '01', title: 'Data Hash',
              desc: 'When an audit completes, a SHA-256 fingerprint is computed from the assessment ID, overall score, finding count, and timestamp. Any post-hoc modification changes this hash.'
            },
            {
              step: '02', title: 'Block Hash',
              desc: 'The data hash is combined with the previous block\'s hash and a timestamp into a new block hash — cryptographically binding each block to its predecessor.'
            },
            {
              step: '03', title: 'Tamper Detection',
              desc: '"Verify Chain" recomputes all hashes from scratch. If any stored hash doesn\'t match the recomputed value, that block and all subsequent blocks are flagged as compromised.'
            },
          ].map(({ step, title, desc }) => (
            <div key={step} className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold text-cyan-400">{step}</span>
                <span className="font-semibold text-slate-300">{title}</span>
              </div>
              <p>{desc}</p>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
