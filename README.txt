Elevor360D PERSONAL BUDGET MANAGER V5.1 — INSTALL FIX
This release fixes install-button guidance and adds standard 192px/512px PNG PWA icons for Chrome/Edge installability.
Upload ALL SIX files to your GitHub Pages repository: index.html, sw.js, manifest.webmanifest, icon.svg, icon-192.png, icon-512.png.
Then reload the HTTPS GitHub Pages URL while online. On Android Chrome, tap Install App on the Overview page. If the browser does not provide an automatic prompt, the button explains how to install from the Chrome menu.
The button disappears when the installed app runs in standalone mode and when the browser emits the appinstalled event. A normal browser tab may still display the button even after installation.
Do not open the HTML directly from the ZIP for PWA installation.
All V5 features and the existing data storage key are retained. Back up data before replacing files.
