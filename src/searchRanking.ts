export type SearchableResult = {
  kind: string;
  keywords?: string;
  subtitle: string;
  title: string;
};

const SEARCH_ALIAS_GROUPS = [
  ['ac', 'alternating current'],
  ['adc', 'analog to digital converter', 'analogue to digital converter'],
  ['bjt', 'transistor', 'bipolar transistor', 'bipolar junction transistor'],
  ['comms', 'communications', 'telecommunications'],
  ['dac', 'digital to analog converter', 'digital to analogue converter'],
  ['dc', 'direct current'],
  ['dsp', 'digital signal processing', 'signal processing'],
  ['emi', 'electromagnetic interference'],
  ['emc', 'electromagnetic compatibility'],
  ['fet', 'mosfet', 'field effect transistor'],
  ['fpga', 'field programmable gate array'],
  ['ic', 'integrated circuit', 'chip'],
  ['kcl', 'kirchhoff current law', 'node current law'],
  ['kvl', 'kirchhoff voltage law', 'loop voltage law'],
  ['led', 'light emitting diode'],
  ['mcu', 'microcontroller', 'microcontroller unit'],
  ['op amp', 'opamp', 'operational amplifier'],
  ['pcb', 'printed circuit board', 'circuit board'],
  ['pid', 'proportional integral derivative', 'feedback controller'],
  ['pll', 'phase locked loop'],
  ['pwm', 'pulse width modulation'],
  ['rc', 'resistor capacitor'],
  ['rf', 'radio frequency'],
  ['rlc', 'resistor inductor capacitor'],
  ['rms', 'root mean square'],
  ['snr', 'signal to noise ratio'],
  ['spi', 'serial peripheral interface'],
  ['uart', 'universal asynchronous receiver transmitter'],
  ['vswr', 'voltage standing wave ratio', 'standing wave ratio'],
] as const;

const NORMALIZED_ALIAS_GROUPS = SEARCH_ALIAS_GROUPS.map((group) =>
  group.map(normalizeSearchText),
);

