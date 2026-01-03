export type SplitInput =
  | { userId: string } // EQUAL
  | { userId: string; sharePaise: number } // EXACT
  | { userId: string; percent: number }; // PERCENT (0-100, can be decimals)

export function computeEqualShares(amountPaise: number, userIds: string[]) {
  const n = userIds.length;
  if (n <= 0) throw new Error("No participants");
  const base = Math.floor(amountPaise / n);
  let rem = amountPaise - base * n;

  return userIds.map((userId) => {
    const extra = rem > 0 ? 1 : 0;
    if (rem > 0) rem -= 1;
    return { userId, sharePaise: base + extra };
  });
}

export function computeExactShares(amountPaise: number, splits: { userId: string; sharePaise: number }[]) {
  const sum = splits.reduce((a, s) => a + s.sharePaise, 0);
  if (sum !== amountPaise) throw new Error("Exact splits must sum to total amount");
  return splits;
}

export function computePercentShares(
  amountPaise: number,
  splits: { userId: string; percent: number }[]
) {
  // percent can be decimals; we convert to basis points (2 decimals)
  const bps = splits.map((s) => ({
    userId: s.userId,
    bps: Math.round(s.percent * 100),
  }));

  const totalBps = bps.reduce((a, s) => a + s.bps, 0);
  if (totalBps !== 10000) throw new Error("Percent splits must sum to 100%");

  // initial floor
  const shares = bps.map((s) => ({
    userId: s.userId,
    sharePaise: Math.floor((amountPaise * s.bps) / 10000),
    bps: s.bps,
  }));

  // distribute remainder
  let sumShares = shares.reduce((a, s) => a + s.sharePaise, 0);
  let rem = amountPaise - sumShares;

  // give remainder to largest bps first (stable)
  const order = [...shares].sort((a, b) => b.bps - a.bps);
  let i = 0;
  while (rem > 0) {
    order[i].sharePaise += 1;
    rem -= 1;
    i = (i + 1) % order.length;
  }

  // return in original order (without bps)
  const map = new Map(order.map((s) => [s.userId, s.sharePaise]));
  return splits.map((s) => ({ userId: s.userId, sharePaise: map.get(s.userId)! }));
}

export function ensureUniqueUsers(userIds: string[]) {
  const set = new Set(userIds);
  if (set.size !== userIds.length) throw new Error("Participants must be unique");
}
