'use client'

import { useState, useEffect } from 'react'
import { X, ChevronDown, ChevronUp, AlertTriangle, CheckCircle } from 'lucide-react'

interface DebugLog {
  timestamp: number
  method: string
  status: 'success' | 'error'
  message: string
  data?: any
  rawResponse?: string
  cleanupSteps?: string[]
  error?: string
}

/**
 * Debug Panel Component
 * Displays Perplexity responses and JSON parsing steps for debugging
 * Activated via ?debug=true query parameter
 */
export function DebugPanel() {
  const [isVisible, setIsVisible] = useState(false)
  const [isExpanded, setIsExpanded] = useState(true)
  const [logs, setLogs] = useState<DebugLog[]>([])
  const [filter, setFilter] = useState<'all' | 'errors'>('all')

  useEffect(() => {
    // Check if debug mode is enabled via URL
    const params = new URLSearchParams(window.location.search)
    const debugMode = params.get('debug') === 'true'
    setIsVisible(debugMode)

    // Listen for debug events from the app
    const handleDebugEvent = (event: CustomEvent) => {
      const log: DebugLog = {
        timestamp: Date.now(),
        ...event.detail
      }
      setLogs(prev => [log, ...prev].slice(0, 50)) // Keep last 50 logs
    }

    window.addEventListener('debug-log' as any, handleDebugEvent)
    return () => {
      window.removeEventListener('debug-log' as any, handleDebugEvent)
    }
  }, [])

  // Helper function to call from anywhere in your app
  if (typeof window !== 'undefined') {
    (window as any).debugLog = (detail: Omit<DebugLog, 'timestamp'>) => {
      window.dispatchEvent(new CustomEvent('debug-log', { detail }))
    }
  }

  if (!isVisible) return null

  const filteredLogs = filter === 'all' 
    ? logs 
    : logs.filter(log => log.status === 'error')

  return (
    <div className="fixed bottom-4 right-4 z-[9999] w-[600px] max-w-[90vw]">
      <div className="bg-gray-900 text-green-400 rounded-lg shadow-2xl border border-gray-700 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between bg-gray-800 px-4 py-2 border-b border-gray-700">
          <div className="flex items-center gap-2">
            <span className="text-sm font-mono font-bold">🔍 DEBUG PANEL</span>
            <span className="text-xs text-gray-400">({filteredLogs.length} logs)</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilter(filter === 'all' ? 'errors' : 'all')}
              className="text-xs px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded"
            >
              {filter === 'all' ? 'Show Errors' : 'Show All'}
            </button>
            <button
              onClick={() => setLogs([])}
              className="text-xs px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded"
            >
              Clear
            </button>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-gray-400 hover:text-white"
            >
              {isExpanded ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
            </button>
            <button
              onClick={() => setIsVisible(false)}
              className="text-gray-400 hover:text-white"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Log Content */}
        {isExpanded && (
          <div className="max-h-[500px] overflow-y-auto p-4 space-y-3 text-xs font-mono">
            {filteredLogs.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                No debug logs yet. Logs will appear here as you use the app.
              </div>
            ) : (
              filteredLogs.map((log, index) => (
                <LogEntry key={`${log.timestamp}-${index}`} log={log} />
              ))
            )}
          </div>
        )}

        {/* Footer */}
        <div className="bg-gray-800 px-4 py-2 border-t border-gray-700 text-xs text-gray-400">
          Debug mode active. Remove <code className="text-green-400">?debug=true</code> from URL to hide.
        </div>
      </div>
    </div>
  )
}

function LogEntry({ log }: { log: DebugLog }) {
  const [isExpanded, setIsExpanded] = useState(false)
  const timestamp = new Date(log.timestamp).toLocaleTimeString()

  return (
    <div className={`border rounded p-3 ${
      log.status === 'error' 
        ? 'border-red-500/50 bg-red-500/5' 
        : 'border-green-500/50 bg-green-500/5'
    }`}>
      {/* Log Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          {log.status === 'error' ? (
            <AlertTriangle size={14} className="text-red-400" />
          ) : (
            <CheckCircle size={14} className="text-green-400" />
          )}
          <span className={log.status === 'error' ? 'text-red-400' : 'text-green-400'}>
            [{timestamp}] {log.method}
          </span>
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-gray-400 hover:text-white text-xs"
        >
          {isExpanded ? 'Collapse' : 'Expand'}
        </button>
      </div>

      {/* Log Message */}
      <div className="text-gray-300 mb-2">{log.message}</div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="space-y-2 mt-3 pt-3 border-t border-gray-700">
          {/* Cleanup Steps */}
          {log.cleanupSteps && log.cleanupSteps.length > 0 && (
            <div>
              <div className="text-blue-400 mb-1">Cleanup Steps:</div>
              <div className="pl-4 text-gray-400">
                {log.cleanupSteps.map((step, i) => (
                  <div key={i}>→ {step}</div>
                ))}
              </div>
            </div>
          )}

          {/* Raw Response */}
          {log.rawResponse && (
            <div>
              <div className="text-yellow-400 mb-1">Raw Response (first 500 chars):</div>
              <pre className="bg-gray-800 p-2 rounded overflow-x-auto text-xs text-gray-300">
                {log.rawResponse.slice(0, 500)}
                {log.rawResponse.length > 500 && '...'}
              </pre>
            </div>
          )}

          {/* Error Details */}
          {log.error && (
            <div>
              <div className="text-red-400 mb-1">Error:</div>
              <pre className="bg-red-900/20 p-2 rounded overflow-x-auto text-xs text-red-300">
                {log.error}
              </pre>
            </div>
          )}

          {/* Additional Data */}
          {log.data && (
            <div>
              <div className="text-purple-400 mb-1">Data:</div>
              <pre className="bg-gray-800 p-2 rounded overflow-x-auto text-xs text-gray-300">
                {JSON.stringify(log.data, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/**
 * Helper function to add debug logs from anywhere in your app
 * Usage: debugLog({ method: 'jobSearch', status: 'success', message: 'Found 10 jobs' })
 */
export function debugLog(detail: Omit<DebugLog, 'timestamp'>) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('debug-log', { detail }))
  }
}

