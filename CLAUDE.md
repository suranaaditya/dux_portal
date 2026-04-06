# Dux Portal - CLAUDE.md

## How to use this file in a new chat

At the start of a new Claude chat session, paste this:

> "Read the project context from this URL before doing anything:
> https://raw.githubusercontent.com/suranaaditya/dux_portal/main/CLAUDE.md
> Then confirm you understand the project and wait for instructions."

---

## What is this app?

dux_portal is a custom Frappe app that provides a role-based smart portal and home screen for ERPNext. It replaces the default ERPNext desk home with a branded dashboard showing categorized link cards, a collapsible "My Items" section driven by User Permissions, and a configurable logo/title/footer.

## GitHub Repository

- **Repo**: https://github.com/suranaaditya/dux_portal
- **Branch**: main
- **Raw CLAUDE.md**: https://raw.githubusercontent.com/suranaaditya/dux_portal/main/CLAUDE.md

## Server Details

- **SSH**: `frappe@187.127.132.58` (passwordless SSH configured)
- **Site**: `erp.jewonline.in`
- **Bench path**: `~/frappe-bench`
- **App path**: `~/frappe-bench/apps/dux_portal`
- **Module path**: `~/frappe-bench/apps/dux_portal/dux_portal/dux_portal/`
- **Process manager**: Supervisor (root-managed, `bench restart` requires sudo)
- **Database**: MariaDB
- **Developer mode**: enabled

## App Structure

### Core files

| File | Purpose |
|---|---|
| `dux_portal/hooks.py` | App hooks: `navbar_items` hook, `app_include_js` (icons, form picker, home button). `role_home_page` is commented out for safe production install (see Known Issues) |
| `dux_portal/dux_portal/api.py` | Whitelisted API `get_portal_data()` — returns sections, links, items, settings. Logo base64 generated on the fly by reading the file from disk (bypasses all caching) |
| `dux_portal/dux_portal/page/dux_portal/dux_portal.js` | Main portal page JS — renders topbar with logo, hero greeting, FY display, section cards, My Items, footer, live clock |
| `dux_portal/dux_portal/page/dux_portal/dux_portal.json` | Page definition (name: dux-portal, standard: Yes) |

### Public JS (loaded via app_include_js)

| File | Purpose |
|---|---|
| `public/js/dux_portal_icons.js` | `window.DUX_ICONS` — 148 Lucide SVG icon paths organized in 10 categories. MUST use `window.` prefix to be globally accessible |
| `public/js/dux_portal_form.js` | `dux_portal_show_icon_dialog()` — custom HTML modal icon picker (NOT frappe.ui.Dialog, which steals focus). Called from doctype JS files |
| `public/js/portal_home_button.js` | Injects a "Home" button on every desk page using `.sidebar-header` injection with MutationObserver for sidebar collapse state |

### DocTypes

#### Portal Section
- Fields: section_name, color_theme (Blue/Green/Amber/Purple/Red/Slate), icon_svg, sort_order, is_active
- `portal_section.js` — adds "Pick Icon" button calling `dux_portal_show_icon_dialog()`

#### Portal Link
- Fields: title, description, url, section (Link -> Portal Section), icon_svg, visible_to (All/Role/Roles/User/Roles & Users), role, user, sort_order, is_active
- `portal_link.js` — adds "Pick Icon" button calling `dux_portal_show_icon_dialog()`
- Has two child tables for multi-role and multi-user visibility (see below)

#### Portal Link Role (Child Table)
- Parent: Portal Link
- Fields: role (Link -> Role)
- Used when `visible_to` = "Roles" or "Roles & Users"

#### Portal Link User (Child Table)
- Parent: Portal Link
- Fields: user (Link -> User)
- Used when `visible_to` = "Roles & Users"

#### Dux Portal Settings (Single DocType)
- **My Items Section**: show_items_section, items_section_label, items_doctype (Link -> DocType), items_display_field, items_abbr_field, items_collapsed, items_visible_to_role
- **Appearance**: portal_title, footer_text
- **Logo**: logo (Attach Image), logo_height (Int, default 24), logo_style (Original/Make Black/Make White), logo_base64 (Text, hidden)
- `dux_portal_settings.py` — `on_update` hook attempts to convert logo to base64 (unreliable for hidden Text fields)
- **Note**: api.py generates logo base64 on every request by reading the file directly from disk. This is the reliable path — the `on_update` hook and `logo_base64` DB field are fallback/legacy

## Visibility Logic (api.py)

Portal Link `visible_to` field has 5 options controlling who sees each link:

| visible_to | Logic |
|---|---|
| `All` | Everyone sees it |
| `Role` | Single role — `link.role` field checked against user's roles |
| `Roles` | Multi-role — queries `Portal Link Role` child table, shows if user has ANY listed role |
| `User` | Single user — `link.user` field checked against current user |
| `Roles & Users` | Combined — queries both `Portal Link Role` and `Portal Link User` child tables, shows if user matches ANY role OR is explicitly listed (OR logic) |

## Logo Base64 Approach

The logo is converted to a base64 data URL on every API call in `api.py`:
1. Read logo file path from `tabSingles` via direct SQL (bypasses Frappe cache)
2. Resolve to disk path using `frappe.get_site_path()` (handles both `/private/` and `/files/`)
3. Read file, detect MIME type, encode to `data:<mime>;base64,...`
4. Return in `settings.logo_base64` — JS renders as `<img src="data:...">`

This approach was chosen because:
- `frappe.get_single()` does not reliably load hidden Text fields
- `frappe.db.get_single_value()` can return cached/empty values
- Direct SQL for `logo_base64` from `tabSingles` was also unreliable
- Reading from file on every request is simple, always fresh, ~5ms overhead

