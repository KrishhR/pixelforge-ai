# PixelForge AI

**PixelForge AI** is a modern, browser-based image editing and AI-assisted image generation platform built with **Next.js 14 (App Router + TypeScript)**. It provides a full-featured workspace for creating, editing, managing, and enhancing images using secure authentication, cloud image storage, and a serverless backend.

---

## Overview

PixelForge AI combines a rich canvas-based editor with scalable cloud services and a polished component system to deliver a performant and professional image tooling experience.

**Key capabilities:**
- Interactive image editor with canvas, layers, and tools
- AI-assisted image workflows (extensible)
- Secure authentication and user sessions
- Project-based organization
- Cloud image uploads with CDN delivery
- Serverless backend for data and business logic
- Consistent, accessible UI built with **shadcn/ui**

---

## Technology Stack

- **Frontend:** Next.js 14 (App Router), TypeScript
- **UI Components:** shadcn/ui (Radix UI + Tailwind CSS)
- **Styling:** Tailwind CSS
- **Authentication:** Clerk
- **Backend / Database:** Convex
- **Image Storage & CDN:** ImageKit

---

## Getting Started

### Prerequisites

- Node.js **18+**
- npm, pnpm, or yarn
- Accounts for:
  - Clerk
  - Convex
  - ImageKit

---

### Installation

```bash
git clone <repo-url>
cd pixelforge-ai
npm install
