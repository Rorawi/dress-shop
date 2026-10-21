export interface CatalogColorOption {
  key: string;
  name: string;
  hex: string;
}

const namedColors: Array<[string, string]> = [
  ["black", "#17141C"],
  ["white", "#FFFFFF"],
  ["purple", "#6F36A8"],
  ["violet", "#7542B8"],
  ["lilac", "#B79AD8"],
  ["lavender", "#B79AD8"],
  ["pink", "#E9A5BC"],
  ["blush", "#E9A5BC"],
  ["red", "#C83D4D"],
  ["burgundy", "#721C3D"],
  ["maroon", "#721C3D"],
  ["blue", "#3976B8"],
  ["navy", "#26345E"],
  ["green", "#4D8A5B"],
  ["olive", "#697252"],
  ["brown", "#80543D"],
  ["tan", "#C49A6C"],
  ["beige", "#D3C4A2"],
  ["cream", "#F3EBDD"],
  ["yellow", "#E5C545"],
  ["orange", "#D97B35"],
  ["gray", "#89858E"],
  ["grey", "#89858E"],
  ["silver", "#BFC2C8"],
  ["gold", "#C6A04A"],
];

export function colorKey(value: string) {
  return value.trim().toLocaleLowerCase();
}

export function toCatalogColorOption(value: string): CatalogColorOption {
  const name = value.trim() || "Default";
  const key = colorKey(name);
  const explicitHex = name.match(/#[\da-f]{3}(?:[\da-f]{3})?(?:[\da-f]{2})?/i)?.[0];
  const namedColor = namedColors.find(([needle]) => key.includes(needle));
  return { key, name, hex: explicitHex ?? namedColor?.[1] ?? "#B8B2BF" };
}

export function getCatalogColorOptions(values: string[]): CatalogColorOption[] {
  const options = new Map<string, CatalogColorOption>();
  for (const value of values) {
    const option = toCatalogColorOption(value);
    if (option.key !== "default" && !options.has(option.key)) options.set(option.key, option);
  }
  return [...options.values()];
}
