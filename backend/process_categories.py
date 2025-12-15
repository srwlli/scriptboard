"""
Process Categories and Descriptions

Maps process names to categories, descriptions, and icons for the System Monitor v2.
Extensible via JSON config in future versions.
"""

from enum import Enum
from typing import Optional
from dataclasses import dataclass


class ProcessCategory(str, Enum):
    """Process category enumeration."""
    BROWSER = "browser"
    DEV_TOOLS = "dev"
    SYSTEM = "system"
    APP = "app"
    MEDIA = "media"
    COMMUNICATION = "communication"
    SECURITY = "security"
    OTHER = "other"


@dataclass
class ProcessInfo:
    """Extended process information."""
    category: ProcessCategory
    description: str
    icon: str


# Process name to category/description mapping
# Keys are lowercase process names (without .exe)
PROCESS_MAP: dict[str, ProcessInfo] = {
    # Browsers
    "chrome": ProcessInfo(ProcessCategory.BROWSER, "Google Chrome web browser", "🌐"),
    "firefox": ProcessInfo(ProcessCategory.BROWSER, "Mozilla Firefox web browser", "🦊"),
    "msedge": ProcessInfo(ProcessCategory.BROWSER, "Microsoft Edge web browser", "🔷"),
    "opera": ProcessInfo(ProcessCategory.BROWSER, "Opera web browser", "🔴"),
    "brave": ProcessInfo(ProcessCategory.BROWSER, "Brave privacy browser", "🦁"),
    "vivaldi": ProcessInfo(ProcessCategory.BROWSER, "Vivaldi web browser", "🎨"),
    "iexplore": ProcessInfo(ProcessCategory.BROWSER, "Internet Explorer (legacy)", "🌐"),
    "chromium": ProcessInfo(ProcessCategory.BROWSER, "Chromium browser", "🌐"),

    # Dev Tools
    "code": ProcessInfo(ProcessCategory.DEV_TOOLS, "Visual Studio Code editor", "📝"),
    "devenv": ProcessInfo(ProcessCategory.DEV_TOOLS, "Visual Studio IDE", "🔷"),
    "python": ProcessInfo(ProcessCategory.DEV_TOOLS, "Python interpreter", "🐍"),
    "pythonw": ProcessInfo(ProcessCategory.DEV_TOOLS, "Python (windowed)", "🐍"),
    "node": ProcessInfo(ProcessCategory.DEV_TOOLS, "Node.js runtime", "📦"),
    "npm": ProcessInfo(ProcessCategory.DEV_TOOLS, "Node package manager", "📦"),
    "git": ProcessInfo(ProcessCategory.DEV_TOOLS, "Git version control", "🔀"),
    "powershell": ProcessInfo(ProcessCategory.DEV_TOOLS, "PowerShell terminal", "💻"),
    "cmd": ProcessInfo(ProcessCategory.DEV_TOOLS, "Command Prompt", "💻"),
    "windowsterminal": ProcessInfo(ProcessCategory.DEV_TOOLS, "Windows Terminal", "💻"),
    "wt": ProcessInfo(ProcessCategory.DEV_TOOLS, "Windows Terminal", "💻"),
    "java": ProcessInfo(ProcessCategory.DEV_TOOLS, "Java runtime", "☕"),
    "javaw": ProcessInfo(ProcessCategory.DEV_TOOLS, "Java (windowed)", "☕"),
    "docker": ProcessInfo(ProcessCategory.DEV_TOOLS, "Docker container engine", "🐳"),
    "docker-compose": ProcessInfo(ProcessCategory.DEV_TOOLS, "Docker Compose", "🐳"),
    "kubectl": ProcessInfo(ProcessCategory.DEV_TOOLS, "Kubernetes CLI", "☸️"),
    "dotnet": ProcessInfo(ProcessCategory.DEV_TOOLS, ".NET runtime", "🔵"),
    "msbuild": ProcessInfo(ProcessCategory.DEV_TOOLS, "MSBuild compiler", "🔨"),
    "rustc": ProcessInfo(ProcessCategory.DEV_TOOLS, "Rust compiler", "🦀"),
    "cargo": ProcessInfo(ProcessCategory.DEV_TOOLS, "Rust package manager", "🦀"),
    "go": ProcessInfo(ProcessCategory.DEV_TOOLS, "Go runtime", "🐹"),
    "ruby": ProcessInfo(ProcessCategory.DEV_TOOLS, "Ruby interpreter", "💎"),
    "php": ProcessInfo(ProcessCategory.DEV_TOOLS, "PHP interpreter", "🐘"),
    "electron": ProcessInfo(ProcessCategory.DEV_TOOLS, "Electron framework", "⚡"),
    "sublime_text": ProcessInfo(ProcessCategory.DEV_TOOLS, "Sublime Text editor", "📝"),
    "notepad++": ProcessInfo(ProcessCategory.DEV_TOOLS, "Notepad++ editor", "📝"),
    "idea64": ProcessInfo(ProcessCategory.DEV_TOOLS, "IntelliJ IDEA", "🧠"),
    "pycharm64": ProcessInfo(ProcessCategory.DEV_TOOLS, "PyCharm IDE", "🐍"),
    "webstorm64": ProcessInfo(ProcessCategory.DEV_TOOLS, "WebStorm IDE", "🌐"),
    "datagrip64": ProcessInfo(ProcessCategory.DEV_TOOLS, "DataGrip database IDE", "🗄️"),
    "rider64": ProcessInfo(ProcessCategory.DEV_TOOLS, "Rider .NET IDE", "🏇"),
    "clion64": ProcessInfo(ProcessCategory.DEV_TOOLS, "CLion C++ IDE", "🔧"),
    "goland64": ProcessInfo(ProcessCategory.DEV_TOOLS, "GoLand Go IDE", "🐹"),
    "rubymine64": ProcessInfo(ProcessCategory.DEV_TOOLS, "RubyMine IDE", "💎"),
    "phpstorm64": ProcessInfo(ProcessCategory.DEV_TOOLS, "PhpStorm IDE", "🐘"),
    "androidstudio64": ProcessInfo(ProcessCategory.DEV_TOOLS, "Android Studio", "🤖"),

    # Scriptboard (our app)
    "scriptboard": ProcessInfo(ProcessCategory.DEV_TOOLS, "Scriptboard clipboard companion", "📋"),
    "uvicorn": ProcessInfo(ProcessCategory.DEV_TOOLS, "Uvicorn ASGI server", "⚡"),
    "gunicorn": ProcessInfo(ProcessCategory.DEV_TOOLS, "Gunicorn WSGI server", "🦄"),

    # System processes
    "explorer": ProcessInfo(ProcessCategory.SYSTEM, "Windows Explorer shell", "📁"),
    "svchost": ProcessInfo(ProcessCategory.SYSTEM, "Windows Service Host", "⚙️"),
    "csrss": ProcessInfo(ProcessCategory.SYSTEM, "Client Server Runtime", "⚙️"),
    "wininit": ProcessInfo(ProcessCategory.SYSTEM, "Windows Initialization", "⚙️"),
    "services": ProcessInfo(ProcessCategory.SYSTEM, "Service Control Manager", "⚙️"),
    "lsass": ProcessInfo(ProcessCategory.SYSTEM, "Local Security Authority", "🔐"),
    "smss": ProcessInfo(ProcessCategory.SYSTEM, "Session Manager", "⚙️"),
    "winlogon": ProcessInfo(ProcessCategory.SYSTEM, "Windows Logon", "🔑"),
    "dwm": ProcessInfo(ProcessCategory.SYSTEM, "Desktop Window Manager", "🖼️"),
    "taskhostw": ProcessInfo(ProcessCategory.SYSTEM, "Task Host Window", "⚙️"),
    "runtimebroker": ProcessInfo(ProcessCategory.SYSTEM, "Runtime Broker", "⚙️"),
    "searchhost": ProcessInfo(ProcessCategory.SYSTEM, "Windows Search", "🔍"),
    "searchindexer": ProcessInfo(ProcessCategory.SYSTEM, "Search Indexer", "🔍"),
    "sihost": ProcessInfo(ProcessCategory.SYSTEM, "Shell Infrastructure Host", "⚙️"),
    "fontdrvhost": ProcessInfo(ProcessCategory.SYSTEM, "Font Driver Host", "🔤"),
    "ctfmon": ProcessInfo(ProcessCategory.SYSTEM, "CTF Loader (text input)", "⌨️"),
    "dllhost": ProcessInfo(ProcessCategory.SYSTEM, "COM Surrogate", "⚙️"),
    "conhost": ProcessInfo(ProcessCategory.SYSTEM, "Console Window Host", "💻"),
    "audiodg": ProcessInfo(ProcessCategory.SYSTEM, "Windows Audio Device Graph", "🔊"),
    "spoolsv": ProcessInfo(ProcessCategory.SYSTEM, "Print Spooler", "🖨️"),
    "wuauserv": ProcessInfo(ProcessCategory.SYSTEM, "Windows Update", "🔄"),
    "msiexec": ProcessInfo(ProcessCategory.SYSTEM, "Windows Installer", "📦"),
    "taskmgr": ProcessInfo(ProcessCategory.SYSTEM, "Task Manager", "📊"),
    "systemsettings": ProcessInfo(ProcessCategory.SYSTEM, "Windows Settings", "⚙️"),
    "settingshandlers_storagepolicies": ProcessInfo(ProcessCategory.SYSTEM, "Storage Settings", "💾"),
    "registry": ProcessInfo(ProcessCategory.SYSTEM, "Registry Editor", "🗄️"),
    "regedit": ProcessInfo(ProcessCategory.SYSTEM, "Registry Editor", "🗄️"),
    "mmc": ProcessInfo(ProcessCategory.SYSTEM, "Management Console", "🛠️"),
    "perfmon": ProcessInfo(ProcessCategory.SYSTEM, "Performance Monitor", "📈"),
    "eventvwr": ProcessInfo(ProcessCategory.SYSTEM, "Event Viewer", "📋"),

    # Security
    "msmpeng": ProcessInfo(ProcessCategory.SECURITY, "Windows Defender Antivirus", "🛡️"),
    "securityhealthservice": ProcessInfo(ProcessCategory.SECURITY, "Windows Security", "🛡️"),
    "msseces": ProcessInfo(ProcessCategory.SECURITY, "Microsoft Security Essentials", "🛡️"),
    "avp": ProcessInfo(ProcessCategory.SECURITY, "Kaspersky Antivirus", "🛡️"),
    "avgnt": ProcessInfo(ProcessCategory.SECURITY, "Avira Antivirus", "🛡️"),
    "mbam": ProcessInfo(ProcessCategory.SECURITY, "Malwarebytes", "🛡️"),
    "norton": ProcessInfo(ProcessCategory.SECURITY, "Norton Security", "🛡️"),

    # Media
    "spotify": ProcessInfo(ProcessCategory.MEDIA, "Spotify music player", "🎵"),
    "vlc": ProcessInfo(ProcessCategory.MEDIA, "VLC media player", "🎬"),
    "mpc-hc64": ProcessInfo(ProcessCategory.MEDIA, "Media Player Classic", "🎬"),
    "wmplayer": ProcessInfo(ProcessCategory.MEDIA, "Windows Media Player", "🎬"),
    "itunes": ProcessInfo(ProcessCategory.MEDIA, "Apple iTunes", "🎵"),
    "audacity": ProcessInfo(ProcessCategory.MEDIA, "Audacity audio editor", "🎧"),
    "obs64": ProcessInfo(ProcessCategory.MEDIA, "OBS Studio", "📹"),
    "obs": ProcessInfo(ProcessCategory.MEDIA, "OBS Studio", "📹"),
    "handbrake": ProcessInfo(ProcessCategory.MEDIA, "HandBrake video encoder", "🎬"),
    "photos": ProcessInfo(ProcessCategory.MEDIA, "Windows Photos", "🖼️"),
    "photoshop": ProcessInfo(ProcessCategory.MEDIA, "Adobe Photoshop", "🎨"),
    "illustrator": ProcessInfo(ProcessCategory.MEDIA, "Adobe Illustrator", "🎨"),
    "premiere": ProcessInfo(ProcessCategory.MEDIA, "Adobe Premiere Pro", "🎬"),
    "afterfx": ProcessInfo(ProcessCategory.MEDIA, "Adobe After Effects", "✨"),
    "lightroom": ProcessInfo(ProcessCategory.MEDIA, "Adobe Lightroom", "📷"),
    "figma": ProcessInfo(ProcessCategory.MEDIA, "Figma design tool", "🎨"),
    "gimp-2.10": ProcessInfo(ProcessCategory.MEDIA, "GIMP image editor", "🎨"),
    "inkscape": ProcessInfo(ProcessCategory.MEDIA, "Inkscape vector editor", "🖌️"),
    "blender": ProcessInfo(ProcessCategory.MEDIA, "Blender 3D", "🎲"),

    # Communication
    "discord": ProcessInfo(ProcessCategory.COMMUNICATION, "Discord chat", "💬"),
    "slack": ProcessInfo(ProcessCategory.COMMUNICATION, "Slack workspace", "💬"),
    "teams": ProcessInfo(ProcessCategory.COMMUNICATION, "Microsoft Teams", "👥"),
    "zoom": ProcessInfo(ProcessCategory.COMMUNICATION, "Zoom video meetings", "📹"),
    "skype": ProcessInfo(ProcessCategory.COMMUNICATION, "Skype", "📞"),
    "telegram": ProcessInfo(ProcessCategory.COMMUNICATION, "Telegram messenger", "✈️"),
    "signal": ProcessInfo(ProcessCategory.COMMUNICATION, "Signal messenger", "🔒"),
    "whatsapp": ProcessInfo(ProcessCategory.COMMUNICATION, "WhatsApp", "💬"),
    "outlook": ProcessInfo(ProcessCategory.COMMUNICATION, "Microsoft Outlook", "📧"),
    "thunderbird": ProcessInfo(ProcessCategory.COMMUNICATION, "Mozilla Thunderbird", "📧"),

    # Apps
    "explorer": ProcessInfo(ProcessCategory.APP, "File Explorer", "📁"),
    "notepad": ProcessInfo(ProcessCategory.APP, "Notepad", "📝"),
    "wordpad": ProcessInfo(ProcessCategory.APP, "WordPad", "📝"),
    "calc": ProcessInfo(ProcessCategory.APP, "Calculator", "🧮"),
    "mspaint": ProcessInfo(ProcessCategory.APP, "Paint", "🎨"),
    "snippingtool": ProcessInfo(ProcessCategory.APP, "Snipping Tool", "✂️"),
    "winword": ProcessInfo(ProcessCategory.APP, "Microsoft Word", "📄"),
    "excel": ProcessInfo(ProcessCategory.APP, "Microsoft Excel", "📊"),
    "powerpnt": ProcessInfo(ProcessCategory.APP, "Microsoft PowerPoint", "📽️"),
    "onenote": ProcessInfo(ProcessCategory.APP, "Microsoft OneNote", "📓"),
    "acrobat": ProcessInfo(ProcessCategory.APP, "Adobe Acrobat", "📕"),
    "acrord32": ProcessInfo(ProcessCategory.APP, "Adobe Reader", "📕"),
    "foxitreader": ProcessInfo(ProcessCategory.APP, "Foxit Reader", "📕"),
    "1password": ProcessInfo(ProcessCategory.APP, "1Password", "🔐"),
    "keepass": ProcessInfo(ProcessCategory.APP, "KeePass", "🔐"),
    "bitwarden": ProcessInfo(ProcessCategory.APP, "Bitwarden", "🔐"),
    "steam": ProcessInfo(ProcessCategory.APP, "Steam gaming platform", "🎮"),
    "epicgameslauncher": ProcessInfo(ProcessCategory.APP, "Epic Games Launcher", "🎮"),
    "origin": ProcessInfo(ProcessCategory.APP, "EA Origin", "🎮"),
    "battle.net": ProcessInfo(ProcessCategory.APP, "Battle.net", "🎮"),
    "7zfm": ProcessInfo(ProcessCategory.APP, "7-Zip File Manager", "📦"),
    "winrar": ProcessInfo(ProcessCategory.APP, "WinRAR", "📦"),
    "filezilla": ProcessInfo(ProcessCategory.APP, "FileZilla FTP client", "📂"),
    "dropbox": ProcessInfo(ProcessCategory.APP, "Dropbox sync", "☁️"),
    "onedrive": ProcessInfo(ProcessCategory.APP, "Microsoft OneDrive", "☁️"),
    "googledrive": ProcessInfo(ProcessCategory.APP, "Google Drive", "☁️"),
}

