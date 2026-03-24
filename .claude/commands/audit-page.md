Use the frontend-auditor agent to thoroughly audit the page at `frontend/src/pages/$ARGUMENTS`.
 
For this page:
1. Read the complete file and every component it imports
2. Trace every API call — verify the endpoint URL is correct and the response shape matches what the component expects
3. Check for bugs: null access, missing loading states, hardcoded content, broken imports
4. Check responsive: does it work at 375px, 768px, 1024px, 1440px?
5. Check i18n: are all user-facing strings translated?
6. List every issue found with severity, file path, line number, and fix approach
 
Output as a markdown checklist.
