## Screenshot capture flow

### Sequential steps

- **1. User clicks capture button (popup)**
  - File: `src/popup/App.tsx`
  - Function `handleCapture`:
    - Queries the active tab using `chrome.tabs.query({ active: true, currentWindow: true })`.
    - Sends a message to the active tab content script:
      - `{ type: 'START_AREA_SELECTION' }`.
    - Closes the popup with `window.close()`.

- **2. Content script receives `START_AREA_SELECTION`**
  - File: `src/content/views/App.tsx`
  - `useEffect` registers `chrome.runtime.onMessage.addListener(handleMessage)`.
  - In `handleMessage`:
    - When `payload.type === 'START_AREA_SELECTION'`, it sets:
      - `isSelecting = true`.
    - This causes the React tree to render `ScreenSelectionOverlay` on top of the page.

- **3. User selects an area on the page**
  - File: `src/content/views/ScreenSelectionOverlay.tsx`
  - `ScreenSelectionOverlay`:
    - Listens to `onMouseDown`, `onMouseMove`, `onMouseUp` on a full-screen `div`.
    - On `mouseDown`:
      - Stores the starting point `{ x, y }` from `event.clientX / clientY`.
      - Initializes `selection = { x, y, width: 0, height: 0 }`.
      - Sets `isDragging = true`.
    - On `mouseMove`:
      - Updates a `cursorPosition` state for helper tooltip text.
      - If dragging:
        - Computes the current rectangle:
          - `x = min(startX, currentX)`
          - `y = min(startY, currentY)`
          - `width = |currentX - startX|`
          - `height = |currentY - startY|`
        - Updates `selection` with these values.
    - On `mouseUp`:
      - Sets `isDragging = false`.
      - If there is no meaningful selection (`width` or `height` too small):
        - Calls `onCancel()` which makes the content script hide the overlay.
      - Otherwise, calls `captureSelection()`.
    - `captureSelection`:
      - Reads the final `selection`.
      - Reads the current viewport size:
        - `viewportWidth = window.innerWidth`
        - `viewportHeight = window.innerHeight`
      - Calls `onSelectionComplete(selection, { width: viewportWidth, height: viewportHeight })`.

- **4. Content script requests a screenshot from the background**
  - Back in `src/content/views/App.tsx`, inside the JSX:
    - `ScreenSelectionOverlay` is rendered with:
      - `onCancel` → sets `isSelecting = false`.
      - `onSelectionComplete(selection, viewport)`:
        - Sets `isSelecting = false` (hides overlay).
        - Sends a runtime message:
          - `chrome.runtime.sendMessage({ type: 'REQUEST_CAPTURE_AFTER_SELECTION', selection, viewport })`.
  - This message goes to the background service worker.

- **5. Background service worker captures the visible tab**
  - File: `src/background/main.ts`
  - `chrome.runtime.onMessage.addListener` listens for messages.
  - When the message has `type === 'REQUEST_CAPTURE_AFTER_SELECTION'`:
    - Casts the message to `CaptureAfterSelectionMessage` to read:
      - `selection`
      - `viewport`
    - Calls `chrome.tabs.captureVisibleTab({ format: 'png' }, callback)`:
      - If an error exists: logs `chrome.runtime.lastError.message` and stops.
      - If `dataUrl` is missing: stops.
    - Queries the active tab with `chrome.tabs.query({ active: true, currentWindow: true })`.
    - For the active tab id, sends back a message:
      - `{ type: 'AREA_CAPTURE_READY', imageUrl: dataUrl, selection, viewport }`.

- **6. Content script receives full screenshot + selection**
  - Again in `src/content/views/App.tsx`, `handleMessage` handles:
    - When `payload.type === 'AREA_CAPTURE_READY'` and it includes a valid `imageUrl`, `selection` and `viewport`:
      - Stores the full screenshot in state:
        - `setOriginalScreenshotUrl(payload.imageUrl)`.
      - Calls `cropImageFromSelection(payload.imageUrl, payload.selection, payload.viewport)`:
        - This function:
          - Creates a new `Image()` and sets `img.src = imageUrl`.
          - On image `onload`:
            - Reads `naturalWidth` and `naturalHeight`.
            - Computes scale factors:
              - `scaleX = naturalWidth / viewport.width`
              - `scaleY = naturalHeight / viewport.height`
            - Maps viewport selection to image pixels:
              - `srcX = max(0, selection.x * scaleX)`
              - `srcY = max(0, selection.y * scaleY)`
              - `srcWidth = max(1, selection.width * scaleX)`
              - `srcHeight = max(1, selection.height * scaleY)`
            - Creates a canvas of size `srcWidth x srcHeight`.
            - Draws the cropped region onto the canvas:
              - `ctx.drawImage(img, srcX, srcY, srcWidth, srcHeight, 0, 0, canvas.width, canvas.height)`.
            - Resolves with `canvas.toDataURL('image/png')` (the cropped screenshot).
          - On `onerror`, rejects the promise with an error.
      - On successful crop:
        - `setScreenshotUrl(croppedUrl)` so the modal can open.

- **7. Modal displays full and cropped images**
  - File: `src/content/views/ScreenshotModal.tsx`
  - Rendered when `screenshotUrl` is not null:
    - Props:
      - `imageUrl` → main/cropped screenshot (selected area).
      - `originalImageUrl` → full screenshot (from `setOriginalScreenshotUrl`).
    - The modal:
      - Displays `imageUrl` as the main large image.
      - If `originalImageUrl` exists:
        - Shows a smaller preview in the bottom-right corner.
      - Handles close actions with `onClose` callback, which clears `screenshotUrl`.

### Flow chart (high level)

```mermaid
flowchart TD
    A[User clicks Capture in popup<br/>src/popup/App.tsx] --> B[Popup sends START_AREA_SELECTION<br/>to active tab and closes]
    B --> C[Content App receives START_AREA_SELECTION<br/>src/content/views/App.tsx]
    C --> D[Set isSelecting = true<br/>render ScreenSelectionOverlay]
    D --> E[User click-drags on page<br/>ScreenSelectionOverlay tracks selection]
    E --> F[Mouse up with valid selection]
    F --> G[Overlay calls onSelectionComplete(selection, viewport)]
    G --> H[Content App sends REQUEST_CAPTURE_AFTER_SELECTION<br/>to background]
    H --> I[Background receives request<br/>src/background/main.ts]
    I --> J[Background captureVisibleTab<br/>current viewport + scroll]
    J --> K[Background sends AREA_CAPTURE_READY<br/>with imageUrl + selection + viewport]
    K --> L[Content App receives AREA_CAPTURE_READY]
    L --> M[cropImageFromSelection(imageUrl, selection, viewport)]
    M --> N[Set originalScreenshotUrl & screenshotUrl]
    N --> O[Render ScreenshotModal<br/>full + cropped images]
``` 
