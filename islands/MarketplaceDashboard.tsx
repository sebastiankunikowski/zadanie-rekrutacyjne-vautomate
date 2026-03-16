import { useMemo, useRef, useState } from "preact/hooks";
import {
  ArrowUpRight,
  Check,
  ChevronRight,
  FileJson,
  FileSpreadsheet,
  Layers,
  Search,
  ShoppingBag,
  Trash2,
  Upload,
  X,
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

interface UploadedFile {
  id: string;
  name: string;
  data: CleanedProduct[];
  timestamp: number;
}

export default function MarketplaceDashboard(
  { initialData: _propsInitialData }: Props,
) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [activeFileId, setActiveFileId] = useState<string | "all">("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [exporting, setExporting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const allData = useMemo(() => {
    if (activeFileId === "all") {
      return files.flatMap((f) => f.data);
    }
    return files.find((f) => f.id === activeFileId)?.data || [];
  }, [files, activeFileId]);

  const filteredData = useMemo(() => {
    return allData.filter((p) =>
      p["NAZWA ORG"].toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.SKU.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.cleanedColor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.allegroTitle.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [allData, searchTerm]);

  const handleFilesUpload = async (e: Event | DragEvent) => {
    let uploadedFiles: FileList | null = null;

    if (e.type === "drop" && e instanceof DragEvent) {
      e.preventDefault();
      setIsDragging(false);
      uploadedFiles = e.dataTransfer?.files || null;
    } else if (e.target && "files" in e.target) {
      const target = e.target as HTMLInputElement;
      uploadedFiles = target.files || null;
    }

    if (!uploadedFiles) return;

    const newFiles: UploadedFile[] = [];

    for (let i = 0; i < uploadedFiles.length; i++) {
      const file = uploadedFiles[i];
      if (file.type !== "application/json" && !file.name.endsWith(".json")) continue;

      try {
        const text = await file.text();
        const rawJson = JSON.parse(text);
        const processed = processBatch(rawJson as Product[]);
        newFiles.push({
          id: Math.random().toString(36).substring(7),
          name: file.name,
          data: processed,
          timestamp: Date.now(),
        });
      } catch (err) {
        console.error(`Błąd w pliku ${file.name}:`, err);
      }
    }

    if (newFiles.length > 0) {
      setFiles((prev) => [...prev, ...newFiles]);
      if (files.length === 0 && newFiles.length === 1) {
        setActiveFileId(newFiles[0].id);
      } else {
        setActiveFileId("all");
      }
    }
  };

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
    if (activeFileId === id) setActiveFileId("all");
  };

  const handleExportExcel = () => {
    setExporting(true);
    try {
      const exportData = filteredData.map((p) => ({
        "Nazwa Oryginalna": p["NAZWA ORG"],
        "SKU": p.SKU,
        "Cena": p.normalizedPrice.toFixed(2) + " " + p.currency,
        "EAN": p.EAN,
        "Stan": p.mappedStock,
        "Status Stanu": p.stockStatus,
        "Wymiary (Ujednolicone)": p.cleanedDimensions,
        "Kolor (Ujednolicony)": p.cleanedColor,
        "Tytuł Allegro": p.allegroTitle,
        "Długość Tytułu": p.titleLength,
        "Opis (Oczyszczony)": p.cleanedDescription,
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Produkty");
      XLSX.writeFile(wb, `marketplace_export_${new Date().getTime()}.xlsx`);
    } finally {
      setExporting(false);
    }
  };

  const clearAll = () => {
    if (confirm("Czy na pewno chcesz usunąć wszystkie pliki?")) {
      setFiles([]);
      setActiveFileId("all");
    }
  };

  return (
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <header class="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div class="space-y-1">
          <h1 class="text-3xl font-extrabold tracking-tight lg:text-4xl">
            Marketplace Fixer
          </h1>
          <p class="text-muted-foreground text-sm lg:text-base">
            Ujednolicaj i optymalizuj dane produktowe do obróbki.
          </p>
        </div>
        <div class="flex items-center gap-3">
          <ThemeSwitcher />
          <div class="h-6 w-px bg-border mx-1" />
          <Button variant="outline" size="sm" onClick={clearAll} class="h-9">
            <Trash2 size={16} class="mr-2" />
            Wyczyść wszystko
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
            multiple
            onChange={handleFilesUpload}
          />
        </div>
      </header>

      {/* VS Code style File Tabs / Cards */}
      {files.length > 0 && (
        <div class="space-y-4">
          <div class="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide no-scrollbar">
            <button
              onClick={() => setActiveFileId("all")}
              class={`flex items-center gap-2 px-4 py-2 rounded-md text-xs font-semibold whitespace-nowrap transition-all border ${
                activeFileId === "all"
                  ? "bg-primary text-primary-foreground border-primary shadow-sm"
                  : "bg-background text-muted-foreground border-border hover:bg-muted"
              }`}
            >
              <Layers size={14} />
              Wszystkie pliki ({files.length})
            </button>
            {files.map((file) => (
              <div
                key={file.id}
                class={`flex items-center gap-0 group transition-all rounded-md border ${
                  activeFileId === file.id
                    ? "bg-card border-primary ring-1 ring-primary/20"
                    : "bg-background border-border hover:border-muted-foreground/30"
                }`}
              >
                <button
                  onClick={() => setActiveFileId(file.id)}
                  class={`flex items-center gap-2 px-3 py-2 text-xs font-medium whitespace-nowrap ${
                    activeFileId === file.id ? "text-foreground" : "text-muted-foreground"
                  }`}
                >
                  <FileJson size={14} class={activeFileId === file.id ? "text-primary" : ""} />
                  {file.name}
                  <Badge variant="secondary" class="ml-1 px-1 py-0 text-[9px] h-4">
                    {file.data.length}
                  </Badge>
                </button>
                <button
                  onClick={() => removeFile(file.id)}
                  class="pr-2 pl-1 py-2 text-muted-foreground hover:text-destructive transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>

          {/* Stats Bar */}
          <div class="grid gap-4 md:grid-cols-4">
            <Card>
              <CardContent class="p-4 flex items-center gap-4">
                <div class="p-2 bg-primary/5 rounded-lg text-primary">
                  <ShoppingBag size={20} />
                </div>
                <div>
                  <p class="text-[10px] font-bold text-muted-foreground uppercase">Suma produktów</p>
                  <p class="text-xl font-black">{allData.length}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent class="p-4 flex items-center gap-4">
                <div class="p-2 bg-emerald-500/5 rounded-lg text-emerald-600">
                  <Check size={20} />
                </div>
                <div>
                  <p class="text-[10px] font-bold text-muted-foreground uppercase">Prawidłowe tytuły</p>
                  <p class="text-xl font-black text-emerald-600">
                    {allData.filter(p => p.isTitleValid).length}
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent class="p-4 flex items-center gap-4">
                <div class="p-2 bg-amber-500/5 rounded-lg text-amber-600">
                  <ArrowUpRight size={20} />
                </div>
                <div>
                  <p class="text-[10px] font-bold text-muted-foreground uppercase">Do poprawy</p>
                  <p class="text-xl font-black text-amber-600">
                    {allData.filter(p => !p.isTitleValid).length}
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent class="p-4 flex items-center gap-4">
                <div class="p-2 bg-muted rounded-lg text-muted-foreground">
                  <ChevronRight size={20} />
                </div>
                <div>
                  <p class="text-[10px] font-bold text-muted-foreground uppercase">Średnia cena</p>
                  <p class="text-xl font-black">
                    {(allData.reduce((acc, p) => acc + p.normalizedPrice, 0) / (allData.length || 1)).toFixed(2)} PLN
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Table Control */}
          <div class="flex flex-col sm:flex-row gap-4 justify-between items-center bg-muted/30 p-4 rounded-lg border border-border/50">
            <div class="relative w-full sm:max-w-md">
              <Search class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
              <Input
                placeholder="Szukaj w wynikach..."
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
              Pobierz zbiorczy .XLSX
            </Button>
          </div>

          {/* Results Table */}
          <div class="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow class="hover:bg-transparent bg-muted/20">
                  <TableHead class="py-4 pl-6">Produkt & SKU</TableHead>
                  <TableHead class="py-4">Atrybuty</TableHead>
                  <TableHead class="py-4">Optymalizacja Allegro</TableHead>
                  <TableHead class="py-4 pr-6 text-right">Cena & Stan</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.map((p, idx) => (
                  <TableRow key={`${p.SKU}-${idx}`}>
                    <TableCell class="py-5 pl-6 align-top">
                      <div class="font-bold text-sm leading-tight mb-1">{p["NAZWA ORG"]}</div>
                      <div class="flex items-center gap-2">
                        <span class="text-[10px] font-mono bg-muted px-1.5 py-0.5 rounded text-muted-foreground">
                          {p.SKU}
                        </span>
                        {p.EAN && <span class="text-[10px] font-mono text-muted-foreground/60 italic">EAN: {p.EAN}</span>}
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
                      <div class="flex items-center justify-between mb-1.5">
                        <div class="text-sm font-bold text-primary leading-tight">{p.allegroTitle}</div>
                        <Badge
                          variant={p.isTitleValid ? "secondary" : "destructive"}
                          class={`text-[9px] h-5 px-1.5 font-bold ${p.isTitleValid ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" : ""}`}
                        >
                          {p.titleLength}/75
                        </Badge>
                      </div>
                      <div class="relative">
                        <p class="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed pl-3 border-l border-primary/20 italic">
                          {p.cleanedDescription}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell class="py-5 pr-6 align-top text-right">
                      <div class="text-xl font-black tabular-nums tracking-tighter">
                        {p.normalizedPrice.toFixed(2)}
                        <span class="text-[10px] font-medium ml-1 text-muted-foreground uppercase">{p.currency}</span>
                      </div>
                      <div class={`text-[10px] font-extrabold mt-1 uppercase tracking-widest ${
                        p.mappedStock === 0 ? "text-destructive" : "text-emerald-600"
                      }`}>
                        {p.stockStatus}: {p.mappedStock}
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
        </div>
      )}

      {/* Default Upload View */}
      {files.length === 0 && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleFilesUpload}
          class={`h-[500px] border-2 border-dashed rounded-3xl flex flex-col items-center justify-center transition-all duration-300 ${
            isDragging ? "border-primary bg-primary/5 scale-[0.99] shadow-inner" : "border-border/50 bg-muted/20"
          }`}
        >
          <div class="w-20 h-20 rounded-2xl bg-background border border-border flex items-center justify-center text-primary mb-8 shadow-sm">
            <Upload size={32} />
          </div>
          <h2 class="text-2xl font-extrabold tracking-tight mb-3">Wgraj pliki JSON do obróbki</h2>
          <p class="text-muted-foreground text-base max-w-sm text-center mb-10 leading-relaxed">
            Wybierz jeden lub kilka plików jednocześnie. Przekonwertujemy je na profesjonalne zestawienie.
          </p>
          <div class="flex gap-4">
            <Button size="lg" onClick={() => fileInputRef.current?.click()} class="px-10 font-bold h-12 rounded-xl">
              Wybierz pliki
            </Button>
          </div>
        </div>
      )}

      {/* Corporate Footer */}
      <footer class="pt-10 pb-8 border-t border-border/50 flex flex-col md:flex-row items-center justify-between gap-4">
        <div class="flex items-center gap-2">
          <div class="w-4 h-4 bg-primary rounded-[2px]" />
          <p class="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
            Marketplace Fixer v2.6.0
          </p>
        </div>
        <div class="flex items-center gap-8 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
          <span class="hover:text-primary cursor-default transition-colors">Enterprise Solution</span>
          <span class="hover:text-primary cursor-default transition-colors">Data Privacy Ready</span>
        </div>
      </footer>
    </div>
  );
}
