# frontend — Angular frontend (devbox self-test scaffold)

Minimal standalone-component Angular 17 app (HttpClient already provided in
main.ts). A devbox worker builds the admin screen drawn in the Figma frames
Dashboard #9–#15 — the screen's contents (layout, columns, controls, brand,
icons, images) are defined ONLY by the design and must be read from it, not from
any description here. EVERYTHING the screen shows — the rows AND the filter
options — comes from the backend API; nothing is hard-coded. The design `.fig`
arrives in the task package (assets/sample.fig) and is imported with
`op import:figma`; the result is verified in a real browser (webwright).

The data comes from the **backend box** over the shared network: the app calls
**relative** `/api/...` and `ng serve --proxy-config proxy.conf.json` forwards it
to `http://backend:8080` (see proxy.conf.json). Start the backend box first.
