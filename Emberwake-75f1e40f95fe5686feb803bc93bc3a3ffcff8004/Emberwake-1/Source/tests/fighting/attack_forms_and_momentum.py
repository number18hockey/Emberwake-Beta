# Fighting: five situational forms, recovery timing, carried momentum and falling air movement.
import asyncio, os, sys
sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'helpers'))
from harness import H


async def main():
    h = await H().start(seed=4242, size=1)
    try:
        await h.ev("inv.fill(null); inv[0]={id:'steel_sword',n:1}; G.sel=0; G.fam={}; WORLD.arena=true; G.enemies.length=0;")
        forms = await h.ev("""(() => {
          const p=G.p, set=MOVESETS.sword, down={wx:p.x+3,wy:p.y+80,md:0,down:false}, up={wx:p.x+3,wy:p.y-80,md:0,down:false}, side={wx:p.x+50,wy:p.y+7,md:0,down:false};
          const reset=(ground,vy=0,vx=0)=>{p.state='normal';p.atk=null;p.buf=null;p.onGround=ground;p.coyote=0;p.vy=vy;p.vx=vx;p.stam=100;p.riposte=0;p.dodgeGrace=0;p.updraft=true;p.airRiseUsed=false;};
          const pick=(name,btn,I,ground,vy=0,vx=0,extra={})=>{reset(ground,vy,vx);Object.assign(p,extra);const ok=startAttack(p,btn,I,false,false);const a=p.atk;const out={ok,id:a&&a.id,form:a&&a.form,crashReady:a&&a.crashReady};if(a)endAttack(p);return out;};
          const out={};
          out.crash=pick('crash','H',down,false,2);
          out.sweep=pick('sweep','H',down,true);
          out.lift=pick('lift','H',up,true);
          out.drive=pick('drive','L',side,false,0,3,{dodgeGrace:4});
          out.riposte=pick('riposte','L',side,true,0,0,{riposte:30});
          return out;
        })()""")
        print('forms:', forms)
        assert forms['crash']['form'] == 'CRASH' and forms['crash']['crashReady'], 'falling heavy down should prime a critical crash'
        assert forms['sweep']['form'] == 'SWEEP', 'grounded heavy down should become a sweep'
        assert forms['lift']['form'] == 'LIFT', 'upward heavy should become a launcher'
        assert forms['drive']['form'] == 'DRIVE', 'a dodge follow-up should become a momentum drive'
        assert forms['riposte']['form'] == 'RIPOSTE', 'a perfect-dodge follow-up should become a riposte'

        fast_beat = await h.ev("""(() => {
          const p=G.p, I={md:0,jumpP:false,jumpH:false,down:false,l:false,r:false,lp:false,rp:true,dodgeP:false,armP:false,wx:p.x+50,wy:p.y+7,faceAim:false};
          p.state='normal';p.atk=null;p.buf=null;p.chainT=0;p.lastMove=null;p.onGround=true;p.coyote=0;p.vx=p.vy=0;p.stam=100;p.hurtT=0;
          startAttack(p,'L',I,false,false);const a=p.atk;a.hit=true;a.tm=.5;a.phase=2;a.pt=attackBeatWindow(a).from;p.cadence={btn:'L',count:1,until:G.time+100,set:'sword'};
          const expectedBeat=a.pt, visible=attackBeatWindow(a);tickFighter(p,I);
          return {expectedBeat,visible,started:p.atk&&p.atk.btn==='H',timed:p.atk&&p.atk.timed,linked:p.atk&&p.atk.cadenceLink,paid:p.atk&&p.atk.staminaPaid,state:p.state,buf:p.buf,active:p.atk&&{id:p.atk.id,btn:p.atk.btn,phase:p.atk.phase},stamina:p.stam};
        })()""")
        print('fast recovery beat:', fast_beat)
        assert fast_beat['expectedBeat'] < 5, 'regression setup should reach the beat before the unscaled recovery threshold'
        assert fast_beat['started'] and fast_beat['timed'] and fast_beat['linked'], 'a displayed fast-weapon beat should accept and link its queued follow-up'
        assert fast_beat['paid'] == 26, 'the follow-up should remember its base and special-move stamina cost for the refund'

        impact = await h.ev("""(() => {
          const p=G.p, e=spawnMob('husk',floor((p.x+3)/T)+3,heights[floor((p.x+3)/T)+3]); e.hp=e.maxhp=5000;e.frozen=1;e.stun=9999;window.TESTFOE=e;
          const reset=(ground,vy=0,vx=0)=>{p.state='normal';p.atk=null;p.onGround=ground;p.coyote=0;p.vy=vy;p.vx=vx;p.stam=100;p.riposte=0;p.dodgeGrace=0;p.updraft=true;p.airRiseUsed=false;p.pogoUsed=false;e.dead=false;e.hp=5000;e.fl={};e.stun=9999;e.vx=e.vy=0;e.onGround=true;};
          const hit=(id,btn,I,ground,vy=0,vx=0,extra={})=>{reset(ground,vy,vx);Object.assign(p,extra);startAttack(p,btn,I,id,false);const a=p.atk,hp=e.hp;applyHit(a,e,e.x+3,e.y+8);const out={form:a.form,ready:a.crashReady,damage:hp-e.hp,vx:e.vx,vy:e.vy};endAttack(p);return out;};
          const down={wx:p.x+3,wy:p.y+80,md:0,down:false}, side={wx:p.x+50,wy:p.y+7,md:0,down:false};
          const random=Math.random;Math.random=()=>.5;
          const crash=hit('meteor_drop','H',down,false,2), fallingTooEarly=hit('meteor_drop','H',down,false,-1);
          const sweep=hit('cyclone','H',down,true);
          const drive=hit('flash_draw','L',side,false,0,3);
          reset(false,2);startAttack(p,'L',side,'talon_dive',false);applyHit(p.atk,e,e.x+3,e.y+8);const pogoFirst={used:p.pogoUsed,vy:p.vy};endAttack(p);
          p.state='normal';p.atk=null;p.onGround=false;p.coyote=0;p.vy=.6;p.stam=100;e.dead=false;e.hp=5000;e.fl={};e.stun=9999;e.vx=e.vy=0;e.onGround=true;
          startAttack(p,'L',side,'talon_dive',false);applyHit(p.atk,e,e.x+3,e.y+8);const pogoSecond={used:p.pogoUsed,vy:p.vy};endAttack(p);
          Math.random=random;
          return {crash,fallingTooEarly,sweep,drive,pogoFirst,pogoSecond};
        })()""")
        print('impact:', impact)
        assert impact['crash']['damage'] > impact['fallingTooEarly']['damage'], 'a correctly timed falling crash should deal its critical bonus'
        assert impact['sweep']['vx'] > 1 and impact['sweep']['vy'] < 0, 'a grounded sweep should shove and trip a grounded foe'
        assert impact['drive']['vx'] > 1, 'a momentum drive should add carried speed to its knockback'
        assert impact['pogoFirst']['used'] and impact['pogoFirst']['vy'] < 0, 'the first dive hit should earn one short rebound'
        assert impact['pogoSecond']['used'] and impact['pogoSecond']['vy'] == .6, 'a second air hit should not refresh the rebound before landing'

        physics = await h.ev("""(() => {
          const p=G.p, I={md:0,jumpP:false,jumpH:false,down:false,l:false,r:false,lp:false,rp:false,dodgeP:false,wx:p.x+40,wy:p.y+5,faceAim:false};
          p.x=p.px=G.p.x;p.y=p.py=max(20,G.p.y-120);p.onGround=false;p.coyote=0;p.vx=0;p.vy=1.4;p.stam=100;p.stamDelay=40;p.airDash=1;p.dodgeCd=0;p.dodgeGrace=0;p.riposte=0;p.atk=null;p.state='normal';
          startDodge(p,1,I);const dodgeBefore=p.vy;tickFighter(p,I);const dodgeAfter=p.vy;
          p.y=p.py=max(20,p.y-80);p.state='normal';p.atk=null;p.onGround=false;p.coyote=0;p.vx=0;p.vy=2;p.airRiseUsed=false;p.pogoUsed=false;p.stam=100;
          startAttack(p,'L',I,'sky_cut1',false);const attackBefore=p.vy;tickFighter(p,I);const attackAfter=p.vy;
          p.atk=null;p.state='normal';p.vy=0;p.airRiseUsed=false;const rise={f:p,m:{rise:-3.5,kind:'swing'},face:1,aimOff:0,th:0};beginActive(rise);const firstRise=p.vy;p.vy=.6;beginActive(rise);const secondRise=p.vy;
          return {dodgeBefore,dodgeAfter,attackBefore,attackAfter,firstRise,secondRise};
        })()""")
        print('air physics:', physics)
        assert physics['dodgeAfter'] > physics['dodgeBefore'], 'an air dodge should preserve downward momentum and gravity'
        assert physics['attackAfter'] > physics['attackBefore'], 'an air attack should not float or cancel falling'
        assert physics['firstRise'] == -3.5 and physics['secondRise'] == .6, 'a rising special should give one lift per airtime'
        print('errors:', h.errs[:5] or 'none')
        assert not h.errs, 'browser reported an error'
    finally:
        await h.stop()


asyncio.run(main())
