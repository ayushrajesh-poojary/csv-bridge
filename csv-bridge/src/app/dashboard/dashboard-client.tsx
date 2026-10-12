'use client'

import { useState, useCallback, useActionState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { generateApiKey, saveWebhookUrl } from './actions'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'

/* ------------------------------------------------------------------ */
/*  Inline SVG Icons                                                   */
/* ------------------------------------------------------------------ */

function BridgeIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 20h16" />
      <path d="M6 20V14" />
      <path d="M18 20V14" />
      <path d="M2 14h20" />
      <path d="M6 14C6 10 8 6 12 6s6 4 6 8" />
    </svg>
  )
}

function CopyIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  )
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

function KeyIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0 3 3L22 7l-3-3m-3.5 3.5L19 4" />
    </svg>
  )
}

function WebhookIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 16.98h-5.99c-1.1 0-1.95.94-2.48 1.9A4 4 0 0 1 2 17c.01-.7.2-1.4.57-2" />
      <path d="m6 17 3.13-5.78c.53-.97.1-2.18-.5-3.1a4 4 0 1 1 6.89-4.06" />
      <path d="m12 6 3.13 5.73C15.66 12.7 16.9 13 18 13a4 4 0 0 1 0 8H12" />
    </svg>
  )
}

/* ------------------------------------------------------------------ */
/*  Client Component                                                   */
/* ------------------------------------------------------------------ */

interface DashboardClientProps {
  initialApiKey: string
  initialWebhookUrl: string
  userInitials: string
}

