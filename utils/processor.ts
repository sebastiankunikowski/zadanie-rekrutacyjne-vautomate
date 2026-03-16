/**
 * Marketplace Fixer Processor
 *
 * This module cleans and standardizes product data for processing.
 */

export interface Product {
  "NAZWA ORG": string;
  "SKU": string;
  "Cena": string;
  "Opis ofe": string;
  "Stany": string | number;
  "EAN": string;
}

export interface MappingConfig {
  stockRanges: { min: number; max: number; status: string }[];
  stockStatusToValue: Record<string, number>;
  currencyMap: Record<string, string>;
  colorMap: Record<string, string>;
}

export interface CleanedProduct extends Product {
  cleanedDimensions: string;
  cleanedColor: string;
  cleanedDescription: string;
  allegroTitle: string;
  titleLength: number;
  isTitleValid: boolean;
  normalizedPrice: number;
  currency: string;
  mappedStock: number;
  stockStatus: string;
}

/**
 * Normalizes color codes to full market names.
 */
function normalizeColor(name: string, config?: MappingConfig): string {
  const n = name.toLowerCase();

  // Use user-defined mapping if available
  if (config?.colorMap) {
    for (const [alias, fullName] of Object.entries(config.colorMap)) {
      if (n.includes(alias.toLowerCase())) return fullName;
    }
  }

  // Default mappings
  if (n.includes("j. szary") || n.includes("jasnoszary")) return "Jasnoszary";
  if (
    n.includes("c. szary") || n.includes("ciemnoszary") || n.includes("c_szary")
  ) return "Ciemnoszary";
  if (n.includes("beż")) return "Beżowy";
  if (n.includes("czarny") || n.includes("blk")) return "Czarny";
  if (n.includes("szary")) return "Szary";
  if (n.includes("niebieski")) return "Niebieski";
  if (n.includes("biały")) return "Biały";

  const colors = [
    "biały",
    "czarny",
    "szary",
    "beżowy",
    "niebieski",
    "zielony",
    "czerwony",
  ];
  for (const c of colors) {
    if (n.includes(c)) return c.charAt(0).toUpperCase() + c.slice(1);
  }

  return name;
}

/**
 * Normalizes dimensions to "Szerokość x Długość cm".
 */
function normalizeDimensions(name: string, description: string): string {
  const combined = (name + " " + description).toLowerCase();

  const p1 = combined.match(/(\d{2,3})\s*[x*]\s*(\d{2,3})\s*cm/);
  if (p1) return `${parseInt(p1[1])} x ${parseInt(p1[2])} cm`;

  const p2 = combined.match(/(\d{3,4})\s*[x*]\s*(\d{3,4})\s*mm/);
  if (p2) return `${Math.floor(parseInt(p2[1]) / 10)} x ${Math.floor(parseInt(p2[2]) / 10)} cm`;

  const p3 = combined.match(/(\d{2,3})\s*[x*]\s*(\d{2,3})/);
  if (p3) return `${parseInt(p3[1])} x ${parseInt(p3[2])} cm`;

  return "brak danych";
}

/**
 * Cleans the description.
 */
function cleanDescription(desc: string): string {
  if (!desc) return "";
  let text = desc;

  if (desc.trim().startsWith("{")) {
    try {
      const parsed = JSON.parse(desc);
      if (parsed.sections) {
        text = parsed.sections
          .flatMap((s: any) => s.items || [])
          .map((i: any) => i.content || "")
          .join(" ");
      }
    } catch { }
  }

  text = text.replace(/<[^>]*>?/gm, " ");
  text = text
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");

  return text.trim().replace(/\s+/g, " ");
}

/**
 * Maps stock values.
 */
function mapStock(stany: string | number, config?: MappingConfig): { count: number; status: string } {
  let count = 0;
  let status = "Nieznany";

  if (typeof stany === "number") {
    count = stany;
  } else {
    const s = stany.toLowerCase();
    // Check status to value map
    if (config?.stockStatusToValue && config.stockStatusToValue[s] !== undefined) {
      count = config.stockStatusToValue[s];
    } else {
      const parsed = parseInt(s.replace(/[^\d]/g, ""));
      count = !isNaN(parsed) ? parsed : 0;
    }
  }

  // Determine status from ranges
  if (config?.stockRanges) {
    for (const range of config.stockRanges) {
      if (count >= range.min && count <= range.max) {
        status = range.status;
        break;
      }
    }
  } else {
    // Default fallback
    status = count > 10 ? "Wysoki" : count > 0 ? "Niski" : "Brak";
  }

  return { count, status };
}

/**
 * Normalizes price and currency.
 */
function normalizePrice(priceStr: string, config?: MappingConfig): { price: number; currency: string } {
  if (!priceStr) {
    return {
      price: 0,
      currency: config?.currencyMap?.[""] || "PLN"
    };
  }

  const cleanPrice = priceStr.replace(",", ".").replace(/[^\d.]/g, "");
  const price = parseFloat(cleanPrice) || 0;

  let currency = "";
  if (priceStr.toUpperCase().includes("EUR")) currency = "EUR";
  else if (priceStr.toUpperCase().includes("USD")) currency = "USD";
  else if (priceStr.toUpperCase().includes("PLN")) currency = "PLN";

  // Map currency if defined
  if (config?.currencyMap && config.currencyMap[currency] !== undefined) {
    currency = config.currencyMap[currency];
  } else if (!currency) {
    currency = config?.currencyMap?.[""] || "PLN";
  }

  return { price, currency };
}

/**
 * Generates an Allegro-friendly sales title (max 75 chars).
 */
function generateAllegroTitle(
  _name: string,
  color: string,
  dimensions: string,
): string {
  const baseType = "Dywanik Łazienkowy";
  const model = "Belweder";

  // Optimization strategy: Type + Model + Feature + Color + Size
  let title = `${baseType} ${model} Miękki ${color} ${dimensions}`;

  if (title.length > 75) {
    title = `${baseType} ${model} ${color} ${dimensions}`;
  }

  const hooks = ["Antypoślizgowy", "Chłonny", "Luksusowy", "Premium"];
  for (const hook of hooks) {
    if ((title + " " + hook).length <= 75) {
      title += " " + hook;
    }
  }

  return title.slice(0, 75).trim();
}

/**
 * Processes a single product entry.
 */
export function processProduct(p: Product, config?: MappingConfig): CleanedProduct {
  const cleanedColor = normalizeColor(p["NAZWA ORG"], config);
  const cleanedDimensions = normalizeDimensions(p["NAZWA ORG"], p["Opis ofe"]);
  const cleanedDescription = cleanDescription(p["Opis ofe"]);
  const allegroTitle = generateAllegroTitle(p["NAZWA ORG"], cleanedColor, cleanedDimensions);

  const { count, status } = mapStock(p.Stany, config);
  const { price, currency } = normalizePrice(p.Cena, config);

  return {
    ...p,
    cleanedDimensions,
    cleanedColor,
    cleanedDescription,
    allegroTitle,
    titleLength: allegroTitle.length,
    isTitleValid: allegroTitle.length <= 75,
    normalizedPrice: price,
    currency,
    mappedStock: count,
    stockStatus: status,
  };
}

/**
 * Processes a batch of products.
 */
export function processBatch(data: Product[], config?: MappingConfig): CleanedProduct[] {
  return data.map(p => processProduct(p, config));
}
