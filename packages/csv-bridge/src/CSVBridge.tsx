'use client'

import React, { useState, useRef, useEffect } from 'react'
import Papa from 'papaparse'

export interface ExpectedColumn {
  key: string
  label: string
  required?: boolean
}

export interface CSVBridgeProps {
  uploadEndpoint?: string
  apiKey?: string
  webhookUrl?: string
  expectedColumns?: ExpectedColumn[]
  onSuccess?: () => void
  onError?: (error: string) => void
  onData?: (data: Record<string, string | null>[]) => void
  maxFileSizeMB?: number
}

type Step = 'upload' | 'review' | 'success'

const LS_KEY = 'csvbridge_destination_url'
const FILE_WARN_MB = 10
const FILE_BLOCK_MB = 50

export function CSVBridge({ 
  uploadEndpoint = '/api/ingest',
  apiKey = '', 
  webhookUrl,
  expectedColumns,
  onSuccess, 
  onError,
  onData,
  maxFileSizeMB = FILE_BLOCK_MB,
}: CSVBridgeProps) {
  const [step, setStep] = useState<Step>('upload')

  // Fix #4: persist destination URL to localStorage so it survives page refresh
  const [destinationUrl, setDestinationUrl] = useState<string>(() => {
    if (webhookUrl) return webhookUrl
    if (typeof window !== 'undefined') {
      return localStorage.getItem(LS_KEY) || ''
    }
    return ''
  })

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(LS_KEY, destinationUrl)
    }
  }, [destinationUrl])

  const [parsedHeaders, setParsedHeaders] = useState<string[]>([])
  const [parsedData, setParsedData] = useState<Record<string, string | null>[]>([])
  const [columnWarnings, setColumnWarnings] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [fileSizeWarning, setFileSizeWarning] = useState<string | null>(null)

  // Fix #5: show more rows toggle
  const [showAllRows, setShowAllRows] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return
    processFile(selectedFile)
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    const droppedFile = e.dataTransfer.files?.[0]
    if (droppedFile && droppedFile.type === 'text/csv' || droppedFile?.name.endsWith('.csv')) {
      processFile(droppedFile)
    } else {
      setErrorMsg('Please upload a valid .csv file')
    }
  }

  const processFile = (selectedFile: File) => {
    setErrorMsg(null)
    setFileSizeWarning(null)
    setColumnWarnings([])

    // Fix #3: File size check
    const fileSizeMB = selectedFile.size / (1024 * 1024)

    if (fileSizeMB > maxFileSizeMB) {
      setErrorMsg(`File is too large (${fileSizeMB.toFixed(1)} MB). Maximum allowed is ${maxFileSizeMB} MB.`)
      return
    }
    if (fileSizeMB > FILE_WARN_MB) {
      setFileSizeWarning(`Large file detected (${fileSizeMB.toFixed(1)} MB). Parsing may take a moment.`)
    }

    Papa.parse(selectedFile, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim().toLowerCase().replace(/[^a-z0-9\s_]/g, '').replace(/\s+/g, '_'),
      transform: (value) => {
        if (typeof value !== 'string') return value;
        const trimmed = value.trim();
        return trimmed === '' ? null : trimmed;
      },
      complete: (results) => {
        if (results.errors.length > 0) {
          setErrorMsg('Error parsing CSV. Please check the file format.')
          return
        }
        
        const headers = results.meta.fields || []
        if (headers.length === 0) {
          setErrorMsg('No headers found in the CSV.')
          return
        }

        // Fix #2: Implement expectedColumns validation
        const warnings: string[] = []
        if (expectedColumns && expectedColumns.length > 0) {
          const missingRequired: string[] = []
          const missingOptional: string[] = []

          for (const col of expectedColumns) {
            const normalizedKey = col.key.trim().toLowerCase().replace(/[^a-z0-9\s_]/g, '').replace(/\s+/g, '_')
            const found = headers.includes(normalizedKey)
            if (!found) {
              if (col.required) {
                missingRequired.push(col.label)
              } else {
                missingOptional.push(col.label)
              }
            }
          }

          if (missingRequired.length > 0) {
            setErrorMsg(`Missing required column(s): ${missingRequired.join(', ')}. Please check your CSV file.`)
            return
          }
          if (missingOptional.length > 0) {
            warnings.push(`Optional column(s) not found and will be empty: ${missingOptional.join(', ')}`)
          }
        }

        setParsedHeaders(headers)
        setParsedData(results.data as Record<string, string | null>[])
        setColumnWarnings(warnings)
        setShowAllRows(false)

        if (onData) onData(results.data as Record<string, string | null>[])

        setStep('review')
      },
      error: (err) => {
        setErrorMsg(err.message)
      }
    })
  }

  const handleDownloadJson = () => {
    const dataStr = JSON.stringify(parsedData, null, 2)
    const blob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'cleaned_data.json'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    setStep('success')
    if (onSuccess) onSuccess()
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    setErrorMsg(null)
    
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      }
      if (apiKey) {
        headers['Authorization'] = `Bearer ${apiKey}`
      }

      const response = await fetch(uploadEndpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          data: parsedData,
          webhookUrl: destinationUrl
        })
      })

      const result = await response.json()

      if (!response.ok) {
        // Fix #6: Surface specific error messages from the API
        const detail = result?.error || result?.message || response.statusText
        let friendlyMsg = detail

        if (response.status === 401) {
          friendlyMsg = `Authentication failed: ${detail}. Please check your API key.`
        } else if (response.status === 502) {
          friendlyMsg = `Your destination webhook returned an error. Please verify the webhook URL is correct and reachable. (${detail})`
        } else if (response.status === 400) {
          friendlyMsg = `Invalid request: ${detail}`
        } else if (response.status === 500) {
          friendlyMsg = 'Server configuration error. Please contact the app administrator.'
        }

        throw new Error(friendlyMsg)
      }

      setStep('success')
      if (onSuccess) onSuccess()

    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'An error occurred during submission'
      setErrorMsg(message)
      if (onError) onError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Fix #7: Clear only resets file state, NOT the destination URL
  const handleClear = () => {
    setParsedData([])
    setParsedHeaders([])
    setColumnWarnings([])
    setErrorMsg(null)
    setFileSizeWarning(null)
    setShowAllRows(false)
    setStep('upload')
    // destinationUrl intentionally NOT reset here
  }

  if (step === 'success') {
    return (
      <div className="w-full max-w-lg mx-auto bg-[#14161a] border border-[#23262b] rounded-xl p-8 text-center text-[#e3e2e5] shadow-2xl">
         <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20 mb-6">
            <svg className="w-8 h-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
         </div>
         <h2 className="text-2xl font-bold mb-2">Success!</h2>
         <p className="text-[#9b9aa0] mb-6">
           {destinationUrl ? "Your data has been successfully imported and sent to your destination webhook." : "Your clean JSON file has been successfully downloaded."}
         </p>
         <button onClick={handleClear} className="px-4 py-2 bg-[#00d4ff] text-[#0a0b0d] font-bold rounded-lg text-sm transition-colors hover:bg-[#00bfe8]">
           Import Another File
         </button>
      </div>
    )
  }

  const previewRows = showAllRows ? parsedData : parsedData.slice(0, 5)

  return (
    <div className="w-full max-w-4xl mx-auto bg-[#14161a] border border-[#23262b] rounded-xl overflow-hidden shadow-2xl text-[#e3e2e5] font-sans p-6">
      {/* Header */}
      <div className="bg-[#14161a] border-b border-[#23262b] px-6 py-4 flex items-center justify-between">
        <h3 className="font-semibold text-lg flex items-center gap-2">
           <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#00d4ff]">
             <path d="M4 20h16M6 20V14M18 20V14M2 14h20M6 14C6 10 8 6 12 6s6 4 6 8" />
           </svg>
           CSV Importer
        </h3>
        <div className="flex gap-2 items-center text-sm">
          <span className={`flex h-6 w-6 items-center justify-center rounded-full ${step === 'upload' ? 'bg-[#00d4ff] text-[#0a0b0d] font-bold' : 'bg-[#23262b] text-[#9b9aa0]'}`}>1</span>
          <div className="h-[2px] w-4 bg-[#23262b]" />
          <span className={`flex h-6 w-6 items-center justify-center rounded-full ${step === 'review' ? 'bg-[#00d4ff] text-[#0a0b0d] font-bold' : 'bg-[#23262b] text-[#9b9aa0]'}`}>2</span>
        </div>
      </div>

      <div className="bg-[#14161a] border-b border-[#23262b] px-6 py-3 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 bg-black/10">
        <label className="text-xs font-semibold text-[#e3e2e5] whitespace-nowrap">Destination URL (Optional):</label>
        <input 
          type="url"
          value={destinationUrl}
          onChange={(e) => setDestinationUrl(e.target.value)}
          placeholder="https://hook.us1.make.com/..."
          className="flex-1 bg-[#1c1f26] border border-[#23262b] text-[#00d4ff] rounded-md p-1.5 px-3 font-mono text-sm outline-none focus:border-[#00d4ff]/50 transition-colors placeholder:text-zinc-600"
        />
      </div>

      <div className="p-6">
        {fileSizeWarning && (
          <div className="mb-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm">
            ⚠️ {fileSizeWarning}
          </div>
        )}

        {columnWarnings.length > 0 && (
          <div className="mb-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm space-y-1">
            {columnWarnings.map((w, i) => <p key={i}>⚠️ {w}</p>)}
          </div>
        )}

        {errorMsg && (
          <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            {errorMsg}
          </div>
        )}

        {/* STEP 1: UPLOAD */}
        {step === 'upload' && (
          <div 
            className="border-2 border-dashed border-[#23262b] hover:border-[#00d4ff]/40 hover:bg-[#00d4ff]/5 transition-all rounded-xl p-12 text-center cursor-pointer group"
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input 
              type="file" 
              accept=".csv" 
              className="hidden" 
              ref={fileInputRef} 
              onChange={handleFileSelect} 
            />
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#23262b] group-hover:bg-[#00d4ff]/20 group-hover:scale-110 transition-all mb-4">
               <svg className="w-8 h-8 text-[#9b9aa0] group-hover:text-[#00d4ff]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
               </svg>
            </div>
            <h4 className="text-lg font-medium mb-1">Upload a CSV file</h4>
            <p className="text-[#9b9aa0] text-sm mb-1">Drag and drop your file here, or click to browse.</p>
            <p className="text-[#9b9aa0] text-xs mb-4">Max file size: {maxFileSizeMB} MB</p>
            <button className="px-4 py-2 bg-[#00d4ff] text-[#0a0b0d] font-bold rounded-lg text-sm hover:bg-[#00bfe8] transition-colors">
               Select File
            </button>
          </div>
        )}

        {/* STEP 2: REVIEW */}
        {step === 'review' && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
             <div className="mb-6">
               <h4 className="text-lg font-medium">Review Data</h4>
               <p className="text-[#9b9aa0] text-sm">
                 You are about to import <strong className="text-[#e3e2e5]">{parsedData.length}</strong> rows
                 with <strong className="text-[#e3e2e5]">{parsedHeaders.length}</strong> columns.
               </p>
             </div>

             <div className="bg-[#14161a] border border-[#23262b] rounded-lg overflow-x-auto mb-6">
               <table className="w-full text-sm text-left">
                  <thead className="bg-black/20 text-xs uppercase text-[#9b9aa0] border-b border-[#23262b]">
                     <tr>
                       {parsedHeaders.map(header => (
                         <th key={header} className="px-4 py-3 font-medium whitespace-nowrap">{header}</th>
                       ))}
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-[#23262b]">
                     {previewRows.map((row, i) => (
                       <tr key={i} className="hover:bg-[#23262b]/40">
                         {parsedHeaders.map(header => (
                           <td key={header} className="px-4 py-3 whitespace-nowrap text-[#e3e2e5] max-w-[200px] truncate">
                             {row[header] || '-'}
                           </td>
                         ))}
                       </tr>
                     ))}
                  </tbody>
               </table>

               {/* Fix #5: Show more / show less toggle */}
               {parsedData.length > 5 && (
                 <div className="p-3 text-center text-xs text-[#9b9aa0] bg-black/20 border-t border-[#23262b]">
                   {showAllRows ? (
                     <>
                       Showing all {parsedData.length} rows.{' '}
                       <button
                         onClick={() => setShowAllRows(false)}
                         className="text-[#00d4ff] hover:underline ml-1"
                       >
                         Show less
                       </button>
                     </>
                   ) : (
                     <>
                       Showing 5 of {parsedData.length} rows.{' '}
                       <button
                         onClick={() => setShowAllRows(true)}
                         className="text-[#00d4ff] hover:underline ml-1"
                       >
                         Show all {parsedData.length} rows
                       </button>
                     </>
                   )}
                 </div>
               )}
             </div>

             <div className="flex justify-between items-center">
              <div className="flex gap-2">
                {/* Fix #7: clears only the file, not the destination URL */}
                <button
                  onClick={handleClear}
                  className="px-5 py-2.5 bg-[#14161a] border border-[#23262b] hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20 rounded-lg text-sm transition-colors text-[#9b9aa0]"
                >
                  Clear File
                </button>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setStep('upload')} disabled={isSubmitting} className="px-5 py-2.5 bg-[#14161a] border border-[#23262b] hover:bg-[#23262b] rounded-lg text-sm transition-colors disabled:opacity-50">
                  Back
                </button>
                {destinationUrl ? (
                  <button onClick={handleSubmit} disabled={isSubmitting} className="bg-[#00d4ff] text-[#0a0b0d] font-bold px-6 py-3 rounded-lg hover:shadow-[0_0_15px_rgba(0,212,255,0.4)] transition-all disabled:opacity-50 flex items-center gap-2">
                    {isSubmitting ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-[#0a0b0d]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        Processing...
                      </>
                    ) : (
                       `Send Data (${parsedData.length} rows)`
                    )}
                  </button>
                ) : (
                  <button onClick={handleDownloadJson} className="bg-[#00d4ff] text-[#0a0b0d] font-bold px-6 py-3 rounded-lg hover:shadow-[0_0_15px_rgba(0,212,255,0.4)] transition-all flex items-center gap-2">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                    Download Clean JSON
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
