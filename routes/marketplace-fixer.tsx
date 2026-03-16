import { define } from "../utils.ts";
import MarketplaceDashboard from "../islands/MarketplaceDashboard.tsx";
import { CleanedProduct } from "../utils/processor.ts";

export default define.page(async function MarketplaceFixerPage() {
  // Start with empty data as requested
  const initialData: CleanedProduct[] = [];

  return (
    <div class="min-h-screen bg-background font-sans text-foreground">
      <MarketplaceDashboard initialData={initialData} />
    </div>
  );
});
