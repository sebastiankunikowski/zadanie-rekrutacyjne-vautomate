import { useMemo, useRef, useState, useEffect } from "preact/hooks";
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
  Settings,
  Plus,
  RefreshCw,
} from "lucide-preact";
import * as XLSX from "xlsx";
import { CleanedProduct, processBatch, Product, MappingConfig } from "../utils/processor.ts";
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
import { IS_BROWSER } from "fresh/runtime";

interface Props {
  initialData: CleanedProduct[];
}

interface UploadedFile {
  id: string;
  name: string;
  data: CleanedProduct[];
  raw: Product[];
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
  const [showSettings, setShowSettings] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Mapping Configuration State
  const [mappingConfig, setMappingConfig] = useState<MappingConfig>({
    stockRanges: [
      { min: 0, max: 0, status: "BRAK" },
      { min: 1, max: 5, status: "NISKI" },
      { min: 6, max: 20, status: "ŚREDNI" },
      { min: 21, max: 9999, status: "WYSOKI" },
    ],
    stockStatusToValue: {
      "dużo": 50,
      "średnio": 15,
      "mało": 5,
      "brak": 0,
    },
    currencyMap: {
      "": "PLN",
      "EUR": "PLN", // Default mapping EUR to PLN
    },
    colorMap: {},
  });

  // Load configuration from localStorage
  useEffect(() => {
    if (IS_BROWSER) {
      const savedConfig = localStorage.getItem("marketplace_mapping_config_v3");
      if (savedConfig) {
        try {
          setMappingConfig(JSON.parse(savedConfig));
        } catch (e) {
          console.error("Failed to parse saved mapping config", e);
        }
      }
    }
  }, []);

  // Save config to localStorage
  useEffect(() => {
    if (IS_BROWSER) {
      localStorage.setItem("marketplace_mapping_config_v3", JSON.stringify(mappingConfig));
    }
  }, [mappingConfig]);

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
        const rawJson = JSON.parse(text) as Product[];
        const processed = processBatch(rawJson, mappingConfig);
        newFiles.push({
          id: Math.random().toString(36).substring(7),
          name: file.name,
          data: processed,
          raw: rawJson,
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

  // Re-process all data when mapping changes
  const refreshData = () => {
    setFiles(prev => prev.map(file => ({
      ...file,
      data: processBatch(file.raw, mappingConfig)
    })));
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
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Header */}
      <header class="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div class="space-y-1">
          <h1 class="text-4xl font-black tracking-tighter">
            Marketplace Fixer
          </h1>
          <p class="text-muted-foreground font-medium">
            Ujednolicaj i optymalizuj dane produktowe do obróbki.
          </p>
        </div>
        <div class="flex items-center gap-3">
          <ThemeSwitcher />
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSettings(!showSettings)}
            class={`h-10 rounded-xl px-4 ${showSettings ? "bg-accent border-primary/30" : ""}`}
          >
            <Settings size={18} class="mr-2" />
            Mapowanie
          </Button>
          <div class="h-6 w-px bg-border mx-1" />
          <Button variant="outline" size="sm" onClick={clearAll} class="h-10 rounded-xl px-4">
            <Trash2 size={18} class="mr-2" />
            Wyczyść wszystko
          </Button>
          <Button size="sm" onClick={() => fileInputRef.current?.click()} class="h-10 rounded-xl px-6 font-bold shadow-lg shadow-primary/10">
            <Upload size={18} class="mr-2" />
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

      {/* Settings Panel */}
      {showSettings && (
        <Card class="border-primary/20 bg-muted/20 animate-in fade-in slide-in-from-top-4 duration-300 overflow-hidden shadow-2xl">
          <CardHeader class="border-b bg-muted/40 flex flex-row items-center justify-between">
            <CardTitle class="text-xl font-bold">Zasady przetwarzania danych</CardTitle>
            <Button variant="default" size="sm" onClick={refreshData} class="h-8 text-xs font-bold">
              <RefreshCw size={14} class="mr-1.5" /> Przelicz dane
            </Button>
          </CardHeader>
          <CardContent class="p-8 grid gap-10 md:grid-cols-3">
            {/* Color Mapping */}
            <div class="space-y-5">
              <div class="flex items-center justify-between">
                <h4 class="text-xs font-black uppercase tracking-widest text-muted-foreground/80">Reguły kolorów</h4>
                <Badge variant="outline" class="text-[10px] bg-background">{Object.keys(mappingConfig.colorMap).length}</Badge>
              </div>
              <div class="flex flex-col gap-2">
                <div class="flex gap-2">
                  <Input id="color-alias" placeholder="np. j. szary" class="h-9 text-xs bg-background border-border/50" />
                  <Input id="color-name" placeholder="np. Jasnoszary" class="h-9 text-xs bg-background border-border/50" />
                  <Button size="icon" class="h-9 w-9 shrink-0" onClick={() => {
                    const alias = (document.getElementById("color-alias") as HTMLInputElement).value;
                    const name = (document.getElementById("color-name") as HTMLInputElement).value;
                    if (alias && name) {
                      setMappingConfig(prev => ({
                        ...prev,
                        colorMap: { ...prev.colorMap, [alias.toLowerCase()]: name }
                      }));
                      (document.getElementById("color-alias") as HTMLInputElement).value = "";
                      (document.getElementById("color-name") as HTMLInputElement).value = "";
                    }
                  }}>
                    <Plus size={16} />
                  </Button>
                </div>
              </div>
              <div class="flex flex-wrap gap-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                {Object.entries(mappingConfig.colorMap).map(([alias, name]) => (
                  <Badge key={alias} variant="secondary" class="gap-2 px-3 py-1.5 text-[11px] font-bold bg-background border shadow-sm group">
                    <span class="text-muted-foreground font-mono">{alias}</span>
                    <ChevronRight size={12} class="text-primary/30" />
                    <span>{name}</span>
                    <X size={14} class="ml-1 cursor-pointer hover:text-destructive text-muted-foreground transition-colors" onClick={() => {
                      const newMap = { ...mappingConfig.colorMap };
                      delete newMap[alias];
                      setMappingConfig({ ...mappingConfig, colorMap: newMap });
                    }} />
                  </Badge>
                ))}
              </div>
            </div>

