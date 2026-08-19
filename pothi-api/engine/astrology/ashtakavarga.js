const BAV_TABLES = {
  Sun: {
    Sun:       [1, 2, 4, 7, 8, 9, 10, 11],
    Moon:      [3, 6, 10, 11],
    Mars:      [1, 2, 4, 7, 8, 9, 10, 11],
    Mercury:   [3, 5, 6, 9, 10, 11, 12],
    Jupiter:   [5, 6, 9, 11],
    Venus:     [6, 7, 12],
    Saturn:    [1, 2, 4, 7, 8, 9, 10, 11],
    Ascendant: [3, 4, 6, 10, 11, 12]
  },
  Moon: {
    Sun:       [3, 6, 7, 8, 10, 11],
    Moon:      [1, 3, 6, 7, 10, 11],
    Mars:      [2, 3, 5, 6, 9, 10, 11],
    Mercury:   [1, 3, 4, 5, 7, 8, 10, 11],
    Jupiter:   [1, 4, 7, 8, 10, 11, 12],
    Venus:     [3, 4, 5, 7, 9, 10, 11],
    Saturn:    [3, 5, 6, 11],
    Ascendant: [3, 6, 10, 11]
  },
  Mars: {
    Sun:       [3, 5, 6, 10, 11],
    Moon:      [3, 6, 11],
    Mars:      [1, 2, 4, 7, 8, 10, 11],
    Mercury:   [3, 5, 6, 11],
    Jupiter:   [6, 10, 11, 12],
    Venus:     [6, 8, 11, 12],
    Saturn:    [1, 4, 7, 8, 9, 10, 11],
    Ascendant: [1, 3, 6, 10, 11]
  },
  Mercury: {
    Sun:       [5, 6, 9, 11, 12],
    Moon:      [2, 4, 6, 8, 10, 11],
    Mars:      [1, 2, 4, 7, 8, 9, 10, 11],
    Mercury:   [1, 3, 5, 6, 9, 10, 11, 12],
    Jupiter:   [6, 8, 11, 12],
    Venus:     [1, 2, 3, 4, 5, 8, 9, 11],
    Saturn:    [1, 2, 4, 7, 8, 9, 10, 11],
    Ascendant: [1, 2, 4, 6, 8, 10, 11]
  },
  Jupiter: {
    Sun:       [1, 2, 3, 4, 7, 8, 9, 10, 11],
    Moon:      [2, 5, 7, 9, 11],
    Mars:      [1, 2, 4, 7, 8, 10, 11],
    Mercury:   [1, 2, 4, 5, 6, 9, 10, 11],
    Jupiter:   [1, 2, 3, 4, 7, 8, 10, 11],
    Venus:     [2, 5, 6, 9, 10, 11],
    Saturn:    [3, 5, 6, 12],
    Ascendant: [1, 2, 4, 5, 6, 7, 9, 10, 11]
  },
  Venus: {
    Sun:       [8, 11, 12],
    Moon:      [1, 2, 3, 4, 5, 8, 9, 11, 12],
    Mars:      [3, 5, 6, 9, 11, 12],
    Mercury:   [3, 5, 6, 9, 11],
    Jupiter:   [5, 8, 9, 10, 11],
    Venus:     [1, 2, 3, 4, 5, 8, 9, 10, 11],
    Saturn:    [3, 4, 5, 8, 9, 10, 11],
    Ascendant: [1, 2, 3, 4, 5, 8, 9, 11]
  },
  Saturn: {
    Sun:       [1, 2, 4, 7, 8, 10, 11],
    Moon:      [3, 6, 11],
    Mars:      [3, 5, 6, 10, 11, 12],
    Mercury:   [6, 8, 9, 10, 11, 12],
    Jupiter:   [5, 6, 11, 12],
    Venus:     [6, 11, 12],
    Saturn:    [3, 5, 6, 11],
    Ascendant: [1, 3, 4, 6, 10, 11]
  }
};

export function computeAshtakavarga(input) {
  const { signIndexByContributor, ascendantSignIndex } = input;
  const benefactors = Object.keys(BAV_TABLES);
  const bavBySign = {};
  const savBySign = new Array(12).fill(0);

  for (const ben of benefactors) {
    const counts = new Array(12).fill(0);
    const table = BAV_TABLES[ben];
    for (const contributor of Object.keys(table)) {
      const contributorSign = signIndexByContributor[contributor];
      if (contributorSign === undefined || contributorSign < 0) continue;
      for (const housePos of table[contributor]) {
        const targetSign = (contributorSign + housePos - 1) % 12;
        counts[targetSign] += 1;
      }
    }
    bavBySign[ben] = counts;
    for (let i = 0; i < 12; i += 1) savBySign[i] += counts[i];
  }

  const asc = ((ascendantSignIndex % 12) + 12) % 12;
  const savByHouse = new Array(12).fill(0);
  for (let i = 0; i < 12; i += 1) savByHouse[i] = savBySign[(asc + i) % 12];

  const total = savBySign.reduce((a, b) => a + b, 0);

  return {
    bavBySign,
    savBySign,
    savByHouse,
    houses: savByHouse.map((score, i) => ({ house: i + 1, score })),
    total
  };
}
