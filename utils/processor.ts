/**
 * Marketplace AI-Fixer Processor
 * 
 * This module cleans and standardizes "dirty" product data.
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
  normalizedPrice: number;
}

/**
 * Normalizes color codes to full market names.
 */
function normalizeColor(name: string): string {
  const n = name.toLowerCase();
  if (n.includes("j. szary") || n.includes("jasnoszary")) return "Jasnoszary";
  if (n.includes("c. szary") || n.includes("ciemnoszary") || n.includes("c_szary")) return "Ciemnoszary";
  if (n.includes("beż")) return "Beżowy";
  if (n.includes("czarny") || n.includes("blk")) return "Czarny";
  if (n.includes("szary")) return "Szary";
  if (n.includes("niebieski")) return "Niebieski";
  if (n.includes("biały")) return "Biały";
  
  // Try to find the color in the name if still ambiguous
  const colors = ["biały", "czarny", "szary", "beżowy", "niebieski", "zielony", "czerwony"];
  for (const c of colors) {
    if (n.includes(c)) return c.charAt(0).toUpperCase() + c.slice(1);
  }
  
  return name;
}

/**
 * Normalizes dimensions to "Szerokość x Długość cm".
 */
function normalizeDimensions(name: string, description: string): string {
  // Try to find formats like 40*60, 40x60, 400x600, 40*060cm
  const combined = (name + " " + description).toLowerCase();
  
  // Pattern 1: 040*060cm or 40*60cm
  const p1 = combined.match(/(\d{2,3})\s*[x*]\s*(\d{2,3})\s*cm/);
  if (p1) {
    const w = parseInt(p1[1]);
    const l = parseInt(p1[2]);
    return `${w} x ${l} cm`;
  }
  
  // Pattern 2: 400x600 mm (convert to cm)
  const p2 = combined.match(/(\d{3,4})\s*[x*]\s*(\d{3,4})\s*mm/);
  if (p2) {
    const w = Math.floor(parseInt(p2[1]) / 10);
    const l = Math.floor(parseInt(p2[2]) / 10);
    return `${w} x ${l} cm`;
  }

  // Pattern 3: just 40x60
  const p3 = combined.match(/(\d{2,3})\s*[x*]\s*(\d{2,3})/);
  if (p3) {
    const w = parseInt(p3[1]);
    const l = parseInt(p3[2]);
    return `${w} x ${l} cm`;
  }

  return "brak danych";
}

/**
 * Cleans the description by removing HTML and parsing internal JSON.
 */
function cleanDescription(desc: string): string {
  if (!desc) return "";
  
  let text = desc;
  
  // Try to parse as JSON
  if (desc.trim().startsWith("{")) {
    try {
      const parsed = JSON.parse(desc);
      if (parsed.sections) {
        text = parsed.sections
          .flatMap((s: any) => s.items || [])
          .map((i: any) => i.content || "")
          .join(" ");
      }
    } catch {
      // Not JSON or malformed
    }
  }
  
  // Remove HTML tags
  text = text.replace(/<[^>]*>?/gm, " ");
  
  // Unescape common HTML entities
  text = text
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
    
  // Clean up whitespace
  return text.trim().replace(/\s+/g, " ");
}

/**
 * Generates an Allegro-friendly sales title (max 75 chars).
 */
function generateAllegroTitle(name: string, color: string, dimensions: string): string {
  // Format: Typ + Model + Kolor + Rozmiar + Wyjątkowa cecha
  const baseType = "Dywanik Łazienkowy";
  const model = "Belweder";
  
  let title = `${baseType} ${model} ${color} ${dimensions}`;
  
  if (title.length > 75) {
    // If too long, try shortening
    title = `${baseType} ${model} ${color} ${dimensions}`;
  }
  
  // Add some sales punch if space allows
  const hooks = ["Antypoślizgowy", "Chłonny", "Luksusowy", "Miękki"];
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
  
  // Price normalization
  let normalizedPrice = 0;
  if (p.Cena) {
    const priceStr = p.Cena.replace(",", ".").replace(/[^\d.]/g, "");
    normalizedPrice = parseFloat(priceStr) || 0;
  }

  return {
    ...p,
    cleanedDimensions,
    cleanedColor,
    cleanedDescription,
    allegroTitle,
    normalizedPrice
  };
}

/**
 * Processes a batch of products.
 */
export function processBatch(data: Product[]): CleanedProduct[] {
  return data.map(processProduct);
}
