# Styling

**File**: `client/css/style.css`

Manifolder uses a single CSS file with CSS custom properties (variables) for theming. The application uses a dark theme.

## Design Tokens

### Colors

```css
/* Background layers (darkest to lightest) */
--bg-sunken:    #0d0d0d;   /* Deepest background */
--bg-base:      #141414;   /* Main background */
--bg-panel:     #1a1a1a;   /* Panel backgrounds */
--bg-raised:    #222222;   /* Elevated elements */
--bg-hover:     #2a2a2a;   /* Hover state */
--bg-active:    #333333;   /* Active/pressed state */

/* Borders */
--border-subtle:  #2a2a2a;  /* Subtle dividers */
--border-default: #333333;  /* Standard borders */
--border-focus:   #4488cc;  /* Focus rings */

/* Text */
--text-primary:   #e0e0e0;  /* Primary text */
--text-secondary: #a0a0a0;  /* Secondary text */
--text-muted:     #666666;  /* Muted/disabled text */
--text-link:      #6699cc;  /* Links */

/* Accent */
--accent:       #4488cc;    /* Primary accent */
--accent-hover: #5599dd;    /* Accent hover */
--accent-dim:   #2a4466;    /* Dimmed accent */

/* Status */
--status-connected:    #44aa44;  /* Connected indicator */
--status-disconnected: #aa4444;  /* Disconnected indicator */
--status-loading:      #aaaa44;  /* Loading indicator */
```

### Node Type Colors

Node type colors are defined in JavaScript (`client/shared/node-types.js`) and injected as CSS variables at runtime via `generateNodeTypeStylesheet()`. This ensures JS and CSS are always in sync.

Example generated variables:
```css
--node-universe: #e0e0ff;
--node-planet: #60b0ff;
--node-city: #d06030;
--node-physical: #80b0c0;
```

These are used for tree icons, inspector type labels, and 3D object colors.

### Typography

```css
--font-ui:   'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
--font-mono: 'JetBrains Mono', 'Fira Code', Consolas, monospace;

--font-size-sm:   11px;
--font-size-base: 12px;
--font-size-lg:   13px;
```

Fonts are loaded from Google Fonts in `app.html`:
- **Inter** (weights 400, 500, 600) — UI text
- **JetBrains Mono** (weights 400, 500) — Code and data display

### Spacing & Transitions

```css
--spacing-xs: 4px;
--spacing-sm: 8px;
--spacing-md: 12px;
--spacing-lg: 16px;

--transition-fast:   100ms;
--transition-normal: 150ms;
```

## Layout Structure

### Toolbar
- Height: 36px
- Flexbox row layout
- Contains: URL input, history dropdown, load/follow buttons, bookmark/share controls

### Main Container
- Flex row with three resizable regions
- Hierarchy panel → Resize handle → Viewport → Resize handle → Inspector panel

### Panels
- Flex column layout
- Header: 28px height with title and minimize button
- Content: Scrollable, fills remaining space
- **Hierarchy**: Default 285px width (150–450px range)
- **Inspector**: Default 280px width (200–450px range)

### Resize Handles
- Width: 8px
- Cursor: `col-resize`
- Hover: highlighted with `--accent-dim`
- Active: highlighted with `--accent`

### Viewport
- `flex: 1` (fills remaining space)
- Contains tab buttons and view containers
- Split view (2 views) or triple view (3 views) via CSS classes

### Status Bar
- Height: 24px
- Contains: connection indicator (colored dot) and status message

## Component Styles

### Tree Nodes

```css
.tree-node-content {
  /* Row layout: toggle + icon + label */
  padding: 2px 0 2px 4px;
  cursor: pointer;
}

.tree-node-content:hover {
  background: var(--bg-hover);
}

.tree-node-content.selected {
  background: var(--accent-dim);
  color: var(--text-primary);
}
```

Tree icon colors are set per node type using generated CSS rules:
```css
.tree-node[data-node-type="Planet"] .tree-icon {
  color: var(--node-planet);
}
```

### Search Highlighting

```css
.tree-node.search-match .tree-label {
  /* Highlighted match */
  color: var(--text-primary);
  font-weight: 600;
}

.tree-node.search-ancestor .tree-label {
  /* Ancestor of match (shown for context) */
  color: var(--text-secondary);
}
```

### Dropdowns

Used for URL history, bookmarks, and type filter:
```css
.dropdown {
  position: absolute;
  background: var(--bg-raised);
  border: 1px solid var(--border-default);
  border-radius: 4px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.4);
  max-height: 300px;
  overflow-y: auto;
}
```

### Context Menus

```css
.context-menu {
  position: fixed;
  background: var(--bg-raised);
  border: 1px solid var(--border-default);
  border-radius: 4px;
  padding: 4px 0;
  box-shadow: 0 4px 12px rgba(0,0,0,0.4);
}
```

### Buttons

```css
button {
  background: var(--bg-raised);
  color: var(--text-secondary);
  border: 1px solid var(--border-default);
  border-radius: 3px;
  padding: 4px 8px;
  cursor: pointer;
}

button:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

button.primary {
  background: var(--accent);
  color: white;
  border-color: var(--accent);
}
```

### Inspector Sections

```css
.inspector-section-header {
  /* Collapsible section header */
  padding: 6px 8px;
  background: var(--bg-raised);
  cursor: pointer;
  font-weight: 500;
}

.inspector-value {
  /* Property values */
  font-family: var(--font-mono);
  font-size: var(--font-size-sm);
}
```

### Form Elements

Inputs and selects follow the dark theme:
```css
input, select {
  background: var(--bg-sunken);
  color: var(--text-primary);
  border: 1px solid var(--border-default);
  border-radius: 3px;
}

input:focus, select:focus {
  border-color: var(--border-focus);
  outline: none;
}
```

## View Layout Modes

### Single View
Default — one view fills the viewport.

### Split View (2 views)
```css
.viewport-container.split-view {
  /* Two views side by side, each 50% */
}
```

### Triple View (3 views)
```css
.viewport-container.triple-view {
  /* Three views, each 33.3% */
}
```

## Responsive Behavior

On narrow screens:
- Panels use horizontal scrolling within the main container
- Minimum widths are enforced
- Touch-friendly targets (context menu items have extra padding)

## Toast Notifications

Used for share feedback:
```css
.share-toast {
  position: fixed;
  bottom: 48px;
  left: 50%;
  transform: translateX(-50%);
  background: var(--bg-raised);
  border: 1px solid var(--accent);
  padding: 8px 16px;
  border-radius: 6px;
  opacity: 0;
  transition: opacity 300ms;
}

.share-toast.visible {
  opacity: 1;
}
```

## Extending Styles

To add a new node type color:
1. Add the type to `client/shared/node-types.js` (name, hex color, CSS variable name)
2. The stylesheet is generated at runtime — no CSS changes needed
3. Tree icon rules are generated automatically based on the node type data
