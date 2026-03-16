import { useMemo, useRef, useState } from "preact/hooks";
import {
  ArrowUpRight,
  FileSpreadsheet,
  Layers,
  Search,
  ShoppingBag,
  Trash2,
  Upload,
} from "lucide-preact";
import * as XLSX from "xlsx";
import { CleanedProduct, processBatch, Product } from "../utils/processor.ts";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui.tsx";
import ThemeSwitcher from "./ThemeSwitcher.tsx";

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
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Header */}
      <header class="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div class="space-y-1">
          <h1 class="text-3xl font-extrabold tracking-tight lg:text-4xl">
            Marketplace <span class="text-primary/50">AI</span>-Fixer
          </h1>
          <p class="text-muted-foreground text-sm lg:text-base">
            Profesjonalna optymalizacja i ujednolicanie danych produktowych.
          </p>
        </div>
        <div class="flex items-center gap-3">
          <ThemeSwitcher />
          <div class="h-6 w-px bg-border mx-1" />
          <Button variant="outline" size="sm" onClick={clearData} class="h-9">
            <Trash2 size={16} class="mr-2" />
            Wyczyść system
          </Button>
          <Button size="sm" onClick={() => fileInputRef.current?.click()} class="h-9">
            <Upload size={16} class="mr-2" />
            Wczytaj JSON
          </Button>
          <input
            type="file"
            ref={fileInputRef}
            class="hidden"
            accept=".json"
            onChange={handleFileUpload}
          />
        </div>
      </header>

      {/* Stats Section */}
      <div class="grid gap-6 md:grid-cols-3">
        <Card class="relative overflow-hidden">
          <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle class="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Całkowita baza</CardTitle>
            <ShoppingBag size={18} class="text-primary/40" />
          </CardHeader>
          <CardContent>
            <div class="text-3xl font-black">{data.length}</div>
            <p class="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <span class="w-2 h-2 rounded-full bg-green-500"></span>
              Wszystkie jednostki SKU
            </p>
          </CardContent>
        </Card>
        <Card class="relative overflow-hidden">
          <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle class="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Filtrowane</CardTitle>
            <Layers size={18} class="text-primary/40" />
          </CardHeader>
          <CardContent>
            <div class="text-3xl font-black">{filteredData.length}</div>
            <p class="text-xs text-muted-foreground mt-1">Dopasowane do zapytania</p>
          </CardContent>
        </Card>
        <Card class="relative overflow-hidden">
          <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle class="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Status Fixera</CardTitle>
            <ArrowUpRight size={18} class="text-primary/40" />
          </CardHeader>
          <CardContent>
            <div class="text-3xl font-black">100%</div>
            <p class="text-xs text-muted-foreground mt-1">Automatyczna optymalizacja</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Table View */}
      <div class="space-y-6">
        <div class="flex flex-col sm:flex-row gap-4 justify-between items-center bg-muted/30 p-4 rounded-lg border border-border/50">
          <div class="relative w-full sm:max-w-md">
            <Search
              class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              size={18}
            />
            <Input
              placeholder="Wyszukaj produkt, SKU lub tytuł..."
              value={searchTerm}
              onInput={(e) => setSearchTerm(e.currentTarget ? (e.currentTarget as HTMLInputElement).value : "")}
              class="pl-10 h-10 border-none bg-background shadow-none focus-visible:ring-1"
            />
          </div>
          <Button
            variant="secondary"
            onClick={handleExportExcel}
            disabled={exporting || filteredData.length === 0}
            class="w-full sm:w-auto font-bold"
          >
            <FileSpreadsheet size={16} class="mr-2" />
            Pobierz .XLSX
          </Button>
        </div>

        {data.length > 0 ? (
          <div class="rounded-xl border border-border bg-card shadow-sm">
            <Table>
              <TableHeader>
                <TableRow class="hover:bg-transparent">
                  <TableHead class="py-4 pl-6">Produkt & SKU</TableHead>
                  <TableHead class="py-4">Atrybuty</TableHead>
                  <TableHead class="py-4">Optymalizacja Allegro</TableHead>
                  <TableHead class="py-4 pr-6 text-right">Cena & Dostępność</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.map((p) => (
                  <TableRow key={p.SKU}>
                    <TableCell class="py-5 pl-6 align-top">
                      <div class="font-bold text-sm leading-tight mb-1">{p["NAZWA ORG"]}</div>
                      <div class="flex items-center gap-2">
                        <span class="text-[10px] font-mono bg-muted px-1.5 py-0.5 rounded text-muted-foreground">
                          {p.SKU}
                        </span>
                        {p.EAN && (
                          <span class="text-[10px] font-mono text-muted-foreground/60 italic">
                            EAN: {p.EAN}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell class="py-5 align-top">
                      <div class="space-y-2">
                        <div class="flex items-center gap-3">
                          <span class="text-[9px] text-muted-foreground uppercase font-black tracking-tighter w-12">Wymiar</span>
                          <Badge variant="outline" class="text-[10px] font-mono py-0">{p.cleanedDimensions}</Badge>
                        </div>
                        <div class="flex items-center gap-3">
                          <span class="text-[9px] text-muted-foreground uppercase font-black tracking-tighter w-12">Kolor</span>
                          <Badge variant="secondary" class="text-[10px] font-bold py-0">{p.cleanedColor}</Badge>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell class="py-5 align-top max-w-sm lg:max-w-md">
                      <div class="text-sm font-bold text-primary leading-tight mb-2">{p.allegroTitle}</div>
                      <div class="relative">
                        <p class="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed pl-3 border-l border-primary/20 italic">
                          {p.cleanedDescription}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell class="py-5 pr-6 align-top text-right">
                      <div class="text-xl font-black tabular-nums tracking-tighter">
                        {p.normalizedPrice.toFixed(2)}
                        <span class="text-[10px] font-medium ml-1 text-muted-foreground uppercase">PLN</span>
                      </div>
                      <div class={`text-[10px] font-extrabold mt-1 uppercase tracking-widest ${
                        p.Stany === 0 || p.Stany === "0" ? "text-destructive" : "text-emerald-600"
                      }`}>
                        {p.Stany === 0 || p.Stany === "0" ? "Brak w magazynie" : `Dostępne: ${p.Stany}`}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {filteredData.length === 0 && (
              <div class="py-20 flex flex-col items-center justify-center text-center">
                <div class="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground mb-4">
                  <Search size={20} />
                </div>
                <h3 class="font-bold">Brak wyników</h3>
                <p class="text-sm text-muted-foreground">Nie znaleźliśmy produktów pasujących do Twoich filtrów.</p>
              </div>
            )}
          </div>
        ) : (
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleFileUpload}
            class={`h-[450px] border-2 border-dashed rounded-2xl flex flex-col items-center justify-center transition-all duration-300 ${
              isDragging ? "border-primary bg-primary/5 scale-[0.99] shadow-inner" : "border-border/50 bg-muted/20"
            }`}
          >
            <div class="w-16 h-16 rounded-full bg-background border border-border flex items-center justify-center text-muted-foreground mb-6 shadow-sm">
              <Upload size={28} />
            </div>
            <h3 class="text-xl font-bold tracking-tight mb-2">Wrzuć plik JSON</h3>
            <p class="text-muted-foreground text-sm max-w-xs text-center mb-8">
              Przeciągnij tutaj swój "brudny" eksport danych, aby natychmiastowo go oczyścić i ujednolicić.
            </p>
            <Button size="lg" onClick={() => fileInputRef.current?.click()} class="px-8 font-bold">
              Wybierz plik lokalnie
            </Button>
          </div>
        )}
      </div>

      {/* Corporate Footer */}
      <footer class="pt-10 pb-8 border-t border-border/50 flex flex-col md:flex-row items-center justify-between gap-4">
        <div class="flex items-center gap-2">
          <div class="w-4 h-4 bg-primary rounded-[2px]" />
          <p class="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
            Marketplace AI-Fixer v2.5.0
          </p>
        </div>
        <div class="flex items-center gap-8 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
          <span class="hover:text-primary cursor-default transition-colors">Enterprise Solution</span>
          <span class="hover:text-primary cursor-default transition-colors">Data Privacy</span>
        </div>
      </footer>
    </div>
  );
}
