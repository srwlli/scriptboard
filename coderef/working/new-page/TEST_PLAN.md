# Manual Testing Plan for Classic Layout Page

## Test Environment Setup

1. **Start Backend:**
   ```powershell
   cd backend
   .\venv\Scripts\python.exe -m uvicorn api:app --host 127.0.0.1 --port 8000
   ```

2. **Start Frontend (if not using Electron):**
   ```powershell
   cd frontend
   npm run dev
   ```

3. **Start Electron App:**
   ```powershell
   cd shell
   .\start-scriptboard.bat
   ```

## Test Cases

### Navigation Tests (POST-IMP-005)

#### Test 1: Navigate to Classic Page
- [ ] Open Electron app
- [ ] Click "Classic" link in header
- [ ] Verify URL changes to `/new-page`
- [ ] Verify all sections are visible (Favorites, Prompt, Attachments, Responses, Management, Footer)

#### Test 2: Navigate Back to Modern
- [ ] From Classic page, click "Modern" link
- [ ] Verify URL changes to `/`
- [ ] Verify grid layout is displayed

#### Test 3: Navigation State Persistence
- [ ] Navigate to Classic page
- [ ] Reload page (F5)
- [ ] Verify still on Classic page
- [ ] Verify "Classic" link is highlighted

### Function Tests (POST-IMP-006)

#### Prompt Section Tests

**Test 4: Load Prompt**
- [ ] Click "Load" button
- [ ] Select a JSON file in file dialog
- [ ] Verify prompt is loaded
- [ ] Verify status shows file name

**Test 5: Paste Prompt**
- [ ] Copy text to clipboard
- [ ] Click "Paste" button
- [ ] Verify prompt is set
- [ ] Verify status shows "Clipboard"

**Test 6: View Prompt**
- [ ] With a prompt loaded, click "View" button
- [ ] Verify modal opens showing prompt content
- [ ] Close modal

**Test 7: Clear Prompt**
- [ ] With a prompt loaded, click "Clear" button
- [ ] Verify status shows "No prompt"
- [ ] Verify prompt is cleared

#### Attachments Section Tests

**Test 8: Load Attachment**
- [ ] Click "Load" button
- [ ] Select a text file
- [ ] Verify attachment is added
- [ ] Verify status shows attachment count and lines

**Test 9: Paste Attachment**
- [ ] Copy code/text to clipboard
- [ ] Click "Paste" button
- [ ] Verify attachment is added with auto-generated filename
- [ ] Verify status updates

**Test 10: View Attachments**
- [ ] With attachments loaded, click "View" button
- [ ] Verify modal opens showing attachment list
- [ ] Close modal

**Test 11: Clear Attachments**
- [ ] With attachments loaded, click "Clear" button
- [ ] Verify status shows "No attachments"
- [ ] Verify attachments are cleared

#### Responses Section Tests

**Test 12: Open LLMs**
- [ ] Click "LLMs" button
- [ ] Verify all configured LLM URLs open in new windows/tabs
- [ ] Verify button is clickable

**Test 13: Paste Response**
- [ ] Copy LLM response to clipboard
- [ ] Click "Paste" button
- [ ] Verify response is added
- [ ] Verify status shows response count and character total

**Test 14: View Responses**
- [ ] With responses loaded, click "View" button
- [ ] Verify modal opens showing responses
- [ ] Close modal

**Test 15: Clear Responses**
- [ ] With responses loaded, click "Clear" button
- [ ] Verify status shows "Responses: 0"
- [ ] Verify responses are cleared

#### Management Section Tests

**Test 16: Copy All**
- [ ] Load prompt, attachments, and responses
- [ ] Click "Copy All" button
- [ ] Verify JSON is copied to clipboard
- [ ] Paste clipboard and verify JSON structure is correct

**Test 17: Save As**
- [ ] Copy text to clipboard
- [ ] Click "Save As" button
- [ ] Select folder (Electron) or verify download (Browser)
- [ ] Verify file is saved

**Test 18: View Combined Preview**
- [ ] Load prompt, attachments, and responses
- [ ] Click "View" button
- [ ] Verify modal opens showing combined preview
- [ ] Verify all sections are included
- [ ] Close modal