export function normalizeSearchText(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function tokenize(value: string) {
  return normalizeSearchText(value).split(' ').filter(Boolean);
}

function hasAdjacentTransposition(left: string, right: string) {
  if (left.length !== right.length) {
    return false;
  }

  const mismatches: number[] = [];
  for (let index = 0; index < left.length; index += 1) {
    if (left[index] !== right[index]) {
      mismatches.push(index);
      if (mismatches.length > 2) {
        return false;
      }
    }
  }

  return (
    mismatches.length === 2 &&
    mismatches[1] === mismatches[0] + 1 &&
    left[mismatches[0]] === right[mismatches[1]] &&
    left[mismatches[1]] === right[mismatches[0]]
  );
}

function getBoundedEditDistance(left: string, right: string, limit: number) {
  if (Math.abs(left.length - right.length) > limit) {
    return limit + 1;
  }

  let previous = Array.from({ length: right.length + 1 }, (_, index) => index);

  for (let leftIndex = 1; leftIndex <= left.length; leftIndex += 1) {
    const current = [leftIndex];
    let rowMinimum = current[0];

    for (let rightIndex = 1; rightIndex <= right.length; rightIndex += 1) {
      const substitutionCost =
        left[leftIndex - 1] === right[rightIndex - 1] ? 0 : 1;
      current[rightIndex] = Math.min(
        current[rightIndex - 1] + 1,
        previous[rightIndex] + 1,
        previous[rightIndex - 1] + substitutionCost,
      );
      rowMinimum = Math.min(rowMinimum, current[rightIndex]);
    }

    if (rowMinimum > limit) {
      return limit + 1;
    }

    previous = current;
  }

  return previous[right.length];
}

function getTokenMatchCost(queryToken: string, candidateToken: string) {
  if (queryToken === candidateToken) {
    return 0;
  }

  if (queryToken.length >= 3 && candidateToken.startsWith(queryToken)) {
    return 2;
  }

  if (queryToken.length >= 4 && candidateToken.includes(queryToken)) {
    return 4;
  }

  if (queryToken.length < 4 || candidateToken.length < 4) {
    return null;
  }

  if (hasAdjacentTransposition(queryToken, candidateToken)) {
    return 6;
  }

  const distanceLimit =
    Math.max(queryToken.length, candidateToken.length) >= 8 ? 2 : 1;
  const distance = getBoundedEditDistance(
    queryToken,
    candidateToken,
    distanceLimit,
  );

  return distance <= distanceLimit ? 6 + distance : null;
}

function aliasMatchesToken(alias: string, queryToken: string) {
  if (alias.includes(' ')) {
    return alias.replaceAll(' ', '') === queryToken;
  }

  return getTokenMatchCost(queryToken, alias) !== null;
}

function getQueryGroups(query: string) {
  const normalizedQuery = normalizeSearchText(query);
  const compactQuery = normalizedQuery.replaceAll(' ', '');
  const wholeQueryAliasGroup = NORMALIZED_ALIAS_GROUPS.find((group) =>
    group.some(
      (alias) =>
        alias === normalizedQuery || alias.replaceAll(' ', '') === compactQuery,
    ),
  );

  if (wholeQueryAliasGroup) {
    return [wholeQueryAliasGroup];
  }

  return tokenize(normalizedQuery).map((queryToken) => {
    const aliasGroup = NORMALIZED_ALIAS_GROUPS.find((group) =>
      group.some((alias) => aliasMatchesToken(alias, queryToken)),
    );

    return aliasGroup ? [queryToken, ...aliasGroup] : [queryToken];
  });
}

function getAlternativeMatchCost(alternative: string, field: string) {
  if (field === alternative) {
    return 0;
  }

  if (field.startsWith(alternative)) {
    return 1;
  }

  if (` ${field} `.includes(` ${alternative} `)) {
    return 2;
  }

  if (alternative.length >= 4 && field.includes(alternative)) {
    return 4;
  }

  if (alternative.includes(' ')) {
    return null;
  }

  let bestTokenCost: number | null = null;
  for (const fieldToken of tokenize(field)) {
    const tokenCost = getTokenMatchCost(alternative, fieldToken);
    if (
      tokenCost !== null &&
      (bestTokenCost === null || tokenCost < bestTokenCost)
    ) {
      bestTokenCost = tokenCost;
    }
  }

  return bestTokenCost;
}

export function getSearchResultScore(
  result: SearchableResult,
  query: string,
) {
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) {
    return null;
  }

  const fields = [
    { value: normalizeSearchText(result.title), weight: 0 },
    { value: normalizeSearchText(result.kind), weight: 12 },
    { value: normalizeSearchText(result.subtitle), weight: 20 },
    { value: normalizeSearchText(result.keywords ?? ''), weight: 28 },
  ];
  const title = fields[0].value;

  if (title === normalizedQuery) {
    return 0;
  }
  if (title.startsWith(normalizedQuery)) {
    return 1;
  }
  if (` ${title} `.includes(` ${normalizedQuery} `)) {
    return 2;
  }
  if (normalizedQuery.length >= 4 && title.includes(normalizedQuery)) {
    return 3;
  }

  let score = 10;
  for (const alternatives of getQueryGroups(normalizedQuery)) {
    let bestGroupCost: number | null = null;

    for (const alternative of alternatives) {
      for (const field of fields) {
        const matchCost = getAlternativeMatchCost(alternative, field.value);
        if (matchCost === null) {
          continue;
        }

        const weightedCost = field.weight + matchCost;
        if (bestGroupCost === null || weightedCost < bestGroupCost) {
          bestGroupCost = weightedCost;
        }
      }
    }

    if (bestGroupCost === null) {
      return null;
    }

    score += bestGroupCost;
  }

  return score;
}
