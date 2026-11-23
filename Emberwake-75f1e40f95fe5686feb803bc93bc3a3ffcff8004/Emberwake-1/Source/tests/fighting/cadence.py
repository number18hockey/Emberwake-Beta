# Fighting: one press, one swing; timed, alternating hits build a Refrain.
import asyncio
import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'helpers'))
from harness import H

FOE = """(() => { G.enemies.length = 0; const p = G.p, x = floor((p.x + 3) / T) + 3, e = spawnMob('husk', x, heights[x]); e.hp = e.maxhp = 2000; e.frozen = 1; e.stun = 9999; window.FOE = e; p.face = 1; return e.hp; })()"""
AIM = "(() => { const e = FOE; mouse.wx = e.x + 3; mouse.wy = e.y + 8; mouse.x = (mouse.wx - G.rcx) * VS.s; mouse.y = (mouse.wy - G.rcy) * VS.s; })();"


async def prepare(h):
    await h.ev("""(() => { const p=G.p,e=FOE; e.dead=false; e.hp=e.maxhp=2000; e.stun=9999; e.vx=e.vy=0; e.fl={};
      p.x=p.px=e.x-16; p.y=p.py=e.y+e.h-p.h; p.vx=p.vy=0; p.face=1; p.onGround=true; p.state='normal'; p.atk=null; p.buf=null; })()""")


async def tap(h, btn, wait=37):
    await prepare(h)
    press = "mouse.l=mouse.lp=true;" if btn == 'L' else "mouse.r=mouse.rp=true;"
    release = "mouse.l=mouse.lp=false;" if btn == 'L' else "mouse.r=mouse.rp=false;"
    await h.step(1, AIM + press)
    await h.ev(release)
    await h.step(wait, AIM + "FOE.stun=9999;")
    return await h.ev("({cadence:G.p.cadence && {...G.p.cadence}, open:FOE.fl && FOE.fl.open>G.time, move:G.lastMove})")


async def beat_tap(h, btn):
    """Press the opposite attack during the visible recovery beat."""
    last = None
    for _ in range(150):
        state = await h.ev("(() => { const a=G.p.atk, w=attackBeatWindow(a); return w ? {pt:a.pt,from:w.from,to:w.to} : null; })()")
        last = await h.ev("({state:G.p.state,atk:G.p.atk&&{id:G.p.atk.id,phase:G.p.atk.phase,pt:G.p.atk.pt,rec:G.p.atk.m.rec,hit:G.p.atk.hit},cadence:G.p.cadence})")
        if state and state['from'] <= state['pt'] <= state['to']:
            before = await h.ev("({cadence:G.p.cadence && {...G.p.cadence}, open:FOE.fl && FOE.fl.open>G.time})")
            press = "mouse.l=mouse.lp=true;" if btn == 'L' else "mouse.r=mouse.rp=true;"
            release = "mouse.l=mouse.lp=false;" if btn == 'L' else "mouse.r=mouse.rp=false;"
            await h.step(1, AIM + press + "FOE.stun=9999;")
            await h.ev(release)
            for _ in range(120):
                if await h.ev("!!(G.p.atk && G.p.atk.hit)"): break
                await h.step(1, AIM + "FOE.stun=9999;")
            return {'before': before, **await h.ev("({cadence:G.p.cadence && {...G.p.cadence}, open:FOE.fl && FOE.fl.open>G.time, move:G.p.atk && G.p.atk.id})")}
        await h.step(1, AIM + "FOE.stun=9999;")
    raise AssertionError('attack never opened its recovery beat: ' + str(last))