            {/* Stock Mapping */}
            <div class="space-y-5">
              <h4 class="text-xs font-black uppercase tracking-widest text-muted-foreground/80">Mapowanie stanów</h4>
              <div class="space-y-3">
                <p class="text-[11px] text-muted-foreground font-bold mb-2">Status → Wartość (sztuki):</p>
                {Object.entries(mappingConfig.stockStatusToValue).map(([status, value]) => (
                  <div key={status} class="flex items-center justify-between p-2 bg-background/50 rounded-lg border border-border/30">
                    <span class="text-xs font-bold text-muted-foreground capitalize ml-1">{status}</span>
                    <Input
                      type="number"
                      value={value}
                      onInput={(e) => setMappingConfig({
                        ...mappingConfig,
                        stockStatusToValue: { ...mappingConfig.stockStatusToValue, [status]: parseInt(e.currentTarget.value) || 0 }
                      })}
                      class="h-7 w-16 text-xs text-right bg-background font-black border-none focus-visible:ring-1"
                    />
                  </div>
                ))}

                <p class="text-[11px] text-muted-foreground font-bold mt-4 mb-2">Przedziały (sztuki → Status):</p>
                <div class="space-y-1.5">
                  {mappingConfig.stockRanges.map((range, idx) => (
                    <div key={idx} class="flex items-center gap-2 text-[10px]">
                      <Input
                        type="number"
                        value={range.min}
                        onInput={(e) => {
                          const newRanges = [...mappingConfig.stockRanges];
                          newRanges[idx].min = parseInt(e.currentTarget.value) || 0;
                          setMappingConfig({...mappingConfig, stockRanges: newRanges});
                        }}
                        class="h-6 w-12 px-1 text-center bg-background"
                      />
                      <span>-</span>
                      <Input
                        type="number"
                        value={range.max}
                        onInput={(e) => {
                          const newRanges = [...mappingConfig.stockRanges];
                          newRanges[idx].max = parseInt(e.currentTarget.value) || 0;
                          setMappingConfig({...mappingConfig, stockRanges: newRanges});
                        }}
                        class="h-6 w-14 px-1 text-center bg-background"
                      />
                      <Input
                        value={range.status}
                        onInput={(e) => {
                          const newRanges = [...mappingConfig.stockRanges];
                          newRanges[idx].status = e.currentTarget.value;
                          setMappingConfig({...mappingConfig, stockRanges: newRanges});
                        }}
                        class="h-6 flex-1 px-2 font-bold uppercase bg-background"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Currency & Misc */}
            <div class="space-y-5">
              <h4 class="text-xs font-black uppercase tracking-widest text-muted-foreground/80">Ustawienia walut i błędy</h4>
              <div class="space-y-4">
                <div class="flex items-center justify-between gap-4 p-3 bg-background/50 rounded-xl border border-border/30">
                  <div class="space-y-0.5">
                    <p class="text-xs font-bold">Domyślna waluta</p>
                    <p class="text-[10px] text-muted-foreground">Dla brakujących wartości</p>
                  </div>
                  <Input
                    value={mappingConfig.currencyMap[""] || ""}
                    onInput={(e) => setMappingConfig({
                      ...mappingConfig,
                      currencyMap: { ...mappingConfig.currencyMap, "": e.currentTarget.value }
                    })}
                    class="h-8 w-16 text-xs text-center font-black bg-background uppercase"
                  />
                </div>

                <div class="p-4 rounded-xl bg-primary/5 border border-primary/10 space-y-2">
                  <p class="text-[10px] font-black uppercase tracking-widest text-primary">Informacja systemowa</p>
                  <p class="text-[11px] text-muted-foreground leading-relaxed">
                    Zmiana mapowania wpływa na wszystkie otwarte pliki. Wartości są automatycznie zapisywane w <strong>LocalStorage</strong>, co pozwala na ich reużycie przy kolejnych sesjach.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* VS Code style File Tabs */}
      {files.length > 0 && (
        <div class="space-y-4">
          <div class="flex items-center gap-0 overflow-x-auto pb-0 border-b border-border/60 scrollbar-hide no-scrollbar">
            <button
              onClick={() => setActiveFileId("all")}
              class={`flex items-center gap-3 px-6 py-3 text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all border-b-2 -mb-[2px] ${
                activeFileId === "all"
                  ? "border-primary bg-muted/40 text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/20"
              }`}
            >
              <Layers size={14} />
              Wszystkie pliki
              <Badge variant="secondary" class="ml-1 h-4 px-1 text-[9px] font-bold">{files.length}</Badge>
            </button>
            {files.map((file) => (
              <div
                key={file.id}
                class={`flex items-center group transition-all border-b-2 -mb-[2px] ${
                  activeFileId === file.id
                    ? "border-primary bg-card text-foreground shadow-[inset_0_1px_0_0_rgba(var(--primary),0.1)]"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/20"
                }`}
              >
                <button
                  onClick={() => setActiveFileId(file.id)}
                  class="flex items-center gap-2.5 px-6 py-3 text-xs font-bold whitespace-nowrap"
                >
                  <FileJson size={14} class={activeFileId === file.id ? "text-primary" : "text-muted-foreground/50"} />
                  {file.name}
                  <Badge variant="outline" class="ml-1 h-4 px-1 text-[9px] font-bold border-muted-foreground/30 opacity-60">
                    {file.data.length}
                  </Badge>
                </button>
                <button
                  onClick={() => removeFile(file.id)}
                  class="pr-3 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>

          {/* Stats Bar */}
          <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card class="border-border/60 shadow-sm">
              <CardContent class="p-6 pt-7 flex items-center gap-5">
                <div class="p-3 bg-primary/5 rounded-2xl text-primary border border-primary/10 shadow-inner">
                  <ShoppingBag size={24} />
                </div>
                <div>
                  <p class="text-[11px] font-black text-muted-foreground uppercase tracking-[0.1em] mb-1">Suma produktów</p>
                  <p class="text-3xl font-black tabular-nums tracking-tighter">{allData.length}</p>
                </div>
              </CardContent>
            </Card>
            <Card class="border-border/60 shadow-sm">
              <CardContent class="p-6 pt-7 flex items-center gap-5">
                <div class="p-3 bg-emerald-500/5 rounded-2xl text-emerald-600 border border-emerald-500/10 shadow-inner">
                  <Check size={24} />
                </div>
                <div>
                  <p class="text-[11px] font-black text-muted-foreground uppercase tracking-[0.1em] mb-1">Prawidłowe tytuły</p>
                  <p class="text-3xl font-black text-emerald-600 tabular-nums tracking-tighter">
                    {allData.filter(p => p.isTitleValid).length}
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card class="border-border/60 shadow-sm">
              <CardContent class="p-6 pt-7 flex items-center gap-5">
                <div class="p-3 bg-amber-500/5 rounded-2xl text-amber-600 border border-amber-500/10 shadow-inner">
                  <ArrowUpRight size={24} />
                </div>
                <div>
                  <p class="text-[11px] font-black text-muted-foreground uppercase tracking-[0.1em] mb-1">Do poprawy</p>
                  <p class="text-3xl font-black text-amber-600 tabular-nums tracking-tighter">
                    {allData.filter(p => !p.isTitleValid).length}
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card class="border-border/60 shadow-sm">
              <CardContent class="p-6 pt-7 flex items-center gap-5">
                <div class="p-3 bg-muted rounded-2xl text-muted-foreground border shadow-inner">
                  <ChevronRight size={24} />
                </div>
                <div>
                  <p class="text-[11px] font-black text-muted-foreground uppercase tracking-[0.1em] mb-1">Średnia cena</p>
                  <p class="text-3xl font-black tabular-nums tracking-tighter whitespace-nowrap">
                    {(allData.reduce((acc, p) => acc + p.normalizedPrice, 0) / (allData.length || 1)).toFixed(2)} <span class="text-sm font-black">PLN</span>
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Table Control */}
          <div class="flex flex-col sm:flex-row gap-4 justify-between items-center bg-muted/20 p-4 rounded-2xl border border-border/50 backdrop-blur-sm">
            <div class="relative w-full sm:max-w-md">
              <Search class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
              <Input
                placeholder="Filtruj wyniki..."
                value={searchTerm}
                onInput={(e) => setSearchTerm(e.currentTarget ? (e.currentTarget as HTMLInputElement).value : "")}
                class="pl-10 h-11 border-none bg-background shadow-inner focus-visible:ring-1 rounded-xl text-sm"
              />
            </div>
            <Button
              variant="secondary"
              onClick={handleExportExcel}
              disabled={exporting || filteredData.length === 0}
              class="w-full sm:w-auto font-black h-11 rounded-xl shadow-sm px-6 bg-background border hover:bg-muted"
            >
              <FileSpreadsheet size={18} class="mr-2" />
              Pobierz zbiorczy .XLSX
            </Button>
          </div>

          {/* Results Table */}
          <div class="rounded-3xl border border-border/60 bg-card shadow-xl overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow class="hover:bg-transparent bg-muted/10">
                  <TableHead class="py-5 pl-8 text-[11px] font-black uppercase tracking-[0.2em]">Produkt & SKU</TableHead>
                  <TableHead class="py-5 text-[11px] font-black uppercase tracking-[0.2em]">Atrybuty</TableHead>
                  <TableHead class="py-5 text-[11px] font-black uppercase tracking-[0.2em]">Optymalizacja Allegro</TableHead>
                  <TableHead class="py-5 pr-8 text-right text-[11px] font-black uppercase tracking-[0.2em]">Cena & Stan</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.map((p, idx) => (
                  <TableRow key={`${p.SKU}-${idx}`} class="group hover:bg-muted/5">
                    <TableCell class="py-7 pl-8 align-top">
                      <div class="font-extrabold text-sm leading-tight mb-2 group-hover:text-primary transition-colors duration-300">{p["NAZWA ORG"]}</div>
                      <div class="flex items-center gap-3">
                        <span class="text-[10px] font-mono bg-muted/80 px-2 py-0.5 rounded text-muted-foreground font-black border border-border/30">
                          {p.SKU}
                        </span>
                        {p.EAN && <span class="text-[10px] font-mono text-muted-foreground/50 italic font-bold">EAN: {p.EAN}</span>}
                      </div>
                    </TableCell>
                    <TableCell class="py-7 align-top">
                      <div class="space-y-3">
                        <div class="flex items-center gap-4">
                          <span class="text-[9px] text-muted-foreground uppercase font-black tracking-widest w-12 opacity-60">Wymiar</span>
                          <Badge variant="outline" class="text-[10px] font-mono py-0 border-muted-foreground/30 bg-background">{p.cleanedDimensions}</Badge>
                        </div>
                        <div class="flex items-center gap-4">
                          <span class="text-[9px] text-muted-foreground uppercase font-black tracking-widest w-12 opacity-60">Kolor</span>
                          <Badge variant="secondary" class="text-[10px] font-black py-0 shadow-sm border border-border/20">{p.cleanedColor}</Badge>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell class="py-7 align-top max-w-sm lg:max-w-md">
                      <div class="flex items-center justify-between mb-3 gap-6">
                        <div class="text-sm font-black text-primary leading-tight tracking-tight">{p.allegroTitle}</div>
                        <Badge
                          variant={p.isTitleValid ? "secondary" : "destructive"}
                          class={`text-[10px] h-5.5 px-2 font-black shrink-0 border shadow-sm ${p.isTitleValid ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" : ""}`}
                        >
                          {p.titleLength}/75
                        </Badge>
                      </div>
                      <div class="relative">
                        <p class="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed pl-4 border-l-2 border-primary/20 italic font-bold opacity-80">
                          {p.cleanedDescription}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell class="py-7 pr-8 align-top text-right">
                      <div class="text-2xl font-black tabular-nums tracking-tighter mb-1.5">
                        {p.normalizedPrice.toFixed(2)}
                        <span class="text-xs font-bold ml-1.5 text-muted-foreground uppercase">{p.currency}</span>
                      </div>
                      <div class={`text-[10px] font-black uppercase tracking-[0.2em] px-2 py-1 rounded-md inline-block ${
                        p.mappedStock === 0 ? "text-destructive bg-destructive/5" : "text-emerald-600 bg-emerald-500/5"
                      }`}>
                        {p.stockStatus}: {p.mappedStock}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {filteredData.length === 0 && (
              <div class="py-32 flex flex-col items-center justify-center text-center bg-muted/5">
                <div class="w-20 h-20 rounded-3xl bg-muted/30 flex items-center justify-center text-muted-foreground/40 mb-6 border border-border/20">
                  <Search size={32} />
                </div>
                <h3 class="text-xl font-black mb-2">Brak wyników</h3>
                <p class="text-muted-foreground font-medium max-w-sm">Wgraj pliki JSON lub zmień kryteria filtrowania, aby zobaczyć przetworzone dane.</p>
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
          class={`h-[600px] border-2 border-dashed rounded-[3rem] flex flex-col items-center justify-center transition-all duration-700 ${
            isDragging ? "border-primary bg-primary/5 scale-[0.97] shadow-2xl" : "border-border/60 bg-muted/10 shadow-inner"
          }`}
        >
          <div class="w-28 h-28 rounded-[2rem] bg-background border border-border/40 flex items-center justify-center text-primary mb-10 shadow-2xl animate-in zoom-in duration-700">
            <Upload size={48} />
          </div>
          <h2 class="text-4xl font-black tracking-tight mb-4">Wgraj pliki do obróbki</h2>
          <p class="text-muted-foreground text-xl max-w-lg text-center mb-14 leading-relaxed px-10 font-medium">
            Przeciągnij tutaj swoje zestawienia produktów. System automatycznie ujednolici wymiary, zmapuje stany i zoptymalizuje tytuły Allegro.
          </p>
          <div class="flex gap-4">
            <Button size="lg" onClick={() => fileInputRef.current?.click()} class="px-14 font-black h-16 rounded-2xl shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all text-lg">
              Wybierz pliki
            </Button>
          </div>
        </div>
      )}

      {/* Corporate Footer */}
      <footer class="pt-14 pb-12 border-t border-border/40 flex flex-col md:flex-row items-center justify-between gap-8 opacity-70">
        <div class="flex items-center gap-4">
          <div class="w-6 h-6 bg-primary rounded-lg shadow-sm" />
          <p class="text-xs font-black uppercase tracking-[0.4em] text-foreground">
            Marketplace Fixer Professional
          </p>
        </div>
        <div class="flex items-center gap-12 text-[10px] font-black uppercase tracking-[0.2em]">
          <span class="hover:text-primary cursor-default transition-colors">Enterprise Systems</span>
          <span class="hover:text-primary cursor-default transition-colors">Data Privacy Compliance</span>
          <span class="text-muted-foreground/30">v2.8.0 Stable</span>
        </div>
      </footer>
    </div>
  );
}
