import { define } from "../utils.ts";
import MarketplaceDashboard from "../islands/MarketplaceDashboard.tsx";
import { CleanedProduct, processBatch } from "../utils/processor.ts";

export default define.page(async function MarketplaceFixerPage() {
  let initialData: CleanedProduct[] = [];

  try {
    const rawData = JSON.parse(
      await Deno.readTextFile("./kontekst/partner_export_dirty.json"),
    );
    initialData = processBatch(rawData);
  } catch (err) {
    console.error("Error loading data:", err);
  }

  return (
    <div class="min-h-screen bg-background font-sans text-foreground">
      <MarketplaceDashboard initialData={initialData} />
    </div>
  );
});
