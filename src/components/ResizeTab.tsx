import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Upload, Zap, Monitor, Download as DownloadIcon, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import JSZip from "jszip";

type SizePreset = {
  label: string;
  width: number;
  height: number;
  aspectRatio: string;
};

const SIZE_PRESETS: Record<string, SizePreset> = {
  "youtube": { label: "Thumbnail do YouTube (1280×720)", width: 1280, height: 720, aspectRatio: "16:9" },
  "reels": { label: "Reels / Shorts (1080×1920)", width: 1080, height: 1920, aspectRatio: "9:16" },
  "instagram": { label: "Post do Instagram (1080×1080)", width: 1080, height: 1080, aspectRatio: "1:1" },
  "quadrado-600": { label: "Quadrado (600×600)", width: 600, height: 600, aspectRatio: "1:1" },
  "portrait": { label: "Retrato / Story (730×1024)", width: 730, height: 1024, aspectRatio: "730:1024" },
  "a4": { label: "A4 Retrato (720×1024)", width: 720, height: 1024, aspectRatio: "720:1024" },
  "vertical": { label: "Vertical (720×1280)", width: 720, height: 1280, aspectRatio: "9:16" },
  "banner": { label: "Banner (2000×590)", width: 2000, height: 590, aspectRatio: "2000:590" },
  // Banner do Módulo (vertical) 2:3
  "modulo-leve": { label: "Módulo Leve (720×1080)", width: 720, height: 1080, aspectRatio: "2:3" },
  "modulo-rec": { label: "Módulo Recomendado (1080×1620)", width: 1080, height: 1620, aspectRatio: "2:3" },
  "modulo-premium": { label: "Módulo Premium 4K (1280×1920)", width: 1280, height: 1920, aspectRatio: "2:3" },
  // Banner/Thumbnail da Aula 16:9
  "aula-leve": { label: "Aula Leve (1280×720)", width: 1280, height: 720, aspectRatio: "16:9" },
  "aula-rec": { label: "Aula Recomendado (1920×1080)", width: 1920, height: 1080, aspectRatio: "16:9" },
  "aula-premium": { label: "Aula Premium 4K (2560×1440)", width: 2560, height: 1440, aspectRatio: "16:9" },
  // Foto do Produto / Card 1:1
  "produto-leve": { label: "Produto Leve (800×800)", width: 800, height: 800, aspectRatio: "1:1" },
  "produto-rec": { label: "Produto Recomendado (1080×1080)", width: 1080, height: 1080, aspectRatio: "1:1" },
  "produto-premium": { label: "Produto Premium 4K (2048×2048)", width: 2048, height: 2048, aspectRatio: "1:1" },
  // Banner do Curso ~5:1
  "curso-leve": { label: "Curso Leve (1440×300)", width: 1440, height: 300, aspectRatio: "~5:1" },
  "curso-rec": { label: "Curso Recomendado (1920×400)", width: 1920, height: 400, aspectRatio: "~5:1" },
  "curso-premium": { label: "Curso Premium 4K (2560×533)", width: 2560, height: 533, aspectRatio: "~5:1" },
  // Hero / Banner responsivo (bg-cover) — container 100% largura × altura fixa
  "hero-mobile": { label: "Hero Mobile (390×256)", width: 390, height: 256, aspectRatio: "~1,5:1" },
  "hero-notebook": { label: "Hero Notebook (1440×320)", width: 1440, height: 320, aspectRatio: "~4,5:1" },
  "hero-fullhd": { label: "Hero Full HD (1920×320)", width: 1920, height: 320, aspectRatio: "~6:1" },
  "hero-ultrawide": { label: "Hero Ultrawide (2560×320)", width: 2560, height: 320, aspectRatio: "~8:1" },
};

type PresetGroup = {
  title: string;
  aspect: string;
  leve?: keyof typeof SIZE_PRESETS;
  recomendado?: keyof typeof SIZE_PRESETS;
  premium?: keyof typeof SIZE_PRESETS;
};

const PRESET_TABLE: PresetGroup[] = [
  { title: "Banner do Módulo (vertical)", aspect: "2:3", leve: "modulo-leve", recomendado: "modulo-rec", premium: "modulo-premium" },
  { title: "Banner / Thumbnail da Aula", aspect: "16:9", leve: "aula-leve", recomendado: "aula-rec", premium: "aula-premium" },
  { title: "Foto do Produto / Card da Biblioteca", aspect: "1:1", leve: "produto-leve", recomendado: "produto-rec", premium: "produto-premium" },
  { title: "Banner do Curso (hero widescreen)", aspect: "~5:1", leve: "curso-leve", recomendado: "curso-rec", premium: "curso-premium" },
];

