const UI_MIN_G = 2;
const UI_MAX_G = 30;

function assertObject(payload) {
  if (
    payload === null ||
    typeof payload !== "object" ||
    Array.isArray(payload)
  ) {
    throw new Error("request body must be a JSON object");
  }
}

function sum(values) {
  return values.reduce((total, value) => total + value, 0);
}

function arraysEqual(left, right) {
  return (
    left.length === right.length &&
    left.every((value, index) => value === right[index])
  );
}

function compareArrays(left, right) {
  const length = Math.min(left.length, right.length);
  for (let index = 0; index < length; index += 1) {
    if (left[index] !== right[index]) {
      return left[index] - right[index];
    }
  }
  return left.length - right.length;
}

function parseCyclicWord(text) {
  const stripped = text.trim();
  const values =
    stripped.length > 0 && [...stripped].every((character) => "01".includes(character))
      ? [...stripped].map(Number)
      : [...stripped.matchAll(/-?\d+/g)].map((match) => Number(match[0]));

  if (values.length === 0) {
    throw new Error("could not find a cyclic binary word");
  }
  if (values.length % 2 !== 0) {
    throw new Error("a cyclic word must have positive even length 2g");
  }
  if (values.some((value) => value !== 0 && value !== 1)) {
    throw new Error("a cyclic word must contain only 0 and 1");
  }
  if (sum(values) !== values.length / 2) {
    throw new Error(
      "a supersingular cyclic word of length 2g must contain exactly g ones",
    );
  }
  return values;
}

function canonicalWithOffset(values) {
  let canonical = [...values];
  let offset = 0;
  for (let candidateOffset = 1; candidateOffset < values.length; candidateOffset += 1) {
    const candidate = [
      ...values.slice(candidateOffset),
      ...values.slice(0, candidateOffset),
    ];
    if (compareArrays(candidate, canonical) < 0) {
      canonical = candidate;
      offset = candidateOffset;
    }
  }
  return { values: canonical, offset };
}

function aNumber(values) {
  return values.reduce(
    (count, value, index) =>
      count +
      Number(value === 0 && values[(index + 1) % values.length] === 1),
    0,
  );
}

function normalizedHeight(valuations) {
  if (sum(valuations) !== valuations.length) {
    throw new Error("a slope-one cyclic block must satisfy sum(v_i)=rank");
  }
  const heights = Array(valuations.length).fill(0);
  for (let index = 1; index < valuations.length; index += 1) {
    heights[index] = heights[index - 1] + valuations[index - 1] - 1;
  }
  const minimum = Math.min(...heights);
  return heights.map((height) => height - minimum);
}

function exteriorSquareBlocks(values) {
  const g = values.length / 2;
  const rank = values.length;
  const blocks = [];

  for (let shift = 1; shift < g; shift += 1) {
    const valuations = values.map(
      (value, index) => value + values[(index + shift) % rank],
    );
    blocks.push({
      shift,
      valuations,
      heights: normalizedHeight(valuations),
    });
  }

  const valuations = Array.from(
    { length: g },
    (_, index) => values[index] + values[index + g],
  );
  blocks.push({
    shift: g,
    valuations,
    heights: normalizedHeight(valuations),
  });
  return blocks;
}

function cyclicArcsAtLevel(heights, level) {
  const seam = heights.findIndex((height) => height < level);
  if (seam < 0) {
    throw new Error(
      "normalized cyclic heights must have a point below each level",
    );
  }

  const arcs = [];
  let index = (seam + 1) % heights.length;
  while (index !== seam) {
    if (heights[index] >= level) {
      const positions = [];
      while (index !== seam && heights[index] >= level) {
        positions.push(index);
        index = (index + 1) % heights.length;
      }
      arcs.push(positions);
    } else {
      index = (index + 1) % heights.length;
    }
  }
  return arcs;
}

function isSubset(subset, superset) {
  const values = new Set(superset);
  return subset.every((value) => values.has(value));
}

function conjugate(partition) {
  if (partition.length === 0) {
    return [];
  }
  const largest = Math.max(...partition);
  return Array.from(
    { length: largest },
    (_, column) =>
      partition.filter((part) => part >= column + 1).length,
  );
}

