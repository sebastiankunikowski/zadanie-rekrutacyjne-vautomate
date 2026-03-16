import { useMemo, useRef, useState } from "preact/hooks";
import {
  ArrowUpRight,
  CheckCircle2,
  FileSpreadsheet,
  Info,
  Layers,
  Palette,
  Search,
  ShoppingBag,
  Trash2,
  Upload,
} from "lucide-preact";
import * as XLSX from "xlsx";
import { CleanedProduct, processBatch, Product } from "../utils/processor.ts";
import { Badge, Button, Card, CardContent, Input } from "../components/ui.tsx";

interface Props {
  initialData: CleanedProduct[];
}

export default function MarketplaceDashboard(
  { initialData: propsInitialData }: Props,
) {
  const [data, setData] = useState<CleanedProduct[]>(propsInitialData);
  const [searchTerm, setSearchTerm] = useState("");
  const [exporting, setExporting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredData = useMemo(() => {
    return data.filter((p) =>
      p["NAZWA ORG"].toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.SKU.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.cleanedColor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.allegroTitle.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [data, searchTerm]);

  const handleFileUpload = async (
    e: Event | DragEvent,
  ) => {
    let file: File | null = null;

    if (e.type === "drop" && e instanceof DragEvent) {
      e.preventDefault();
      setIsDragging(false);
      file = e.dataTransfer?.files[0] || null;
    } else if (e.target && "files" in e.target) {
      const target = e.target as HTMLInputElement;
      file = target.files?.[0] || null;
    }

    if (!file) return;

    try {
      const text = await file.text();
      const rawJson = JSON.parse(text);
      const processed = processBatch(rawJson as Product[]);
      setData((prev) => [...processed, ...prev]);
    } catch (err) {
      alert(
        "Błąd podczas wczytywania pliku JSON. Upewnij się, że format jest poprawny.",
      );
      console.error(err);
    }
  };

  const handleExportExcel = () => {
    setExporting(true);
    try {
      const exportData = filteredData.map((p) => ({
        "Nazwa Oryginalna": p["NAZWA ORG"],
        "SKU": p.SKU,
        "Cena": p.normalizedPrice.toFixed(2) + " PLN",
        "EAN": p.EAN,
        "Stan": p.Stany,
        "Wymiary (Ujednolicone)": p.cleanedDimensions,
        "Kolor (Ujednolicony)": p.cleanedColor,
        "Tytuł Allegro": p.allegroTitle,
        "Opis (Oczyszczony)": p.cleanedDescription,
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Produkty");
      XLSX.writeFile(wb, "marketplace_cleaned_data.xlsx");
    } finally {
      setExporting(false);
    }
  };

  const clearData = () => {
    if (confirm("Czy na pewno chcesz wyczyścić wszystkie dane?")) {
      setData([]);
    }
  };

  return (
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header Section */}
      <div class="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-border pb-10">
        <div class="space-y-4">
          <Badge
            variant="secondary"
            class="px-3 py-1 text-[10px] uppercase tracking-widest font-bold bg-primary/5 text-primary border-primary/10"
          >
            Enterprise Data Tools
          </Badge>
          <div class="space-y-1">
            <h1 class="text-4xl font-extrabold tracking-tighter sm:text-5xl">
              Marketplace{" "}
              <span class="text-muted-foreground font-light">AI</span>-Fixer
            </h1>
            <p class="text-muted-foreground text-lg max-w-xl leading-relaxed">
              Profesjonalne narzędzie do ujednolicania i optymalizacji brudnych
              danych eksportowych. Automatyczne czyszczenie opisów, wymiarów i
              kolorów.
            </p>
          </div>
        </div>

        <div class="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={clearData}
            size="lg"
            class="h-12 border-muted-foreground/20 hover:bg-destructive hover:text-destructive-foreground hover:border-destructive transition-all duration-300"
          >
            <Trash2 size={18} class="mr-2" />
            Wyczyść system
          </Button>
          <Button
            onClick={() => fileInputRef.current?.click()}
            size="lg"
            class="h-12 shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            <Upload size={18} class="mr-2" />
            Wgraj nowy JSON
          </Button>
          <input
            type="file"
            ref={fileInputRef}
            class="hidden"
            accept=".json"
            onChange={handleFileUpload}
          />
        </div>
      </div>

      {/* Main Interface Group */}
      <div class="grid grid-cols-1 xl:grid-cols-4 gap-8">
        {/* Left Sidebar: Stats & Info */}
        <div class="xl:col-span-1 space-y-6">
          <Card class="bg-primary text-primary-foreground border-none overflow-hidden relative group">
            <div class="absolute -right-4 -top-4 opacity-10 group-hover:scale-110 transition-transform duration-500">
              <ShoppingBag size={120} />
            </div>
            <CardContent class="p-6 relative z-10">
              <p class="text-primary-foreground/70 text-xs font-bold uppercase tracking-wider mb-1">
                Całkowita baza
              </p>
              <h3 class="text-4xl font-black">{data.length}</h3>
              <div class="mt-4 flex items-center text-[10px] font-medium bg-white/10 w-fit px-2 py-1 rounded">
                <CheckCircle2 size={12} class="mr-1" />
                DANE ZWERYFIKOWANE
              </div>
            </CardContent>
          </Card>

          <div class="grid grid-cols-2 xl:grid-cols-1 gap-4">
            <Card class="border-border/50 bg-card/50 backdrop-blur">
              <CardContent class="p-5 flex items-center gap-4">
                <div class="p-2 rounded-lg bg-secondary text-secondary-foreground">
                  <Layers size={20} />
                </div>
                <div>
                  <p class="text-[10px] font-bold text-muted-foreground uppercase tracking-tight">
                    Pasujące
                  </p>
                  <p class="text-xl font-bold">{filteredData.length}</p>
                </div>
              </CardContent>
            </Card>

            <Card class="border-border/50 bg-card/50 backdrop-blur">
              <CardContent class="p-5 flex items-center gap-4">
                <div class="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
                  <ArrowUpRight size={20} />
                </div>
                <div>
                  <p class="text-[10px] font-bold text-muted-foreground uppercase tracking-tight">
                    Zoptymalizowane
                  </p>
                  <p class="text-xl font-bold">100%</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card class="border-primary/20 bg-primary/5 hidden xl:block">
            <CardContent class="p-5 space-y-3">
              <div class="flex items-center gap-2 text-primary font-bold text-xs uppercase">
                <Info size={14} />
                System logiki
              </div>
              <ul class="text-[11px] space-y-2 text-muted-foreground leading-relaxed">
                <li class="flex items-start gap-2">
                  <span class="text-primary font-bold">•</span>
                  <span>
                    Transformacja jednostek miary (cm/mm) do standardu
                    rynkowego.
                  </span>
                </li>
                <li class="flex items-start gap-2">
                  <span class="text-primary font-bold">•</span>
                  <span>
                    Normalizacja nazw kolorów oraz czyszczenie parametrów
                    "dirty".
                  </span>
                </li>
                <li class="flex items-start gap-2">
                  <span class="text-primary font-bold">•</span>
                  <span>
                    Generowanie tytułów sprzedażowych Allegro (SEO/CTR max 75
                    znaków).
                  </span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Right Content: Table & Actions */}
        <div class="xl:col-span-3 space-y-6">
          {/* Controls Bar */}
          <div class="flex flex-col sm:flex-row gap-4 justify-between items-stretch sm:items-center bg-card p-2 rounded-xl border shadow-sm">
            <div class="relative flex-1">
              <Search
                class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                size={18}
              />
              <Input
                placeholder="Wyszukaj po SKU, nazwie lub parametrach..."
                value={searchTerm}
                onInput={(e) => setSearchTerm(e.currentTarget ? (e.currentTarget as HTMLInputElement).value : "")}
                class="pl-10 h-11 border-none bg-transparent focus-visible:ring-0 text-base"
              />
            </div>
            <div class="flex items-center gap-2 pr-2">
              <Button
                variant="default"
                size="sm"
                class="h-9 px-4 font-bold tracking-tight rounded-lg"
                onClick={handleExportExcel}
                disabled={exporting || filteredData.length === 0}
              >
                <FileSpreadsheet size={16} class="mr-2" />
                Pobierz .XLSX
              </Button>
            </div>
          </div>

          {/* Main Table Container */}
          {data.length > 0
            ? (
              <Card class="border shadow-2xl shadow-primary/5 overflow-hidden">
                <div class="overflow-x-auto">
                  <table class="w-full text-left border-collapse">
                    <thead>
                      <tr class="bg-muted/50 border-b">
                        <th class="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground w-1/3">
                          Produkt & Identyfikator
                        </th>
                        <th class="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                          Parametry
                        </th>
                        <th class="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                          Optymalizacja Allegro
                        </th>
                        <th class="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground text-right italic">
                          Cena & Stan
                        </th>
                      </tr>
                    </thead>
                    <tbody class="divide-y">
                      {filteredData.map((p) => (
                        <tr
                          key={p.SKU}
                          class="group hover:bg-muted/30 transition-colors"
                        >
                          <td class="px-6 py-6">
                            <div class="space-y-1">
                              <div class="font-bold text-base leading-snug group-hover:text-primary transition-colors">
                                {p["NAZWA ORG"]}
                              </div>
                              <div class="flex items-center gap-3 text-[10px] font-mono text-muted-foreground/60">
                                <span class="bg-secondary px-1.5 py-0.5 rounded text-secondary-foreground font-bold">
                                  {p.SKU}
                                </span>
                                {p.EAN && (
                                  <span class="flex items-center gap-1">
                                    <Palette size={10} /> {p.EAN}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td class="px-6 py-6">
                            <div class="flex flex-col gap-2">
                              <div class="flex items-center gap-2">
                                <span class="text-[9px] font-bold text-muted-foreground uppercase tracking-tighter w-12">
                                  Wymiar
                                </span>
                                <Badge
                                  variant="outline"
                                  class="text-[10px] py-0 px-2 font-mono border-muted-foreground/20"
                                >
                                  {p.cleanedDimensions}
                                </Badge>
                              </div>
                              <div class="flex items-center gap-2">
                                <span class="text-[9px] font-bold text-muted-foreground uppercase tracking-tighter w-12">
                                  Kolor
                                </span>
                                <Badge
                                  variant="secondary"
                                  class="text-[10px] py-0 px-2 font-bold"
                                >
                                  {p.cleanedColor}
                                </Badge>
                              </div>
                            </div>
                          </td>
                          <td class="px-6 py-6 max-w-sm">
                            <div class="space-y-2">
                              <div class="text-sm font-bold text-primary/80 leading-tight">
                                {p.allegroTitle}
                              </div>
                              <div class="relative">
                                <p class="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed pl-3 border-l border-border italic">
                                  {p.cleanedDescription}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td class="px-6 py-6 text-right whitespace-nowrap">
                            <div class="text-xl font-black tabular-nums tracking-tighter">
                              {p.normalizedPrice.toFixed(2)}
                              <span class="text-[10px] font-medium ml-1 opacity-50 uppercase">
                                PLN
                              </span>
                            </div>
                            <div
                              class={`text-[10px] font-bold mt-1 uppercase tracking-widest ${
                                p.Stany === 0 || p.Stany === "0"
                                  ? "text-destructive"
                                  : "text-emerald-500"
                              }`}
                            >
                              {p.Stany === 0 || p.Stany === "0"
                                ? "Brak na stanie"
                                : `Dostępne: ${p.Stany}`}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {filteredData.length === 0 && (
                  <div class="py-24 flex flex-col items-center justify-center text-center">
                    <div class="w-16 h-16 rounded-full bg-secondary flex items-center justify-center text-muted-foreground mb-4">
                      <Search size={24} />
                    </div>
                    <h3 class="text-lg font-bold">Brak wyników</h3>
                    <p class="text-sm text-muted-foreground mb-6">
                      Nikogo nie ma w domu dla zapytania "{searchTerm}".
                    </p>
                    <Button variant="outline" onClick={() => setSearchTerm("")}>
                      Wyczyść filtry
                    </Button>
                  </div>
                )}
              </Card>
            )
            : (
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleFileUpload}
                class={`h-[500px] border-2 border-dashed rounded-3xl flex flex-col items-center justify-center transition-all duration-500 ${
                  isDragging
                    ? "border-primary bg-primary/5 scale-[0.99] shadow-inner"
                    : "border-border opacity-50"
                }`}
              >
                <div class="p-8 rounded-full bg-secondary text-secondary-foreground mb-6 shadow-xl animate-bounce">
                  <Upload size={48} />
                </div>
                <h2 class="text-2xl font-black tracking-tight mb-2">
                  Wrzuć plik JSON
                </h2>
                <p class="text-muted-foreground max-w-sm text-center mb-8 px-6 leading-relaxed">
                  Przeciągnij tutaj swój "brudny" eksport danych, aby
                  natychmiastowo go oczyścić i ujednolicić według standardu
                  Enterprise.
                </p>
                <Button
                  size="lg"
                  onClick={() => fileInputRef.current?.click()}
                  class="px-10 h-14 rounded-2xl font-bold shadow-xl shadow-primary/20"
                >
                  Wybierz plik lokalnie
                </Button>
              </div>
            )}
        </div>
      </div>

      {/* Corporate Style Footer */}
      <footer class="pt-20 pb-10 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-6 opacity-30 grayscale hover:grayscale-0 transition-all duration-700">
        <div class="flex items-center gap-2">
          <div class="w-5 h-5 bg-foreground rounded-sm" />
          <p class="text-[9px] font-black uppercase tracking-[0.3em]">
            AI-Fixer Global Operations
          </p>
        </div>
        <div class="flex items-center gap-10 text-[9px] font-black uppercase tracking-widest">
          <a href="#" class="hover:text-primary transition-colors">
            Infra Status
          </a>
          <a href="#" class="hover:text-primary transition-colors">
            Privacy & GDPR
          </a>
          <a href="#" class="hover:text-primary transition-colors">
            v2.4.0-Stable
          </a>
        </div>
      </footer>
    </div>
  );
}
