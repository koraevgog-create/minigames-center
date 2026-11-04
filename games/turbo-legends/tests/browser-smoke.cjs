'use strict';
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const page=await browser.newPage({viewport:{width:1440,height:800}});
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 try{
  const response=await page.goto('http://127.0.0.1:8765/games/turbo-legends/',{waitUntil:'networkidle'});
  assert.equal(response.status(),200);
  await page.waitForFunction(()=>!!(window.TurboLegends&&window.TurboRacePhysics&&window.TurboRetroRenderer&&window.TurboRaceEvents&&window.TurboSegmentRoad));
  const before=await page.evaluate(()=>({
   menu:!document.getElementById('menu').hidden,version:document.querySelector('.version').textContent,
   tracks:document.getElementById('track').options.length
  }));
  assert.ok(before.menu);assert.match(before.version,/2\.7/);assert.equal(before.tracks,4);
  await page.click('#start');
  const begun=await page.evaluate(()=>({phase:window.TurboLegends.state.phase,grid:window.TurboLegends.state.rivals.length}));
  assert.equal(begun.phase,'countdown');assert.equal(begun.grid,19);
  const grid=await page.evaluate(()=>({front:window.TurboLegends.state.rivals.filter(o=>o.z>0).length,back:window.TurboLegends.state.rivals.filter(o=>o.z<0).length,rank:window.TurboLegends.state.position}));
  assert.equal(grid.front,10);assert.equal(grid.back,9);assert.equal(grid.rank,11);
  const progress=await page.evaluate(()=>{
   const g=window.TurboLegends;g.state.phase='race';g.state.keys.gas=true;
   for(let i=0;i<60*18;i++)g.update(1/60);
   g.state.keys.gas=false;
   return {z:g.state.player.z,speed:g.state.player.speed,position:g.state.position,x:g.state.player.x,
    health:g.state.player.health,pickups:g.state.pickups?.length,lap:g.state.player.lap};
  });
  assert.ok(progress.z>120);
  assert.ok(progress.speed>35);
  assert.ok(progress.position>=1&&progress.position<=20);
  assert.ok(Math.abs(progress.x)<=1.5);
  assert.equal(progress.pickups,21);
  // Real-time simulation must keep pace with wall-clock time at browser frame rate.
  const clock=await page.evaluate(async()=>{
   const g=window.TurboLegends;
   g.state.phase='race';g.state.keys.gas=true;
   const before=g.state.time,start=performance.now();
   await new Promise(resolve=>setTimeout(resolve,1800));
   return {elapsed:(performance.now()-start)/1000,simulated:g.state.time-before,meters:g.state.player.z};
  });
  assert.ok(clock.simulated>clock.elapsed*.79,'physics must not run in slow motion');
  assert.ok(clock.simulated<clock.elapsed*1.25,'physics clock must not run too fast');
  const arcade=await page.evaluate(()=>{
    const g=window.TurboLegends,p=g.state.player,original={...p};
    const speed=100;
    p.speed=speed;
    const before=p.z;
    window.TurboRacePhysics.vehicle(p,{gas:false,brake:false},g.state.track,{maxSpeed:300,handling:1},1/60);
    const delta=p.z-before;
    const pace=window.TurboRacePhysics.worldScale;
    Object.assign(p,original);
    return {delta,pace};
  });
  assert.ok(arcade.pace>=2.5,'arcade world speed factor must be enabled');
  assert.ok(arcade.delta>.95,'100 km/h must traverse substantially over 0.95 world units per physics step');
  const perspective=await page.evaluate(()=>{
   const g=window.TurboLegends;
   const points=window.TurboSegmentRoad.sample(g.state);
   return {near:points[0].scale,distance120:points[5].scale,far:points[55].scale};
  });
  assert.ok(perspective.near>perspective.distance120*1.8,'nearby objects must grow perceptibly');
  assert.ok(perspective.distance120>perspective.far*4,'depth must be legible');
  await page.evaluate(()=>{
   const g=window.TurboLegends;
   g.state.player.z=g.state.track.length*3-0.5;
   g.state.player.speed=230;
   g.state.keys.gas=true;g.update(1/60);
  });
  const final=await page.evaluate(()=>({phase:window.TurboLegends.state.phase,
   finishVisible:!document.getElementById('finish').hidden,
   rows:document.querySelectorAll('#results .result-row').length}));
  assert.equal(final.phase,'finish');
  assert.ok(final.finishVisible);assert.equal(final.rows,20);
  assert.deepEqual(errors,[],'no browser JavaScript exceptions');
  console.log(JSON.stringify({success:true,before,progress,final}));
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
