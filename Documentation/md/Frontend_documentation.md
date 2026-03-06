# Resume Radar Frontend Documentation

Covers the routing layer, page components, UI component library, score visualization system, styling conventions, and data flow from the user's perspective.

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Architecture Overview](#2-architecture-overview)
3. [Technology Stack](#3-technology-stack)
4. [Project Structure](#4-project-structure)
5. [Routing](#5-routing)
6. [Pages (Routes)](#6-pages-routes)
7. [Component Library](#7-component-library)
8. [Score Visualization System](#8-score-visualization-system)
9. [Accordion System](#9-accordion-system)
10. [Styling Conventions](#10-styling-conventions)
11. [Application Shell](#11-application-shell)

---

## 1) Executive Summary

Resume Radar's frontend is built with **React Router v7** using the App Router with SSR enabled. All pages are React components organized as file-based routes under `app/routes/`. The UI is composed of a small, focused component library that renders AI-generated feedback through score gauges, color-coded badges, and expandable accordion sections.

Key frontend characteristics:

- **React Router v7** handles routing, SSR shell rendering, and page-level meta tags.
- **Puter.js state** is consumed across all pages and components via the `usePuterStore` Zustand store — there is no separate API client layer on the frontend.
- **Score-driven UI** — every feedback category maps its numeric score (0–100) to a three-tier color system (green / yellow / red) rendered consistently across badges, circles, and gauges.
- **No form library** — the upload form uses native HTML `FormData` with a controlled `File` state value for the PDF input.
- **Tailwind CSS v4** is used for all styling, with a small set of custom design tokens for badge colors and gradients.

---

## 2) Architecture Overview

### 2.1 Component Tree

```
root.tsx (Layout)
  └─ Outlet
      ├─ home.tsx
      │   ├─ Navbar
      │   └─ ResumeCard[]
      │       └─ ScoreCircle
      │
      ├─ Auth.tsx
      │
      ├─ Upload.tsx
      │   ├─ Navbar
      │   └─ FileUploader
      │
      ├─ Resume.tsx
      │   ├─ Summary
      │   │   ├─ ScoreGauge
      │   │   ├─ ScoreBadge
      │   │   └─ Category (×4)
      │   ├─ ATS
      │   └─ Details
      │       └─ Accordion
      │           └─ AccordionItem (×4)
      │               ├─ AccordionHeader → CategoryHeader → ScoreBadge (from Details)
      │               └─ AccordionContent → CategoryContent
      │
      └─ Wipe.tsx
```

### 2.2 Data Flow

All UI data flows through `usePuterStore`. Components do not fetch data independently — routes load data and pass it down as props.

```
Puter KV / FS
      │
      ▼
usePuterStore (Zustand)
      │
      ├─ home.tsx ────────── kv.list() ────▶ Resume[] ──▶ ResumeCard[]
      │
      ├─ Upload.tsx ─────── fs.upload()
      │                     ai.feedback()
      │                     kv.set()
      │
      └─ Resume.tsx ──────── kv.get() ─────▶ feedback ──▶ Summary, ATS, Details
                             fs.read() ─────▶ Blob URLs ──▶ <img>, <a href>
```

### 2.3 Authentication Flow

Every protected route checks `auth.isAuthenticated` on mount and redirects to `/auth?next=<path>` if the user is not signed in. The `Auth` page redirects back after sign-in resolves.

```
User visits protected route
      │
      ▼
useEffect: auth.isAuthenticated?
      │
  No  ├──▶ navigate('/auth?next=<path>')
      │         │
      │         ▼
      │     Auth.tsx: auth.signIn() ──▶ Puter modal
      │         │
      │         ▼
      │     auth.isAuthenticated becomes true
      │         │
      │         ▼
      │     navigate(next)
      │
  Yes └──▶ render page
```

---

## 3) Technology Stack

### 3.1 Core

| Package | Version | Role |
|---|---|---|
| React Router | 7.x | SSR framework, file-based routing, page meta |
| React | 19.x | Component rendering |
| TypeScript | 5.x | Type safety |

### 3.2 Styling

| Package | Version | Role |
|---|---|---|
| Tailwind CSS | 4.x | Utility-first CSS; configured via Vite plugin |
| clsx | — | Conditional class composition |
| tailwind-merge | — | Resolves conflicting Tailwind utility classes |

### 3.3 UI Behaviour

| Package | Version | Role |
|---|---|---|
| react-dropzone | — | Drag-and-drop PDF file input with MIME filtering and size cap |
| Zustand | 5.x | Global state store (`usePuterStore`) consumed in all routes |

### 3.4 Build

| Package | Role |
|---|---|
| Vite | Dev server and build tool |
| vite-tsconfig-paths | Enables `~/` alias resolving to `app/` |
| @tailwindcss/vite | Tailwind CSS v4 Vite integration |

---

## 4) Project Structure

```
app/
  root.tsx                  # Layout shell — injects Puter.js script, calls init()
  routes.ts                 # Route config — maps paths to route files
  app.css                   # Global CSS — custom tokens, shared class names
  routes/
    home.tsx                # Dashboard — resume history grid
    Auth.tsx                # Sign in / sign out page
    Upload.tsx              # Resume upload form + analysis trigger
    Resume.tsx              # Feedback detail view
    Wipe.tsx                # Data clearing utility
  components/
    Navbar.tsx              # Top navigation bar (logo + Upload Resume link)
    FileUploader.tsx        # Drag-and-drop PDF input
    ResumeCard.tsx          # Summary card for each resume in the history grid
    Summary.tsx             # Overall score panel with gauge and category rows
    ATS.tsx                 # ATS score card with color-coded tip list
    Details.tsx             # Expandable accordion for all four feedback categories
    Accordion.tsx           # Generic multi-item accordion (Context-based)
    ScoreCircle.tsx         # SVG circular progress ring used in ResumeCard
    ScoreGauge.tsx          # SVG half-arc gauge used in Summary
    ScoreBadge.tsx          # Pill badge showing score tier label
  lib/
    puter.ts                # Zustand store (see Backend documentation)
    pdfToImage.ts           # PDF-to-PNG conversion (see Backend documentation)
    utils.ts                # cn(), formatSize(), generateUUID()
  constants/
    index.ts                # AI prompt builder and response schema
```

---

## 5) Routing

**File:** [app/routes.ts](app/routes.ts)

Routes are declared using `@react-router/dev/routes` helpers and are resolved to files under `app/routes/`.

| Path | Component File | Access |
|---|---|---|
| `/` | `routes/home.tsx` | Protected |
| `/auth` | `routes/Auth.tsx` | Public |
| `/upload` | `routes/Upload.tsx` | Protected |
| `/resume/:id` | `routes/Resume.tsx` | Protected |
| `/wipe` | `routes/Wipe.tsx` | Protected |

**Route param:**

| Param | Route | Description |
|---|---|---|
| `:id` | `/resume/:id` | UUID of the resume record in Puter KV |

**Query param:**

| Param | Route | Description |
|---|---|---|
| `?next=<path>` | `/auth` | Path to redirect to after successful sign-in |

---

## 6) Pages (Routes)

### 6.1 `home.tsx` — Dashboard

**Path:** `/`

The main landing page after sign-in. Displays all previously analyzed resumes as a responsive card grid.

**State:**

| Variable | Type | Description |
|---|---|---|
| `resumes` | `Resume[]` | Parsed list of all resume records from Puter KV |
| `loadingResumes` | `boolean` | True while the KV list query is in flight |

**Behavior:**

- On mount, redirects unauthenticated users to `/auth?next=/`.
- Loads all resumes with `kv.list('resume-*', true)` and parses each JSON value into a `Resume` object.
- Shows a scanning animation GIF while loading.
- If no resumes exist, renders an "Upload Resume" CTA button.
- If resumes exist, renders a `ResumeCard` for each one.

**Meta:**

```
title: "Resumatch"
description: "Smart feedback for job applications!"
```

---

### 6.2 `Auth.tsx` — Authentication

**Path:** `/auth`

A full-screen centered auth card. Handles sign-in and sign-out exclusively through Puter.

**Behavior:**

- Reads `?next=` from the URL and navigates there once `auth.isAuthenticated` becomes `true`.
- Shows a pulsing "Loading..." button while `isLoading` is `true`.
- When authenticated: renders a "Log Out" button.
- When not authenticated: renders a "Sign In" button that calls `auth.signIn()`.

**Meta:**

```
title: "Resumatch | Auth"
description: "Log into your account"
```

---

### 6.3 `Upload.tsx` — Resume Upload

**Path:** `/upload`

The primary data entry page. Collects job context and a PDF file, then runs the full analysis pipeline.

**Form Fields:**

| Field | Input Type | Name Attribute | Description |
|---|---|---|---|
| Company Name | `text` | `company-name` | Optional — target employer |
| Job Title | `text` | `job-title` | Role the user is applying for |
| Job Description | `textarea` | `job-description` | Full job description for AI context |
| Resume | `FileUploader` | — | Controlled via `file` state |

**State:**

| Variable | Type | Description |
|---|---|---|
| `isProcessing` | `boolean` | True while the pipeline is running; hides the form |
| `statusText` | `string` | Live status message shown to the user during processing |
| `file` | `File \| null` | The selected PDF, set by `FileUploader` via `onFileSelect` |

**Pipeline** (`handleAnalyze`):

| Step | Status Message | Action |
|---|---|---|
| 1 | "Uploading file..." | `fs.upload([file])` |
| 2 | "Converting to image..." | `convertPdfToImage(file)` |
| 3 | "Uploading Image..." | `fs.upload([imageFile.file])` |
| 4 | "Preparing data..." | Build record object, `kv.set(resume-{uuid}, ...)` |
| 5 | "Analyzing..." | `ai.feedback(resumePath, prompt)` |
| 6 | "Analysis complete, redirecting..." | Update KV with feedback, `navigate(/resume/{uuid})` |

During processing, the form is replaced by an animated scanning GIF and the current `statusText`.

**Meta:** none (no `export const meta`)

---

### 6.4 `Resume.tsx` — Feedback Detail

**Path:** `/resume/:id`

The feedback view. Splits into two side-by-side panels: a sticky resume preview on the left and the scrollable feedback sections on the right.

**State:**

| Variable | Type | Description |
|---|---|---|
| `imageUrl` | `string` | Object URL of the PNG thumbnail (from Puter FS) |
| `resumeUrl` | `string` | Object URL of the PDF file (from Puter FS) |
| `feedback` | `Feedback \| null` | Parsed feedback object from KV; `null` while loading |

**Layout:**

```
┌────────────────────────┬────────────────────────────────┐
│  Sticky Resume Preview │  Scrollable Feedback Panel     │
│  (left, lg+)           │                                │
│                        │  <Summary>                     │
│  PNG thumbnail         │  <ATS>                         │
│  (links to PDF)        │  <Details>                     │
│                        │    └─ 4 accordion sections     │
└────────────────────────┴────────────────────────────────┘
```

On mobile (`max-lg`), the layout stacks vertically with the feedback above the preview (column-reverse).

While `feedback` is `null`, a scanning animation GIF is shown in the feedback panel.

**Meta:**

```
title: "Resumatch | Review"
description: "Detailed overview of your resume"
```

---

### 6.5 `Wipe.tsx` — Data Utility

**Path:** `/wipe`

A developer/user utility for resetting all application data. Not linked from the main navigation.

**Behavior:**

- Lists all files in the Puter FS root directory on mount.
- "Wipe App Data" button calls `fs.delete()` on every listed file, then `kv.flush()` to clear all KV entries.
- Reloads the file list after deletion to confirm it is empty.
- Requires authentication.

---

## 7) Component Library

### 7.1 `Navbar`

**File:** [app/components/Navbar.tsx](app/components/Navbar.tsx)

A simple top navigation bar rendered on the home and upload pages.

| Element | Destination | Description |
|---|---|---|
| "RESUME RADAR" logo | `/` | Text logo with gradient styling |
| "Upload Resume" button | `/upload` | Primary CTA button |

---

### 7.2 `FileUploader`

**File:** [app/components/FileUploader.tsx](app/components/FileUploader.tsx)

A drag-and-drop file input built with `react-dropzone`. Accepts PDF files only, up to 20 MB.

**Props:**

| Prop | Type | Description |
|---|---|---|
| `onFileSelect` | `(file: File \| null) => void` | Called when a file is accepted or removed |

**Behavior:**

- Drag active state is handled by `react-dropzone` internally.
- When a file is selected, shows the file name, formatted size, and a remove (×) button.
- The remove button calls `onFileSelect(null)` and stops propagation to avoid re-opening the picker.
- When no file is selected, shows an info icon and upload instructions.

**Constraints:**

| Constraint | Value |
|---|---|
| Accepted types | `application/pdf` (`.pdf`) |
| Max file size | 20 MB |
| Multiple files | Not allowed |

---

### 7.3 `ResumeCard`

**File:** [app/components/ResumeCard.tsx](app/components/ResumeCard.tsx)

A clickable card displayed in the home page grid. Navigates to `/resume/:id` on click.

**Props:**

| Prop | Type | Description |
|---|---|---|
| `resume` | `Resume` | The resume record including `feedback`, `imagePath`, `companyName`, `jobTitle` |

**Behavior:**

- On mount, reads the PNG thumbnail from Puter FS using `imagePath` and creates an object URL.
- Displays `companyName` and `jobTitle` as headings; falls back to "Resume" if both are absent.
- Shows `ScoreCircle` with `feedback.overallScore` in the top-right corner.
- Renders the thumbnail image below the header once the object URL resolves.

---

### 7.4 `ATS`

**File:** [app/components/ATS.tsx](app/components/ATS.tsx)

A card displaying the ATS compatibility score with an icon, subtitle, and list of tips.

**Props:**

| Prop | Type | Description |
|---|---|---|
| `score` | `number` | ATS score (0–100) |
| `suggestions` | `{ type: "good" \| "improve"; tip: string }[]` | List of ATS tips |

**Score tiers:**

| Score Range | Background | Icon | Subtitle |
|---|---|---|---|
| > 69 | `from-green-100` | `ats-good.svg` | "Great Job!" |
| 50–69 | `from-yellow-100` | `ats-warning.svg` | "Good Start" |
| < 50 | `from-red-100` | `ats-bad.svg` | "Needs Improvement" |

Each suggestion renders a check or warning icon and color-codes its text:
- `"good"` → `text-green-700`
- `"improve"` → `text-amber-700`

---

### 7.5 `Summary`

**File:** [app/components/Summary.tsx](app/components/Summary.tsx)

The overall score panel shown at the top of the feedback view. Displays a half-arc gauge and a row for each of the four scored categories.

**Props:**

| Prop | Type | Description |
|---|---|---|
| `feedback` | `Feedback` | Full feedback object |

**Layout:**

- Top: `ScoreGauge` with `overallScore` + a text description.
- Below: four `Category` rows for Tone & Style, Content, Structure, and Skills.

**Internal `Category` component:**

Renders the category name, a `ScoreBadge`, and the `score/100` value. The score number is color-coded:

| Score | Color |
|---|---|
| > 70 | `text-green-600` |
| 50–70 | `text-yellow-600` |
| < 50 | `text-red-600` |

---

### 7.6 `Details`

**File:** [app/components/Details.tsx](app/components/Details.tsx)

An accordion-based section displaying the detailed tips for each of the four feedback categories.

**Props:**

| Prop | Type | Description |
|---|---|---|
| `feedback` | `Feedback` | Full feedback object |

**Accordion sections:**

| Section ID | Category | Data Source |
|---|---|---|
| `tone-style` | Tone & Style | `feedback.toneAndStyle` |
| `content` | Content | `feedback.content` |
| `structure` | Structure | `feedback.structure` |
| `skills` | Skills | `feedback.skills` |

Each section uses two internal sub-components:

**`CategoryHeader`** — Renders the section title and a `ScoreBadge` (score-circle variant from `Details.tsx`) in the accordion trigger button.

**`CategoryContent`** — Renders tips in two passes:
1. A compact 2-column grid of tip titles with check/warning icons (overview).
2. Expanded cards for each tip with the full `explanation` text, color-coded by `type`:
   - `"good"` → green background, green border, green text
   - `"improve"` → yellow background, yellow border, yellow text

---

## 8) Score Visualization System

The application uses three distinct visual components to represent scores, each suited to a different layout context.

### 8.1 `ScoreCircle`

**File:** [app/components/ScoreCircle.tsx](app/components/ScoreCircle.tsx)
**Used in:** `ResumeCard`

A compact 100×100 px SVG circular progress ring.

**Implementation:**

| Property | Value |
|---|---|
| Radius | 40 |
| Stroke width | 8 |
| Progress fill | Blue-to-cyan linear gradient (`#3B82F6` → `#06B6D4`) |
| Background ring | `#e5e7eb` (gray-200) |
| Start angle | −90° (rotated via CSS `transform`) |
| Progress formula | `strokeDashoffset = circumference × (1 − score/100)` |

Renders `{score}/100` centered inside the ring.

---

### 8.2 `ScoreGauge`

**File:** [app/components/ScoreGauge.tsx](app/components/ScoreGauge.tsx)
**Used in:** `Summary`

A half-arc (180°) gauge rendered as an SVG path. Wider and more prominent than `ScoreCircle`, designed for the primary score display.

**Implementation:**

| Property | Value |
|---|---|
| SVG viewBox | `0 0 100 50` |
| Arc path | `M10,50 A40,40 0 0,1 90,50` (semicircle) |
| Stroke width | 10 |
| Progress fill | Blue-to-cyan linear gradient (horizontal) |
| Background arc | `#e5e7eb` |
| Progress formula | `strokeDashoffset = pathLength × (1 − score/100)` |
| Path length | Measured via `pathRef.current.getTotalLength()` in `useEffect` |

Renders `{score}/100` centered below the arc.

---

### 8.3 `ScoreBadge`

**File:** [app/components/ScoreBadge.tsx](app/components/ScoreBadge.tsx)
**Used in:** `Summary` (Category rows)

A pill-shaped label badge that maps a score to a human-readable tier name.

**Score tiers:**

| Score | Background | Text Color | Label |
|---|---|---|---|
| > 70 | `bg-badge-green` | `text-green-600` | "Strong" |
| 50–70 | `bg-badge-yellow` | `text-yellow-600` | "Good Start" |
| < 50 | `bg-badge-red` | `text-red-600` | "Needs Work" |

> **Note:** `Details.tsx` also contains a local `ScoreBadge` variant that displays `{score}/100` numerically with a check or warning icon, used specifically inside the accordion category headers. These are two different components with the same name in different files.

---

### 8.4 Score Threshold Summary

All score-dependent UI elements follow a consistent three-tier mapping:

| Tier | Threshold | Color Family | Meaning |
|---|---|---|---|
| Strong | score > 70 (or > 69) | Green | No significant issues |
| Good Start | score 50–70 | Yellow | Moderate improvements needed |
| Needs Work / Improvement | score < 50 | Red | Significant revision required |

Minor threshold variation exists between components (`> 70` vs `> 69`) but the overall three-tier system is consistent.

---

## 9) Accordion System

**File:** [app/components/Accordion.tsx](app/components/Accordion.tsx)

A fully custom, context-driven accordion. No external library dependency.

### 9.1 Architecture

Uses React Context (`AccordionContext`) to share state between the container and its items without prop drilling.

```
<Accordion>                    ← provides AccordionContext
  <AccordionItem id="...">     ← structural wrapper (border-bottom)
    <AccordionHeader itemId>   ← toggle button, reads/writes context
    <AccordionContent itemId>  ← conditionally visible via max-h + opacity
  </AccordionItem>
</Accordion>
```

### 9.2 Components

**`Accordion`**

| Prop | Type | Default | Description |
|---|---|---|---|
| `children` | `ReactNode` | — | `AccordionItem` children |
| `defaultOpen` | `string` | `undefined` | ID of the item open on initial render |
| `allowMultiple` | `boolean` | `false` | Whether multiple items can be open simultaneously |
| `className` | `string` | `""` | Additional classes on the wrapper `<div>` |

**`AccordionItem`**

| Prop | Type | Description |
|---|---|---|
| `id` | `string` | Unique identifier; passed to children as `itemId` |
| `children` | `ReactNode` | Header and Content |
| `className` | `string` | Additional classes |

**`AccordionHeader`**

| Prop | Type | Default | Description |
|---|---|---|---|
| `itemId` | `string` | — | Must match the parent `AccordionItem` `id` |
| `children` | `ReactNode` | — | Header content (title, badge, etc.) |
| `icon` | `ReactNode` | Chevron SVG | Custom expand/collapse icon |
| `iconPosition` | `"left" \| "right"` | `"right"` | Position of the expand icon |
| `className` | `string` | `""` | Additional classes |

The default chevron icon rotates 180° when the item is active (`rotate-180` class via `cn`).

**`AccordionContent`**

| Prop | Type | Description |
|---|---|---|
| `itemId` | `string` | Must match the parent `AccordionItem` `id` |
| `children` | `ReactNode` | Content to reveal |
| `className` | `string` | Additional classes |

Visibility is controlled by toggling between `max-h-fit opacity-100` and `max-h-0 opacity-0` with a `transition-all duration-300` for a smooth slide effect.

### 9.3 Toggle Behavior

```typescript
// Single mode (default): opening an item closes any currently open one
setActiveItems((prev) =>
  prev.includes(id) ? [] : [id]
);

// Multi mode (allowMultiple: true): items toggle independently
setActiveItems((prev) =>
  prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
);
```

---

## 10) Styling Conventions

### 10.1 Global CSS

**File:** [app/app.css](app/app.css)

Shared utility class names used across multiple components are defined as Tailwind `@apply` groups in the global stylesheet. This avoids duplicating long utility strings across files.

Key class names referenced in route and component files:

| Class | Used On | Description |
|---|---|---|
| `.navbar` | `Navbar` | Top nav bar layout |
| `.primary-button` | `Navbar`, `home.tsx`, `Upload.tsx` | Main CTA button style |
| `.auth-button` | `Auth.tsx` | Auth sign-in/out button |
| `.main-section` | `home.tsx`, `Upload.tsx` | Page content area |
| `.page-heading` | `home.tsx`, `Upload.tsx` | Page title/subtitle block |
| `.resume-card` | `ResumeCard` | Card container with hover state |
| `.resume-card-header` | `ResumeCard` | Card header row layout |
| `.resumes-section` | `home.tsx` | Resume grid layout |
| `.feedback-section` | `Resume.tsx` | Side-by-side panel |
| `.resume-nav` | `Resume.tsx` | Back navigation bar |
| `.resume-summary` | `Summary` | Category row wrapper |
| `.category` | `Summary` | Score row layout |
| `.form-div` | `Upload.tsx` | Label + input wrapper |
| `.gradient-border` | `ResumeCard`, `Auth.tsx`, `FileUploader`, `Resume.tsx` | Gradient border effect |
| `.back-button` | `Resume.tsx` | Back navigation button |
| `.text-gradient` | `Navbar`, `Auth.tsx` | Blue-to-cyan text gradient |

### 10.2 Custom Design Tokens

Custom color tokens used for score badges (defined in the Tailwind config or global CSS):

| Token | Use |
|---|---|
| `bg-badge-green` | Green badge background |
| `bg-badge-yellow` | Yellow badge background |
| `bg-badge-red` | Red badge background |
| `text-badge-green-text` | Green badge text color (used in `Details.tsx` score badge) |
| `text-badge-yellow-text` | Yellow badge text color |
| `text-badge-red-text` | Red badge text color |

### 10.3 Score Color System (Inline)

Where inline Tailwind classes drive score-dependent color, the following patterns are used:

```typescript
// Background gradient (ATS.tsx)
score > 69 ? 'from-green-100' : score > 49 ? 'from-yellow-100' : 'from-red-100'

// Text color (Summary.tsx Category)
score > 70 ? 'text-green-600' : score > 49 ? 'text-yellow-600' : 'text-red-600'

// Card border + background (Details.tsx CategoryContent)
tip.type === 'good'
  ? 'bg-green-50 border border-green-200 text-green-700'
  : 'bg-yellow-50 border border-yellow-200 text-yellow-700'
```

### 10.4 Animations

Fade-in animations use React Router's built-in `animate-in fade-in duration-1000` Tailwind classes, applied to:
- `ResumeCard` on render
- The feedback sections on the Resume detail page
- The gradient-border resume preview on the Resume detail page

---

## 11) Application Shell

**File:** [app/root.tsx](app/root.tsx)

### 11.1 `Layout` Component

The root layout wraps every page. It is responsible for:

1. **Loading Puter.js** — injects `<script src="https://js.puter.com/v2/">` into `<body>`.
2. **Initializing the store** — calls `usePuterStore().init()` once via `useEffect` after mount.
3. **Google Fonts** — preconnects to Google Fonts and loads the `Inter` variable font (weight 100–900, optical sizing 14–32).
4. **SSR plumbing** — renders React Router's `<Meta>`, `<Links>`, `<ScrollRestoration>`, and `<Scripts>` in the correct positions.

### 11.2 `App` Component

The default export renders `<Outlet />`, which React Router replaces with the matched route component.

### 11.3 `ErrorBoundary`

Catches route-level errors and renders a fallback UI:

| Error Type | Message | Details |
|---|---|---|
| 404 response | "404" | "The requested page could not be found." |
| Other HTTP error | "Error" | `error.statusText` |
| Unhandled JS error (dev only) | "Oops!" | `error.message` + stack trace |

The stack trace is only rendered in development (`import.meta.env.DEV`).

### 11.4 `links` Export

Declares font preconnect and stylesheet link tags via React Router's `LinksFunction`. These are injected into `<head>` by the `<Links />` component in the layout.
