# Smart AI Study Planner

A sophisticated web application designed for lecturers to craft industrial-grade learning paths and for students to engage in AI-assisted learning.

## 🚀 Features

- **Role-Based Access**: Specialized interfaces for Lecturers and Students.
- **AI Curriculum Generation**: Generate complete learning paths using Google Gemini AI.
- **Industrial Learning**: Support for PDF resources and external website links.
- **AI Study Assistant**: Real-time chat support for students to clarify doubts.
- **Event Management**: Dashboard for upcoming programs and enrollment.
- **Pomodoro Timer**: Integrated productivity tool for focused study sessions.
- **Dark Mode**: Fully responsive UI with light and dark theme support.

## 🛠️ Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS, Lucide Icons, Framer Motion.
- **Backend**: Node.js, Express.
- **Database**: SQLite (Better-SQLite3).
- **AI**: Google Gemini API (@google/genai).

## 📋 Prerequisites

- **Node.js**: v18.0.0 or higher.
- **npm**: v9.0.0 or higher.

## ⚙️ Local Setup

1. **Clone the project** to your local machine.
2. **Open your terminal** (Command Prompt, PowerShell, or VS Code Terminal) in the project root directory.
3. **Install dependencies**:
   ```bash
   npm install
   ```
4. **Configure Environment Variables**:
   Create a file named `.env` in the root directory and add your Gemini API key:
   ```env
   GEMINI_API_KEY=your_actual_api_key_here
   ```
5. **Start the Development Server**:
   ```bash
   npm run dev
   ```
6. **Access the App**: Open your browser and navigate to `http://localhost:3000`.

## 🧩 Recommended VS Code Extensions

To get the best development experience, install these extensions from the VS Code Marketplace:

1. **Tailwind CSS IntelliSense** (`bradlc.vscode-tailwindcss`) - For class autocompletion.
2. **ESLint** (`dbaeumer.vscode-eslint`) - For code quality checks.
3. **Prettier - Code formatter** (`esbenp.prettier-vscode`) - For consistent code styling.
4. **SQLite Viewer** (`qwtel.sqlite-viewer`) - To inspect `database.sqlite` directly.
5. **ES7+ React/Redux/React-Native snippets** (`dsznajder.es7-react-js-snippets`) - For faster coding.

## 📁 Project Structure

- `/src`: Frontend React components and pages.
- `/server.ts`: Express backend and API routes.
- `/database.sqlite`: Local database (generated on first run).
- `/public`: Static assets.
