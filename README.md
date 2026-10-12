<div align="center">

# 🌉 CSV Bridge

**The lightweight, open-source CSV importer for modern React & Next.js applications.**

Transform messy spreadsheets into clean, validated JSON directly in your user's browser — with built-in webhook forwarding and BYOK security.

[![npm version](https://img.shields.io/npm/v/csv-bridge.svg?color=00d4ff&label=npm%20package)](https://www.npmjs.com/package/csv-bridge)
[![npm downloads](https://img.shields.io/npm/dm/csv-bridge.svg?color=7c3aed)](https://www.npmjs.com/package/csv-bridge)
[![License: MIT](https://img.shields.io/badge/License-MIT-10b981.svg)](LICENSE)
[![React](https://img.shields.io/badge/React-18%20%7C%2019-61dafb.svg)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178c6.svg)](https://www.typescriptlang.org)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

[Features](#-key-features) • [Installation](#-installation) • [Quick Start](#-quick-start) • [Props](#-props) • [Self-Hosting](#-self-hosting) • [Contributing](#-contributing)

</div>

---

## ⚡ Why CSV Bridge?

Building a reliable CSV importer from scratch takes 50–100+ engineering hours: dealing with irregular delimiters, trailing spaces, mismatched headers, large file crashes, and backend validation.

**CSV Bridge** solves this completely:
- 🚀 **Zero Server Burden:** Fast, client-side streaming parser using PapaParse.
- 🔒 **BYOK (Bring Your Own Key):** Users pass their own API keys; sensitive tokens never touch intermediate servers.
- 🎯 **Automatic Sanitization:** Automatically cleans and normalizes headers into clean `snake_case` keys.
- 🌐 **Direct Webhooks:** Forwards parsed payloads directly to Make, Zapier, n8n, or your custom REST API.
- 💾 **Instant Fallback:** Users can download a formatted `.json` file instantly if no webhook or endpoint is specified.
- 💯 **100% Free & Open Source:** Released under the MIT License with zero row limits, paywalls, or subscriptions.

---

## 📦 Installation

Install the package from npm into your React or Next.js project:

```bash
npm install csv-bridge
# or
pnpm add csv-bridge
# or
yarn add csv-bridge
```

---

## 🚀 Quick Start

Drop `<CSVBridge />` straight into your application:

```tsx
'use client'

import { CSVBridge } from 'csv-bridge'

export default function DataImportPage() {
  return (
    <div className="max-w-3xl mx-auto p-6">
      <CSVBridge 
        uploadEndpoint="/api/ingest"
        onSuccess={() => console.log('Import finished successfully!')}
        onError={(err) => console.error('Import failed:', err)}
      />
    </div>
  )
}
```

### With Destination Webhook & API Key

```tsx
'use client'

import { CSVBridge } from 'csv-bridge'

export default function WebhookImportPage() {
  return (
    <CSVBridge 
      uploadEndpoint="https://api.yourdomain.com/ingest"
      apiKey="csvb_sk_your_api_key"
      webhookUrl="https://hook.us1.make.com/your-unique-webhook"
      onSuccess={() => alert('Data ingested & webhook triggered!')}
    />
  )
}
```

---

## ⚙️ Props Reference

| Prop | Type | Default | Required | Description |
| :--- | :--- | :--- | :--- | :--- |
| `uploadEndpoint` | `string` | `"/api/ingest"` | No | Target API URL where the parsed JSON payload is POSTed. |
| `apiKey` | `string` | `""` | No | API key sent in the `Authorization: Bearer <key>` header. |
| `webhookUrl` | `string` | `undefined` | No | Destination webhook URL (e.g. Zapier, Make, n8n). |
| `expectedColumns` | `ExpectedColumn[]` | `undefined` | No | Column mapping schema: `{ key, label, required? }`. |
| `onSuccess` | `() => void` | `undefined` | No | Callback fired after successful upload or JSON download. |
| `onError` | `(error: string) => void` | `undefined` | No | Callback fired if validation or upload encounters an error. |

---

## 📁 Monorepo Architecture

This repository is organized as an open-source monorepo:

```text
csv-bridge/
├── packages/
│   └── csv-bridge/        # 📦 The standalone React npm library
│       ├── src/           # Component source & TypeScript definitions
│       ├── dist/          # Compiled ESM, CJS, and .d.ts typings
│       └── package.json   # Published npm package manifest
├── csv-bridge/            # 🌐 Full-stack Next.js web application
│       ├── src/app/       # Landing page, dashboard, and /api/ingest
│       └── ...
├── supabase/              # 🗄️ Database schemas & SQL migration scripts
│       └── schema.sql     # Tables, RLS policies, and indexes
└── .github/               # 🤖 Workflows (CI, automated npm release)
```

---

## 🛠️ Local Development

Clone the repository and install all dependencies from the root:

```bash
git clone https://github.com/ayushrajesh-poojary/csv-bridge.git
cd csv-bridge
npm install
```

### Useful Root Commands

```bash
# Build the npm library package
npm run build:package

# Start the Next.js demo web app (localhost:3000)
npm run dev:app

# Run linter across the workspace
npm run lint

# Build both package and web application
npm run build
```

---

## 🗄️ Self-Hosting the Ingestion Backend

### ⚡ One-Click Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/ayushrajesh-poojary/csv-bridge&root=csv-bridge&env=NEXT_PUBLIC_SUPABASE_URL,NEXT_PUBLIC_SUPABASE_ANON_KEY,SUPABASE_SERVICE_ROLE_KEY&envDescription=Supabase%20credentials%20for%20the%20CSV%20Bridge%20backend&envLink=https://supabase.com/docs/guides/getting-started)

### Manual Setup

If you prefer to deploy manually:

1. Create a free project at [Supabase](https://supabase.com).
2. Go to the **SQL Editor** in Supabase and run the script in [`supabase/schema.sql`](supabase/schema.sql).
3. Copy `.env.example` to `.env.local` inside `csv-bridge/`:
   ```bash
   cp csv-bridge/.env.example csv-bridge/.env.local
   ```
4. Fill in your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```
5. Deploy to [Vercel](https://vercel.com) or any Node.js hosting platform.

---

## 🤝 Contributing

Contributions make the open-source community thrive! Whether reporting a bug, improving the docs, or adding new features:

1. Read our [Contributing Guide](CONTRIBUTING.md).
2. Follow our [Code of Conduct](CODE_OF_CONDUCT.md).
3. Open a Pull Request!

---

## 📄 License

Distributed under the **MIT License**. See [`LICENSE`](LICENSE) for more details.
