# Sidebar icon/data extraction notes

This repository now includes `sidebar-menu-data.json`, a normalized menu structure you can plug into your updated `<nav class="menu">` component.

## Mapping rules used
- Pulled icon classes from each jsTree node's `<i class="... jstree-themeicon ...">` class list.
- Pulled labels from the anchor text in the jsTree node.
- Pulled links from the anchor `href` where present.
- When jsTree had no icon class for an item, `icon` is set to `null`.
- Kept your updated sidebar naming where needed (for example `Session` in the new structure), while still using the closest jsTree icon.

## Quick usage
1. Load `sidebar-menu-data.json`.
2. Render each object recursively:
   - `label` => menu text
   - `icon` => `<i class="...">`
   - `href` => link target (or button group if `children` exists)
   - `children` => nested menu-group

## Caveats
- Some entries in your provided updated HTML (such as nested `Manage Image`/`Manage Snapshot` placeholders) did not have a one-to-one URL match in the pasted jsTree snippet. These were kept with best-match icon class and `href: null` where unavailable.
