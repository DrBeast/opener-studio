---
name: Create Studio Page Implementation Plan
overview: ""
todos:
  - id: 932b1396-0a5b-4d3d-9ddf-bcfeecdc77b6
    content: Create /src/pages/Studio.tsx with three-panel resizable layout structure
    status: pending
  - id: 093ecb18-3f9e-42bf-b77c-83ca54099f54
    content: Create StudioContactCard component or inline contact card for left panel with name, role, company display
    status: pending
  - id: d8c53bab-546e-4e06-ad23-76bccc1fa324
    content: Implement contact selection logic with localStorage persistence and cross-tab synchronization
    status: pending
  - id: 65c3202b-be77-465e-9085-09499d04f891
    content: Build left panel with contacts list, selection handling, and Create Contact button
    status: pending
  - id: d5f87a74-fd73-4a07-8121-299f4755a051
    content: Integrate MessageGeneration component in center panel, remove overlay logic, ensure proper spacing
    status: pending
  - id: 8d2bd4fa-0fc9-4cca-8052-00be73b68353
    content: Integrate ContactPreview in right panel with empty state message when no contact selected
    status: pending
  - id: a5ecd8ad-bf15-482c-ab63-8d6279f20bdf
    content: Integrate AddContactModal with onSuccess callback that selects newly created contact
    status: pending
  - id: 4b392bf2-ee50-4f97-b378-c9bd4eea7c0c
    content: Add /studio route to App.tsx within ProtectedRoute section
    status: pending
  - id: d9b9cd04-9e18-4197-a9dd-8dea9dd2cfdf
    content: Create helper function to map Contact interface to ContactForMessage interface for MessageGeneration and ContactPreview
    status: pending
---

# Create Studio Page Implementation Plan

## Overview

Create a new `/studio` route with a three-panel horizontal layout using the resizable component. The page provides a workspace-style experience for crafting messages with contact management on the left, message generation in the center, and contact preview on the right.

## Files to Create/Modify

### 1. Create `/src/pages/Studio.tsx`

- New page component with three-panel layout
- Use `ResizablePanelGroup`, `ResizablePanel`, and `ResizableHandle` from `/src/components/ui/design-system/resizable.tsx`
- Manage contact selection state with localStorage persistence (key: `studio_selectedContactId`)
- Listen to storage events for cross-tab synchronization
- Integrate existing components:
  - `useContacts` hook for contact list
  - `MessageGeneration` component in center panel
  - `ContactPreview` component in right panel
  - `AddContactModal` for creating new contacts

### 2. Create `/src/components/ui/design-system/contactcard.tsx`

- Create ContactCard component following design system patterns (using forwardRef)
- Display: First name, Last name, Role, Company
- Show selected state when contact is active (visual highlight)
- Clickable to select contact
- Export from design-system index.tsx

### 3. Modify `/src/App.tsx`

- Add new route: `<Route path="/studio" element={<Studio />} />` within ProtectedRoute
- Import the new Studio component

## Implementation Details

### Left Panel - Contacts

- Display list of contacts from `useContacts` hook
- Show simplified contact cards with: name (first + last), role, company
- Highlight selected contact visually
- Show "+ Create Contact" button at bottom (or top if no contacts)
- Contact selection persisted to localStorage and synced across tabs
- When contact created via modal, automatically select it

### Center Panel - Workspace

- Always visible (no overlay/screen blocking)
- Display `MessageGeneration` component with:
  - `embedded={true}`
  - `disabled={!selectedContact}` (button locked when no contact)
  - `isOpen={true}`
  - Contact data mapped from selected contact to `ContactForMessage` interface
- Remove any logic that adds overlay/screen on top
- Add appropriate spacing/padding for clean layout

### Right Panel - Context

- Show `ContactPreview` when contact is selected
- Show guiding message when no contact selected: "Select a contact to preview their profile and craft an opener for them"
- Contact data mapped from selected contact

### State Management

- Selected contact ID stored in localStorage: `studio_selectedContactId`
- Listen to `storage` events to sync selection across browser tabs
- When contact changes, MessageGeneration automatically refreshes (uses contact_id in storageKey)
- Convert Contact interface to ContactForMessage interface when needed:
  ```typescript
  {
    contact_id: string;
    first_name: string;
    last_name: string;
    role: string;
    company_id?: string;
    current_company: string; // from company_name
    location: string;
    bio_summary: string;
    how_i_can_help: string;
    recent_activity_summary: string;
  }
  ```


### Component Integration

- `AddContactModal`: Pass `onSuccess` callback that:

  1. Refreshes contacts list
  2. Sets newly created contact as selected
  3. Saves to localStorage

- `MessageGeneration`: Remove disabled overlay logic, keep `disabled` prop for button state
- `ContactPreview`: Pass contact data matching its interface requirements

## Layout Structure

```
<ResizablePanelGroup direction="horizontal">
  <ResizablePanel defaultSize={25} minSize={20}>
    {/* Left: Contacts List */}
  </ResizablePanel>
  <ResizableHandle withHandle />
  <ResizablePanel defaultSize={50} minSize={30}>
    {/* Center: MessageGeneration */}
  </ResizablePanel>
  <ResizableHandle withHandle />
  <ResizablePanel defaultSize={25} minSize={20}>
    {/* Right: ContactPreview or empty state */}
  </ResizablePanel>
</ResizablePanelGroup>
```

## Key Behaviors

1. Default state: No contact selected on initial page load (unless restored from localStorage)
2. Contact selection persists across browser tabs via localStorage
3. MessageGeneration state already persists per contact via localStorage (uses contact_id in key)
4. When contact changes, MessageGeneration refreshes automatically (storageKey changes)
5. Add Contact modal: After creation, contact is automatically selected
6. Loading states: Show appropriate loading indicators while contacts are fetched

## Styling Notes

- Use existing design system components (PrimaryCard, CardContent, etc.)
- Follow spacing patterns from Pipeline.tsx
- Ensure resizable handles are visible and functional
- Left panel should scroll if contacts list is long
- Right panel should handle empty state gracefully