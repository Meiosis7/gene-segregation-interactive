const Genetics = (() => {
  const genotypes = ['AA', 'Aa', 'aa'];

  function gametes(genotype) {
    const alleles = [...new Set(genotype)];
    return alleles.map(allele => ({ allele, p: 1 / alleles.length }));
  }

  function combine(egg, sperm) {
    return egg === sperm ? egg + sperm : 'Aa';
  }

  function cross(female, male) {
    const eggs = gametes(female);
    const sperm = gametes(male);
    const totals = { AA: 0, Aa: 0, aa: 0 };
    const cells = eggs.map(egg => sperm.map(pollen => {
      const genotype = combine(egg.allele, pollen.allele);
      const p = egg.p * pollen.p;
      totals[genotype] += p;
      return { genotype, p, egg, sperm: pollen };
    }));
    return {
      eggs, sperm, cells, genotypes: totals,
      phenotypes: { yellow: totals.AA + totals.Aa, green: totals.aa },
    };
  }

  function resolveParents(mode, female, male) {
    if (mode === 'self') return [female, female];
    if (mode === 'test') return [female, 'aa'];
    return [female, male];
  }

  function fertilize(female, male, random = Math.random) {
    const egg = female[Math.floor(random() * 2)];
    const sperm = male[Math.floor(random() * 2)];
    return { egg, sperm, genotype: combine(egg, sperm) };
  }

  return { genotypes, gametes, cross, resolveParents, fertilize };
})();
if (typeof module !== 'undefined') module.exports = Genetics;
