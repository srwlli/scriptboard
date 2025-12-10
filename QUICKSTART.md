# Quick Start Guide

## Running Scriptboard

### Option 1: Web Browser (Recommended for Development)

#### Step 1: Start the Backend

Open a terminal and run:

```bash
cd backend
venv\Scripts\activate  # Windows PowerShell
# OR: source venv/bin/activate  # Linux/Mac

uvicorn api:app --reload --host 127.0.0.1 --port 8000
```

You should see:
```
INFO:     Uvicorn running on http://127.0.0.1:8000
INFO:     Application startup complete.
```

The API will be available at `http://localhost:8000`
- API docs: `http://localhost:8000/docs`
- Health check: `http://localhost:8000/health`

#### Step 2: Start the Frontend

Open a **new terminal** and run:

```bash
cd frontend
npm install  # First time only
npm run dev
```

You should see:
```
- ready started server on 0.0.0.0:3000
- Local:        http://localhost:3000
```

#### Step 3: Open in Browser

Open your browser and go to:
```
http://localhost:3000
```

You should see the Scriptboard interface!

---

### Option 2: Electron Desktop App

#### Step 1: Install Frontend Dependencies (if not done)

```bash
cd frontend
npm install
```

#### Step 2: Install Electron Dependencies

```bash
cd shell
npm install
```

#### Step 3: Start Electron

```bash
cd shell
npm run dev
```

This will:
1. Automatically spawn the backend (uvicorn)
2. Wait for backend to be healthy
3. Load the Next.js frontend in an Electron window

---

## Troubleshooting

### Backend won't start

- Make sure Python virtual environment is activated
- Check that all dependencies are installed: `pip install -r requirements.txt`
- Verify Python version: `python --version` (should be 3.10+)

### Frontend won't start

- Make sure Node.js is installed: `node --version` (should be 18+)
- Install dependencies: `cd frontend && npm install`
- Check if port 3000 is already in use

### Frontend can't connect to backend

- Verify backend is running on `http://localhost:8000`
- Check browser console for CORS errors
- Make sure `NEXT_PUBLIC_BACKEND_URL` is set correctly (defaults to `http://localhost:8000`)

### Electron issues

- Make sure both backend and frontend dependencies are installed
- Check that the venv path in `shell/main.js` is correct for your system
- On first run, Electron will create the backend process automatically

---

## Environment Variables

### Frontend

Create `frontend/.env.local` (optional):

```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
```

If not set, defaults to `http://localhost:8000`.

---

## First Run

On first run, the app will:
1. Create `~/.scriptboard/` directory
2. Create `~/.scriptboard/config.json` with defaults
3. Create `~/.scriptboard/sessions/` directory

You can customize settings by editing `~/.scriptboard/config.json`.