type HeroRow = {
  device: string;
  key: keyof typeof SIZE_PRESETS;
  ratio: string;
};

const HERO_TABLE: HeroRow[] = [
  { device: "Mobile (~390 px)", key: "hero-mobile", ratio: "~1,5:1" },
  { device: "Notebook (1440 px)", key: "hero-notebook", ratio: "~4,5:1" },
  { device: "Full HD (1920 px)", key: "hero-fullhd", ratio: "~6:1" },
  { device: "Ultrawide (2560 px)", key: "hero-ultrawide", ratio: "~8:1" },
];

export const ResizeTab = () => {
  const [selectedSize, setSelectedSize] = useState<keyof typeof SIZE_PRESETS>("youtube");
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [resizedImage, setResizedImage] = useState<string | null>(null);
  const [originalDimensions, setOriginalDimensions] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const [imageInfo, setImageInfo] = useState<{
    format: string;
    originalSize: number;
    aspectRatio: string;
  } | null>(null);
  const [batchItems, setBatchItems] = useState<
    { name: string; original: string; resized: string }[]
  >([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;

    if (files.length > 1) {
      void handleBatchUpload(files);
      return;
    }

    const file = files[0];

    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "Arquivo muito grande",
        description: "O tamanho máximo é 10MB",
        variant: "destructive",
      });
      return;
    }

    const preset = SIZE_PRESETS[selectedSize];

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        setOriginalImage(event.target?.result as string);
        setOriginalDimensions({ width: img.width, height: img.height });
        
        const canvas = document.createElement("canvas");
        canvas.width = preset.width;
        canvas.height = preset.height;
        const ctx = canvas.getContext("2d");
        
        if (ctx) {
          ctx.fillStyle = "#000";
          ctx.fillRect(0, 0, preset.width, preset.height);
          
          const scale = Math.max(preset.width / img.width, preset.height / img.height);
          const x = (preset.width - img.width * scale) / 2;
          const y = (preset.height - img.height * scale) / 2;
          
          ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
          
          const resized = canvas.toDataURL("image/jpeg", 0.9);
          setResizedImage(resized);
          
          setImageInfo({
            format: `JPG (90%)`,
            originalSize: file.size / 1024,
            aspectRatio: preset.aspectRatio,
          });
          
          toast({
            title: "Imagem processada!",
            description: `Redimensionada para ${preset.width}×${preset.height}px`,
          });
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const resizeFile = (file: File): Promise<{ name: string; original: string; resized: string }> => {
    return new Promise((resolve, reject) => {
      const preset = SIZE_PRESETS[selectedSize];
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          canvas.width = preset.width;
          canvas.height = preset.height;
          const ctx = canvas.getContext("2d");
          if (!ctx) return reject(new Error("Canvas error"));
          ctx.fillStyle = "#000";
          ctx.fillRect(0, 0, preset.width, preset.height);
          const scale = Math.max(preset.width / img.width, preset.height / img.height);
          const x = (preset.width - img.width * scale) / 2;
          const y = (preset.height - img.height * scale) / 2;
          ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
          resolve({
            name: file.name.replace(/\.[^.]+$/, ""),
            original: dataUrl,
            resized: canvas.toDataURL("image/jpeg", 0.9),
          });
        };
        img.onerror = () => reject(new Error("Image load error"));
        img.src = dataUrl;
      };
      reader.onerror = () => reject(new Error("File read error"));
      reader.readAsDataURL(file);
    });
  };

  const handleBatchUpload = async (files: File[]) => {
    const valid = files.filter((f) => f.size <= 10 * 1024 * 1024);
    if (valid.length < files.length) {
      toast({
        title: "Alguns arquivos ignorados",
        description: "Arquivos maiores que 10MB foram ignorados.",
        variant: "destructive",
      });
    }
    if (valid.length === 0) return;

    setIsProcessing(true);
    try {
      const results = await Promise.all(valid.map(resizeFile));
      setBatchItems(results);
      setOriginalImage(null);
      setResizedImage(null);
      toast({
        title: "Lote processado!",
        description: `${results.length} imagens redimensionadas para ${SIZE_PRESETS[selectedSize].width}×${SIZE_PRESETS[selectedSize].height}px`,
      });
    } catch (err) {
      toast({
        title: "Falha no processamento",
        description: (err as Error).message,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadZip = async () => {
    if (batchItems.length === 0) return;
    const preset = SIZE_PRESETS[selectedSize];
    const zip = new JSZip();
    batchItems.forEach((item) => {
      const base64 = item.resized.split(",")[1];
      zip.file(`${item.name}-${preset.width}x${preset.height}.jpg`, base64, { base64: true });
    });
    const blob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.download = `resized-${preset.width}x${preset.height}.zip`;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleDownload = () => {
    if (!resizedImage) return;
    const preset = SIZE_PRESETS[selectedSize];
    const link = document.createElement("a");
    link.download = `image-${preset.width}x${preset.height}.jpg`;
    link.href = resizedImage;
    link.click();
  };

  const handleNewImage = () => {
    setOriginalImage(null);
    setResizedImage(null);
    setOriginalDimensions(null);
    setImageInfo(null);
    setBatchItems([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-8">
      {batchItems.length > 0 ? (
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="flex justify-start">
            <Button onClick={handleNewImage} variant="outline" size="sm" className="gap-2 transition-transform duration-300 hover:scale-105">
              <ArrowLeft className="w-4 h-4" />
              Voltar ao menu
            </Button>
          </div>
          <div className="text-center space-y-2">
            <h2 className="text-2xl md:text-3xl font-bold">
              {batchItems.length} imagens redimensionadas
            </h2>
            <p className="text-muted-foreground text-sm">
              {SIZE_PRESETS[selectedSize].label}
            </p>
          </div>

          <div className="flex gap-3 justify-center flex-wrap">
            <Button onClick={handleDownloadZip} size="lg" className="gap-2 transition-transform duration-300 hover:scale-105">
              <DownloadIcon className="w-4 h-4" />
              Baixar ZIP ({batchItems.length})
            </Button>
            <Button onClick={handleNewImage} variant="outline" size="lg" className="gap-2 transition-transform duration-300 hover:scale-105">
              🔄 Novo Lote
            </Button>
          </div>

          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
            {batchItems.map((item, idx) => (
              <Card key={idx} className="p-3 space-y-2 transition-all duration-300 hover:scale-105 hover:border-primary hover:border-2 hover:shadow-lg hover:shadow-primary/20">
                <div
                  className="bg-muted rounded-lg overflow-hidden flex items-center justify-center"
                  style={{ aspectRatio: `${SIZE_PRESETS[selectedSize].width} / ${SIZE_PRESETS[selectedSize].height}` }}
                >
                  <img src={item.resized} alt={item.name} className="w-full h-full object-contain" />
                </div>
                <p className="text-xs text-muted-foreground truncate text-center">{item.name}</p>
              </Card>
            ))}
          </div>
        </div>
      ) : !originalImage ? (
        <>
          <div className="text-center space-y-4">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold">
              Redimensione Imagens para <span className="text-primary">Redes Sociais</span>
            </h2>
            <p className="text-muted-foreground text-sm md:text-base max-w-2xl mx-auto">
              Converta qualquer imagem para o tamanho perfeito para thumbnails do YouTube, Reels/Shorts, posts do Instagram, retratos, A4, vertical ou banners
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            <Card className="p-6 text-center transition-all duration-300 hover:scale-105 hover:border-primary hover:border-2 hover:shadow-lg hover:shadow-primary/20">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 transition-transform duration-300 group-hover:scale-110">
                <Zap className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Processamento Rápido</h3>
              <p className="text-sm text-muted-foreground">
                Redimensionamento instantâneo com alta qualidade
              </p>
            </Card>

            <Card className="p-6 text-center transition-all duration-300 hover:scale-105 hover:border-primary hover:border-2 hover:shadow-lg hover:shadow-primary/20">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 transition-transform duration-300 group-hover:scale-110">
                <Monitor className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">7 Presets</h3>
              <p className="text-sm text-muted-foreground">
                YouTube, Reels, Instagram, Retrato, A4, Vertical e Banner
              </p>
            </Card>

            <Card className="p-6 text-center transition-all duration-300 hover:scale-105 hover:border-primary hover:border-2 hover:shadow-lg hover:shadow-primary/20">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 transition-transform duration-300 group-hover:scale-110">
                <DownloadIcon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Download Direto</h3>
              <p className="text-sm text-muted-foreground">
                Baixe em JPG com 90% de qualidade
              </p>
            </Card>

            <Card className="p-6 text-center transition-all duration-300 hover:scale-105 hover:border-primary hover:border-2 hover:shadow-lg hover:shadow-primary/20">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 transition-transform duration-300 group-hover:scale-110">
                <Upload className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Lote em ZIP</h3>
              <p className="text-sm text-muted-foreground">
                Envie várias imagens e baixe como ZIP
              </p>
            </Card>
          </div>

          <Card className="max-w-2xl mx-auto p-12 transition-all duration-300 hover:border-primary hover:border-2 hover:shadow-xl hover:shadow-primary/20">
            <div className="mb-6">
              <p className="text-sm font-semibold mb-3 text-center">Escolha o tamanho de saída:</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {(Object.keys(SIZE_PRESETS) as Array<keyof typeof SIZE_PRESETS>).map((key) => {
                  const preset = SIZE_PRESETS[key];
                  const isActive = selectedSize === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setSelectedSize(key)}
                      className={`p-3 rounded-lg border-2 text-sm font-medium transition-all duration-300 hover:scale-105 ${
                        isActive
                          ? "border-primary bg-primary/10 text-foreground"
                          : "border-border hover:border-primary"
                      }`}
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-border">
              <p className="text-sm font-semibold mb-3 text-center">📐 Tabela completa de tamanhos recomendados</p>
              <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left p-2 font-semibold">Onde</th>
                      <th className="text-left p-2 font-semibold">Proporção</th>
                      <th className="text-left p-2 font-semibold">🥉 Leve</th>
                      <th className="text-left p-2 font-semibold">🥈 Recomendado</th>
                      <th className="text-left p-2 font-semibold">🥇 Premium (4K)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {PRESET_TABLE.map((row) => (
                      <tr key={row.title} className="border-b border-border/50">
                        <td className="p-2 font-medium">{row.title}</td>
                        <td className="p-2 text-muted-foreground">{row.aspect}</td>
                        {(["leve", "recomendado", "premium"] as const).map((tier) => {
                          const key = row[tier];
                          if (!key) return <td key={tier} className="p-2">—</td>;
                          const preset = SIZE_PRESETS[key];
                          const isActive = selectedSize === key;
                          return (
                            <td key={tier} className="p-1">
                              <button
                                type="button"
                                onClick={() => setSelectedSize(key)}
                                className={`w-full px-2 py-1.5 rounded border-2 text-xs font-medium transition-all duration-200 hover:scale-105 ${
                                  isActive
                                    ? "border-primary bg-primary/10 text-foreground"
                                    : "border-border hover:border-primary"
                                }`}
                              >
                                {preset.width} × {preset.height}
                              </button>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-border">
              <p className="text-sm font-semibold mb-1 text-center">🖥️ Hero / Banner responsivo (bg-cover)</p>
              <p className="text-xs text-muted-foreground mb-3 text-center">
                Container 100% da largura × altura fixa de 256/320 px. A proporção real varia por dispositivo.
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left p-2 font-semibold">Dispositivo</th>
                      <th className="text-left p-2 font-semibold">Container</th>
                      <th className="text-left p-2 font-semibold">Proporção</th>
                      <th className="text-left p-2 font-semibold">Selecionar</th>
                    </tr>
                  </thead>
                  <tbody>
                    {HERO_TABLE.map((row) => {
                      const preset = SIZE_PRESETS[row.key];
                      const isActive = selectedSize === row.key;
                      return (
                        <tr key={row.key} className="border-b border-border/50">
                          <td className="p-2 font-medium">{row.device}</td>
                          <td className="p-2 text-muted-foreground">{preset.width} × {preset.height}</td>
                          <td className="p-2 text-muted-foreground">{row.ratio}</td>
                          <td className="p-1">
                            <button
                              type="button"
                              onClick={() => setSelectedSize(row.key)}
                              className={`w-full px-2 py-1.5 rounded border-2 text-xs font-medium transition-all duration-200 hover:scale-105 ${
                                isActive
                                  ? "border-primary bg-primary/10 text-foreground"
                                  : "border-border hover:border-primary"
                              }`}
                            >
                              Usar {preset.width}×{preset.height}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageUpload}
              className="hidden"
              id="image-upload"
            />
            <div className="flex flex-col items-center gap-4 mt-6">
              <div className="text-center space-y-2">
                <p className="font-semibold text-lg">Envie sua(s) imagem(ns)</p>
                <p className="text-sm text-muted-foreground">
                  Arraste e solte ou clique no botão — selecione várias para receber um ZIP
                </p>
                <p className="text-xs text-muted-foreground">
                  JPG, PNG, WEBP até 10MB
                </p>
              </div>
              <Button
                type="button"
                size="lg"
                className="gap-2 transition-transform duration-300 hover:scale-105"
                disabled={isProcessing}
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-5 h-5" />
                {isProcessing ? "Processando..." : "Selecionar Imagem(ns)"}
              </Button>
            </div>
          </Card>

          <div className="max-w-4xl mx-auto">
            <h3 className="text-center font-semibold text-lg mb-8">Como usar:</h3>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center mx-auto mb-3 font-bold">
                  1
                </div>
                <p className="text-sm">Envie a imagem</p>
              </div>
              <div className="text-center">
                <div className="w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center mx-auto mb-3 font-bold">
                  2
                </div>
                <p className="text-sm">Veja o resultado automático</p>
              </div>
              <div className="text-center">
                <div className="w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center mx-auto mb-3 font-bold">
                  3
                </div>
                <p className="text-sm">Baixe sua thumbnail</p>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex justify-start">
            <Button onClick={handleNewImage} variant="outline" size="sm" className="gap-2 transition-transform duration-300 hover:scale-105">
              <ArrowLeft className="w-4 h-4" />
              Voltar ao menu
            </Button>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="p-4 space-y-2 transition-all duration-300 hover:scale-105 hover:border-primary hover:border-2 hover:shadow-lg hover:shadow-primary/20">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold">Imagem Original</h3>
                <span className="text-xs text-muted-foreground">
                  {originalDimensions ? `${originalDimensions.width} × ${originalDimensions.height}` : '1280 × 720'}
                </span>
              </div>
              <div className="aspect-video bg-muted rounded-lg overflow-hidden">
                <img
                  src={originalImage}
                  alt="Original"
                  className="w-full h-full object-contain"
                />
              </div>
            </Card>
            <Card className="p-4 space-y-2 transition-all duration-300 hover:scale-105 hover:border-primary hover:border-2 hover:shadow-lg hover:shadow-primary/20">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold">Imagem Redimensionada</h3>
                <span className="text-xs text-muted-foreground">
                  {SIZE_PRESETS[selectedSize].width} × {SIZE_PRESETS[selectedSize].height}
                </span>
              </div>
              <div className="bg-muted rounded-lg overflow-hidden flex items-center justify-center" style={{ aspectRatio: `${SIZE_PRESETS[selectedSize].width} / ${SIZE_PRESETS[selectedSize].height}` }}>
                <img
                  src={resizedImage || ""}
                  alt="Resized"
                  className="w-full h-full object-contain"
                />
              </div>
            </Card>
          </div>

          {imageInfo && (
            <div className="grid grid-cols-3 gap-4">
              <Card className="p-4 text-center transition-all duration-300 hover:scale-105 hover:border-primary hover:shadow-lg hover:shadow-primary/20">
                <p className="text-xs text-muted-foreground mb-1">📎 Formato</p>
                <p className="font-semibold">{imageInfo.format}</p>
              </Card>
              <Card className="p-4 text-center transition-all duration-300 hover:scale-105 hover:border-primary hover:shadow-lg hover:shadow-primary/20">
                <p className="text-xs text-muted-foreground mb-1">📊 Tamanho</p>
                <p className="font-semibold">{imageInfo.originalSize.toFixed(2)} KB</p>
              </Card>
              <Card className="p-4 text-center transition-all duration-300 hover:scale-105 hover:border-primary hover:shadow-lg hover:shadow-primary/20">
                <p className="text-xs text-muted-foreground mb-1">📐 Proporção</p>
                <p className="font-semibold">{imageInfo.aspectRatio}</p>
              </Card>
            </div>
          )}

          <div className="flex gap-3 justify-center flex-wrap">
            <Button onClick={handleDownload} size="lg" className="gap-2 transition-transform duration-300 hover:scale-105">
              <DownloadIcon className="w-4 h-4" />
              Baixar Imagem
            </Button>
            <Button onClick={handleNewImage} variant="outline" size="lg" className="gap-2 transition-transform duration-300 hover:scale-105">
              🔄 Nova Imagem
            </Button>
          </div>

          <Card className="p-6 mt-8 border-2 border-primary/50 transition-all duration-300 hover:border-primary hover:shadow-lg hover:shadow-primary/20">
            <h3 className="text-center font-semibold text-lg mb-6">Como usar:</h3>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center mx-auto mb-3 font-bold">
                  1
                </div>
                <p className="text-sm">Envie a imagem</p>
              </div>
              <div className="text-center">
                <div className="w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center mx-auto mb-3 font-bold">
                  2
                </div>
                <p className="text-sm">Veja o resultado automático</p>
              </div>
              <div className="text-center">
                <div className="w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center mx-auto mb-3 font-bold">
                  3
                </div>
                <p className="text-sm">Baixe sua thumbnail</p>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
