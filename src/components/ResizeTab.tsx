import { useState, useRef, useEffect } from "react";
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
  "quadrado-512": { label: "Quadrado (512×512)", width: 512, height: 512, aspectRatio: "1:1" },
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
  // Banner largo 3:1
  "banner-3x1": { label: "Banner 3:1 (1920×640)", width: 1920, height: 640, aspectRatio: "3:1" },
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

type OutputFormat = "jpg" | "png" | "webp";

const OUTPUT_FORMATS: Record<
  OutputFormat,
  { label: string; mime: string; ext: string; lossy: boolean; transparent: boolean; hint: string }
> = {
  jpg: { label: "JPG", mime: "image/jpeg", ext: "jpg", lossy: true, transparent: false, hint: "leve, sem transparência" },
  png: { label: "PNG", mime: "image/png", ext: "png", lossy: false, transparent: true, hint: "sem perdas, transparente" },
  webp: { label: "WebP", mime: "image/webp", ext: "webp", lossy: true, transparent: true, hint: "menor tamanho, moderno" },
};

type FocusKey =
  | "top-left" | "top" | "top-right"
  | "left" | "center" | "right"
  | "bottom-left" | "bottom" | "bottom-right";

const FOCUS_POINTS: Record<FocusKey, { label: string; x: number; y: number }> = {
  "top-left": { label: "Topo esq.", x: 0, y: 0 },
  "top": { label: "Topo", x: 0.5, y: 0 },
  "top-right": { label: "Topo dir.", x: 1, y: 0 },
  "left": { label: "Esquerda", x: 0, y: 0.5 },
  "center": { label: "Centro", x: 0.5, y: 0.5 },
  "right": { label: "Direita", x: 1, y: 0.5 },
  "bottom-left": { label: "Base esq.", x: 0, y: 1 },
  "bottom": { label: "Base", x: 0.5, y: 1 },
  "bottom-right": { label: "Base dir.", x: 1, y: 1 },
};

type FitMode = "cover" | "contain";
type BackgroundMode = "blur" | "color" | "transparent";
type WatermarkType = "text" | "logo";

