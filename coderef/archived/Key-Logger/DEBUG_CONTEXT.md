# Key-Logger Feature - Debug Context

## Problem Summary

**Error 1:** `409 Conflict` when calling `POST /macros/record/start`
**Error 2:** `pynput is required for keyboard recording`

## Error Details

### Error Messages
```
API Error: POST http://localhost:8000/macros/record/start - Status: 409
Failed to start recording: {}
```

```
pynput is required for keyboard recording
```

## File Locations

### Backend Files

1. **Key Logger Module**
   - Location: `backend/key_logger.py`
   - Purpose: Core recording functionality with keyboard hooks and clipboard monitoring
   - Key Class: `KeyLogger`
   - Key Methods:
     - `start_recording()` - Lines 302-335
     - `stop_recording()` - Lines 337-372
     - `_on_key_press()` - Lines 150-159
     - `_on_key_release()` - Lines 161-170
     - `_check_clipboard_change()` - Lines 250-264

2. **API Endpoints**
   - Location: `backend/api.py`
   - Macro Endpoints: Lines 1434-1562
     - `POST /macros/record/start` - Line 1438
     - `POST /macros/record/stop` - Line 1462
     - `POST /macros/save` - Line 1497
   - KeyLogger Initialization: Lines 42-47
     ```python
     try:
         from key_logger import KeyLogger
         key_logger = KeyLogger()
     except ImportError:
         key_logger = None
     ```

3. **Pydantic Schemas**
   - Location: `backend/schemas.py`
   - Macro Models: Lines 369-413
     - `MacroEventType` - Line 369
     - `MacroEvent` - Line 375
     - `Macro` - Line 388
     - `MacroSavePayload` - Line 395
     - `MacroRecordResponse` - Line 407

4. **Dependencies**
   - Location: `backend/requirements.txt`
   - Added Dependencies: Lines 9-10
     ```
     pynput>=1.7.6
     pyperclip>=1.8.2
     ```

### Frontend Files

1. **KeyLogPanel Component**
   - Location: `frontend/src/components/KeyLogPanel.tsx`
   - Purpose: UI component for macro recording
   - Key Functions:
     - `handleStartRecording()` - Lines 26-39
     - `handleStopRecording()` - Lines 41-60
     - `handleSaveMacro()` - Lines 62-82

2. **API Client**
   - Location: `frontend/src/lib/api.ts`
   - Macro Methods: Lines 372-390
     - `startRecording()` - Line 372
     - `stopRecording()` - Line 377
     - `saveMacro()` - Line 383

3. **Page Integration**
   - Location: `frontend/app/new-page/page.tsx`
   - KeyLogPanel Import: Line 15
   - KeyLogPanel Usage: Line 54

### Test Files

1. **Unit Tests**
   - Location: `backend/tests/test_key_logger.py`
   - Tests for KeyLogger class functionality

2. **Integration Tests**
   - Location: `backend/tests/test_macro_api.py`
   - Tests for API endpoints

## Implementation Details

### Key Logger Initialization Flow

1. **Module Import** (`backend/api.py:42-47`)
   ```python
   try:
       from key_logger import KeyLogger
       key_logger = KeyLogger()
   except ImportError:
       key_logger = None
   ```

2. **Dependency Check** (`backend/key_logger.py:16-27`)
   ```python
   try:
       from pynput import keyboard
       from pynput.keyboard import Key, Listener
   except ImportError:
       keyboard = None
       Key = None
       Listener = None
   ```

3. **Start Recording Validation** (`backend/key_logger.py:309-316`)
   ```python
   if self._recording:
       raise RuntimeError("Already recording")
   
   if keyboard is None or Listener is None:
       raise RuntimeError("pynput is required for keyboard recording")
   
   if pyperclip is None:
       raise RuntimeError("pyperclip is required for clipboard monitoring")
   ```

### Error Handling

**API Endpoint** (`backend/api.py:1447-1459`)
```python
try:
    key_logger.start_recording()
    return MacroRecordResponse(status="recording")
except RuntimeError as e:
    raise HTTPException(
        status_code=status.HTTP_409_CONFLICT,
        detail=str(e)
    )
```

