<!-- 2ef1574a-d610-4a66-9d7f-de378fa28e36 63027629-e116-4a07-bf36-45cac498ca93 -->
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

### To-dos

- [ ] Create /src/pages/Studio.tsx with three-panel resizable layout structure
- [ ] Create StudioContactCard component or inline contact card for left panel with name, role, company display
- [ ] Implement contact selection logic with localStorage persistence and cross-tab synchronization
- [ ] Build left panel with contacts list, selection handling, and Create Contact button
- [ ] Integrate MessageGeneration component in center panel, remove overlay logic, ensure proper spacing
- [ ] Integrate ContactPreview in right panel with empty state message when no contact selected
- [ ] Integrate AddContactModal with onSuccess callback that selects newly created contact
- [ ] Add /studio route to App.tsx within ProtectedRoute section
- [ ] Create helper function to map Contact interface to ContactForMessage interface for MessageGeneration and ContactPreview