const WM_POSITIONS: Record<string, { label: string; x: number; y: number }> = {
  "top-left": { label: "Topo esq.", x: 0, y: 0 },
  "top": { label: "Topo", x: 0.5, y: 0 },
  "top-right": { label: "Topo dir.", x: 1, y: 0 },
  "left": { label: "Esquerda", x: 0, y: 0.5 },
  "center": { label: "Centro", x: 0.5, y: 0.5 },
  "right": { label: "Direita", x: 1, y: 0.5 },
  "bottom-left": { label: "Base esq.", x: 0, y: 1 },
  "bottom": { label: "Base", x: 0.5, y: 1 },
  "bottom-right": { label: "Base dir.", x: 1, y: 1 },
};


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
  const [outputFormat, setOutputFormat] = useState<OutputFormat>("jpg");
  const [quality, setQuality] = useState(90);
  const [focus, setFocus] = useState<FocusKey>("center");
  const [fitMode, setFitMode] = useState<FitMode>("cover");
  const [background, setBackground] = useState<BackgroundMode>("blur");
  const [bgColor, setBgColor] = useState("#000000");
  const [wmEnabled, setWmEnabled] = useState(false);
  const [wmType, setWmType] = useState<WatermarkType>("text");
  const [wmText, setWmText] = useState("SinergIA Club");
  const [wmColor, setWmColor] = useState("#ffffff");
  const [wmOpacity, setWmOpacity] = useState(60);
  const [wmScale, setWmScale] = useState(20);
  const [wmPosition, setWmPosition] = useState("bottom-right");
  const [wmLogo, setWmLogo] = useState<string | null>(null);
  const [wmLogoVersion, setWmLogoVersion] = useState(0);
  const wmLogoImgRef = useRef<HTMLImageElement | null>(null);
  const wmLogoInputRef = useRef<HTMLInputElement>(null);
  const [customWidth, setCustomWidth] = useState(1200);
  const [customHeight, setCustomHeight] = useState(630);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const clampDim = (n: number) => Math.min(8000, Math.max(16, Math.round(n) || 16));

  const activePreset: SizePreset =
    selectedSize === "custom"
      ? {
          label: `Personalizado (${clampDim(customWidth)}×${clampDim(customHeight)})`,
          width: clampDim(customWidth),
          height: clampDim(customHeight),
          aspectRatio: `${clampDim(customWidth)}:${clampDim(customHeight)}`,
        }
      : SIZE_PRESETS[selectedSize] ?? SIZE_PRESETS["youtube"];



  const exportCanvas = (canvas: HTMLCanvasElement) => {
    const fmt = OUTPUT_FORMATS[outputFormat];
    return fmt.lossy
      ? canvas.toDataURL(fmt.mime, quality / 100)
      : canvas.toDataURL(fmt.mime);
  };

  const drawToCanvas = (img: HTMLImageElement) => {
    const preset = activePreset;
    const point = FOCUS_POINTS[focus];
    const canvas = document.createElement("canvas");
    canvas.width = preset.width;
    canvas.height = preset.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    const supportsAlpha = OUTPUT_FORMATS[outputFormat].transparent;
    // Formatos sem alpha (JPG) nunca podem ficar transparentes
    const bgMode: BackgroundMode =
      background === "transparent" && !supportsAlpha ? "color" : background;

    const scale =
      fitMode === "cover"
        ? Math.max(preset.width / img.width, preset.height / img.height)
        : Math.min(preset.width / img.width, preset.height / img.height);
    const w = img.width * scale;
    const h = img.height * scale;
    const x = (preset.width - w) * point.x;
    const y = (preset.height - h) * point.y;

    const hasEmptyArea = fitMode === "contain" && (w < preset.width || h < preset.height);

    if (bgMode === "color" || (!hasEmptyArea && !supportsAlpha)) {
      ctx.fillStyle = bgMode === "color" ? bgColor : "#000000";
      ctx.fillRect(0, 0, preset.width, preset.height);
    }

    if (hasEmptyArea && bgMode === "blur") {
      // Preenche o fundo com a própria imagem ampliada e desfocada
      const coverScale = Math.max(preset.width / img.width, preset.height / img.height) * 1.1;
      const cw = img.width * coverScale;
      const ch = img.height * coverScale;
      ctx.save();
      ctx.filter = "blur(24px)";
      ctx.drawImage(img, (preset.width - cw) / 2, (preset.height - ch) / 2, cw, ch);
      ctx.restore();
    }

    ctx.drawImage(img, x, y, w, h);
    drawWatermark(ctx, preset.width, preset.height);
    return canvas;
  };

  const drawWatermark = (ctx: CanvasRenderingContext2D, W: number, H: number) => {
    if (!wmEnabled) return;
    const pos = WM_POSITIONS[wmPosition] ?? WM_POSITIONS["bottom-right"];
    const margin = Math.round(Math.min(W, H) * 0.03);
    ctx.save();
    ctx.globalAlpha = wmOpacity / 100;

    if (wmType === "logo") {
      const logo = wmLogoImgRef.current;
      if (!logo || !logo.width) {
        ctx.restore();
        return;
      }
      const lw = (W * wmScale) / 100;
      const lh = (logo.height / logo.width) * lw;
      const lx = margin + (W - lw - margin * 2) * pos.x;
      const ly = margin + (H - lh - margin * 2) * pos.y;
      ctx.drawImage(logo, lx, ly, lw, lh);
    } else {
      const text = wmText.trim();
      if (!text) {
        ctx.restore();
        return;
      }
      const fontSize = Math.max(10, (H * wmScale) / 100);
      ctx.font = `bold ${fontSize}px Arial, sans-serif`;
      ctx.fillStyle = wmColor;
      ctx.textBaseline = "top";
      ctx.textAlign = "left";
      const metrics = ctx.measureText(text);
      const tw = metrics.width;
      const th = fontSize * 1.2;
      const tx = margin + (W - tw - margin * 2) * pos.x;
      const ty = margin + (H - th - margin * 2) * pos.y;
      ctx.shadowColor = "rgba(0,0,0,0.5)";
      ctx.shadowBlur = fontSize * 0.15;
      ctx.fillText(text, tx, ty);
    }
    ctx.restore();
  };


  const renderFromDataUrl = (dataUrl: string): Promise<string> =>
    new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = drawToCanvas(img);
        if (!canvas) return reject(new Error("Canvas error"));
        resolve(exportCanvas(canvas));
      };
      img.onerror = () => reject(new Error("Image load error"));
      img.src = dataUrl;
    });



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

    const preset = activePreset;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        setOriginalImage(event.target?.result as string);
        setOriginalDimensions({ width: img.width, height: img.height });

        const canvas = drawToCanvas(img);
        if (canvas) {
          setResizedImage(exportCanvas(canvas));

          setImageInfo({
            format: OUTPUT_FORMATS[outputFormat].lossy
              ? `${OUTPUT_FORMATS[outputFormat].label} (${quality}%)`
              : OUTPUT_FORMATS[outputFormat].label,
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
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        renderFromDataUrl(dataUrl)
          .then((resized) =>
            resolve({
              name: file.name.replace(/\.[^.]+$/, ""),
              original: dataUrl,
              resized,
            })
          )
          .catch(reject);
      };
      reader.onerror = () => reject(new Error("File read error"));
      reader.readAsDataURL(file);
    });
  };

  // Reprocessa automaticamente quando tamanho, formato, qualidade ou foco mudam
  useEffect(() => {
    let cancelled = false;
    if (originalImage) {
      renderFromDataUrl(originalImage)
        .then((out) => {
          if (!cancelled) setResizedImage(out);
        })
        .catch(() => undefined);
    } else if (batchItems.length > 0) {
      Promise.all(
        batchItems.map((item) =>
          renderFromDataUrl(item.original).then((resized) => ({ ...item, resized }))
        )
      )
        .then((items) => {
          if (!cancelled) setBatchItems(items);
        })
        .catch(() => undefined);
    }
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    selectedSize,
    customWidth,
    customHeight,
    outputFormat,
    quality,
    focus,
    fitMode,
    background,
    bgColor,
    originalImage,
    wmEnabled,
    wmType,
    wmText,
    wmColor,
    wmOpacity,
    wmScale,
    wmPosition,
    wmLogo,
    wmLogoVersion,
  ]);

  // Carrega o logo da marca d'água
  useEffect(() => {
    if (!wmLogo) {
      wmLogoImgRef.current = null;
      return;
    }
    const img = new Image();
    img.onload = () => {
      wmLogoImgRef.current = img;
      setWmLogoVersion((v) => v + 1);
    };
    img.src = wmLogo;
  }, [wmLogo]);


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
        description: `${results.length} imagens redimensionadas para ${activePreset.width}×${activePreset.height}px`,
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
    const preset = activePreset;
    const ext = OUTPUT_FORMATS[outputFormat].ext;
    const zip = new JSZip();
    batchItems.forEach((item) => {
      const base64 = item.resized.split(",")[1];
      zip.file(`${item.name}-${preset.width}x${preset.height}.${ext}`, base64, { base64: true });
    });
    const blob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.download = `resized-${preset.width}x${preset.height}-${ext}.zip`;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleDownload = () => {
    if (!resizedImage) return;
    const preset = activePreset;
    const link = document.createElement("a");
    link.download = `image-${preset.width}x${preset.height}.${OUTPUT_FORMATS[outputFormat].ext}`;
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
              {activePreset.label}
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
                  style={{ aspectRatio: `${activePreset.width} / ${activePreset.height}` }}
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
              <h3 className="font-semibold mb-2">26 Presets</h3>
              <p className="text-sm text-muted-foreground">
                YouTube, Instagram, Reels, banners, módulos, aulas, produtos e hero
              </p>
            </Card>

            <Card className="p-6 text-center transition-all duration-300 hover:scale-105 hover:border-primary hover:border-2 hover:shadow-lg hover:shadow-primary/20">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 transition-transform duration-300 group-hover:scale-110">
                <DownloadIcon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Download Direto</h3>
              <p className="text-sm text-muted-foreground">
                Escolha JPG, PNG ou WebP com controle de qualidade
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
                <button
                  type="button"
                  onClick={() => setSelectedSize("custom")}
                  className={`p-3 rounded-lg border-2 text-sm font-medium transition-all duration-300 hover:scale-105 ${
                    selectedSize === "custom"
                      ? "border-primary bg-primary/10 text-foreground"
                      : "border-border hover:border-primary"
                  }`}
                >
                  ✏️ Personalizado
                </button>
              </div>

              {selectedSize === "custom" && (
                <div className="animate-fade-in mt-4 p-4 rounded-lg border-2 border-primary/40 bg-primary/5">
                  <p className="text-xs font-medium mb-3 text-center">
                    Digite as dimensões desejadas (16 a 8000 px)
                  </p>
                  <div className="flex items-end justify-center gap-3 flex-wrap">
                    <div>
                      <label className="block text-[11px] text-muted-foreground mb-1" htmlFor="custom-w">
                        Largura (px)
                      </label>
                      <input
                        id="custom-w"
                        type="number"
                        min={16}
                        max={8000}
                        value={customWidth}
                        onChange={(e) => setCustomWidth(Number(e.target.value))}
                        className="w-28 h-10 px-3 rounded-md border-2 border-border bg-background text-sm focus:border-primary outline-none transition-colors"
                      />
                    </div>
                    <span className="pb-3 text-muted-foreground">×</span>
                    <div>
                      <label className="block text-[11px] text-muted-foreground mb-1" htmlFor="custom-h">
                        Altura (px)
                      </label>
                      <input
                        id="custom-h"
                        type="number"
                        min={16}
                        max={8000}
                        value={customHeight}
                        onChange={(e) => setCustomHeight(Number(e.target.value))}
                        className="w-28 h-10 px-3 rounded-md border-2 border-border bg-background text-sm focus:border-primary outline-none transition-colors"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setCustomWidth(clampDim(customHeight));
                        setCustomHeight(clampDim(customWidth));
                      }}
                      className="h-10 px-3 rounded-md border-2 border-border text-xs font-medium hover:border-primary hover:scale-105 transition-all duration-300"
                    >
                      ⇄ Inverter
                    </button>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-3 text-center">
                    Saída: <span className="text-primary font-semibold">
                      {activePreset.width} × {activePreset.height} px
                    </span>{" "}
                    ({activePreset.aspectRatio})
                  </p>
                </div>
              )}
            </div>


            <div className="mb-2">
              <p className="text-sm font-semibold mb-3 text-center">Formato de saída:</p>
              <div className="grid grid-cols-3 gap-3">
                {(Object.keys(OUTPUT_FORMATS) as OutputFormat[]).map((key) => {
                  const fmt = OUTPUT_FORMATS[key];
                  const isActive = outputFormat === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setOutputFormat(key)}
                      className={`p-3 rounded-lg border-2 text-sm font-medium transition-all duration-300 hover:scale-105 ${
                        isActive
                          ? "border-primary bg-primary/10 text-foreground"
                          : "border-border hover:border-primary"
                      }`}
                    >
                      {fmt.label}
                      <span className="block text-[10px] text-muted-foreground font-normal">
                        {fmt.hint}
                      </span>
                    </button>
                  );
                })}
              </div>

              {OUTPUT_FORMATS[outputFormat].lossy && (
                <div className="mt-4">
                  <div className="flex justify-between text-xs mb-2">
                    <span className="font-medium">Qualidade / compressão</span>
                    <span className="text-primary font-semibold">{quality}%</span>
                  </div>
                  <input
                    type="range"
                    min={40}
                    max={100}
                    step={5}
                    value={quality}
                    onChange={(e) => setQuality(Number(e.target.value))}
                    className="w-full accent-primary cursor-pointer"
                  />
                  <p className="text-[10px] text-muted-foreground mt-1">
                    Menor qualidade = arquivo mais leve
                  </p>
                </div>
              )}
            </div>

            <div className="mt-6 pt-6 border-t border-border">
              <p className="text-sm font-semibold mb-1 text-center">🎯 Ponto de foco do corte</p>
              <p className="text-[11px] text-muted-foreground mb-3 text-center">
                Escolha qual parte da imagem deve ser preservada ao recortar
              </p>
              <div className="grid grid-cols-3 gap-2 max-w-xs mx-auto">
                {(Object.keys(FOCUS_POINTS) as FocusKey[]).map((key) => {
                  const isActive = focus === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setFocus(key)}
                      title={FOCUS_POINTS[key].label}
                      className={`aspect-square rounded-lg border-2 text-[10px] font-medium transition-all duration-300 hover:scale-105 flex items-center justify-center ${
                        isActive
                          ? "border-primary bg-primary/10 text-foreground shadow-lg"
                          : "border-border hover:border-primary text-muted-foreground"
                      }`}
                    >
                      {FOCUS_POINTS[key].label}
                    </button>
                  );
                })}
              </div>
              <p className="text-[10px] text-muted-foreground mt-2 text-center">
                Atual: <span className="text-primary font-semibold">{FOCUS_POINTS[focus].label}</span>
              </p>
            </div>

            <div className="mt-6 pt-6 border-t border-border">
              <p className="text-sm font-semibold mb-1 text-center">🖼️ Enquadramento e fundo</p>
              <p className="text-[11px] text-muted-foreground mb-3 text-center">
                Escolha entre cortar a imagem ou encaixá-la inteira preenchendo as áreas vazias
              </p>

              <div className="grid grid-cols-2 gap-3 mb-4">
                {([
                  { key: "cover" as FitMode, label: "Preencher (cortar)", hint: "sem áreas vazias" },
                  { key: "contain" as FitMode, label: "Encaixar (imagem inteira)", hint: "gera áreas vazias" },
                ]).map((opt) => (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => setFitMode(opt.key)}
                    className={`p-3 rounded-lg border-2 text-sm font-medium transition-all duration-300 hover:scale-105 ${
                      fitMode === opt.key
                        ? "border-primary bg-primary/10 text-foreground"
                        : "border-border hover:border-primary"
                    }`}
                  >
                    {opt.label}
                    <span className="block text-[10px] text-muted-foreground font-normal">
                      {opt.hint}
                    </span>
                  </button>
                ))}
              </div>

              {fitMode === "contain" && (
                <div className="animate-fade-in">
                  <p className="text-xs font-medium mb-2">Fundo das áreas vazias:</p>
                  <div className="grid grid-cols-3 gap-3">
                    {([
                      { key: "blur" as BackgroundMode, label: "Blur", hint: "imagem desfocada" },
                      { key: "color" as BackgroundMode, label: "Cor sólida", hint: "escolha a cor" },
                      { key: "transparent" as BackgroundMode, label: "Transparente", hint: "PNG / WebP" },
                    ]).map((opt) => {
                      const disabled =
                        opt.key === "transparent" && !OUTPUT_FORMATS[outputFormat].transparent;
                      return (
                        <button
                          key={opt.key}
                          type="button"
                          disabled={disabled}
                          onClick={() => setBackground(opt.key)}
                          className={`p-3 rounded-lg border-2 text-sm font-medium transition-all duration-300 ${
                            disabled
                              ? "border-border opacity-40 cursor-not-allowed"
                              : background === opt.key
                                ? "border-primary bg-primary/10 text-foreground hover:scale-105"
                                : "border-border hover:border-primary hover:scale-105"
                          }`}
                        >
                          {opt.label}
                          <span className="block text-[10px] text-muted-foreground font-normal">
                            {disabled ? "requer PNG/WebP" : opt.hint}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {background === "color" && (
                    <div className="mt-4 flex items-center justify-center gap-3">
                      <label className="text-xs font-medium" htmlFor="bg-color">
                        Cor do fundo:
                      </label>
                      <input
                        id="bg-color"
                        type="color"
                        value={bgColor}
                        onChange={(e) => setBgColor(e.target.value)}
                        className="h-9 w-16 rounded-md border-2 border-border bg-transparent cursor-pointer"
                      />
                      <span className="text-xs text-muted-foreground uppercase">{bgColor}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="mt-6 pt-6 border-t border-border">
              <div className="flex items-center justify-center gap-3 mb-1">
                <p className="text-sm font-semibold">💧 Marca d'água</p>
                <button
                  type="button"
                  onClick={() => setWmEnabled((v) => !v)}
                  className={`px-3 py-1 rounded-full border-2 text-[11px] font-semibold transition-all duration-300 hover:scale-105 ${
                    wmEnabled
                      ? "border-primary bg-primary/10 text-foreground"
                      : "border-border text-muted-foreground hover:border-primary"
                  }`}
                >
                  {wmEnabled ? "Ativada" : "Desativada"}
                </button>
              </div>
              <p className="text-[11px] text-muted-foreground mb-3 text-center">
                Adicione um texto ou logo sobre as imagens exportadas
              </p>

              {wmEnabled && (
                <div className="animate-fade-in space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    {([
                      { key: "text" as WatermarkType, label: "Texto", hint: "escreva o texto" },
                      { key: "logo" as WatermarkType, label: "Logo", hint: "envie uma imagem" },
                    ]).map((opt) => (
                      <button
                        key={opt.key}
                        type="button"
                        onClick={() => setWmType(opt.key)}
                        className={`p-3 rounded-lg border-2 text-sm font-medium transition-all duration-300 hover:scale-105 ${
                          wmType === opt.key
                            ? "border-primary bg-primary/10 text-foreground"
                            : "border-border hover:border-primary"
                        }`}
                      >
                        {opt.label}
                        <span className="block text-[10px] text-muted-foreground font-normal">
                          {opt.hint}
                        </span>
                      </button>
                    ))}
                  </div>

                  {wmType === "text" ? (
                    <div className="flex flex-col sm:flex-row items-center gap-3">
                      <input
                        type="text"
                        value={wmText}
                        onChange={(e) => setWmText(e.target.value)}
                        placeholder="Seu texto ou @usuario"
                        className="flex-1 w-full h-10 px-3 rounded-md border-2 border-border bg-background text-sm focus:border-primary outline-none transition-colors"
                      />
                      <div className="flex items-center gap-2">
                        <label className="text-xs font-medium" htmlFor="wm-color">
                          Cor:
                        </label>
                        <input
                          id="wm-color"
                          type="color"
                          value={wmColor}
                          onChange={(e) => setWmColor(e.target.value)}
                          className="h-9 w-14 rounded-md border-2 border-border bg-transparent cursor-pointer"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-3">
                      <input
                        ref={wmLogoInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const reader = new FileReader();
                          reader.onload = () => setWmLogo(reader.result as string);
                          reader.readAsDataURL(file);
                        }}
                      />
                      <div className="flex items-center gap-3">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => wmLogoInputRef.current?.click()}
                          className="border-2 border-primary hover:scale-105 transition-all duration-300"
                        >
                          {wmLogo ? "Trocar logo" : "Selecionar logo (PNG)"}
                        </Button>
                        {wmLogo && (
                          <>
                            <img
                              src={wmLogo}
                              alt="Prévia do logo da marca d'água"
                              className="h-10 w-auto rounded border border-border bg-muted/30 p-1"
                            />
                            <button
                              type="button"
                              onClick={() => setWmLogo(null)}
                              className="text-xs text-muted-foreground hover:text-primary underline"
                            >
                              remover
                            </button>
                          </>
                        )}
                      </div>
                      {!wmLogo && (
                        <p className="text-[10px] text-muted-foreground">
                          Dica: use PNG com fundo transparente
                        </p>
                      )}
                    </div>
                  )}

                  <div>
                    <p className="text-xs font-medium mb-2 text-center">Posição</p>
                    <div className="grid grid-cols-3 gap-2 max-w-xs mx-auto">
                      {Object.keys(WM_POSITIONS).map((key) => (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setWmPosition(key)}
                          className={`py-2 rounded-md border-2 text-[10px] font-medium transition-all duration-300 hover:scale-105 ${
                            wmPosition === key
                              ? "border-primary bg-primary/10 text-foreground"
                              : "border-border hover:border-primary text-muted-foreground"
                          }`}
                        >
                          {WM_POSITIONS[key].label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <div className="flex justify-between text-xs font-medium mb-2">
                        <span>Tamanho</span>
                        <span className="text-primary">{wmScale}%</span>
                      </div>
                      <input
                        type="range"
                        min={3}
                        max={60}
                        value={wmScale}
                        onChange={(e) => setWmScale(Number(e.target.value))}
                        className="w-full accent-primary cursor-pointer"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between text-xs font-medium mb-2">
                        <span>Opacidade</span>
                        <span className="text-primary">{wmOpacity}%</span>
                      </div>
                      <input
                        type="range"
                        min={10}
                        max={100}
                        value={wmOpacity}
                        onChange={(e) => setWmOpacity(Number(e.target.value))}
                        className="w-full accent-primary cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              )}
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
                  {activePreset.width} × {activePreset.height}
                </span>
              </div>
              <div className="bg-muted rounded-lg overflow-hidden flex items-center justify-center" style={{ aspectRatio: `${activePreset.width} / ${activePreset.height}` }}>
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
