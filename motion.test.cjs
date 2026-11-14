const test = require('node:test');
const assert = require('node:assert/strict');
let M;
try { M = require('./src/motion.js'); } catch {}
test('a separation frame is available between endpoints, retaining the same chromosomes', () => {
  assert.ok(M, 'missing continuous motion model');
  const initial=M.frame(1.5), moving=M.frame(3), end=M.frame(6);
  assert.ok(moving.x[0]<initial.x[0] && moving.x[0]>end.x[0]);
  assert.ok(moving.x[1]>initial.x[1] && moving.x[1]<end.x[1]);
  assert.equal(moving.rodsOpacity,0);
  assert.equal(end.daughterOpacity,1);
  assert.equal(end.motherOpacity,0);
});
test('sister separation starts in the two existing daughter cells and ends in four products', () => {
  assert.ok(M, 'missing continuous motion model');
  const a=M.frame(6),b=M.frame(6.001),mid=M.frame(9),end=M.frame(13);
  assert.ok(Math.abs(a.x[0]-b.x[0])<.01);
  assert.equal(a.rodsOpacity,0);
  assert.equal(mid.xOpacity,0);
  assert.ok(mid.rods[0]<26 && mid.rods[1]>26);
  assert.deepEqual(end.rods,[14,38,62,86]);
  assert.equal(end.productOpacity,1);
  assert.equal(end.daughterOpacity,0);
  assert.equal(end.rodsOpacity,1);
});
test('seeking forward and back gives identical frames and clamps to scene bounds', () => {
  assert.ok(M, 'missing continuous motion model');
  const before=M.frame(8.3); M.frame(15);
  assert.deepEqual(M.frame(8.3),before);
  assert.deepEqual(M.frame(-20),M.frame(0));
  assert.deepEqual(M.frame(50),M.frame(16));
});
test('pause freezes the playhead, slow speed advances continuously and completion clamps', () => {
  assert.ok(M, 'missing continuous motion model');
  const state={time:2,end:6,playing:false,speed:.5};
  assert.equal(M.advance(state,1).time,2);
  assert.equal(M.advance({...state,playing:true},1).time,2.5);
  const done=M.advance({...state,time:5.8,playing:true},1);
  assert.equal(done.time,6);assert.equal(done.playing,false);
});
