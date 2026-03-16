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
function normalizeColor(name: string): string {
  const n = name.toLowerCase();
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
function mapStock(stany: string | number): { count: number; status: string } {
  if (typeof stany === "number") {
    return {
      count: stany,
      status: stany > 10 ? "Wysoki" : stany > 0 ? "Niski" : "Brak",
    };
  }

  const s = stany.toLowerCase();
  if (s === "dużo") return { count: 50, status: "Wysoki" };
  if (s === "średnio") return { count: 15, status: "Średni" };
  if (s === "mało") return { count: 5, status: "Niski" };
  if (s === "brak" || s === "0") return { count: 0, status: "Brak" };

  const parsed = parseInt(s.replace(/[^\d]/g, ""));
  if (!isNaN(parsed)) {
    return mapStock(parsed);
  }

  return { count: 0, status: "Nieznany" };
}

/**
 * Normalizes price and currency.
 */
function normalizePrice(priceStr: string): { price: number; currency: string } {
  if (!priceStr) return { price: 0, currency: "PLN" };

  const cleanPrice = priceStr.replace(",", ".").replace(/[^\d.]/g, "");
  const price = parseFloat(cleanPrice) || 0;

  let currency = "PLN";
  if (priceStr.toUpperCase().includes("EUR")) currency = "EUR";
  if (priceStr.toUpperCase().includes("USD")) currency = "USD";

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
export function processProduct(p: Product): CleanedProduct {
  const cleanedColor = normalizeColor(p["NAZWA ORG"]);
  const cleanedDimensions = normalizeDimensions(p["NAZWA ORG"], p["Opis ofe"]);
  const cleanedDescription = cleanDescription(p["Opis ofe"]);
  const allegroTitle = generateAllegroTitle(p["NAZWA ORG"], cleanedColor, cleanedDimensions);

  const { count, status } = mapStock(p.Stany);
  const { price, currency } = normalizePrice(p.Cena);

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
export function processBatch(data: Product[]): CleanedProduct[] {
  return data.map(processProduct);
}
