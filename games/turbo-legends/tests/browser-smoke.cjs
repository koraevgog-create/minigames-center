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
  await page.waitForFunction(()=>!!(window.TurboLegends&&window.TurboRacePhysics&&window.TurboRetroRenderer&&window.TurboRaceEvents));
  const before=await page.evaluate(()=>({
   menu:!document.getElementById('menu').hidden,version:document.querySelector('.version').textContent,
   tracks:document.getElementById('track').options.length
  }));
  assert.ok(before.menu);assert.match(before.version,/2\.0/);assert.equal(before.tracks,4);
  await page.click('#start');
  const begun=await page.evaluate(()=>({phase:window.TurboLegends.state.phase,grid:window.TurboLegends.state.rivals.length}));
  assert.equal(begun.phase,'countdown');assert.equal(begun.grid,19);
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
