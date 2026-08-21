# GhostSOP

GhostSOP is an AI-powered Standard Operating Procedure (SOP) generator and management platform. It allows users to quickly generate, document, and manage structured SOPs for various industries such as Electronics Manufacturing, Automotive, Pharmaceuticals, and Heavy Industry.

The project acts as an AI "Ghost SOP Agent" that analyzes tasks, determines risk levels, references relevant industry standards, and automatically compiles detailed step-by-step procedures and quality checkpoints.

## Features

- **AI-Powered SOP Generation (`CapturePage`)**:
  - Input a task name, industry domain, and operator name to instantly generate comprehensive SOPs.
  - "Quick Analysis" provides an upfront estimate of risk levels, suggested steps, and relevant industry standards.
  - Real-time agent generation logs show progress.
  - Quick presets for common tasks like PCB Assembly, Valve Torque Check, and Blister Packing.
- **SOP Library (`SOPLibraryPage`)**:
  - A centralized dashboard to view, search, and manage all generated SOPs.
  - Track high-level statistics including total SOPs, domains covered, and total steps documented.
- **Detailed SOP View (`SOPDetailPage`)**:
  - View the complete generated procedure, including individual steps and quality gates.
- **Deviation Tracking (`DeviationPage`)**:
  - Record and manage operational deviations from standard procedures.
- **Contextual AI Chat (`ChatPage`)**:
  - Interact with an AI assistant for questions or clarifications regarding the active SOP.

## Tech Stack

- **Frontend Framework**: React 19
- **Build Tool**: Vite
- **Styling**: Vanilla CSS with custom design tokens for a sleek, dark-mode focused UI.
- **Language**: JavaScript (ES modules) / JSX

## Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)
- npm or yarn

### Installation

1. Clone the repository and navigate to the project directory:
   ```bash
   cd ghostsop
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser and visit the local URL provided by Vite (usually `http://localhost:5173`).

### Building for Production

To build the project for production, run:

```bash
npm run build
```

This will output optimized static files to the `dist` directory.

## Project Structure

- `src/components/Layout.jsx`: Main application wrapper and navigation layout.
- `src/pages/`: Contains the main application views (`CapturePage`, `SOPLibraryPage`, `SOPDetailPage`, `DeviationPage`, `ChatPage`).
- `src/lib/api.js`: Handles API interactions and AI agent communication.
- `src/App.jsx`: Main routing and state management component.
- `src/index.css`: Global styles and design system variables.
