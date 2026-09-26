"""README screenshots and hero banner, from the live app.

  python scripts/readme-shots.py            # against production
  BASE=http://127.0.0.1:5173 python scripts/readme-shots.py

Needs Python with Playwright and Chrome. It walks through onboarding as "Mira",
then gives her three habits about three weeks of imperfect history, so Rhythm
and the garden have something to show. Everything stays in the throwaway
browser. Writes docs/readme/{today,rhythm,garden,neko,night,matcha,hero}.png.
"""
import base64, datetime as dt, json, os, re
from pathlib import Path
from playwright.sync_api import sync_playwright

BASE = os.environ.get('BASE', 'https://kawaii-habit-tracker.vercel.app')
OUT = Path('docs/readme')
OUT.mkdir(parents=True, exist_ok=True)
UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1'
TODAY = dt.date.today()
# Day offsets each habit was skipped on: missed days, not a perfect streak.
GAPS = [{3, 7, 12, 13, 19}, {2, 5, 9, 10, 16, 20}, {4, 11, 17}]

with sync_playwright() as p:
    b = p.chromium.launch(channel='chrome')
    ctx = b.new_context(viewport={'width': 393, 'height': 852}, device_scale_factor=2, user_agent=UA, is_mobile=True, has_touch=True)
    page = ctx.new_page()
    nav = lambda label: page.get_by_role('navigation', name='Primary navigation').get_by_role('button', name=label).click()
    shot = lambda name, wait=500: (page.wait_for_timeout(wait), page.screenshot(path=str(OUT / f'{name}.png')))

    page.goto(BASE, wait_until='networkidle')
    page.get_by_role('button', name='Begin gently').click()
    page.get_by_placeholder('What should Neko call you?').fill('Mira')
    def step(next_heading):
        page.get_by_role('button', name='Continue').click()
        page.get_by_role('heading', name=next_heading).wait_for()
        page.wait_for_timeout(400)
    step('Pick one to three habits')
    for i in range(3):
        page.locator('.preset-grid button').nth(i).click()
    step('What is the tiny version?')
    step(re.compile('light'))
    step('Do one tiny thing now')
    page.locator('.first-ritual-list button').first.click()
    page.get_by_role('button', name='Enter your garden').click()
    page.get_by_role('heading', name='Mira', exact=False).first.wait_for()

    # Three weeks of history, written into the app's own state object.
    state = json.loads(page.evaluate("localStorage.getItem('kw_state_v2')"))
    for habit, gaps in zip(state['habits'], GAPS):
        done = set(habit.get('completedDates', []))
        done |= {(TODAY - dt.timedelta(days=n)).isoformat() for n in range(1, 22) if n not in gaps}
        habit['completedDates'] = sorted(done)
    page.evaluate('s => localStorage.setItem("kw_state_v2", s)', json.dumps(state))
    page.reload(wait_until='networkidle')

    shot('today', 900)
    for label in ['Rhythm', 'Garden', 'Neko']:
        nav(label); shot(label.lower(), 700)
    nav('Today')

    for theme, name in [(r'Moonlit Nook', 'night'), (r'Matcha Study', 'matcha')]:
        page.get_by_role('button', name='Open settings').click()
        page.get_by_role('button', name=theme, exact=False).click()
        page.get_by_role('button', name='Close settings').click()
        shot(name, 600)
    ctx.close()

    # Hero: the mark, the promise, and three real screens.
    img = lambda n: 'data:image/png;base64,' + base64.b64encode((OUT / n).read_bytes()).decode()
    icon = 'data:image/png;base64,' + base64.b64encode(Path('public/icon-192.png').read_bytes()).decode()
    hero = f'''<html><head>
<style>
body {{ margin: 0; width: 1600px; height: 820px; background: #F6EEE2; font-family: Inter, 'Segoe UI', sans-serif; color: #38272B; overflow: hidden; position: relative; }}
.glow {{ position: absolute; right: -180px; top: -220px; width: 1000px; height: 1000px; border-radius: 50%;
  background: radial-gradient(closest-side, rgba(201,102,72,0.16), rgba(201,102,72,0)); }}
.leaf {{ position: absolute; left: -140px; bottom: -220px; width: 620px; height: 620px; border-radius: 50%;
  background: radial-gradient(closest-side, rgba(123,155,109,0.16), rgba(123,155,109,0)); }}
.copy {{ position: absolute; left: 110px; top: 200px; width: 640px; }}
.wm {{ display: flex; align-items: center; gap: 16px; font-family: Georgia, serif; font-size: 38px; font-weight: 700; }}
.wm img {{ width: 60px; height: 60px; border-radius: 16px; }}
h1 {{ margin: 54px 0 0; font-family: Georgia, serif; font-size: 66px; line-height: 1.08; font-weight: 700; letter-spacing: -0.02em; }}
h1 em {{ font-style: italic; font-weight: 400; color: #C96648; }}
p {{ margin: 28px 0 0; font-size: 24px; line-height: 1.5; color: #6D5A58; max-width: 30ch; }}
.phone {{ position: absolute; width: 300px; border-radius: 38px; overflow: hidden; border: 1px solid rgba(56,39,43,0.12);
  box-shadow: 0 40px 80px -30px rgba(56,39,43,0.45); background: #fff; }}
.phone img {{ display: block; width: 100%; }}
.a {{ left: 800px; top: 120px; transform: rotate(-4deg); }}
.b {{ left: 1040px; top: 70px; z-index: 2; }}
.c {{ left: 1280px; top: 140px; transform: rotate(4deg); }}
</style></head><body><div class="glow"></div><div class="leaf"></div>
<div class="copy"><div class="wm"><img src="{icon}">Kawaii Habit Tracker</div>
<h1>A pocket garden for <em>gentle, imperfect</em> routines.</h1>
<p>Tiny versions count, rest days are planned, and ordinary care grows a small world.</p></div>
<div class="phone a"><img src="{img('rhythm.png')}"></div>
<div class="phone b"><img src="{img('today.png')}"></div>
<div class="phone c"><img src="{img('garden.png')}"></div>
</body></html>'''
    pg = b.new_page(viewport={'width': 1600, 'height': 820})
    pg.set_content(hero)
    pg.evaluate('document.fonts.ready')
    pg.wait_for_timeout(800)
    pg.screenshot(path=str(OUT / 'hero.png'))
    b.close()
print('written:', sorted(x.name for x in OUT.iterdir()))
