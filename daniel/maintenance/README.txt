DANIEL BIBLE STUDIES - MAINTENANCE KIT

Place the entire maintenance folder inside your local GitHub repository's daniel folder, next to daniel/index.html.

1. Double-click ENABLE_MAINTENANCE.bat inside daniel/maintenance.
   It first copies YOUR CURRENT daniel/index.html to maintenance/index-normal.html, then installs the Daniel maintenance notice.
2. Review the changes in GitHub Desktop, commit and push.
3. When ready, double-click RESTORE_WEBSITE.bat, then commit and push again.

IMPORTANT: The supplied index-normal.html is an example from an older desktop website package. Do NOT manually use it to restore your website. The ENABLE script replaces it with your actual current Daniel homepage.

The batch files operate on the index.html ONE folder above them (daniel/index.html), not the repository root index.html.

This only changes the Daniel homepage, not the main Getting to Know Jesus homepage. Direct links to other pages may still work during maintenance.

If you rebuild the Daniel website during maintenance, inspect the saved normal homepage before restoring; it may be outdated.
