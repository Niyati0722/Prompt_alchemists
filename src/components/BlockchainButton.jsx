/**
 * BlockchainButton.jsx
 * ────────────────────
 * NEW FILE — do NOT modify any existing file to add this component.
 * Import and render it anywhere after results are available.
 *
 * Typical placement (in App.jsx, inside the {hasResults && ( ... )} block,
 * just before the "Start New Analysis" button):
 *
 *   import BlockchainButton from './components/BlockchainButton'
 *
 *   <BlockchainButton
 *     walls={walls}
 *     selectedPlan={selectedPlan}
 *     materials={materials}       // optional — pass material recs if available
 *     explanation={explanation}   // optional — pass AI text if available
 *   />
 */

import { useState } from 'react'
import { saveReportToBlockchain } from '../web3/blockchain.js'

// Possible button states
const STATE = {
  IDLE:    'idle',
  SAVING:  'saving',
  SUCCESS: 'success',
  ERROR:   'error',
}

const BlockchainButton = ({ walls, selectedPlan, materials = null, explanation = null }) => {
  const [status, setStatus]   = useState(STATE.IDLE)
  const [txHash, setTxHash]   = useState(null)
  const [errorMsg, setErrorMsg] = useState(null)

  const handleSave = async () => {
    setStatus(STATE.SAVING)
    setTxHash(null)
    setErrorMsg(null)

    try {
      const { txHash: hash } = await saveReportToBlockchain({
        walls,
        selectedPlan,
        materials,
        explanation,
      })
      setTxHash(hash)
      setStatus(STATE.SUCCESS)
    } catch (err) {
      // User rejected the transaction in MetaMask
      if (err.code === 4001 || err.message?.includes('user rejected')) {
        setErrorMsg('Transaction rejected. You cancelled the MetaMask prompt.')
      } else {
        setErrorMsg(err.message || 'Unknown error occurred.')
      }
      setStatus(STATE.ERROR)
    }
  }

  const handleReset = () => {
    setStatus(STATE.IDLE)
    setTxHash(null)
    setErrorMsg(null)
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{
      margin: '0 0 24px',
      padding: '22px 28px',
      borderRadius: 14,
      background: 'rgba(59,130,246,0.06)',
      border: '1px solid rgba(99,102,241,0.2)',
      display: 'flex',
      flexDirection: 'column',
      gap: 14,
      fontFamily: "'Inter', sans-serif",
    }}>

      {/* Section label */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {/* Chain icon */}
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2">
          <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/>
          <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/>
        </svg>
        <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#60a5fa', fontFamily: 'JetBrains Mono, monospace' }}>
          Blockchain Storage
        </span>
      </div>

      <p style={{ fontSize: 13, color: 'var(--text-3)', margin: 0, lineHeight: 1.7 }}>
        Save this structural analysis report permanently on the Ethereum blockchain.
        Requires MetaMask and a small gas fee on the connected network.
      </p>

      {/* ── IDLE state ── */}
      {status === STATE.IDLE && (
        <button
          onClick={handleSave}
          className="btn btn-primary"
          style={{ alignSelf: 'flex-start', padding: '12px 28px', fontSize: 14, gap: 10 }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/>
            <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/>
          </svg>
          Save to Blockchain
        </button>
      )}

      {/* ── SAVING state ── */}
      {status === STATE.SAVING && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 20, height: 20, borderRadius: '50%',
            border: '2px solid rgba(59,130,246,0.2)',
            borderTopColor: '#60a5fa',
            animation: 'spin 0.8s linear infinite',
            flexShrink: 0,
          }} />
          <span style={{ fontSize: 14, color: '#93c5fd', fontWeight: 600 }}>
            Saving to blockchain…
          </span>
          <span style={{ fontSize: 11, color: 'var(--text-3)', fontFamily: 'JetBrains Mono, monospace' }}>
            Confirm the transaction in MetaMask
          </span>
        </div>
      )}

      {/* ── SUCCESS state ── */}
      {status === STATE.SUCCESS && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 28, height: 28, borderRadius: '50%',
              background: 'rgba(52,211,153,0.15)',
              border: '1px solid rgba(52,211,153,0.4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="3">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#34d399' }}>
              Saved successfully
            </span>
          </div>

          {txHash && (
            <div style={{
              padding: '10px 16px', borderRadius: 10,
              background: 'rgba(15,23,42,0.6)',
              border: '1px solid rgba(52,211,153,0.2)',
              fontFamily: 'JetBrains Mono, monospace',
            }}>
              <span style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.16em', color: 'var(--text-3)' }}>
                Tx Hash
              </span>
              <div style={{ marginTop: 4, fontSize: 12, color: '#67e8f9', wordBreak: 'break-all' }}>
                {txHash}
              </div>
              {/* Etherscan link — update subdomain to match your network */}
              <a
                href={`https://sepolia.etherscan.io/tx/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontSize: 11, color: '#60a5fa', marginTop: 6, display: 'inline-block' }}
              >
                View on Etherscan ↗
              </a>
            </div>
          )}

          <button
            onClick={handleReset}
            className="btn btn-secondary"
            style={{ alignSelf: 'flex-start', padding: '8px 18px', fontSize: 12 }}
          >
            Save Another Report
          </button>
        </div>
      )}

      {/* ── ERROR state ── */}
      {status === STATE.ERROR && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 28, height: 28, borderRadius: '50%',
              background: 'rgba(248,113,113,0.12)',
              border: '1px solid rgba(248,113,113,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2.5">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </div>
            <span style={{ fontSize: 14, fontWeight: 600, color: '#f87171' }}>
              Failed to save
            </span>
          </div>

          <p style={{ fontSize: 13, color: 'var(--text-2)', margin: 0, fontFamily: 'JetBrains Mono, monospace', fontSize: 12 }}>
            {errorMsg}
          </p>

          <button
            onClick={handleReset}
            className="btn btn-secondary"
            style={{ alignSelf: 'flex-start', padding: '8px 18px', fontSize: 12 }}
          >
            Try Again
          </button>
        </div>
      )}
    </div>
  )
}

export default BlockchainButton
