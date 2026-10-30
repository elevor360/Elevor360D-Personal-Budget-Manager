Elevor360D Personal Budget Manager V8.1 — Licence diagnostics

This is based on the exact V8 ZIP supplied by the user. No budgeting data, API endpoint, App ID or device-ID storage key was changed.

V8.1 displays the App ID on the activation screen and shows the exact HTTP status and Worker rejection reason on failure. It also fetches licence.js network-first to avoid serving a stale activation script from the old service-worker cache.

UPLOAD all 8 files to the same GitHub Pages repository and refresh online. Confirm activation screen says Release V8.1 before testing. Existing local budget records remain on the same origin. Back up before updating.

If the Worker rejects a new code, check its recorded App ID in the manager. The manager test used one device slot; a separate browser/device can use the second slot. Do not share licence keys or admin secrets.
