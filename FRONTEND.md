# FRONTEND.md — Order Lists admin screen (Figma "Stack Admin Light Style 1", frames Dashboard #9–#15)

## Data flow
```
Browser (Angular 17, standalone)  --GET /api/orders[?status=..&type=..&date=..]-->  ng serve dev server (:4200)
        |                                  GET /api/orders/meta                       proxy.conf.json: /api -> http://backend:8080
        v                                                                              |
  OrdersService (src/app/orders.service.ts)  <----------- JSON ---------------  backend box (Order API)  -->  SQLite
```
* Everything is fetched from **relative** `/api/*`; no host/port, rows or filter options exist in app code.
* `OrdersService.getOrders(filters)` → `GET /api/orders` (filters become query params, multi-select values are sent as
  repeated params, e.g. `?type=Accessories&type=Book%20%26%20Stationary`; the API also accepts CSV — verified with curl, see
  `proof/api-samples.md`). `getMeta()` → `GET /api/orders/meta` (`{types, statuses}`) which supplies the options of the
  **Order Type** and **Order Status** controls. Filtering is done by the server; the UI only passes params and re-renders.
* Run: `npm install && npm start -- --host 0.0.0.0 --proxy-config proxy.conf.json`.

## Figma frames used
Page "🤩 Stack Admin Light Style 1": **Dashboard # 9** (resting page, `_ref/design.json` + `_ref/target.png`),
**# 10** (Date calendar open), **# 11** (date applied), **# 12/# 13** (Order Type popover, nothing / two chips selected),
**# 14/# 15** (Order Status popover, nothing / two chips selected). Controls are the designed custom components
(date calendar popover, pill multi-selects with *Apply Now*, *Reset Filter*), never native `<select>`/`<input type=date>`.
While a popover is open the other triggers are dimmed (as the frames draw it).

## Assets extracted from the `.fig`
* Raster (from the `.fig` ZIP, `images/<hash>`): UK flag `7260fbd7…` → `src/assets/images/uk-flag.png`,
  avatar `95bca3ec…` → `src/assets/images/avatar.png` (md5-identical to the ZIP entries). No placeholders were needed.
* Vector icons are inline `<svg>` (`src/app/shared/icons.ts`, rendered by `IconComponent` via
  `bypassSecurityTrustHtml` — Angular strips `<svg>` from plain `[innerHTML]`). Geometry: the sidebar masters and the bell
  were **decoded from the raw vector blobs of the `.fig`** (openpencil's SVG export collapses several of them to
  rectangles); the other UI icons come from a per-node SVG export. Each path keeps its own fill (bell: `#4880FF` /
  `#3D42DF` / `#FF0000`@.3, replay `#EA0234`, …).
* Font: **Nunito Sans** (the design family, weights 400/600/700/800), self-hosted from the baked system file
  (`src/assets/fonts/NunitoSans.ttf`, `@font-face` weight range 200–1000) so every browser renders the real face.
* Logo: wordmark "DashStack" — two-tone text per `dx-fig-fills` ("Dash" `#4880FF`, "Stack" `#202224`), 20px/800; the
  design's logo instance has no vector mark (text only).

## Icon provenance (whole-document search: `openpencil find --name "Element / icon" --type COMPONENT` → 14 masters × 3 colour variants)
| UI icon | design node (layer name, openpencil id of the default variant) |
|---|---|
| Dashboard | `Element / icon / dashboard` 0:462 |
| Products | `Element / icon / product` 0:378 |
| Favorites | `Element / icon / Favourites` 0:384 |
| Inbox | `Element / icon / chat` 0:388 |
| Order Lists (active, white variant) | `Element / icon / orderlist` 0:396 |
| Product Stock | `Element / icon / stock` 0:402 |
| Pricing | `Element / icon /  pricing` 0:408 |
| Calender | `Element / icon / calendar` 0:416 |
| To-Do | `Element / icon / to do` 0:424 |
| Contact | `Element / icon / contact` 0:429 |
| Invoice | `Element / icon / invoice` 0:435 |
| UI Elements | `Element / icon / UI element` 0:443 |
| Team | `Element / icon / team` 0:450 |
| Settings | `Element / icon / settings` 0:455 |
| Logout | `power` 0:12328 (page "Stack Admin Light Style 2", inside "Logout" 0:12326); geometry decoded from the raw blobs of its identical copy, colour #202224 |
| Table | **no master**: `openpencil find --name table` → `tablet` COMPONENT/VECTOR (device icon, unrelated) + two `Table` TEXT nodes. Disclosed open-set substitute: a plain 24px grid/table glyph, #202224 |
| Filter funnel | `Filter icon / filter` 0:9849 (Oval + Path, strokes) |
| Chevrons (Date / Order Type / Order Status) | `ic-keyboard-arrow-down-48px` 0:9840 / 0:9828 / 0:9834 |
| Reset Filter | `ic-replay-24px` 0:9822 |
| Pagination | `ic-keyboard-arrow-left-24px` 0:9731 and its mirrored copy 0:9734 |
| Search | `search` 0:44307 |
| Bell, badge, halo | `icon` 0:44293, `Oval` 0:44298 (badge, "6"), `Oval` 0:44300 (halo) |
| Language caret, profile "more" | `Drop Down` 0:44284, `More` 0:44271 |
| Calendar prev/next | `Indicator` squares 0:8902/0:8904 + `Shape` 0:8903/0:8905 (design #10) |

Reference notes: the design's pagination frame carries a *transparent* 24×23 bounding `Path` (0:9010, no fill/stroke) laid
out at x+77; it is reproduced as an empty `<svg class="arrow-box">` so the node has a rendered counterpart. The mirrored
right chevron is drawn (the reference *render* blanks it; the `.fig` model has it as a filled path at x+69). Names/rows in
the table are live API data, so they differ from the mockup's sample rows by design (`--data-selector "tbody"`).

## Conformance & verification
* `dx-fig-model design/sample.fig --frame "Dashboard  # 9" --json -o _ref/design.json` (committed).
* `dx-ui-audit --url http://localhost:4200 --ref _ref/design.json --wait table --data-selector "tbody" --out _ref/ui`
  → **PASS, 0 errors** (50 warnings: empty `<col>`/path slots, status-pill contrast of the design's own colours, ±7px label
  width from live data); structural pass `dx-ui-audit --url http://localhost:4200 --out _ref/sanity` → **0 errors**.
* Browser check with the **webwright skill, keyless** (Claude Code drives Playwright **Firefox**, 1280×1800, no
  `full_page`; no API keys, no `webwright` CLI): `proof/order-list.py` loads the page against the live backend, screenshots
  the rows, opens the designed Order Type popover, checks two options, applies, and screenshots the server-filtered
  table (`proof/order-list.png`, `popover-open.png`, `filtered.png`).

## Row count vs API
`/api/orders` returns 14 rows; the table shows **9 per page by design** (the design's pagination footer, "Showing 1-9 of 14",
page size 9 client-side over the full server result). Page 2 shows the remaining 5. Filtering stays server-side.

## Layout at narrower viewports (1280×1800 webwright proof)
The design frame is 1440 wide. The main column, table card (`width:100%; max-width:1141px`, column widths as % of 1141) and
pagination are fluid, and the top-bar right group (bell … profile) is anchored to the right edge, so all six columns, the
pagination and the profile block are visible at 1280 and pixel-identical in geometry at 1440. Order-load errors clear the
table and show the error; a `/meta` failure shows its own alert.