## Home Button Implementation

The home button (`portal_home_button.js`) uses:
- **`.sidebar-header` injection** — button is injected into the sidebar header area
- **MutationObserver** — watches for sidebar collapse/expand state changes and adjusts the button accordingly
- Loaded globally via `app_include_js` so it appears on every desk page

## My Items Section

The "My Items" section is fully dynamic, configured entirely through **Dux Portal Settings**:
- `items_doctype` — which DocType to pull items from (e.g., Company)
- `items_display_field` — which field to show as the item label
- `items_abbr_field` — which field to use for the abbreviation/avatar
- `items_section_label` — customizable section heading
- `items_collapsed` — whether section starts collapsed
- `items_visible_to_role` — restrict visibility to a specific role
- Items are filtered by the current user's User Permissions for the configured DocType

## Key Commands

```bash
# All commands must be run from ~/frappe-bench

# Build JS assets for this app
bench build --app dux_portal
bench build --app dux_portal --force  # force rebuild

# Clear cache (always do after changes)
bench --site erp.jewonline.in clear-cache

# Full cache flush (when regular clear-cache isn't enough)
redis-cli -p 13000 flushall && redis-cli -p 11000 flushall

# Migrate (after DocType field changes)
bench --site erp.jewonline.in migrate

# Bench console (for DocType creation, data fixes, setup scripts)
bench --site erp.jewonline.in console

# Restart gunicorn workers (ALWAYS required after Python file changes)
# Option 1: graceful reload (sends HUP to gunicorn master)
kill -HUP $(pgrep -f 'gunicorn.*frappe.app' | head -1)
# Option 2: wait for auto-recycle (max-requests 5000, can take minutes)
# Option 3: bench restart (requires sudo, may fail without it)

# Check JS syntax before deploying
node --check path/to/file.js

# Check Python syntax
python3 -c "import ast; ast.parse(open('path/to/file.py').read())"
```

## Setup for Fresh Installations

A setup script is available for fresh installations via bench console:

```bash
bench --site <site_name> console
```

Then run the setup commands to create default Portal Sections, Portal Links, and Dux Portal Settings. See the app's setup documentation or existing data for reference configurations.

## Important Learnings

### JS gotchas
- `window.DUX_ICONS` MUST use `window.` prefix — `var DUX_ICONS` gets trapped in module scope by Frappe's asset pipeline
- Do NOT use `frappe.ui.Dialog` for the icon picker — it re-initializes fields on innerHTML changes, stealing focus from the search input. Use a plain HTML modal appended to `document.body`
- Page JS files (in `page/dux_portal/`) are served by Frappe directly, not via esbuild. They are NOT in `sites/assets/`. Cache clearing + Ctrl+Shift+R is needed to pick up changes
- Doctype JS files (`doctype/portal_section/portal_section.js`) are auto-loaded by Frappe on form open. This is more reliable than `app_include_js` for `frappe.ui.form.on()` triggers

### Python gotchas
- `frappe.get_single()` does NOT reliably load hidden Text fields with large content
- Even `frappe.db.get_single_value()` and direct SQL on `tabSingles` can return cached/empty for large text. For the logo, just read the file from disk every time
- **Worker restart is ALWAYS required for Python file changes** — workers auto-recycle via `max-requests 5000`, or use `kill -HUP <master_pid>` for immediate reload
- `bench restart` requires sudo on this server. Use `kill -HUP` on gunicorn master or wait for worker recycle

### Deployment gotchas
- `role_home_page` is currently **commented out** in hooks.py for safe production install — using `role_home_page` with `"All"` breaks the website root URL
- Private file URLs (`/private/files/...`) need auth. For the logo, generate base64 on the fly in api.py to avoid flicker
- After changing hooks.py, flush Redis to pick up new `app_include_js` entries
- site_config.json `home_page` should NOT be set (removed) — let Frappe use defaults
- `navbar_items` hook is added in hooks.py for navigation integration

### Creating DocTypes
- Always use `bench --site ... console` for DocType creation, NOT direct JSON editing
- After creating fields: `bench migrate` to create DB columns
- After modifying DocType JSON: `bench migrate` again

## Known Issues

- **Root URL proxy issue on dev server**: The root URL (`/`) may not redirect correctly when using the development server due to proxy configuration. This affects `role_home_page` behavior — the hook is commented out in hooks.py as a workaround
- Logo `on_update` base64 conversion in `dux_portal_settings.py` is unreliable for hidden Text fields — api.py's on-the-fly file read is the authoritative approach

## Current Features

1. **Portal Dashboard** — branded home page with greeting, live clock, financial year
2. **Section Cards** — color-themed sections with categorized link cards
3. **5-mode Visibility** — All, Role, Roles (multi), User, Roles & Users (combined) with Portal Link Role and Portal Link User child tables
4. **Icon Picker** — 148 Lucide icons in 10 categories with search, plain HTML modal
5. **My Items Section** — fully dynamic collapsible section configured via Dux Portal Settings, driven by User Permissions
6. **Logo Support** — uploaded logo converted to base64 data URL on the fly (read from file on every API call), CSS filter options (Make Black/White)
7. **Home Button** — global "Home" button on every desk page via .sidebar-header injection with MutationObserver for collapse state
8. **Configurable** — portal_title, footer_text, logo, logo_height, logo_style, items section all via Dux Portal Settings
9. **Navbar Integration** — navbar_items hook in hooks.py

## What's Next

- Role-based testing — verify different users see correct links and items
- Material Indent section — for college users to submit material requests
- Store Operations section — inventory management links for store users
- Mobile responsiveness improvements
- Dark mode support