async def main():
    h = await H().start(seed=4242, size=1)
    try:
        await h.ev("inv.fill(null); inv[0]={id:'steel_sword',n:1}; G.sel=0; G.fam={}; G.p.stam=100; G.p.atkN=0;")
        await h.ev(FOE)
        await h.step(4, AIM)

        await prepare(h)
        await h.step(1, AIM + "mouse.l=mouse.lp=true;")
        await h.ev("mouse.lp=false")
        await h.step(90, AIM + "mouse.l=true; FOE.stun=9999;")
        held_starts = await h.ev("G.p.atkN")
        held_progress = await h.ev("G.p.cadence && G.p.cadence.count")

        await h.ev("G.p.cadence=null; G.p.atkN=0;")
        same_first = await tap(h, 'L')
        same_second = await tap(h, 'L')
        assert same_first['cadence'] and same_second['cadence']['count'] == 1, 'repeating the same button should restart the cadence'

        await h.ev("G.p.cadence=null")
        await tap(h, 'L')
        await prepare(h)
        await h.ev("FOE.x=FOE.px=G.p.x+250;")
        await h.step(1, AIM + "mouse.r=mouse.rp=true;")
        await h.ev("mouse.r=mouse.rp=false")
        await h.step(37, AIM + "FOE.stun=9999;")
        missed = await h.ev("G.p.cadence")
        assert not missed, 'a follow-up that misses should not keep the cadence'

        await prepare(h)
        await h.step(1, AIM + "mouse.l=mouse.lp=true;")
        await h.ev("mouse.l=mouse.lp=false")
        second = await beat_tap(h, 'H')
        third = await beat_tap(h, 'L')
        first = second['before']
        second = {k: v for k, v in second.items() if k != 'before'}
        third = {k: v for k, v in third.items() if k != 'before'}
        print('held light starts:', held_starts, 'cadence after its hit:', held_progress)
        print('L -> H -> L:', first, second, third)
        assert held_starts == 1, 'holding light should not start repeat swings'
        assert first['cadence'] and first['cadence']['count'] == 1, 'first landed hit should plant one ember'
        assert second['cadence'] and second['cadence']['count'] == 2, 'alternating hit should create an ECHO beat'
        assert third['open'], 'third alternating hit should land REFRAIN and open its target'
        assert third['cadence'] and third['cadence']['count'] == 1, 'REFRAIN should reset into a fresh cadence'

        await h.ev("inv[0]={id:'wood_shortbow',n:1}; inv[1]={id:'arrow',n:99}; G.sel=0; G.p.cadence=null; G.p.atk=null; G.p.state='normal'; G.p.stam=100;")
        await prepare(h)
        await h.step(10, AIM + "FOE.stun=9999;")
        await h.step(1, AIM + "mouse.l=mouse.lp=true;")
        await h.ev("mouse.l=mouse.lp=false")
        bow_second = await beat_tap(h, 'H')
        bow_third = await beat_tap(h, 'L')
        bow_first = bow_second['before']
        bow_second = {k: v for k, v in bow_second.items() if k != 'before'}
        bow_third = {k: v for k, v in bow_third.items() if k != 'before'}
        print('bow L -> H -> L:', bow_first, bow_second, bow_third)
        assert bow_first['cadence'] and bow_first['cadence']['count'] == 1, 'a landed arrow should plant one ember'
        assert bow_second['cadence'] and bow_second['cadence']['count'] == 2, 'bow heavy should create an ECHO on impact'
        assert bow_third['open'], 'bow REFRAIN should open its target on impact'

        refunds = await h.ev("""(() => {
          const p=G.p,e=FOE,make=(btn,count,paid,perfect=false)=>{const q={btn:btn==='H'?'L':'H',count,until:G.time+48,set:'sword'};p.cadence=q;return {f:p,link:false,cadenceCommitted:false,timed:true,perfect,cadenceBase:{...q},cadenceLink:true,setName:'sword',btn,staminaPaid:paid};};
          p.maxstam=100;p.stam=50;p.stamDelay=25;const echoAtk=make('H',1,20),echoBeat=cadenceStep(echoAtk);cadenceHit(echoAtk,e,echoBeat,e.x+3,e.y+8);const echo={beat:echoBeat,stam:p.stam,delay:p.stamDelay,feed:G.feed[0].name};
          p.stam=50;p.stamDelay=25;const refrainAtk=make('L',2,30),refrainBeat=cadenceStep(refrainAtk);cadenceHit(refrainAtk,e,refrainBeat,e.x+3,e.y+8);const refrain={beat:refrainBeat,stam:p.stam,delay:p.stamDelay,feed:G.feed[0].name};
          G.slowT=0;p.stam=50;p.stamDelay=25;const perfectEchoAtk=make('H',1,20,true),perfectEchoBeat=cadenceStep(perfectEchoAtk);cadenceHit(perfectEchoAtk,e,perfectEchoBeat,e.x+3,e.y+8);const perfectEcho={beat:perfectEchoBeat,stam:p.stam,feed:G.feed[0].name};
          p.stam=50;p.stamDelay=25;const perfectRefrainAtk=make('L',2,30,true),perfectRefrainBeat=cadenceStep(perfectRefrainAtk);cadenceHit(perfectRefrainAtk,e,perfectRefrainBeat,e.x+3,e.y+8);const perfectRefrain={beat:perfectRefrainBeat,stam:p.stam,feed:G.feed[0].name};
          return {echo,refrain,perfectEcho,perfectRefrain,slow:G.slowT,echoMul:cadenceMul(2),refrainMul:cadenceMul(3)};
        })()""")
        print('cadence refunds and damage:', refunds)
        assert refunds['echo']['beat'] == 2 and refunds['echo']['stam'] == 64, 'ECHO should return 70% of the move cost'
        assert refunds['refrain']['beat'] == 3 and refunds['refrain']['stam'] == 88, 'REFRAIN should refund the move plus its 8-stamina surplus'
        assert refunds['echo']['delay'] == refunds['refrain']['delay'] == 0, 'a successful cadence should restart stamina recovery immediately'
        assert refunds['echoMul'] == 1.08 and refunds['refrainMul'] == 1.16, 'cadence should reward timing without a runaway damage multiplier'
        assert refunds['perfectEcho']['stam'] == 70 and refunds['perfectRefrain']['stam'] == 96, 'a perfect beat should refund ECHO fully and add 16 to REFRAIN'
        assert refunds['slow'] >= 6 and refunds['perfectRefrain']['feed'].startswith('PERFECT REFRAIN'), 'the narrow sweet spot should have a distinct flourish and callout'
        print('errors:', h.errs[:5] or 'none')
        assert not h.errs, 'browser reported an error'
    finally:
        await h.stop()


asyncio.run(main())