**Test 19: Clear All** ⭐ (FIXED)
- [ ] Load prompt, attachments, and responses
- [ ] Click "Clear All" button
- [ ] Confirm in dialog
- [ ] **Verify all sections refresh:**
  - Prompt status shows "No prompt"
  - Attachments status shows "No attachments"
  - Responses status shows "Responses: 0"
  - Management status shows "Prompts: 0 | Attachments: 0 | Responses: 0"
- [ ] Verify character count in footer updates

#### Favorites Section Tests

**Test 20: Add Favorite**
- [ ] Click "Add+" button
- [ ] Select a folder
- [ ] Verify favorite is added (if API supports it)
- [ ] Verify button appears in favorites row

**Test 21: Open Favorite**
- [ ] Click a favorite button
- [ ] Verify folder opens in system file explorer (Electron)
- [ ] Or verify alert shows path (Browser)

**Test 22: Remove Favorite**
- [ ] Right-click a favorite button
- [ ] Confirm removal
- [ ] Verify favorite is removed

#### Footer Bar Tests

**Test 23: Status Message**
- [ ] Perform actions that show status messages
- [ ] Verify status appears in footer
- [ ] Verify status clears after timeout

**Test 24: Character Count**
- [ ] Add responses with content
- [ ] Verify character count updates in footer
- [ ] Clear responses
- [ ] Verify character count resets

**Test 25: Lock Size Toggle**
- [ ] Click "Lock Size" checkbox
- [ ] Verify container max-width is set
- [ ] Uncheck
- [ ] Verify max-width is removed

**Test 26: On Top Toggle**
- [ ] Click "On Top" checkbox
- [ ] Verify container position is sticky
- [ ] Uncheck
- [ ] Verify position is reset

**Test 27: Window Size Display**
- [ ] Toggle size display (if implemented)
- [ ] Verify window dimensions are shown
- [ ] Resize window
- [ ] Verify dimensions update

#### Toggleable Preview Tests

**Test 28: Toggle Preview**
- [ ] Find preview toggle mechanism
- [ ] Toggle preview on
- [ ] Verify preview panel appears
- [ ] Toggle preview off
- [ ] Verify preview panel hides

**Test 29: Preview Content**
- [ ] Load prompt, attachments, responses
- [ ] Show preview
- [ ] Verify preview shows combined content
- [ ] Verify content is truncated appropriately

### Integration Tests

**Test 30: Full Workflow**
- [ ] Load prompt from file
- [ ] Paste attachment from clipboard
- [ ] Paste response from clipboard
- [ ] View combined preview
- [ ] Copy all to clipboard
- [ ] Clear all
- [ ] Verify everything is cleared

**Test 31: Cross-Section Updates**
- [ ] Add prompt
- [ ] Verify management section count updates
- [ ] Add attachment
- [ ] Verify management section count updates
- [ ] Add response
- [ ] Verify management section count updates
- [ ] Clear all
- [ ] Verify all sections update correctly

### Error Handling Tests

**Test 32: Backend Offline**
- [ ] Stop backend server
- [ ] Try to paste prompt
- [ ] Verify error is handled gracefully
- [ ] Verify no console errors in production

**Test 33: Clipboard Permission Denied**
- [ ] Deny clipboard permission (if possible)
- [ ] Try to paste
- [ ] Verify user-friendly error message

**Test 34: File Too Large**
- [ ] Try to attach a file > 2MB
- [ ] Verify error message
- [ ] Verify file is not attached

## Test Results Template

```
Test #: [Number]
Status: [PASS/FAIL/SKIP]
Notes: [Any issues or observations]
```

## Known Issues to Verify Fixed

1. ✅ **Clear All Refresh** - Fixed with session-refresh event system
   - All sections now listen for refresh events
   - Clear All triggers refresh for all sections
   - Individual clear operations also trigger refresh

## Completion Criteria

- [ ] All navigation tests pass
- [ ] All function tests pass
- [ ] All integration tests pass
- [ ] Error handling works correctly
- [ ] No console errors in production mode
- [ ] All sections refresh correctly after Clear All