function buildWeightedForest(blocks) {
  const vertices = [];
  const edges = [];

  for (const block of blocks) {
    const pExponent = Math.max(...block.heights);
    const levels = new Map();

    for (let level = 1; level <= pExponent; level += 1) {
      const levelVertices = cyclicArcsAtLevel(block.heights, level).map(
        (positions, arcIndex) => {
          const vertex = {
            id: `s${block.shift}q${level}a${arcIndex + 1}`,
            block: block.shift,
            level,
            positions,
            type: positions.length,
            height:
              Math.max(...positions.map((index) => block.heights[index])) -
              level +
              1,
          };
          vertices.push(vertex);
          return vertex;
        },
      );
      levels.set(level, levelVertices);
    }

    for (let level = 2; level <= pExponent; level += 1) {
      for (const child of levels.get(level) ?? []) {
        const candidates = (levels.get(level - 1) ?? []).filter((parent) =>
          isSubset(child.positions, parent.positions),
        );
        if (candidates.length !== 1) {
          throw new Error("a cyclic superlevel arc must have a unique parent");
        }
        const parent = candidates[0];
        const parentIndices = child.positions.map((position) =>
          parent.positions.indexOf(position),
        );
        const minimum = Math.min(...parentIndices);
        const maximum = Math.max(...parentIndices);
        const expected = Array.from(
          { length: maximum - minimum + 1 },
          (_, index) => minimum + index,
        );
        if (!arraysEqual(parentIndices, expected)) {
          throw new Error("a child arc must be contiguous in its parent lift");
        }
        const extensionPower = parent.positions.length - maximum - 2;
        if (extensionPower < 0) {
          throw new Error(
            "a cyclic edge weight must be a nonnegative V-power",
          );
        }
        edges.push({
          child: child.id,
          parent: parent.id,
          extension_power: extensionPower,
          extension_class: `V^${extensionPower}`,
        });
      }
    }
  }

  const children = new Set(edges.map((edge) => edge.child));
  const roots = vertices
    .filter((vertex) => !children.has(vertex.id))
    .map((vertex) => vertex.id);
  const typeSequence = vertices
    .map((vertex) => vertex.type)
    .sort((left, right) => left - right);
  const pExponent = vertices.reduce(
    (maximum, vertex) => Math.max(maximum, vertex.height),
    0,
  );
  const lambdaConjugate = Array.from(
    { length: pExponent },
    (_, index) =>
      vertices.filter((vertex) => vertex.height === index + 1).length,
  );

  return {
    roots,
    vertices,
    edges,
    typeSequence,
    pExponent,
    sigmaArt: sum(typeSequence),
    isogenyPartition: conjugate(lambdaConjugate),
  };
}

function paperBounds(g, aNumberValue, pExponent, sigmaArt) {
  let exponentLower;
  let exponentUpper;
  let exponentUpperFormula;
  let exponentUpperLatex;
  let source;

  if (g === 1) {
    exponentLower = 0;
    exponentUpper = 0;
    exponentUpperFormula = "0 (degree two is trivial)";
    exponentUpperLatex = String.raw`0\quad\text{(degree two is trivial)}`;
    source = "trivial degree-two case";
  } else if (g === 2) {
    exponentLower = 1;
    exponentUpper = 1;
    exponentUpperFormula = "1 (surface case)";
    exponentUpperLatex = String.raw`1\quad\text{(surface case)}`;
    source = "the two abelian-surface cases";
  } else {
    exponentLower = Math.floor((g - 2) / aNumberValue) + 1;
    source = "Theorem F";
    if (aNumberValue === 1) {
      exponentUpper = g - 1;
      exponentUpperFormula = "g − 1 (a = 1)";
      exponentUpperLatex = String.raw`g-1\quad(a=1)`;
    } else if (aNumberValue === 2) {
      exponentUpper = g - 2;
      exponentUpperFormula = "g − 2 (a = 2)";
      exponentUpperLatex = String.raw`g-2\quad(a=2)`;
    } else {
      exponentUpper = g - aNumberValue + 1;
      exponentUpperFormula = "g − a + 1";
      exponentUpperLatex = String.raw`g-a+1`;
    }
  }

  const degreeTwoRank = g * (2 * g - 1);
  const sigmaLower =
    g * (g - 1) - Math.floor((aNumberValue * (aNumberValue - 1)) / 2);

  return {
    source,
    a_number: {
      actual: aNumberValue,
      lower: 1,
      upper: g,
    },
    p_exponent: {
      actual: pExponent,
      lower: exponentLower,
      upper: exponentUpper,
      lower_formula: "⌈(g − 1)/a⌉",
      upper_formula: exponentUpperFormula,
      lower_latex: String.raw`\left\lceil\frac{g-1}{a}\right\rceil`,
      upper_latex: exponentUpperLatex,
    },
    sigma_Art: {
      actual: sigmaArt,
      lower: sigmaLower,
      upper: Math.floor((pExponent * degreeTwoRank) / 2),
      a_number_upper: Math.floor((exponentUpper * degreeTwoRank) / 2),
      lower_formula: "g(g − 1) − C(a, 2)",
      upper_formula: "⌊e g(2g − 1)/2⌋",
      a_number_upper_formula: "⌊E_max(a) g(2g − 1)/2⌋",
      lower_latex: String.raw`g(g-1)-\binom{a}{2}`,
      upper_latex: String.raw`\left\lfloor\frac{eg(2g-1)}{2}\right\rfloor`,
      a_number_upper_latex:
        String.raw`\left\lfloor\frac{E_{\max}(a)g(2g-1)}{2}\right\rfloor`,
      upper_requires_principal_polarization: true,
    },
  };
}

