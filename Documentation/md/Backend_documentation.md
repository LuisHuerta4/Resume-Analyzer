# Resume Radar Backend Documentation

Covers the Puter.js integration layer, state management, data models, AI pipeline, file storage, and all client-side backend logic.

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Architecture Overview](#2-architecture-overview)
3. [Technology Stack](#3-technology-stack)
4. [Project Structure](#4-project-structure)
5. [Data Models](#5-data-models)
6. [Authentication](#6-authentication)
7. [Puter Store (State & API Layer)](#7-puter-store-state--api-layer)
8. [File Storage](#8-file-storage)
9. [AI Pipeline](#9-ai-pipeline)
10. [Key-Value Persistence](#10-key-value-persistence)
11. [PDF Processing](#11-pdf-processing)
12. [Route Logic](#12-route-logic)
13. [Utility Layer](#13-utility-layer)
14. [Configuration](#14-configuration)

---

## 1) Executive Summary

Resume Radar is a **React Router v7** full-stack application that provides AI-powered resume analysis. Unlike traditional applications with a dedicated backend server, all backend logic — authentication, file storage, AI inference, and data persistence — is handled entirely by **Puter.js**, a client-accessible cloud platform loaded via a script tag.

At a high level:

- **React Router v7** serves both the UI and SSR shell from a single Vite-powered process.
- **Puter.js** (loaded via CDN) provides the entire backend: authentication, a cloud file system, AI inference, and key-value storage — no server infrastructure required.
- **Zustand** wraps the raw Puter.js browser API into a typed, reactive store (`usePuterStore`) consumed across all routes and components.
- **pdfjs-dist** converts uploaded PDF resumes into PNG thumbnails client-side for preview rendering.
- **Claude 3.7 Sonnet** (via Puter AI) performs all resume analysis, returning structured JSON feedback scored across five dimensions.
- **Puter KV** persists resume metadata and AI feedback per user, keyed by UUID. **Puter FS** stores the raw PDF and PNG thumbnail files.

---

## 2) Architecture Overview

### 2.1 System Context

```
External Services
  Puter.js CDN (js.puter.com/v2/) ──────────────────────────────────┐
  (auth, file system, AI, key-value store)                          │
                                                                    │
  Claude 3.7 Sonnet (via Puter AI) ─────────────────────────────────┤
  (resume analysis, structured JSON feedback)                        │
                                                                    │
  pdfjs-dist (bundled) ──────────────────────────────────────────────┤
  (client-side PDF → PNG conversion)                                 │
                                                                    ▼
Browser Client                                    React Router App (Vite/SSR)
  │                                                        │
  ├─ Page Requests ──────────────────────────▶ React Router SSR Shell
  │   └─ Route components fetch data                       │
  │       via usePuterStore                                │
  │                                                        │
  ├─ Upload Form Submission ──────────────────▶ handleAnalyze()
  │   ├─ PDF → Puter FS (raw file)                         │
  │   ├─ PDF → PNG → Puter FS (thumbnail)                  │
  │   ├─ Metadata → Puter KV (resume-{uuid})               │
  │   └─ AI feedback → Puter KV (resume-{uuid})            │
  │                                                        │
  ├─ Resume History ─────────────────────────▶ Puter KV list('resume-*')
  │                                                        │
  └─ Resume Detail ──────────────────────────▶ Puter KV get + Puter FS read
                                                           │
                                                           ▼
                                                   Puter Cloud Storage
                                              ├─ FS: PDF files
                                              ├─ FS: PNG thumbnails
                                              └─ KV: resume-{uuid} records
```

### 2.2 Runtime Model

Because this application has no dedicated backend process, all data operations run in the browser via the Puter.js SDK. The Puter platform handles user isolation, file storage, and AI inference on its own infrastructure. The React Router SSR layer renders only the HTML shell; all data loading happens client-side after Puter initializes.

Key design patterns:

- **Puter readiness polling** — `init()` polls `window.puter` every 100 ms until the CDN script loads, with a 10-second timeout fallback.
- **Zustand singleton store** — `usePuterStore` is a single global store that centralizes all Puter API calls, auth state, and loading/error flags.
- **UUID-keyed KV records** — Each resume is stored under a `resume-{uuid}` key, making list queries simple (`kv.list('resume-*', true)`).
- **File path references** — The Puter FS path returned on upload is stored in the KV record so files can be retrieved later by path without re-uploading.

---

## 3) Technology Stack

### 3.1 Core Platform

| Package | Version | Role |
|---|---|---|
| React Router | 7.x | Full-stack framework — SSR shell, routing, file-based route config |
| React | 19.x | UI rendering |
| TypeScript | 5.x | Type safety across the codebase |
| Vite | 6.x | Build tool and dev server |

### 3.2 Backend Platform (Puter.js)

| Service | Accessed Via | Role |
|---|---|---|
| Puter Auth | `window.puter.auth` | User authentication — sign in, sign out, session check |
| Puter FS | `window.puter.fs` | Cloud file storage — PDF and PNG uploads, reads, deletes |
| Puter AI | `window.puter.ai` | AI inference via Claude 3.7 Sonnet — resume feedback |
| Puter KV | `window.puter.kv` | Persistent key-value store — resume metadata and feedback |

### 3.3 State Management

| Package | Version | Role |
|---|---|---|
| Zustand | 5.x | Global store wrapping all Puter API calls and application state |

### 3.4 File Processing

| Package | Version | Role |
|---|---|---|
| pdfjs-dist | 4.x | Client-side PDF rendering — converts first page to a PNG thumbnail |

### 3.5 UI Utilities

| Package | Role |
|---|---|
| react-dropzone | Drag-and-drop file input with PDF filtering and size validation |
| clsx + tailwind-merge | Conditional className composition |
| Tailwind CSS v4 | Utility-first styling |

---

## 4) Project Structure

```
resume-radar/
  app/
    root.tsx                  # Root layout — loads Puter.js script, calls init()
    routes.ts                 # Route config (React Router file-based)
    app.css                   # Global styles
    routes/
      home.tsx                # Dashboard — lists all user resumes from KV
      Auth.tsx                # Auth gate — sign in / sign out via Puter
      Upload.tsx              # Upload form — orchestrates the full analysis pipeline
      Resume.tsx              # Resume detail — renders feedback and preview
      Wipe.tsx                # Dev utility — deletes all FS files and flushes KV
    components/
      Navbar.tsx              # Top navigation bar
      FileUploader.tsx        # Drag-and-drop PDF input (react-dropzone)
      ResumeCard.tsx          # Card for resume history list (loads thumbnail from FS)
      ATS.tsx                 # ATS score section with tip badges
      Summary.tsx             # Overall score summary with gauges
      Details.tsx             # Expandable accordion for each feedback category
      Accordion.tsx           # Generic accordion component
      ScoreCircle.tsx         # Circular score indicator
      ScoreGauge.tsx          # Gauge-style score visualization
      ScoreBadge.tsx          # Badge indicating "good" or "improve" tip type
    lib/
      puter.ts                # Zustand store — all Puter API wrappers and auth state
      pdfToImage.ts           # PDF → PNG conversion using pdfjs-dist
      utils.ts                # Formatting helpers (cn, formatSize, generateUUID)
    constants/
      index.ts                # AI response schema + prepareInstructions() prompt builder
  react-router.config.ts      # React Router config (SSR enabled)
  vite.config.ts              # Vite config (Tailwind, React Router, tsconfig paths)
  package.json
```

---

## 5) Data Models

### 5.1 Resume Record (Puter KV)

Each submitted resume is stored as a JSON-serialized object under the key `resume-{uuid}` in Puter KV.

| Field | Type | Notes |
|---|---|---|
| `id` | `string` (UUID) | Generated with `crypto.randomUUID()` at upload time |
| `resumePath` | `string` | Puter FS path of the uploaded PDF file |
| `imagePath` | `string` | Puter FS path of the generated PNG thumbnail |
| `companyName` | `string` | Target company entered by the user |
| `jobTitle` | `string` | Job title the resume is being submitted for |
| `jobDescription` | `string` | Full job description text used to contextualize AI analysis |
| `feedback` | `Feedback \| ''` | Parsed AI feedback object; empty string until analysis completes |

**KV key pattern:** `resume-{uuid}`
**KV list pattern:** `resume-*` (used to load all resumes for a user)

### 5.2 Feedback Object (AI Response)

The AI returns a structured JSON object conforming to the following schema, which is also embedded directly in the prompt as a TypeScript interface.

```typescript
interface Feedback {
  overallScore: number;           // 0–100 composite score
  ATS: {
    score: number;                // ATS suitability score
    tips: ATSTip[];               // 3–4 tips
  };
  toneAndStyle: FeedbackCategory;
  content: FeedbackCategory;
  structure: FeedbackCategory;
  skills: FeedbackCategory;
}

interface FeedbackCategory {
  score: number;                  // 0–100
  tips: DetailedTip[];            // 3–4 tips
}

interface ATSTip {
  type: "good" | "improve";
  tip: string;
}

interface DetailedTip {
  type: "good" | "improve";
  tip: string;                    // Short title
  explanation: string;            // Full explanation
}
```

### 5.3 Puter User

The authenticated user object returned by `puter.auth.getUser()`.

| Field | Type | Notes |
|---|---|---|
| `username` | `string` | Puter account username |
| (other fields) | varies | Additional profile fields provided by Puter platform |

### 5.4 Puter FS Item

Returned by `puter.fs.upload()` and `puter.fs.readdir()`.

| Field | Type | Notes |
|---|---|---|
| `id` | `string` | Unique file identifier |
| `name` | `string` | File name |
| `path` | `string` | Full Puter FS path — stored in KV for later retrieval |

### 5.5 Data Not Persisted

Raw PDF content and PNG thumbnails are **never stored in KV**. Only their Puter FS paths are stored. File content is fetched from Puter FS on demand by the Resume detail page and the ResumeCard component.

---

## 6) Authentication

**File:** [app/lib/puter.ts](app/lib/puter.ts)

### 6.1 Overview

Authentication is handled entirely by Puter.js. There is no password or credential management in this codebase — the Puter platform presents its own OAuth-style sign-in modal when `puter.auth.signIn()` is called.

### 6.2 Auth Methods

| Method | Description |
|---|---|
| `puter.auth.isSignedIn()` | Returns `true` if the user has an active Puter session |
| `puter.auth.getUser()` | Returns the authenticated `PuterUser` object |
| `puter.auth.signIn()` | Opens the Puter sign-in modal |
| `puter.auth.signOut()` | Ends the session and clears user data from the store |

### 6.3 Auth State in the Store

The `auth` slice of `usePuterStore` exposes:

| Property / Method | Type | Description |
|---|---|---|
| `user` | `PuterUser \| null` | Currently authenticated user, or `null` |
| `isAuthenticated` | `boolean` | `true` when a valid session exists |
| `signIn()` | `async () => void` | Calls `puter.auth.signIn()` then refreshes auth state |
| `signOut()` | `async () => void` | Calls `puter.auth.signOut()` and resets `user` to `null` |
| `refreshUser()` | `async () => void` | Re-fetches user data from Puter without triggering sign-in |
| `checkAuthStatus()` | `async () => boolean` | Checks `isSignedIn()` and syncs store state; called during `init()` |
| `getUser()` | `() => PuterUser \| null` | Synchronous accessor returning the current `user` from store |

### 6.4 Initialization Flow

`init()` is called once in `root.tsx` via `useEffect`. It polls `window.puter` every 100 ms until the CDN script is available, then sets `puterReady: true` and immediately calls `checkAuthStatus()` to restore any existing session.

```
root.tsx → useEffect → init()
  ├─ window.puter already loaded? → set puterReady, checkAuthStatus()
  └─ not yet? → poll every 100ms (max 10s) → set puterReady, checkAuthStatus()
                                                      │
                                              puter.auth.isSignedIn()
                                                      │
                                            true  ────▶ puter.auth.getUser() → set user + isAuthenticated
                                            false ────▶ set user: null, isAuthenticated: false
```

### 6.5 Route-Level Auth Guards

All protected routes check `auth.isAuthenticated` inside a `useEffect` and redirect to `/auth?next=<current-path>` if the user is not signed in. The `Auth` route reads the `next` query parameter and redirects back to the original destination after successful sign-in.

```typescript
// Pattern used in home.tsx, Resume.tsx, Wipe.tsx
useEffect(() => {
  if (!auth.isAuthenticated) navigate('/auth?next=/');
}, [auth.isAuthenticated]);
```

---

## 7) Puter Store (State & API Layer)

**File:** [app/lib/puter.ts](app/lib/puter.ts)

`usePuterStore` is the central Zustand store that wraps all Puter.js API calls, manages loading/error state, and exposes typed methods to the rest of the application.

### 7.1 Top-Level State

| Field | Type | Description |
|---|---|---|
| `isLoading` | `boolean` | `true` during any async Puter operation |
| `error` | `string \| null` | Last error message, cleared by `clearError()` |
| `puterReady` | `boolean` | `true` once `window.puter` is available and initialized |

### 7.2 Store Slices

The store is organized into four namespaced slices mirroring the Puter API surface:

| Slice | Description |
|---|---|
| `auth` | Authentication state and methods (see [Section 6](#6-authentication)) |
| `fs` | File system operations — `write`, `read`, `readDir`, `upload`, `delete` |
| `ai` | AI operations — `chat`, `feedback`, `img2txt` |
| `kv` | Key-value store operations — `get`, `set`, `delete`, `list`, `flush` |

Every method in every slice is guarded by a null check on `window.puter`. If Puter is not available, `setError("Puter.js not available")` is called and the method returns `undefined`. This prevents crashes during SSR or before the CDN script loads.

### 7.3 `getPuter()` Helper

```typescript
const getPuter = (): typeof window.puter | null =>
  typeof window !== "undefined" && window.puter ? window.puter : null;
```

A module-level utility called at the start of every store method to safely access `window.puter`. Returns `null` during SSR or before the script loads.

---

## 8) File Storage

**File:** [app/lib/puter.ts](app/lib/puter.ts) — `fs` slice

All files are stored in the authenticated user's Puter cloud file system. No server-side storage infrastructure is required.

### 8.1 FS Methods

| Method | Signature | Description |
|---|---|---|
| `fs.upload(files)` | `(File[] \| Blob[]) => Promise<FSItem \| undefined>` | Uploads one or more files; returns the `FSItem` with the Puter FS path |
| `fs.read(path)` | `(string) => Promise<Blob \| undefined>` | Reads a file by its Puter FS path; returns a raw `Blob` |
| `fs.write(path, data)` | `(string, string \| File \| Blob) => Promise<File \| undefined>` | Writes data to a specific path |
| `fs.readDir(path)` | `(string) => Promise<FSItem[] \| undefined>` | Lists all items in a directory |
| `fs.delete(path)` | `(string) => Promise<void>` | Permanently deletes a file at the given path |

### 8.2 Storage Pattern

Each resume upload creates two FS entries:

| File | Format | Stored As |
|---|---|---|
| Original resume | PDF | `uploadedFile.path` → saved in KV as `resumePath` |
| Thumbnail preview | PNG (4× scale) | `uploadedImage.path` → saved in KV as `imagePath` |

Files are retrieved by path using `fs.read(path)` and converted to object URLs for display in the browser:

```typescript
const blob = await fs.read(data.resumePath);
const url = URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
```

---

## 9) AI Pipeline

### 9.1 Overview

AI inference is performed by **Claude 3.7 Sonnet** via the Puter AI API. The AI receives the uploaded PDF file directly (by Puter FS path) alongside a structured text prompt, and returns a JSON feedback object.

**File:** [app/lib/puter.ts](app/lib/puter.ts) — `ai.feedback()`
**Prompt:** [app/constants/index.ts](app/constants/index.ts) — `prepareInstructions()`

### 9.2 `ai.feedback(path, message)`

The primary AI method used for resume analysis. It constructs a multimodal chat message with:

1. A **file part** — the Puter FS path of the uploaded PDF, passed as `{ type: "file", puter_path: path }`. Puter resolves this to the actual file content for the model.
2. A **text part** — the structured analysis prompt built by `prepareInstructions()`.

```typescript
puter.ai.chat(
  [
    {
      role: "user",
      content: [
        { type: "file", puter_path: path },
        { type: "text", text: message },
      ],
    },
  ],
  { model: "claude-3-7-sonnet" }
)
```

The response is returned as an `AIResponse` object. The content is extracted as:

```typescript
const feedbackText =
  typeof feedback.message.content === 'string'
    ? feedback.message.content
    : feedback.message.content[0].text;

data.feedback = JSON.parse(feedbackText);
```

### 9.3 Prompt Strategy

**File:** [app/constants/index.ts](app/constants/index.ts)

| Export | Description |
|---|---|
| `AIResponseFormat` | A TypeScript interface literal embedded in the prompt, defining the exact JSON schema the model must return |
| `prepareInstructions({ jobTitle, jobDescription })` | A factory function that injects the job context and response schema into the full system prompt |

**Prompt constraints:**

- The model is instructed to act as an ATS and resume analysis expert.
- Scores should be genuinely reflective of quality — low scores are explicitly permitted and encouraged for weak resumes.
- If a job description is provided, it is used to contextualize all scoring.
- The response must be **raw JSON only** — no markdown fences, no extra commentary.

**Response schema:** Five scored categories, each with 3–4 tips typed as `"good"` or `"improve"`:

| Category | Description |
|---|---|
| `overallScore` | Composite score (0–100) |
| `ATS` | ATS keyword match and formatting suitability |
| `toneAndStyle` | Writing style, tone, and professionalism |
| `content` | Relevance, impact, and quality of resume content |
| `structure` | Layout, section ordering, and readability |
| `skills` | Skills alignment with job requirements |

### 9.4 AI Upload Pipeline

The full pipeline executed in `Upload.tsx → handleAnalyze()`:

```
1. fs.upload([file])               → get resumePath
2. convertPdfToImage(file)         → get PNG File
3. fs.upload([imageFile])          → get imagePath
4. generateUUID()                  → id
5. kv.set(`resume-${id}`, data)    → persist stub (no feedback yet)
6. ai.feedback(resumePath, prompt) → get structured JSON
7. kv.set(`resume-${id}`, data)    → update record with feedback
8. navigate(`/resume/${id}`)       → redirect to detail view
```

Status messages are shown to the user at each step via `statusText` state.

---

## 10) Key-Value Persistence

**File:** [app/lib/puter.ts](app/lib/puter.ts) — `kv` slice

Puter KV is a per-user, string-based key-value store. All resume records are serialized to JSON strings before storage.

### 10.1 KV Methods

| Method | Signature | Description |
|---|---|---|
| `kv.get(key)` | `(string) => Promise<string \| null \| undefined>` | Retrieves a single value by key; returns `null` if not found |
| `kv.set(key, value)` | `(string, string) => Promise<boolean \| undefined>` | Writes a string value to the given key |
| `kv.delete(key)` | `(string) => Promise<boolean \| undefined>` | Deletes a key-value entry |
| `kv.list(pattern, returnValues?)` | `(string, boolean?) => Promise<string[] \| KVItem[] \| undefined>` | Lists keys matching a glob pattern; set `returnValues: true` to return `KVItem[]` with both key and value |
| `kv.flush()` | `() => Promise<boolean \| undefined>` | Deletes all KV entries for the user |

### 10.2 Key Naming Convention

| Pattern | Used By | Description |
|---|---|---|
| `resume-{uuid}` | `Upload.tsx`, `Resume.tsx` | Individual resume record |
| `resume-*` | `home.tsx` | Glob pattern to list all resume records |

### 10.3 KVItem Shape

When `kv.list(pattern, true)` is called, it returns `KVItem[]`:

```typescript
interface KVItem {
  key: string;
  value: string;  // JSON-serialized Resume object
}
```

Parsed in `home.tsx`:
```typescript
const resumes = (await kv.list('resume-*', true)) as KVItem[];
const parsed = resumes.map((r) => JSON.parse(r.value) as Resume);
```

---

## 11) PDF Processing

**File:** [app/lib/pdfToImage.ts](app/lib/pdfToImage.ts)

### 11.1 Overview

`convertPdfToImage()` renders the first page of a PDF to a PNG thumbnail entirely in the browser using `pdfjs-dist`. The worker is served from the public directory (`/pdf.worker.min.mjs`) to avoid bundler complications.

### 11.2 Lazy Loading

`pdfjs-dist` is loaded lazily on first use via dynamic import. A module-level `loadPromise` ensures the library is only initialized once even if `convertPdfToImage` is called concurrently.

```typescript
loadPromise = import("pdfjs-dist/build/pdf.mjs").then((lib) => {
  lib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
  pdfjsLib = lib;
  return lib;
});
```

### 11.3 `convertPdfToImage(file)`

| Step | Description |
|---|---|
| 1 | Load pdfjs-dist (cached after first call) |
| 2 | Read the PDF `File` as an `ArrayBuffer` |
| 3 | Parse with `lib.getDocument({ data: arrayBuffer })` |
| 4 | Retrieve page 1 with `pdf.getPage(1)` |
| 5 | Create a viewport at **4× scale** for high-resolution output |
| 6 | Render to an off-screen `<canvas>` with `imageSmoothingQuality: "high"` |
| 7 | Export to a PNG `Blob` at quality `1.0` |
| 8 | Wrap the blob in a `File` named `{original-name}.png` |
| Returns | `PdfConversionResult { imageUrl, file, error? }` |

**Return type:**

```typescript
interface PdfConversionResult {
  imageUrl: string;    // Object URL for immediate preview
  file: File | null;   // PNG File ready for Puter FS upload
  error?: string;      // Set if conversion fails
}
```

---

## 12) Route Logic

### 12.1 Route Map

**File:** [app/routes.ts](app/routes.ts)

| Path | File | Description |
|---|---|---|
| `/` | `routes/home.tsx` | Dashboard — lists all user resumes |
| `/auth` | `routes/Auth.tsx` | Authentication gate |
| `/upload` | `routes/Upload.tsx` | Resume upload and analysis form |
| `/resume/:id` | `routes/Resume.tsx` | Resume detail with AI feedback |
| `/wipe` | `routes/Wipe.tsx` | Data clearing utility |

### 12.2 `home.tsx` — Dashboard

- Redirects unauthenticated users to `/auth?next=/`.
- Loads all resumes from KV using `kv.list('resume-*', true)` and parses each JSON value.
- Renders a `ResumeCard` for each resume, or an upload prompt if none exist.

### 12.3 `Auth.tsx` — Authentication Gate

- Reads `?next=` query parameter to support post-login redirect.
- Delegates sign-in/sign-out entirely to `auth.signIn()` / `auth.signOut()` from the store.
- Auto-redirects to `next` when `auth.isAuthenticated` becomes `true`.

### 12.4 `Upload.tsx` — Analysis Pipeline

The most logic-heavy route. Orchestrates the full 8-step pipeline (see [Section 9.4](#94-ai-upload-pipeline)):

1. Collects company name, job title, job description, and PDF file via form.
2. Calls `handleAnalyze()` which drives the sequential pipeline with status updates.
3. On completion, navigates to `/resume/{uuid}`.

### 12.5 `Resume.tsx` — Feedback Detail

- Loads the resume record from KV by `id` (route param).
- Reads both the PDF and PNG files from Puter FS by their stored paths.
- Creates object URLs from the blobs for rendering.
- Passes the `feedback` object to `<Summary>`, `<ATS>`, and `<Details>` components.

### 12.6 `Wipe.tsx` — Data Utility

A developer/user utility for clearing all application data:

- Reads the root directory from Puter FS (`fs.readDir("./")`) and deletes each file.
- Calls `kv.flush()` to delete all KV entries.
- Requires authentication; redirects to `/auth?next=/wipe` if not signed in.

---

## 13) Utility Layer

**File:** [app/lib/utils.ts](app/lib/utils.ts)

| Function | Description |
|---|---|
| `cn(...inputs)` | Merges Tailwind class strings using `clsx` + `tailwind-merge`. Resolves class conflicts. |
| `formatSize(bytes)` | Converts a byte count to a human-readable string (e.g. `"1.45 MB"`). Uses `Bytes / KB / MB / GB / TB` suffixes with 2 decimal places. |
| `generateUUID()` | Returns a new UUID v4 string via `crypto.randomUUID()`. Used to generate unique resume record IDs at upload time. |

---

## 14) Configuration

### 14.1 React Router

**File:** [react-router.config.ts](react-router.config.ts)

```typescript
export default { ssr: true } satisfies Config;
```

SSR is enabled — React Router renders the HTML shell server-side. All Puter data loading happens client-side after hydration, since Puter.js is a browser-only library.

### 14.2 Vite

**File:** [vite.config.ts](vite.config.ts)

| Plugin | Role |
|---|---|
| `@tailwindcss/vite` | Tailwind CSS v4 integration via Vite plugin |
| `@react-router/dev/vite` | React Router v7 framework integration |
| `vite-tsconfig-paths` | Enables `~/` path alias resolving to `app/` |

### 14.3 Environment Variables

Resume Radar requires **no environment variables**. All API keys and credentials are managed by the Puter platform on behalf of the authenticated user. The Puter CDN script is loaded directly from `https://js.puter.com/v2/` in the root layout.

### 14.4 Development Commands

```bash
# Install dependencies
npm install

# Start dev server (Vite + React Router)
npm run dev

# Build for production
npm run build

# Run production preview
npm run start
```

### 14.5 PDF Worker Setup

`pdfjs-dist` requires its worker script to be accessible at a public URL. The file `pdf.worker.min.mjs` must be present in the `public/` directory. It is referenced at runtime as:

```typescript
lib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
```
