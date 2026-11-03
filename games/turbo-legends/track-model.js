/* Turbo Legends 1.1: authored track geometry shared between gameplay and radar. */
(()=>{'use strict';
const profiles={
coast:[[.012,.095,1.05],[.19,.26,-1.25],[.32,.38,1.35],[.47,.55,-.78],[.61,.69,1.5],[.76,.83,-1.1],[.90,.95,.65]],
alpine:[[.010,.095,1.25],[.15,.23,-1.65],[.28,.36,1.95],[.40,.48,-1.7],[.54,.61,1.9],[.66,.74,-1.85],[.80,.87,1.4],[.92,.98,-1.05]],
desert:[[.015,.16,1.30],[.22,.29,-1.8],[.36,.46,-.95],[.51,.59,1.65],[.65,.73,-1.35],[.79,.90,1.15]],
night:[[.014,.12,-1.45],[.17,.22,1.7],[.29,.36,1.1],[.43,.49,-1.8],[.56,.65,1.55],[.72,.78,-1.65],[.85,.94,.9]]
};
const smooth=x=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x)};
function curvature(z,track){const x=((z%track.length)+track.length)%track.length/track.length;const entries=profiles[track.theme]||profiles.coast;let result=0;for(const [start,end,strength] of entries){const ramp=Math.min(.022,(end-start)*.27);const enter=smooth((x-start)/ramp),leave=1-smooth((x-(end-ramp))/ramp);result+=strength*enter*leave}return result}
function upcoming(z,track,distance=210){let worst=0;for(let d=0;d<=distance;d+=35){const c=curvature(z+d,track);if(Math.abs(c)>Math.abs(worst))worst=c}return worst}
window.TurboTrackModel={curvature,upcoming,profiles};
})();