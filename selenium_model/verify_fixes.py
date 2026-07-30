"""Quick verification that all 14 fixes are in place."""
import pathlib

nav  = pathlib.Path("tests/test_navigation_extended.py").read_text(encoding="utf-8")
e2e  = pathlib.Path("tests/test_e2e_flows.py").read_text(encoding="utf-8")
val  = pathlib.Path("tests/test_validation.py").read_text(encoding="utf-8")
auth = pathlib.Path("tests/test_auth_extended.py").read_text(encoding="utf-8")
ui   = pathlib.Path("tests/test_ui_extended.py").read_text(encoding="utf-8")

VOX_SEARCH = 'text_present("VOX"'

checks = [
    ("NAV-009 uses direct nav (not driver.back)",      "driver.get(config.BASE_URL)" in nav),
    ("NAV-011 accepts Get Started button",             "Get Started" in nav),
    ("NAV-017/018/019 search for VOX not VOXIRA",      VOX_SEARCH in nav),
    ("NAV-020 uses direct nav",                        "direct navigation" in nav),
    ("E2E-011 uses direct nav",                        "driver.get(config.BASE_URL)" in e2e),
    ("UI-026 searches for VOX",                        VOX_SEARCH in ui),
    ("VAL-012 uses digit+space input",                 "1 2 3" in val),
    ("VAL-013 uses ASCII symbols not emoji",           "User#" in val),
    ("VAL-024 uses double-@@ invalid email",           "@@" in val),
    ("VAL-041 accepts Weak/Fair/Good/Strong",          "Strong" in val and "VAL-041" in val),
    ("AUTH-037 uses digit+space name",                 "1   " in auth),
]

all_pass = True
for name, result in checks:
    status = "PASS" if result else "FAIL"
    if not result:
        all_pass = False
    print(f"  [{status}] {name}")

print()
if all_pass:
    print("All 11 fix checks passed!")
else:
    print("Some fixes missing — check above")