function analyzePayload(payload) {
  assertObject(payload);
  const rawWord = payload.word;
  if (typeof rawWord !== "string" || rawWord.trim().length === 0) {
    throw new Error("word must be a nonempty string");
  }
  const preserveRotation = payload.preserve_rotation ?? false;
  if (typeof preserveRotation !== "boolean") {
    throw new Error("preserve_rotation must be true or false");
  }

  const inputWord = parseCyclicWord(rawWord);
  const g = inputWord.length / 2;
  if (g < UI_MIN_G) {
    throw new Error(
      `the interactive UI supports g >= ${UI_MIN_G}; use the CLI for smaller words`,
    );
  }
  if (g > UI_MAX_G) {
    throw new Error(
      `the interactive UI supports g <= ${UI_MAX_G}; use the CLI for larger words`,
    );
  }

  const canonical = preserveRotation
    ? { values: [...inputWord], offset: 0 }
    : canonicalWithOffset(inputWord);
  const aNumberValue = aNumber(canonical.values);
  const forest = buildWeightedForest(exteriorSquareBlocks(canonical.values));
  const dimension = forest.vertices.length;
  const expectedDimension = Math.floor((g * (g - 1)) / 2);
  if (dimension !== expectedDimension) {
    throw new Error(
      `cyclic domino dimension ${dimension} != binomial(g,2) ${expectedDimension}`,
    );
  }

  return {
    input_word: inputWord,
    canonical_word: canonical.values,
    rotation_to_canonical: canonical.offset,
    g,
    a_number: aNumberValue,
    weighted_forest: {
      roots: forest.roots,
      vertices: forest.vertices.map((vertex) => ({
        id: vertex.id,
        block: vertex.block,
        level: vertex.level,
        type: vertex.type,
        height: vertex.height,
        first_position: vertex.positions[0] + 1,
      })),
      edges: forest.edges,
    },
    invariants: {
      dimension,
      a_number: aNumberValue,
      p_exponent: forest.pExponent,
      type_sequence: forest.typeSequence,
      sigma_Art: forest.sigmaArt,
      isogeny_partition: forest.isogenyPartition,
    },
    paper_bounds: paperBounds(
      g,
      aNumberValue,
      forest.pExponent,
      forest.sigmaArt,
    ),
    scope: {
      determines_isomorphism_class: true,
      retains_original_unit_coefficients: false,
      geometric_realizability_checked: false,
      principal_polarizability_checked: false,
    },
  };
}

function randomInteger(maximumExclusive) {
  if (!Number.isSafeInteger(maximumExclusive) || maximumExclusive <= 0) {
    throw new Error("random range must be a positive integer");
  }
  if (!globalThis.crypto?.getRandomValues) {
    return Math.floor(Math.random() * maximumExclusive);
  }
  const limit =
    Math.floor(0x100000000 / maximumExclusive) * maximumExclusive;
  const buffer = new Uint32Array(1);
  do {
    globalThis.crypto.getRandomValues(buffer);
  } while (buffer[0] >= limit);
  return buffer[0] % maximumExclusive;
}

function sampleWithoutReplacement(values, count) {
  const available = [...values];
  for (let index = 0; index < count; index += 1) {
    const swapIndex = index + randomInteger(available.length - index);
    [available[index], available[swapIndex]] = [
      available[swapIndex],
      available[index],
    ];
  }
  return available.slice(0, count);
}

function randomPositiveComposition(total, parts) {
  if (parts === 1) {
    return [total];
  }
  const candidates = Array.from({ length: total - 1 }, (_, index) => index + 1);
  const cuts = sampleWithoutReplacement(candidates, parts - 1).sort(
    (left, right) => left - right,
  );
  const boundaries = [0, ...cuts, total];
  return boundaries.slice(0, -1).map(
    (boundary, index) => boundaries[index + 1] - boundary,
  );
}

function randomWordPayload(payload) {
  assertObject(payload);
  const g = payload.g;
  if (
    !Number.isInteger(g) ||
    typeof g === "boolean" ||
    g < UI_MIN_G ||
    g > UI_MAX_G
  ) {
    throw new Error(
      `random g must be an integer from ${UI_MIN_G} to ${UI_MAX_G}`,
    );
  }

  const requestedANumber = payload.a_number;
  let selectedANumber;
  if (requestedANumber === null || requestedANumber === undefined) {
    selectedANumber = randomInteger(g) + 1;
  } else if (
    !Number.isInteger(requestedANumber) ||
    typeof requestedANumber === "boolean" ||
    requestedANumber < 1 ||
    requestedANumber > g
  ) {
    throw new Error(
      `random a-number must be an integer from 1 to g = ${g}, or null`,
    );
  } else {
    selectedANumber = requestedANumber;
  }

  const zeroRuns = randomPositiveComposition(g, selectedANumber);
  const oneRuns = randomPositiveComposition(g, selectedANumber);
  const values = [];
  for (let index = 0; index < selectedANumber; index += 1) {
    values.push(...Array(zeroRuns[index]).fill(0));
    values.push(...Array(oneRuns[index]).fill(1));
  }
  const rotation = randomInteger(2 * g);
  const rotated = [...values.slice(rotation), ...values.slice(0, rotation)];

  return {
    word: rotated.join(""),
    g,
    a_number: selectedANumber,
  };
}

globalThis.CyclicDomino = {
  UI_MIN_G,
  UI_MAX_G,
  analyzePayload,
  randomWordPayload,
};
