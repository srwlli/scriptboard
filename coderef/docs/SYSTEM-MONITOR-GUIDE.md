# System Monitor - Complete Guide

> A beginner-friendly guide to understanding and using the System Monitor feature.

---

## What is System Monitor?

System Monitor is like Task Manager on steroids. It shows you all the programs (called "processes") running on your computer, how much power they're using, and lets you close them if needed.

**Think of it like this:** Your computer is a busy office. System Monitor lets you see every worker (process), what they're doing, and fire anyone who's slacking off or causing trouble.

---

## The Main Screen

When you open System Monitor, you'll see a list of all running processes. Each row shows:

| Column | What It Means |
|--------|---------------|
| **Name** | The program's name (like "Chrome" or "Spotify") |
| **CPU %** | How much brain power it's using (0-100%) |
| **Memory** | How much RAM it's eating (shown in MB or GB) |
| **Sparkline** | A tiny graph showing CPU history over time |
| **Kill Button** | Click to force-close the program |

### The Mini Graphs (Sparklines)

Those tiny line graphs next to each process show you the CPU usage history.

- **Flat line at bottom** = The program is idle, doing nothing
- **Spiky line** = The program is busy, working hard
- **Line at the top** = The program is hogging your CPU!

---

## Quick Filters - Finding What You Need

At the top of the screen, you'll see a row of filter buttons. These help you find specific types of programs quickly.

### Category Filters

| Filter | What It Shows | Examples |
|--------|---------------|----------|
| **All** | Everything running | All processes |
| **Apps** | Regular programs you use | Notepad, Calculator |
| **Browsers** | Web browsers | Chrome, Firefox, Edge |
| **Dev** | Programming tools | VS Code, Node.js, Python |
| **System** | Windows background stuff | svchost, dwm, explorer |
| **Media** | Music and video apps | Spotify, VLC, Netflix |
| **Chat** | Communication apps | Discord, Slack, Teams |
| **Security** | Antivirus and firewalls | Windows Defender |

### Special Filters

| Filter | What It Shows | Why It's Useful |
|--------|---------------|-----------------|
| **High CPU** | Programs using lots of CPU | Find what's making your computer slow |
| **High Memory** | Programs using lots of RAM | Find memory hogs |
| **Network** | Programs using the internet | See what's downloading/uploading |
| **Safe to Kill** | Programs safe to close | Quickly free up resources |
| **Startup** | Programs that run at boot | Speed up your computer startup |
| **Recent** | Recently started programs | Find newly launched apps |

**Pro Tip:** Click a filter button, and the number badge shows how many matches there are.

---

## View Modes

You can switch between two ways of viewing the process list:

### List View (Default)
Shows all processes in a simple list. Good for:
- Quickly scanning everything
- Sorting by CPU or Memory
- Finding a specific process

### Grouped View
Organizes processes by category (Apps, Browsers, System, etc.). Good for:
- Understanding what types of things are running
- Finding all processes of one type
- Cleaner organization

**How to switch:** Look for the view toggle buttons at the top of the process list.

---

## Understanding the Kill Button Colors

The kill button (X) next to each process is color-coded to help you know what's safe to close:

### Green = Safe to Kill
**What it means:** You can close this without any problems. It's a regular app that won't affect your system.

**Examples:** Chrome, Spotify, Notepad, games

### Yellow = Use Caution
**What it means:** This might be important. Closing it could affect other programs or lose unsaved work.

**Examples:** Development tools, background services for apps you use

### Red = Dangerous
**What it means:** DO NOT close unless you know exactly what you're doing. This could crash your computer or cause data loss.

**Examples:** Windows system processes, security software, drivers

**The Rule:** If it's red, leave it alone. If it's yellow, think twice. If it's green, go for it.

---

## Network Panel

The Network Panel shows you what programs are using your internet connection.

### Connections Tab
Shows active internet connections:
- **Local Address** - Your computer's connection point
- **Remote Address** - The server it's talking to
- **Status** - Connected, waiting, etc.
- **Process** - Which program owns this connection

**What this means:** If you see a program you don't recognize making lots of connections, it might be suspicious.

### Listening Ports Tab
Shows which programs are waiting for incoming connections:
- **Port** - The "door number" being used (like port 80 for web)
- **Process** - Which program is listening
- **Address** - What network interface

**What this means:** If a program is listening on a port and you didn't expect it to, investigate.

---

## Disk Usage Panel

The Disk Panel shows how full your hard drives are and helps find what's taking up space.

### Drive Overview
Shows each drive (C:, D:, etc.) with:
- **Usage bar** - Visual of how full it is
- **Percentage** - Exact % used
- **Free space** - How much room is left

**Color codes:**
- **Green** = Plenty of space (under 50%)
- **Yellow** = Getting full (50-75%)
- **Orange** = Running low (75-90%)
- **Red** = Almost full (over 90%) - Free up space soon!

### Folder Scanner
Click "Scan" to find the biggest folders:
1. Pick a drive or folder to scan
2. Click "Scan" and wait (this takes a while for large drives)
3. See which folders are hogging space
4. Click a folder to drill down deeper

**Warning:** Scanning is slow because it has to check every file. Be patient.

---

## Tips & Tricks

### Finding What's Slowing Your Computer
1. Click the **High CPU** filter
2. Look for anything using more than 20% consistently
3. If it's green, you can safely close it
4. If it's a browser, try closing some tabs

### Freeing Up Memory
1. Click the **High Memory** filter
2. Look for apps using more than 500 MB
3. Close apps you're not actively using
4. Restart memory-hungry apps like browsers

### Checking for Suspicious Programs
1. Click the **Network** filter
2. Look for unfamiliar program names
3. Check the Connections tab for weird addresses
4. If something looks wrong, Google the process name

### Speeding Up Startup
1. Click the **Startup** filter
2. See which programs start automatically
3. Decide which ones you actually need at startup
4. (To disable them, use Windows Task Manager's Startup tab)

### Finding Recently Started Programs
1. Click the **Recent** filter
2. See what started in the last few minutes
3. Useful for finding programs that just auto-started

---

## Common Questions

### "What's svchost.exe?"
Windows uses many svchost processes to run background services. They're normal. Don't close them.

### "Why are there so many Chrome processes?"
Chrome runs each tab as a separate process for stability. If one tab crashes, the others survive. This is normal.

### "Something is using 100% CPU!"
1. Check if it's a legitimate app doing heavy work (like video editing)
2. If it's something you don't recognize, try closing it (if green/yellow)
3. If it's red (system process), restart your computer instead

### "Can I close everything that's yellow?"
Technically yes, but you might lose unsaved work or affect other programs. Only close what you don't need.

### "The kill button didn't work"
Some processes are protected or need admin rights to close. Try right-clicking the app in your taskbar instead.

---

## Technical Reference

For developers who want to understand the code:

**Main Component:** `ProcessListV2.tsx`
**Quick Filters:** `QuickFilters.tsx`
**Process Row:** `ProcessRow.tsx`
**Network Panel:** `NetworkPanel.tsx`
**Disk Panel:** `DiskUsagePanel.tsx`

**Backend Endpoints:**
- `GET /system/processes` - Basic process list
- `GET /system/processes/detailed` - Full process info
- `POST /system/processes/kill/{pid}` - Kill a process
- `GET /system/network/connections` - Active connections
- `GET /system/network/listening` - Listening ports
- `GET /system/disk/usage` - Drive usage
- `GET /system/disk/largest` - Largest folders
- `GET /system/startup-apps` - Startup programs

---

*Last updated: December 2024*
