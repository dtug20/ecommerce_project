Scan the frontend codebase for dead code:
 
1. Find all component files in `frontend/src/components/`
2. For each component, grep the entire codebase for its import
3. If a component is imported nowhere — mark as DEAD
4. Find all page files — check if any are unreachable (no links, not in sitemap)
5. Find all SCSS files — check if their classes are used anywhere
6. Find all utility functions — check if they're imported anywhere
7. Find all Redux slices — check if their actions/selectors are used
8. Find all static data files — check if they're imported (especially old blog-data.js)
 
Output as a list: file path, status (DEAD / USED / UNCERTAIN), imported by (which files)