export default function DashboardClient({ initialApiKey, initialWebhookUrl, userInitials }: DashboardClientProps) {
  /* ---- API Key state ---- */
  const [apiKey, setApiKey] = useState(initialApiKey || '')
  const isGenerated = Boolean(apiKey)
  const [copied, setCopied] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)

  /* ---- Webhook state ---- */
  const [webhookState, webhookAction, isWebhookPending] = useActionState(saveWebhookUrl, null)

  /* ---- Logout ---- */
  const router = useRouter()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  /* ---- Handlers ---- */
  const handleGenerateKey = async () => {
    setIsGenerating(true)
    const result = await generateApiKey()
    if (result.apiKey) {
      setApiKey(result.apiKey)
      setCopied(false)
    }
    setIsGenerating(false)
  }

  const copyKey = useCallback(async () => {
    await navigator.clipboard.writeText(apiKey)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [apiKey])

  const handleLogout = async () => {
    setIsLoggingOut(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  /* ---- Nav links ---- */
  const navLinks = [
    { href: '/dashboard', label: 'Dashboard' },
  ]

  return (
    <div className="min-h-screen bg-[#09090b] text-white">
      {/* ============================================================ */}
      {/*  Top Navigation                                               */}
      {/* ============================================================ */}
      <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-zinc-950/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2.5 transition-opacity hover:opacity-80"
          >
            <span className="text-violet-400">
              <BridgeIcon />
            </span>
            <span className="text-lg font-semibold tracking-tight">
              CSV Bridge
            </span>
          </Link>

          {/* Nav links */}
          <nav className="hidden items-center gap-1 md:flex">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-lg px-3.5 py-2 text-sm font-medium text-zinc-400 transition-colors hover:bg-white/5 hover:text-white"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right side: Avatar + Logout */}
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 text-xs font-bold tracking-wider text-white shadow-lg shadow-violet-500/20 ring-2 ring-white/10 select-none">
              {userInitials}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="flex items-center gap-1.5 border-white/10 bg-transparent text-zinc-400 hover:bg-white/5 hover:text-white disabled:opacity-50"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              {isLoggingOut ? 'Signing out...' : 'Sign out'}
            </Button>
          </div>
        </div>
      </header>

      {/* ============================================================ */}
      {/*  Main Content                                                 */}
      {/* ============================================================ */}
      <main className="mx-auto max-w-4xl px-6 py-12">
        {/* Page heading */}
        <div className="mb-10">
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="mt-1.5 text-sm text-zinc-400">
            Manage your CSV&nbsp;Bridge integration
          </p>
        </div>

        <div className="flex flex-col gap-8">
          {/* -------------------------------------------------------- */}
          {/*  Card 1 – API Key Management                              */}
          {/* -------------------------------------------------------- */}
          <Card className="overflow-hidden rounded-xl border border-white/10 bg-white/5 shadow-2xl shadow-violet-500/5 backdrop-blur-md">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/10 text-violet-400">
                  <KeyIcon />
                </span>
                <div>
                  <CardTitle className="text-base font-semibold text-white">
                    API Key
                  </CardTitle>
                  <CardDescription className="text-xs text-zinc-500">
                    Generate and manage your API key for CSV&nbsp;Bridge
                    integration
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <Separator className="bg-white/5" />

            <CardContent className="pt-6">
              {!isGenerated ? (
                /* ---------- Empty state ---------- */
                <div className="flex flex-col items-center gap-5 py-6 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-zinc-800/60 ring-1 ring-white/10">
                    <KeyIcon className="text-zinc-500" />
                  </div>
                  <p className="max-w-sm text-sm leading-relaxed text-zinc-400">
                    No API key generated yet. Click the button below to generate
                    one.
                  </p>
                  <Button
                    onClick={handleGenerateKey}
                    disabled={isGenerating}
                    className="cursor-pointer bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-600/25 transition-all duration-200 hover:shadow-xl hover:shadow-violet-600/30 hover:brightness-110 active:scale-[0.98] disabled:opacity-50"
                  >
                    {isGenerating ? 'Generating...' : 'Generate API Key'}
                  </Button>
                </div>
              ) : (
                /* ---------- Key generated ---------- */
                <div className="animate-in fade-in slide-in-from-bottom-2 flex flex-col gap-4 duration-300">
                  {/* Key display */}
                  <div className="flex items-center gap-2">
                    <div className="flex-1 overflow-x-auto rounded-lg border border-white/10 bg-zinc-900 p-3 font-mono text-sm text-emerald-400 select-all">
                      {apiKey}
                    </div>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={copyKey}
                      className="h-10 w-10 shrink-0 cursor-pointer border-white/10 bg-transparent text-zinc-400 transition-colors hover:bg-white/5 hover:text-white"
                    >
                      {copied ? (
                        <CheckIcon className="text-emerald-400" />
                      ) : (
                        <CopyIcon />
                      )}
                    </Button>
                  </div>

                  {/* Copied indicator */}
                  <div
                    className={`text-xs font-medium text-emerald-400 transition-all duration-200 ${copied ? 'translate-y-0 opacity-100' : 'pointer-events-none -translate-y-1 opacity-0'}`}
                  >
                    Copied to clipboard!
                  </div>

                  {/* Warning */}
                  <p className="flex items-start gap-2 text-xs leading-relaxed text-amber-400/80">
                    <svg
                      className="mt-0.5 h-3.5 w-3.5 shrink-0"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                      <line x1="12" y1="9" x2="12" y2="13" />
                      <line x1="12" y1="17" x2="12.01" y2="17" />
                    </svg>
                    Store this key securely. It won&apos;t be shown again.
                  </p>

                  {/* Regenerate */}
                  <div>
                    <Button
                      variant="outline"
                      onClick={handleGenerateKey}
                      disabled={isGenerating}
                      className="cursor-pointer border-white/10 bg-transparent text-zinc-300 transition-colors hover:bg-white/5 hover:text-white disabled:opacity-50"
                    >
                      {isGenerating ? 'Regenerating...' : 'Regenerate'}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>


          {/* -------------------------------------------------------- */}
          {/*  Card 2 – Webhook URL                                     */}
          {/* -------------------------------------------------------- */}
          <Card className="overflow-hidden rounded-xl border border-white/10 bg-white/5 shadow-2xl shadow-violet-500/5 backdrop-blur-md">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400">
                  <WebhookIcon />
                </span>
                <div>
                  <CardTitle className="text-base font-semibold text-white">
                    Destination Webhook
                  </CardTitle>
                  <CardDescription className="text-xs text-zinc-500">
                    Set a default webhook URL where your CSV data will be sent
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <Separator className="bg-white/5" />

            <CardContent className="pt-6">
              <form action={webhookAction} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="webhookUrl" className="text-sm text-zinc-300">
                    Webhook URL
                  </Label>
                  <p className="text-xs text-zinc-500">
                    Your CSV data will be POST&apos;d as JSON to this endpoint when users submit an import.
                  </p>
                  <Input
                    id="webhookUrl"
                    name="webhookUrl"
                    type="url"
                    defaultValue={initialWebhookUrl}
                    placeholder="https://hook.us1.make.com/..."
                    className="border-white/10 bg-zinc-900 font-mono text-sm text-indigo-300 placeholder:text-zinc-600 focus-visible:ring-indigo-500/50"
                  />
                </div>

                {webhookState && 'success' in webhookState && webhookState.success && (
                  <p className="flex items-center gap-1.5 text-xs text-emerald-400">
                    ✓ Webhook URL saved successfully.
                  </p>
                )}
                {webhookState && 'error' in webhookState && (
                  <p className="text-xs text-red-400">{webhookState.error}</p>
                )}

                <div>
                  <Button
                    type="submit"
                    disabled={isWebhookPending}
                    className="cursor-pointer bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-600/25 transition-all duration-200 hover:brightness-110 active:scale-[0.98] disabled:opacity-50"
                  >
                    {isWebhookPending ? 'Saving...' : 'Save Webhook URL'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* -------------------------------------------------------- */}
          {/*  Card 3 – Quick Start                                     */}
          {/* -------------------------------------------------------- */}
          <Card className="overflow-hidden rounded-xl border border-white/10 bg-white/5 shadow-2xl shadow-violet-500/5 backdrop-blur-md">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="16 18 22 12 16 6" />
                    <polyline points="8 6 2 12 8 18" />
                  </svg>
                </span>
                <div>
                  <CardTitle className="text-base font-semibold text-white">
                    Quick Start
                  </CardTitle>
                  <CardDescription className="text-xs text-zinc-500">
                    Embed the CSV Bridge widget in your app
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <Separator className="bg-white/5" />

            <CardContent className="pt-6">
              <p className="mb-3 text-sm text-zinc-400">
                Install the package, then drop the component into your page:
              </p>
              <pre className="overflow-x-auto rounded-lg border border-white/10 bg-zinc-900 p-4 text-xs leading-relaxed text-zinc-300">
                <code>{`import { CSVBridge } from "csv-bridge"

export default function MyPage() {
  return (
    <CSVBridge
      apiKey="${apiKey || 'YOUR_API_KEY'}"
    />
  )
}`}</code>
              </pre>
              <p className="mt-3 text-xs text-zinc-500">
                Pass <code className="text-violet-300">webhookUrl</code> directly as a prop to override the dashboard setting.
              </p>
            </CardContent>
          </Card>

        </div>
      </main>
    </div>
  )
}
