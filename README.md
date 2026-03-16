# NutriTech Application

NutriTech is an advanced agricultural management platform designed to monitor soil health, manage plant experiments, and provide AI-driven crop recommendations.

## 📁 Project Structure

- `/frontend`: React application (Vite, Tailwind, Supabase)
- `/backend`: Main API (Flask, Supabase Integration)
- `/ml-service`: AI Prediction Engine (Flask, Scikit-Learn)

## 🚀 Quick Start

### 1. Prerequisites
- Python 3.9+
- Node.js 18+
- Supabase Account

### 2. Environment Setup
Both `/backend` and `/frontend` require a `.env` file with your Supabase credentials:
```env
SUPABASE_URL=your_project_url
SUPABASE_KEY=your_anon_or_service_key
```

### 3. Running Locally
- **Backend**: `cd backend && python app.py` (Runs on port 5000)
- **ML Service**: `cd ml-service && python app.py` (Runs on port 5001)
- **Frontend**: `cd frontend && npm install && npm run dev`

## 📖 Documentation
For more detailed information, please refer to:
- [**Codebase Overview**](CODEBASE_OVERVIEW.md): Architecture and Workflows.
- [**Database Schema**](DATABASE_SCHEMA.md): Tables, columns, and relationships.
