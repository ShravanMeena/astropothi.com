import { rupees } from "./api";

/**
 * A struck-through price is a claim, not a decoration.
 *
 * India's consumer rules treat a crossed-out number as a representation that
 * the thing was, or is, sold at it. So the rule here is narrow: strike the
 * shelf price only when it is genuinely higher than what we are charging
 * today, and never invent one. If a report is charged at its shelf price the
 * strike simply does not appear.
 */
export type Priced = { price_paise: number; list_paise?: number };

export function priceView(item: Priced | undefined) {
  const now = item?.price_paise ?? 0;
  const list = item?.list_paise ?? 0;
  const discounted = list > now && now > 0;
  return {
    now,
    list,
    discounted,
    nowText: now ? rupees(now) : "…",
    listText: discounted ? rupees(list) : "",
    offPct: discounted ? Math.round(((list - now) / list) * 100) : 0
  };
}
