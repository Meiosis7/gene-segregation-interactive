const SegregationMotion = (() => {
  const clamp = (n,a=0,b=1) => Math.min(b,Math.max(a,n));
  const progress = (t,a,b) => {const x=clamp((t-a)/(b-a));return x*x*(3-2*x);};
  const mix = (a,b,p) => a+(b-a)*p;
  function frame(time) {
    const t=clamp(time,0,16), zoom=progress(t,0,1.5), separate=progress(t,1.5,4.2);
    const divide=progress(t,4.2,6), split=progress(t,6.3,7.5);
    const spread=progress(t,7,10.7), divide2=progress(t,10.5,12.6), exit=1-progress(t,13,14.3);
    return {
      motherX:mix(59,50,zoom), motherWidth:mix(55,87,zoom), motherHeight:mix(82,76,zoom),
      motherOpacity:1-divide, daughterOpacity:divide*(1-divide2)*exit,
      daughterWidth:mix(43,47,progress(t,8,10)), productOpacity:divide2*exit,
      plantOpacity:1-zoom,
      x:[mix(mix(51,44,zoom),26,separate),mix(mix(67,56,zoom),74,separate)],
      xOpacity:(1-split)*exit, rodsOpacity:split*exit,
      rods:[mix(26,14,spread),mix(26,38,spread),mix(74,62,spread),mix(74,86,spread)],
      spindleOpacity:progress(t,1.1,1.8)*(1-progress(t,4.2,5)),
      poolOpacity:progress(t,14.3,16),
      caption:t<1.5?'聚焦这一对同源染色体':t<4.2?'同源染色体移向相反两极；姐妹染色单体仍相连':t<6?'细胞分裂，A 与 a 进入不同子细胞':t<7.5?'着丝粒分裂，姐妹染色单体开始分开':t<10.5?'每个子细胞内，两条染色体分别移向两极':t<13?'再次分裂，形成 2 个带 A、2 个带 a 的产物':t<14.3?'配子形成结束，接下来观察两个亲本': '转到卵细胞池和精子池，准备随机受精'
    };
  }
  function advance(state,seconds) {
    if(!state.playing)return {...state};
    const time=Math.min(state.end,state.time+Math.max(0,seconds)*state.speed);
    return {...state,time,playing:time<state.end};
  }
  return {frame,advance,progress,mix};
})();
if(typeof module!=='undefined')module.exports=SegregationMotion;
