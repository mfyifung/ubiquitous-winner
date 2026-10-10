#!/usr/bin/env python3
"""Re-runnable browser proof for the Order Lists page (webwright skill, keyless).

Drives Playwright Firefox, viewport 1280x1800, never full_page, against the LIVE
backend through the Angular dev-server proxy (relative /api -> http://backend:8080).

Usage:  python order-list.py [--url http://localhost:4200] [--out <dir>]
Writes: order-list.png, popover-open.png, filtered.png, date-open.png,
        type-open.png, date-applied.png and order-list.log into --out (default: this script's dir).
"""
import argparse
import json
import os
import urllib.parse
from playwright.sync_api import sync_playwright


def main(url: str, out: str) -> None:
    os.makedirs(out, exist_ok=True)
    log_lines = []

    def log(msg: str) -> None:
        print(msg)
        log_lines.append(msg)

    def shot(page, name: str) -> None:
        """Screenshot once the page is visually stable: CSS transitions (the .12s trigger fade) finished
        AND two consecutive captures are byte-identical (a transition can still be painting when
        getAnimations() is already empty)."""
        page.wait_for_function("document.getAnimations().length === 0")
        prev = page.screenshot()
        for _ in range(40):
            page.wait_for_timeout(50)
            cur = page.screenshot()
            if cur == prev:
                break
            prev = cur
        else:
            raise AssertionError(f"{name}: page never became visually stable")
        with open(os.path.join(out, name), "wb") as fh:
            fh.write(cur)

    with sync_playwright() as p:
        # headed on the box display when DX_QA_HEADED=1 (QA watches it), headless otherwise
        browser = p.firefox.launch(headless=os.environ.get("DX_QA_HEADED") != "1")
        page = browser.new_page(viewport={"width": 1280, "height": 1800})
        console_errors = []
        page.on("console", lambda m: console_errors.append(m.text) if m.type == "error" else None)

        # 1) initial load: rows + filter options both come from the API
        with page.expect_response(lambda r: r.url.endswith("/api/orders/meta")) as meta_resp:
            with page.expect_response(lambda r: urllib.parse.urlparse(r.url).path == "/api/orders") as orders_resp:
                page.goto(url)
        meta = meta_resp.value.json()
        api_rows = orders_resp.value.json()
        page.wait_for_selector("tbody tr.row")
        page.evaluate("document.fonts.ready")
        rows = page.locator("tbody tr.row")
        n_rows = rows.count()
        first_id = rows.nth(0).locator("td").nth(0).inner_text().strip()
        log(f"step 1 load: GET /api/orders -> {len(api_rows)} rows; table renders {n_rows} (page size 9); "
            f"first row id {first_id!r} == api {api_rows[0]['orderId']!r}")
        assert n_rows == min(9, len(api_rows)) and first_id == api_rows[0]["orderId"]
        log(f"step 1 meta: types={meta['types']} statuses={meta['statuses']}")

        # assets actually render (pixels, not markup)
        svg_boxes = page.eval_on_selector_all(
            "app-sidebar svg, app-topbar svg, .filter-bar svg",
            "els => els.map(e => { const b = e.getBoundingClientRect(); return [b.width, b.height]; })")
        blank = [b for b in svg_boxes if b[0] < 4 or b[1] < 4]
        imgs = page.eval_on_selector_all("img", "els => els.map(e => [e.getAttribute('src'), e.naturalWidth])")
        font_ok = page.evaluate("document.fonts.check('600 14px \"Nunito Sans\"')")
        log(f"step 1 assets: {len(svg_boxes)} inline svg icons, {len(blank)} blank; images={imgs}; Nunito Sans loaded={font_ok}")
        assert svg_boxes and not blank and all(w > 0 for _, w in imgs) and font_ok
        shot(page, "order-list.png")

        # 2) designed date picker (frame #10) - open state only
        page.click(".cell-date")
        page.wait_for_selector("app-date-popover .day-cell")
        shot(page, "date-open.png")
        log("step 2 date picker opened (custom calendar, no <input type=date>)")
        page.click(".cell-date")

        # 3) designed Order Type multi-select (frames #12/#13) - options from /meta
        page.click(".cell-type")
        page.wait_for_selector("app-multi-select-popover .pill")
        type_pills = page.locator("app-multi-select-popover .pill").all_inner_texts()
        assert [t.strip() for t in type_pills] == meta["types"], type_pills
        shot(page, "type-open.png")
        log(f"step 3 order-type popover options == /meta types ({len(type_pills)})")
        page.click(".cell-type")

        # 4) Order Status multi-select (frames #14/#15): check two options, apply
        pick = [s for s in ("Completed", "Rejected") if s in meta["statuses"]] or meta["statuses"][:2]
        page.click(".cell-status")
        page.wait_for_selector("app-multi-select-popover .pill")
        for s in pick:
            page.locator("app-multi-select-popover .pill", has_text=s).click()
        selected = page.locator("app-multi-select-popover .pill--selected").all_inner_texts()
        assert sorted(t.strip() for t in selected) == sorted(pick), selected
        assert page.locator("select, input[type=date], input[type=checkbox]").count() == 0
        dimmed = page.eval_on_selector_all(".filter-control.dim", "els => els.map(e => e.className)")
        assert len(dimmed) == 1 and "cell-status" in dimmed[0], dimmed  # frames #14/#15: only the OPEN trigger is dimmed
        shot(page, "popover-open.png")
        log(f"step 4 order-status popover open, checked {pick} (no native select/date/checkbox on page)")

        with page.expect_response(lambda r: "/api/orders?" in r.url) as filt_resp:
            page.click("app-multi-select-popover .apply-btn")
        req_url = filt_resp.value.url
        filt_rows = filt_resp.value.json()
        page.wait_for_function(
            "n => document.querySelectorAll('tbody tr.row').length === n", arg=min(9, len(filt_rows)))
        statuses = [t.strip() for t in page.locator("tbody tr.row .status-pill").all_inner_texts()]
        log(f"step 5 apply -> {urllib.parse.unquote(req_url.split('/api', 1)[1])} -> {len(filt_rows)} rows; "
            f"table statuses {sorted(set(statuses))}")
        assert set(statuses) == set(pick) and len(filt_rows) < len(api_rows)
        page.wait_for_function("!document.querySelector('app-multi-select-popover, .filter-control.dim')")
        shot(page, "filtered.png")

        # 6) date filter (frames #10/#11): reset, pick the first API row's day, apply, then "Next Date"
        with page.expect_response(lambda r: urllib.parse.urlparse(r.url).path == "/api/orders"):
            page.click(".cell-reset")
        day = api_rows[0]["date"]  # yyyy-MM-dd, live data
        y, m, d = (int(v) for v in day.split("-"))
        page.click(".cell-date")
        page.wait_for_selector("app-date-popover .day-cell")
        months = ["January", "February", "March", "April", "May", "June", "July", "August",
                  "September", "October", "November", "December"]
        for _ in range(36):
            label = page.locator("app-date-popover .month-label").inner_text().strip()
            ly, lm = int(label.split()[1]), months.index(label.split()[0]) + 1
            if (ly, lm) == (y, m):
                break
            page.click("app-date-popover .nav-prev" if (ly, lm) > (y, m) else "app-date-popover .nav-next")
        page.locator("app-date-popover .day-cell:not([disabled])", has_text=str(d)).filter(
            has_text=__import__("re").compile(rf"^{d}$")).click()
        with page.expect_response(lambda r: "/api/orders?date=" in r.url) as date_resp:
            page.click("app-date-popover .apply-btn")
        date_rows = date_resp.value.json()
        page.wait_for_function("n => document.querySelectorAll('tbody tr.row').length === n", arg=len(date_rows))
        label = page.locator(".cell-date .cell-text").inner_text().strip()
        log(f"step 6 date apply -> {urllib.parse.unquote(date_resp.value.url.split('/api', 1)[1])} -> "
            f"{len(date_rows)} rows; trigger label {label!r}")
        assert date_rows and all(r["date"] == day for r in date_rows)
        shot(page, "date-applied.png")
        with page.expect_response(lambda r: "/api/orders?date=" in r.url) as next_resp:
            page.click(".date-next")
        log(f"step 7 Next Date -> {urllib.parse.unquote(next_resp.value.url.split('/api', 1)[1])}; "
            f"label {page.locator('.cell-date .cell-text').inner_text().strip()!r}")

        log(f"console errors: {console_errors}")
        assert not console_errors
        log("RESULT: PASS")
        browser.close()

    with open(os.path.join(out, "order-list.log"), "w") as fh:
        fh.write("\n".join(log_lines) + "\n")


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--url", default="http://localhost:4200")
    ap.add_argument("--out", default=os.path.dirname(os.path.abspath(__file__)))
    a = ap.parse_args()
    main(a.url, a.out)
