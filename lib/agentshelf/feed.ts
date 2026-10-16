import Papa from "papaparse";
export type Product = {
  title: string;
  brand: string;
  description: string;
  sku: string;
  gtin: string;
  category: string;
  price: string;
  currency: string;
  availability: string;
  image: string;
  size: string;
  colour: string;
  material: string;
  shipping: string;
  returns: string;
  variants: string;
};
export type FeedResult = {
  products: Product[];
  issues: {
    row: number;
    field: string;
    level: "required" | "recommended" | "optional";
    message: string;
  }[];
  completeness: number | null;
  proposedCsv: string;
  schemaExamples?: { row: number; schema: ReturnType<typeof schemaExample> }[];
};
const aliases: Record<keyof Product, string[]> = {
  title: ["title", "name"],
  brand: ["brand", "vendor"],
  description: ["description", "body (html)"],
  sku: ["sku", "variant sku"],
  gtin: ["gtin", "barcode", "variant barcode"],
  category: ["category", "product category", "type"],
  price: ["price", "variant price"],
  currency: ["currency"],
  availability: ["availability", "status"],
  image: ["image", "image src", "image link"],
  size: ["size"],
  colour: ["colour", "color"],
  material: ["material"],
  shipping: ["shipping"],
  returns: ["returns", "return policy"],
  variants: ["variants", "option1 value"],
};
export function validateFeed(csv: string): FeedResult {
  if (Buffer.byteLength(csv) > 1_000_000)
    throw new Error("CSV must be smaller than 1 MB.");
  const parsed = Papa.parse<Record<string, string>>(csv, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim().toLowerCase(),
  });
  if (parsed.errors.length)
    throw new Error(`CSV validation: ${parsed.errors[0].message}`);
  if (parsed.data.length > 500)
    throw new Error("Import at most 500 rows per assessment.");
  if (!parsed.meta.fields?.some((h) => aliases.title.includes(h)))
    throw new Error("A Title or Name column is required.");
  const products = parsed.data.map(
    (row) =>
      Object.fromEntries(
        Object.entries(aliases).map(([field, headers]) => [
          field,
          headers
            .map((h) => row[h])
            .find((v) => v?.trim())
            ?.trim() || "",
        ]),
      ) as Product,
  );
  const issues: FeedResult["issues"] = [];
  products.forEach((p, i) => {
    for (const field of [
      "title",
      "description",
      "price",
      "currency",
      "availability",
      "image",
    ] as const) {
      if (!p[field])
        issues.push({
          row: i + 2,
          field,
          level: "required",
          message: `Missing ${field}. Required by this AgentShelf core rubric, not a universal platform mandate.`,
        });
    }
    if (p.price && (!Number.isFinite(Number(p.price)) || Number(p.price) < 0))
      issues.push({
        row: i + 2,
        field: "price",
        level: "required",
        message: "Price must be a finite non-negative number.",
      });
    if (
      p.currency &&
      !new Set(Intl.supportedValuesOf("currency")).has(p.currency)
    )
      issues.push({
        row: i + 2,
        field: "currency",
        level: "required",
        message: "Use a three-letter ISO currency code.",
      });
    if (
      p.availability &&
      !/^(in[ _]?stock|out[ _]?of[ _]?stock|pre[ _]?order|back[ _]?order|limited[ _]?availability|discontinued|sold[ _]?out)$/i.test(
        p.availability,
      )
    )
      issues.push({
        row: i + 2,
        field: "availability",
        level: "required",
        message:
          "Supply an explicit inventory availability value; a Shopify publishing status such as active does not establish stock availability.",
      });
    if (p.image && !/^https:\/\//.test(p.image))
      issues.push({
        row: i + 2,
        field: "image",
        level: "recommended",
        message: "Use a public HTTPS image URL.",
      });
    for (const field of [
      "brand",
      "sku",
      "category",
      "shipping",
      "returns",
    ] as const)
      if (!p[field])
        issues.push({
          row: i + 2,
          field,
          level: "recommended",
          message: `Add ${field} where applicable.`,
        });
    if (p.gtin && !validGtin(p.gtin))
      issues.push({
        row: i + 2,
        field: "gtin",
        level: "recommended",
        message:
          "GTIN length or check digit is invalid. Do not invent identifiers.",
      });
    if (!p.material)
      issues.push({
        row: i + 2,
        field: "material",
        level: "optional",
        message: "Add material only if applicable and verified.",
      });
  });
  const invalidCore = new Set(
    issues
      .filter((i) => i.level === "required")
      .map((i) => `${i.row}:${i.field}`),
  );
  const completeness = products.length
    ? Math.round(
        (100 *
          products.reduce(
            (n, p, i) =>
              n +
              [
                "title",
                "description",
                "price",
                "currency",
                "availability",
                "image",
              ].filter(
                (k) =>
                  Boolean(p[k as keyof Product]) &&
                  !invalidCore.has(`${i + 2}:${k}`),
              ).length,
            0,
          )) /
          (products.length * 6),
      )
    : null;
  const safe = (v: string) => (/^[=+\-@\t\r]/.test(v) ? `'${v}` : v);
  return {
    products,
    issues,
    completeness,
    schemaExamples: products
      .slice(0, 20)
      .map((p, i) => ({ row: i + 2, schema: schemaExample(p) })),
    proposedCsv: Papa.unparse(
      products.map((p, i) => ({
        ...Object.fromEntries(Object.entries(p).map(([k, v]) => [k, safe(v)])),
        proposed_changes: issues
          .filter((x) => x.row === i + 2)
          .map((x) => x.message)
          .join(" | "),
      })),
    ),
  };
}
export function validGtin(value: string) {
  if (!/^(\d{8}|\d{12}|\d{13}|\d{14})$/.test(value)) return false;
  const digits = value.split("").map(Number);
  const check = digits.pop();
  return (
    (10 -
      (digits
        .reverse()
        .reduce((sum, d, i) => sum + d * (i % 2 === 0 ? 3 : 1), 0) %
        10)) %
      10 ===
    check
  );
}
export function schemaExample(p: Product) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.title,
    description: p.description,
    sku: p.sku || undefined,
    ...(p.brand ? { brand: { "@type": "Brand", name: p.brand } } : {}),
    image: p.image || undefined,
    offers: {
      "@type": "Offer",
      price: p.price,
      priceCurrency: p.currency,
      availability:
        p.availability.toLowerCase() === "in stock"
          ? "https://schema.org/InStock"
          : undefined,
    },
  };
}
