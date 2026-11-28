# Accounts require a password, start signed out, and keep each profile's worlds separate.
# And the board answers the keyboard: Up and Down choose a name, Enter signs in, Tab walks the fields, Escape steps back,
# a toast welcomes you, and the device remembers only which account was used last (ew2.last: an id, nothing more).
import asyncio, os, sys
sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'helpers'))
from harness import H

async def main():
    h = await H().start(mode='none')
    try:
        initial = await h.ev("[G.state, ACCOUNT.active === null]")
        too_short = await h.ev("(async()=>await accountCreate('Waker', 'short', 'short', 0, 0))()")
        await h.ev("""localStorage.setItem('ew2.index', JSON.stringify([{id:'legacy',name:'Old world'}]));
          localStorage.setItem('ew2.w.legacy', JSON.stringify({id:'legacy',name:'Old world',savedAt:1}));""")
        created = await h.ev("(async()=>await accountCreate('Waker', 'ember-wake-123', 'ember-wake-123', 1, 0))()")
        migrated = await h.ev("[SAVE.list.some(m => m.id === 'legacy'), !!LS.get(profileKey('w.legacy'))]")
        password_not_stored = await h.ev("!LS.get('ew2.accounts').includes('ember-wake-123')")
        await h.ev("""createWorld({name:'Saved world',seed:'account-test',size:0,shape:0,mode:0,skin:1});""")
        await h.pg.wait_for_timeout(500)
        await h.ev("G.manual=true; if (G.state === 'intro') beginPlay(true); addItem('flask', 5); saveWorld(true);")
        world = await h.ev("({id:WORLD.id, meta:SAVE.list.find(m => m.id === WORLD.id), items:countItem('flask')})")
        await h.ev("accountLogout()")
        reloaded_out = await h.ev("G.state === 'accounts' && ACCOUNT.active === null")
        await h.pg.reload(); await h.pg.wait_for_timeout(500)
        signed_out_after_reload = await h.ev("G.state === 'accounts' && ACCOUNT.active === null")
        wrong_password = await h.ev("(async()=>await accountLogin(ACCOUNT.profiles.find(p => p.name === 'Waker'), 'wrong-password'))()")
        correct_login = await h.ev("(async()=>await accountLogin(ACCOUNT.profiles.find(p => p.name === 'Waker'), 'ember-wake-123'))()")
        world_found = await h.ev("SAVE.list.some(m => m.id === %r)" % world['id'])
        await h.ev("(async()=>await openWorld(SAVE.list.find(m => m.id === %r)) )()" % world['id'])
        await h.pg.wait_for_timeout(500)
        await h.ev("G.manual=true; if (G.state === 'intro') beginPlay(false);")
        restored_items = await h.ev("countItem('flask')")
        second_created = await h.ev("(async()=>await accountCreate('Another', 'another-pass-123', 'another-pass-123', 0, 0))()")
        second_has_no_worlds = await h.ev("SAVE.list.length === 0")
        # ---- the board by keyboard ----
        pg = h.pg
        async def key(k, ms=120): await pg.keyboard.press(k); await pg.wait_for_timeout(ms)
        async def until(js, ms=8000):
            for _ in range(ms // 50):
                if await h.ev(js): return True
                await pg.wait_for_timeout(50)
            return False
        await pg.reload(); await pg.wait_for_timeout(600)
        ids = await h.ev("ACCOUNT.profiles.map(p => p.id)")
        last = await h.ev("[LS.get('ew2.last'), ACCOUNT.profiles.find(p => p.name === 'Another').id, ACCOUNT.loginId, UI.focus, Object.keys(localStorage).filter(k => k.startsWith('ew2.last'))]")
        await key('ArrowUp'); chose = await h.ev("[ACCOUNT.profiles.find(p => p.id === ACCOUNT.loginId).name, UI.focus]")
        await pg.keyboard.type('not-the-password'); await key('Enter')
        await until("!ACCOUNT.busy && !!ACCOUNT.msg"); wrong_kb = await h.ev("[G.state, ACCOUNT.msg && ACCOUNT.msg.kind, FORM.accountPassword, UI.focus]")
        await pg.keyboard.type('ember-wake-123'); await key('Enter'); await until("G.state === 'title'")
        await pg.wait_for_timeout(100); signed_kb = await h.ev("[G.state, ACCOUNT.active && ACCOUNT.active.name, KIT.toast && KIT.toast.text, FORM.accountPassword, LS.get('ew2.last')]")
        # Escape, signed in: the A key opens the board on your own row; Escape goes straight home, as its BACK does
        await key('a'); opened = await h.ev("[G.state, ACCOUNT.loginId === ACCOUNT.active.id]")
        await key('Escape'); e1 = await h.ev("[G.state, ACCOUNT.loginId]"); await key('Escape'); e2 = await h.ev("G.state")
        # Escape, signed out: the field lets go, the choice clears, then the board says what to do (and stays)
        await h.ev("accountLogout()"); await pg.wait_for_timeout(100); await h.ev("UI.focus = 'accountPassword'"); await pg.wait_for_timeout(60)
        await key('Escape'); o1 = await h.ev("[UI.focus, !!ACCOUNT.loginId]"); await key('Escape'); o2 = await h.ev("ACCOUNT.loginId"); await key('Escape')
        o3 = await h.ev("[G.state, ACCOUNT.msg && ACCOUNT.msg.kind, ACCOUNT.active]")
        # Tab and Enter on A NEW WAKER: an empty submit marks the name; the three fields by Tab; Enter makes the account
        await h.ev("accountMake()"); await pg.wait_for_timeout(100); await h.ev("UI.focus = null"); await pg.wait_for_timeout(60); await key('Enter')
        empty = await h.ev("[ACCOUNT.form, UI.focus, !!ACCOUNT.err.accountName]")
        await pg.keyboard.type('Third'); await key('Tab'); t1 = await h.ev("UI.focus"); await pg.keyboard.type('third-pass-99'); await key('Tab'); t2 = await h.ev("UI.focus"); await pg.keyboard.type('third-pass-99')
        await key('Enter'); await until("G.state === 'title'")
        made = await h.ev("[G.state, ACCOUNT.active && ACCOUNT.active.name, KIT.toast && KIT.toast.text, FORM.accountPassword, FORM.accountConfirm, !LS.get('ew2.accounts').includes('third-pass-99')]")
        keyboard = {'last': last, 'chose': chose, 'wrong': wrong_kb, 'signed': signed_kb, 'opened': opened, 'esc in': [e1, e2], 'esc out': [o1, o2, o3], 'empty': empty, 'tab': [t1, t2], 'made': made}
        print(keyboard)
        checks = {
            'starts signed out': initial == ['accounts', True],
            'rejects short password': too_short is False,
            'creates account': created is True,
            'migrates guest saves': migrated == [True, True],
            'does not store plaintext password': password_not_stored is True,
            'saves world and inventory': world['meta']['name'] == 'Saved world' and world['items'] == 5,
            'signs out immediately': reloaded_out is True,
            'signs out after reload': signed_out_after_reload is True,
            'rejects wrong password': wrong_password is False,
            'logs in with correct password': correct_login is True,
            'restores account world': world_found is True,
            'restores saved item': restored_items == 5,
            'keeps other profile separate': second_created is True and second_has_no_worlds is True,
            'remembers only the last account id': last[0] == last[1] and last[0] in ids and last[4] == ['ew2.last'] and last[2] == last[1] and last[3] == 'accountPassword',
            'Up chooses a row and readies the password': chose == ['Waker', 'accountPassword'],
            'Enter with a wrong password: stays, says so, clears it, keeps the focus': wrong_kb == ['accounts', 'err', '', 'accountPassword'],
            'Enter signs in, welcomes, forgets the password': signed_kb[:4] == ['title', 'Waker', 'Welcome back, Waker.', ''] and signed_kb[4] == ids[0],
            'A opens the board on your own row': opened == ['accounts', True],
            # (the signed-in card's own row is chosen: Escape does what its BACK does and goes straight home)
            'Escape signed in: straight home, like its BACK': e1[0] == 'title' and e2 == 'title',
            'Escape signed out: field, choice, then a warning': o1 == [None, True] and o2 is None and o3 == ['accounts', 'warn', None],
            'Enter on an empty form marks the name': empty == ['create', 'accountName', True],
            'Tab walks the fields': [t1, t2] == ['accountPassword', 'accountConfirm'],
            'Enter makes the account and welcomes': made == ['title', 'Third', 'Account made. Welcome, Third.', '', '', True]
        }
        print(checks)
        assert all(checks.values()), 'One or more account/save checks failed.'
        print('errors:', h.errs[:8] or 'none')
    finally:
        await h.stop()

asyncio.run(main())