# Category icons for grouping
CATEGORY_ICONS: dict[ProcessCategory, str] = {
    ProcessCategory.BROWSER: "🌐",
    ProcessCategory.DEV_TOOLS: "🛠️",
    ProcessCategory.SYSTEM: "⚙️",
    ProcessCategory.APP: "📱",
    ProcessCategory.MEDIA: "🎬",
    ProcessCategory.COMMUNICATION: "💬",
    ProcessCategory.SECURITY: "🛡️",
    ProcessCategory.OTHER: "❓",
}

# Category display names
CATEGORY_NAMES: dict[ProcessCategory, str] = {
    ProcessCategory.BROWSER: "Browsers",
    ProcessCategory.DEV_TOOLS: "Dev Tools",
    ProcessCategory.SYSTEM: "System",
    ProcessCategory.APP: "Applications",
    ProcessCategory.MEDIA: "Media",
    ProcessCategory.COMMUNICATION: "Communication",
    ProcessCategory.SECURITY: "Security",
    ProcessCategory.OTHER: "Other",
}


def normalize_process_name(name: str) -> str:
    """Normalize process name for lookup."""
    # Remove .exe extension and convert to lowercase
    name = name.lower()
    if name.endswith(".exe"):
        name = name[:-4]
    return name


def get_process_info(name: str) -> ProcessInfo:
    """
    Get category, description, and icon for a process.

    Args:
        name: Process name (with or without .exe)

    Returns:
        ProcessInfo with category, description, and icon
    """
    normalized = normalize_process_name(name)

    if normalized in PROCESS_MAP:
        return PROCESS_MAP[normalized]

    # Default for unknown processes
    return ProcessInfo(
        category=ProcessCategory.OTHER,
        description=f"{name} process",
        icon="❓"
    )