## Current Status

### Dependencies Installation
- ✅ `pynput>=1.7.6` installed in virtual environment
- ✅ `pyperclip>=1.8.2` installed in virtual environment
- ✅ Verified installation: `backend\venv\Scripts\python.exe -c "import pynput; import pyperclip"`

### Possible Issues

1. **Backend Server Not Using Virtual Environment**
   - The server might be running with system Python instead of venv Python
   - Check: Is the server started with `backend\venv\Scripts\python.exe -m uvicorn api:app`?

2. **Import Error at Module Load Time**
   - If `key_logger` is `None`, the endpoints return 503, not 409
   - 409 suggests `key_logger` exists but `start_recording()` raises RuntimeError

3. **Already Recording State**
   - If a previous recording wasn't properly stopped, `_recording` flag might be `True`
   - Check: Is there a way to reset the KeyLogger instance?

4. **Module Import Timing**
   - The import happens at module load time
   - If pynput wasn't available when the server started, `key_logger` would be `None`
   - But if it's `None`, we'd get 503, not 409

## Debugging Steps

### Step 1: Verify Server is Using Correct Python
```powershell
# Check which Python the server is using
# Should be: backend\venv\Scripts\python.exe
```

### Step 2: Check KeyLogger State
Add debug logging to `backend/api.py`:
```python
@app.post("/macros/record/start", response_model=MacroRecordResponse)
async def start_macro_recording():
    """Start recording keyboard and clipboard events."""
    print(f"DEBUG: key_logger is None: {key_logger is None}")
    if key_logger is not None:
        print(f"DEBUG: key_logger.is_recording(): {key_logger.is_recording()}")
        print(f"DEBUG: keyboard module: {key_logger._keyboard_listener}")
    
    if key_logger is None:
        raise HTTPException(...)
    
    try:
        key_logger.start_recording()
        ...
```

### Step 3: Check Import Status
Add debug logging to `backend/key_logger.py`:
```python
# At module level, after imports
print(f"DEBUG: keyboard is None: {keyboard is None}")
print(f"DEBUG: pyperclip is None: {pyperclip is None}")
```

### Step 4: Verify Virtual Environment
```powershell
# Activate venv and check imports
backend\venv\Scripts\activate
python -c "from key_logger import KeyLogger; logger = KeyLogger(); print('KeyLogger created successfully')"
```

### Step 5: Check for Stale Recording State
The KeyLogger instance is global and persists across requests. If a recording wasn't properly stopped, it might be stuck in recording state.

**Solution:** Add a reset method or check if we need to handle this case:
```python
# In api.py, before starting recording
if key_logger.is_recording():
    # Force stop any existing recording
    try:
        key_logger.stop_recording()
    except:
        pass
```

## Expected Behavior

1. **First Request:**
   - `POST /macros/record/start` → 200 OK, `{"status": "recording"}`
   - KeyLogger starts keyboard listener and clipboard monitoring

2. **During Recording:**
   - Keyboard events are captured
   - Clipboard changes are detected
   - Events stored in memory

3. **Stop Recording:**
   - `POST /macros/record/stop` → 200 OK, `{"status": "stopped", "events": [...]}`
   - Returns captured events

4. **Save Macro:**
   - `POST /macros/save` with name and events → 200 OK
   - Saves to `~/.scriptboard/macros/{name}_{id}.json`

## Related Files for Review

- `backend/key_logger.py` - Core recording logic
- `backend/api.py:1438-1459` - Start recording endpoint
- `backend/api.py:42-47` - KeyLogger initialization
- `frontend/src/components/KeyLogPanel.tsx:26-39` - Frontend start handler
- `frontend/src/lib/api.ts:372-376` - API client method

## Next Steps

1. Verify backend server is using virtual environment Python
2. Add debug logging to identify exact failure point
3. Check if KeyLogger instance is in unexpected state
4. Consider adding reset/cleanup mechanism for stuck recordings

