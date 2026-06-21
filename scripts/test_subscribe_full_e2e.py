"""Full subscribe flow E2E — randomized registration, plan, checkout, activation."""
from __future__ import annotations

import json
import os
import sys
import time
from playwright.sync_api import sync_playwright

URL = os.environ.get("SUBSCRIBE_URL", "https://yogabrata.com/subscribe/")
RUNS = int(os.environ.get("SUBSCRIBE_E2E_RUNS", "3"))
results: dict = {"url": URL, "runs": [], "errors": []}


def pass_check(run: dict, name: str, detail: str = "") -> None:
    run["checks"].append({"name": name, "ok": True, "detail": detail})
    print(f"  PASS: {name} {detail}")


def fail_check(run: dict, name: str, detail: str = "") -> None:
    run["checks"].append({"name": name, "ok": False, "detail": detail})
    results["errors"].append(f"run {run['index']} {name}: {detail}")
    print(f"  FAIL: {name} {detail}")


def run_flow(page, index: int, seen_names: set[str]) -> dict:
    run = {"index": index, "checks": [], "profile": {}}
    print(f"\n--- Run {index + 1}/{RUNS} ---")

    page.goto(URL + "?program=cbse10", wait_until="networkidle", timeout=60000)
    page.evaluate("localStorage.removeItem('ml_student_token'); localStorage.removeItem('ml_student_user');")
    page.reload(wait_until="networkidle")

    page.wait_for_selector("#regForm", timeout=20000)
    pass_check(run, "register_form")

    name = page.input_value('input[name="full_name"]')
    email = page.input_value('input[name="email"]')
    school = page.input_value('input[name="school_name"]')
    city = page.input_value('input[name="city"]')
    run["profile"] = {"name": name, "email": email, "school": school, "city": city}

    if not name or not email:
        fail_check(run, "random_prefill", f"name={name!r} email={email!r}")
    else:
        pass_check(run, "random_prefill", f"{name} · {email}")

    if name in seen_names:
        fail_check(run, "unique_name", f"Duplicate name: {name}")
    else:
        seen_names.add(name)
        pass_check(run, "unique_name", name)

    if "test.in." in email or "test.us." in email:
        fail_check(run, "email_format", f"Old static email pattern: {email}")
    else:
        pass_check(run, "email_format", email.split("@")[0][:24] + "…")

    # Program selector
    if page.locator('#programList .program[data-program="cbse10"].on').count():
        pass_check(run, "program_cbse10_selected")
    else:
        fail_check(run, "program_cbse10_selected")

    # Register
    register_resp = {"status": None, "body": ""}

    def on_register(response):
        if "/auth/register" in response.url and response.request.method == "POST":
            register_resp["status"] = response.status
            register_resp["body"] = response.text()[:400]

    page.on("response", on_register)
    page.click('button[type="submit"]:has-text("Create account")')
    page.wait_for_selector("text=Choose your plan", timeout=20000)
    if register_resp["status"] and 200 <= register_resp["status"] < 300:
        pass_check(run, "register_api", f"HTTP {register_resp['status']}")
    else:
        fail_check(run, "register_api", str(register_resp))
        return run

    pass_check(run, "plan_step")

    # Start free trial
    checkout_resp = {"status": None}

    def on_checkout(response):
        if "/billing/checkout" in response.url and response.request.method == "POST":
            checkout_resp["status"] = response.status

    page.on("response", on_checkout)
    page.click("#checkoutBtn")
    page.wait_for_selector("#payBtn", timeout=15000)
    if checkout_resp["status"] and 200 <= checkout_resp["status"] < 300:
        pass_check(run, "checkout_api", f"HTTP {checkout_resp['status']}")
    else:
        fail_check(run, "checkout_api", str(checkout_resp))
        return run

    pass_check(run, "pay_step")

    pay_resp = {"status": None}

    def on_pay(response):
        if "/billing/fake-pay/confirm" in response.url and response.request.method == "POST":
            pay_resp["status"] = response.status

    page.on("response", on_pay)
    page.click("#payBtn")
    page.wait_for_selector("text=Subscription active", timeout=25000)
    if pay_resp["status"] and 200 <= pay_resp["status"] < 300:
        pass_check(run, "activate_api", f"HTTP {pay_resp['status']}")
    else:
        fail_check(run, "activate_api", str(pay_resp))
        return run

    pass_check(run, "subscription_active")

    if page.locator("text=ManjuLab Academy").count():
        pass_check(run, "manjulab_branding")
    else:
        fail_check(run, "manjulab_branding")

    return run


def main() -> int:
    seen_names: set[str] = set()

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()
        page.on(
            "console",
            lambda msg: print(f"  BROWSER {msg.type}: {msg.text}") if msg.type == "error" else None,
        )

        try:
            for i in range(RUNS):
                run = run_flow(page, i, seen_names)
                results["runs"].append(run)
                if i < RUNS - 1:
                    time.sleep(1)
        except Exception as exc:
            results["errors"].append(f"unexpected: {exc}")
            page.screenshot(
                path=os.path.join(os.path.dirname(__file__), "subscribe-full-fail.png"),
                full_page=True,
            )
            print(f"UNEXPECTED: {exc}")
        finally:
            browser.close()

    failed = sum(1 for r in results["runs"] for c in r.get("checks", []) if not c["ok"])
    failed += len(results["errors"])
    print("\n=== SUMMARY ===")
    print(json.dumps(results, indent=2))
    print(f"\nTotal failures: {failed}")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
