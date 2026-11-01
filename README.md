# Vibora Admin

A clean, modern admin dashboard for managing Vibora users — built with **React 19**, **Vite 8**, **Tailwind CSS v4**, and **React Router v7**.

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

## Demo Credentials

| Field    | Value               |
|----------|---------------------|
| Email    | `admin@vibora.com`  |
| Password | `admin123`          |

> **Note:** These are demo credentials only. Replace the `DEMO_CREDENTIALS` constant in `src/context/AuthContext.jsx` with a real backend auth call before deploying.

## Pages

| Route        | Description                              |
|--------------|------------------------------------------|
| `/login`     | Sign-in page (redirects if authenticated) |
| `/dashboard` | Live stats & recent users from context   |
| `/users`     | Full CRUD: add, edit, delete, block      |

## Features

- 🎨 **Brand-derived design tokens** — colours extracted from `logo.png` (violet, pink, orange-gold on deep-navy)
- 👤 **Users data layer** — `UsersContext` with `localStorage` persistence (key: `vibora_users`)
- 📊 **Live dashboard stats** — Total / Active / Blocked / New-this-month, animated count-up
- ➕ **User CRUD** — Add, Edit, Delete (with confirmation), Block/Unblock
- 🔍 **Live search** on the Users table
- 📱 **Responsive** — drawer sidebar on mobile, cards on small screens
- ♿ **Accessible** — ARIA labels, keyboard nav, focus rings, Escape to close modals
- ⚡ **Zero ESLint warnings** — hooks and components in separate files

## Project Structure

```
src/
  components/
    ui/           # Button, Badge, Avatar, Input, Modal, ConfirmDialog, EmptyState, StatCard
    Header.jsx
    LoadingScreen.jsx
    Sidebar.jsx
  context/
    AuthContext.jsx
    UsersContext.jsx
  hooks/
    useAuth.js
    useUsers.js
  layouts/
    DashboardLayout.jsx
  lib/
    cn.js          # clsx + tailwind-merge helper
  pages/
    Dashboard.jsx
    Login.jsx
    Users.jsx
  App.jsx
  main.jsx
  index.css       # Tailwind v4 @theme design tokens
```

## Scripts

```bash
npm run dev     # Start dev server
npm run build   # Production build
npm run lint    # ESLint check
npm run preview # Preview production build
```