def get_category_icon(category: ProcessCategory) -> str:
    """Get icon for a category."""
    return CATEGORY_ICONS.get(category, "❓")


def get_category_name(category: ProcessCategory) -> str:
    """Get display name for a category."""
    return CATEGORY_NAMES.get(category, "Other")


def categorize_processes(process_names: list[str]) -> dict[ProcessCategory, list[str]]:
    """
    Group process names by category.

    Args:
        process_names: List of process names

    Returns:
        Dictionary mapping categories to lists of process names
    """
    result: dict[ProcessCategory, list[str]] = {cat: [] for cat in ProcessCategory}

    for name in process_names:
        info = get_process_info(name)
        result[info.category].append(name)

    return result


# Protected process names that should never be killed
PROTECTED_PROCESS_NAMES = {
    "system", "csrss", "wininit", "smss", "services",
    "lsass", "svchost", "explorer", "winlogon", "dwm",
    "scriptboard", "scriptboard-backend", "uvicorn",
}

# Scores by category:
# 0-10: Protected (system-critical)
# 10-30: Services (important system services)
# 30-50: System (system utilities, can usually restart)
# 50-70: Dev (development tools, safe but might lose work)
# 70-90: Apps (user applications, generally safe)
# 90-100: Unknown (other processes, safest to kill)
CATEGORY_SAFETY_SCORES: dict[ProcessCategory, tuple[int, str]] = {
    ProcessCategory.SYSTEM: (20, "System process - killing may cause instability"),
    ProcessCategory.SECURITY: (25, "Security software - killing may leave system vulnerable"),
    ProcessCategory.DEV_TOOLS: (60, "Development tool - may lose unsaved work"),
    ProcessCategory.BROWSER: (75, "Browser - may lose open tabs/work"),
    ProcessCategory.COMMUNICATION: (80, "Communication app - safe to close"),
    ProcessCategory.MEDIA: (85, "Media app - safe to close"),
    ProcessCategory.APP: (85, "Application - safe to close"),
    ProcessCategory.OTHER: (90, "Unknown process - generally safe to close"),
}


def get_safety_score(name: str, is_protected: bool, category: ProcessCategory) -> tuple[int, str]:
    """
    Calculate safe-to-kill score for a process.

    Args:
        name: Process name
        is_protected: Whether process is in protected list
        category: Process category

    Returns:
        Tuple of (score 0-100, reason string)
        Lower score = more dangerous to kill
    """
    normalized = normalize_process_name(name)

    # Protected processes get lowest score
    if is_protected or normalized in PROTECTED_PROCESS_NAMES:
        return (5, "Protected system process - DO NOT KILL")

    # Check for specific critical processes
    if normalized in {"lsass", "csrss", "smss", "wininit", "services", "winlogon"}:
        return (0, "Critical Windows process - killing will crash system")

    if normalized == "dwm":
        return (10, "Desktop Window Manager - killing will break display")

    if normalized in {"svchost", "dllhost", "runtimebroker"}:
        return (15, "Windows service host - killing may break features")

    # Category-based scoring
    if category in CATEGORY_SAFETY_SCORES:
        score, reason = CATEGORY_SAFETY_SCORES[category]
        return (score, reason)

    # Default for unknown
    return (90, "Unknown process - generally safe to close")
