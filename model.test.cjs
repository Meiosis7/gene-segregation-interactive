const assert = require('node:assert/strict');
const test = require('node:test');
const { gametes, cross, fertilize, resolveParents } = require('./src/genetics.js');

test('each gamete carries one allele with the Mendelian probability', () => {
  assert.deepEqual(gametes('AA'), [{ allele: 'A', p: 1 }]);
  assert.deepEqual(gametes('Aa'), [{ allele: 'A', p: 0.5 }, { allele: 'a', p: 0.5 }]);
  assert.deepEqual(gametes('aa'), [{ allele: 'a', p: 1 }]);
});

test('all nine parental combinations yield the expected distribution', () => {
  const combinations = [
    ['AA', 'AA', [1, 0, 0]], ['AA', 'Aa', [0.5, 0.5, 0]], ['AA', 'aa', [0, 1, 0]],
    ['Aa', 'AA', [0.5, 0.5, 0]], ['Aa', 'Aa', [0.25, 0.5, 0.25]], ['Aa', 'aa', [0, 0.5, 0.5]],
    ['aa', 'AA', [0, 1, 0]], ['aa', 'Aa', [0, 0.5, 0.5]], ['aa', 'aa', [0, 0, 1]],
  ];
  for (const [female, male, expected] of combinations) {
    const result = cross(female, male);
    assert.deepEqual(Object.values(result.genotypes), expected);
    assert.deepEqual(Object.values(result.phenotypes), [expected[0] + expected[1], expected[2]]);
    assert.equal(result.cells.flat().reduce((sum, cell) => sum + cell.p, 0), 1);
  }
});

test('self and testcross constrain the pollen parent', () => {
  assert.deepEqual(resolveParents('self', 'aa', 'Aa'), ['aa', 'aa']);
  assert.deepEqual(resolveParents('test', 'AA', 'Aa'), ['AA', 'aa']);
  assert.deepEqual(resolveParents('custom', 'aa', 'AA'), ['aa', 'AA']);
});

test('fertilization independently draws each parental allele', () => {
  for (const [rolls, expected] of [
    [[0, 0], 'AA'], [[0, 0.5], 'Aa'], [[0.5, 0], 'Aa'], [[0.5, 0.5], 'aa'],
  ]) {
    assert.equal(fertilize('Aa', 'Aa', () => rolls.shift()).genotype, expected);
    assert.equal(rolls.length, 0);
  }
  assert.deepEqual(fertilize('aa', 'AA', () => 0.99), { egg: 'a', sperm: 'A', genotype: 'Aa' });
});
