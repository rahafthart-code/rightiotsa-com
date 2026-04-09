Right Frontend
==============

## Overview

React + Vite + Tailwind CSS + i18next dashboard for Right:

- Email + OTP login flow backed by the FastAPI API
- Multi-language support (English/Arabic) with language toggle
- Separate dashboards for Camels, Horses, and Falcons
- Real-time Mapbox map integration
- Connectivity status indicators (Online/Offline/Removed)
- Admin portal for managing users, animals, and devices

## Setup

1. Install dependencies:

```bash
cd frontend
npm install
```

2. Configure environment variables:

Create a `.env` file based on `.env.example`:

```env
VITE_API_BASE_URL=http://localhost:8000
VITE_MAPBOX_ACCESS_TOKEN=YOUR_MAPBOX_TOKEN
```

Get your Mapbox token from: https://account.mapbox.com/access-tokens/

3. Run the development server:

```bash
npm run dev
```

The app will be available at `http://localhost:5173`.

## Features

- **Multi-language**: Toggle between English (EN) and Arabic (ع) in the navbar
- **Multi-species dashboards**: 
  - `/dashboard` - Camels
  - `/horses` - Horses  
  - `/falcons` - Falcons
- **Connectivity monitoring**: Real-time status indicators for all devices
- **Mapbox integration**: Interactive maps showing animal locations
- **Admin portal**: Manage users, animals, and devices

## Build for Production

```bash
npm run build
```

This creates an optimized build in the `dist/` folder.

