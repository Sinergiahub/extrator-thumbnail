import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Upload, Zap, Monitor, Download as DownloadIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import JSZip from "jszip";

type SizePreset = {
  label: string;
  width: number;
  height: number;
  aspectRatio: string;
};

const SIZE_PRESETS: Record<string, SizePreset> = {
  "youtube": { label: "YouTube Thumbnail (1280×720)", width: 1280, height: 720, aspectRatio: "16:9" },
  "reels": { label: "Reels / Shorts (1080×1920)", width: 1080, height: 1920, aspectRatio: "9:16" },
  "portrait": { label: "Portrait / Story (730×1024)", width: 730, height: 1024, aspectRatio: "730:1024" },
  "banner": { label: "Banner (2000×590)", width: 2000, height: 590, aspectRatio: "2000:590" },
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
        title: "File too large",
        description: "Maximum size is 10MB",
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
            title: "Image processed!",
            description: `Resized to ${preset.width}×${preset.height}px`,
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
        title: "Some files skipped",
        description: "Files larger than 10MB were ignored.",
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
        title: "Batch processed!",
        description: `${results.length} images resized to ${SIZE_PRESETS[selectedSize].width}×${SIZE_PRESETS[selectedSize].height}px`,
      });
    } catch (err) {
      toast({
        title: "Processing failed",
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
          <div className="text-center space-y-2">
            <h2 className="text-2xl md:text-3xl font-bold">
              {batchItems.length} images resized
            </h2>
            <p className="text-muted-foreground text-sm">
              {SIZE_PRESETS[selectedSize].label}
            </p>
          </div>

          <div className="flex gap-3 justify-center flex-wrap">
            <Button onClick={handleDownloadZip} size="lg" className="gap-2 transition-transform duration-300 hover:scale-105">
              <DownloadIcon className="w-4 h-4" />
              Download ZIP ({batchItems.length})
            </Button>
            <Button onClick={handleNewImage} variant="outline" size="lg" className="gap-2 transition-transform duration-300 hover:scale-105">
              🔄 New Batch
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
              Resize Images for <span className="text-primary">YouTube Thumbnails</span>
            </h2>
            <p className="text-muted-foreground text-sm md:text-base max-w-2xl mx-auto">
              Convert any image to the perfect size for YouTube thumbnails (1280×720), portrait/story format (730×1024), or banner (2000×590)
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <Card className="p-6 text-center transition-all duration-300 hover:scale-105 hover:border-primary hover:border-2 hover:shadow-lg hover:shadow-primary/20">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 transition-transform duration-300 group-hover:scale-110">
                <Zap className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Fast Processing</h3>
              <p className="text-sm text-muted-foreground">
                Instant resizing with high quality
              </p>
            </Card>

            <Card className="p-6 text-center transition-all duration-300 hover:scale-105 hover:border-primary hover:border-2 hover:shadow-lg hover:shadow-primary/20">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 transition-transform duration-300 group-hover:scale-110">
                <Monitor className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Perfect Size</h3>
              <p className="text-sm text-muted-foreground">
                Always 1280×720px, ideal for YouTube
              </p>
            </Card>

            <Card className="p-6 text-center transition-all duration-300 hover:scale-105 hover:border-primary hover:border-2 hover:shadow-lg hover:shadow-primary/20">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 transition-transform duration-300 group-hover:scale-110">
                <DownloadIcon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Direct Download</h3>
              <p className="text-sm text-muted-foreground">
                Download in JPG with 90% quality
              </p>
            </Card>
          </div>

          <Card className="max-w-2xl mx-auto p-12 transition-all duration-300 hover:border-primary hover:border-2 hover:shadow-xl hover:shadow-primary/20">
            <div className="mb-6">
              <p className="text-sm font-semibold mb-3 text-center">Choose output size:</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageUpload}
              className="hidden"
              id="image-upload"
            />
            <label
              htmlFor="image-upload"
              className="cursor-pointer flex flex-col items-center gap-4"
            >
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center transition-transform duration-300 hover:scale-110">
                <Upload className="w-8 h-8 text-muted-foreground" />
              </div>
              <div className="text-center space-y-3">
                <p className="font-semibold text-lg">Upload your image(s)</p>
                <p className="text-sm text-muted-foreground">
                  Drag and drop or click to select — select multiple to get a ZIP
                </p>
                <p className="text-xs text-muted-foreground">
                  JPG, PNG, WEBP up to 10MB
                </p>
                <Button type="button" className="mt-2 transition-transform duration-300 hover:scale-105" disabled={isProcessing}>
                  {isProcessing ? "Processing..." : "Select Image(s)"}
                </Button>
              </div>
            </label>
          </Card>

          <div className="max-w-4xl mx-auto">
            <h3 className="text-center font-semibold text-lg mb-8">How to use:</h3>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center mx-auto mb-3 font-bold">
                  1
                </div>
                <p className="text-sm">Upload image</p>
              </div>
              <div className="text-center">
                <div className="w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center mx-auto mb-3 font-bold">
                  2
                </div>
                <p className="text-sm">See automatic result</p>
              </div>
              <div className="text-center">
                <div className="w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center mx-auto mb-3 font-bold">
                  3
                </div>
                <p className="text-sm">Download your thumbnail</p>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="p-4 space-y-2 transition-all duration-300 hover:scale-105 hover:border-primary hover:border-2 hover:shadow-lg hover:shadow-primary/20">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold">Original Image</h3>
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
                <h3 className="font-semibold">Resized Image</h3>
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
                <p className="text-xs text-muted-foreground mb-1">📎 Format</p>
                <p className="font-semibold">{imageInfo.format}</p>
              </Card>
              <Card className="p-4 text-center transition-all duration-300 hover:scale-105 hover:border-primary hover:shadow-lg hover:shadow-primary/20">
                <p className="text-xs text-muted-foreground mb-1">📊 Size</p>
                <p className="font-semibold">{imageInfo.originalSize.toFixed(2)} KB</p>
              </Card>
              <Card className="p-4 text-center transition-all duration-300 hover:scale-105 hover:border-primary hover:shadow-lg hover:shadow-primary/20">
                <p className="text-xs text-muted-foreground mb-1">📐 Aspect Ratio</p>
                <p className="font-semibold">{imageInfo.aspectRatio}</p>
              </Card>
            </div>
          )}

          <div className="flex gap-3 justify-center flex-wrap">
            <Button onClick={handleDownload} size="lg" className="gap-2 transition-transform duration-300 hover:scale-105">
              <DownloadIcon className="w-4 h-4" />
              Download Image
            </Button>
            <Button onClick={handleNewImage} variant="outline" size="lg" className="gap-2 transition-transform duration-300 hover:scale-105">
              🔄 New Image
            </Button>
          </div>

          <Card className="p-6 mt-8 border-2 border-primary/50 transition-all duration-300 hover:border-primary hover:shadow-lg hover:shadow-primary/20">
            <h3 className="text-center font-semibold text-lg mb-6">How to use:</h3>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center mx-auto mb-3 font-bold">
                  1
                </div>
                <p className="text-sm">Upload image</p>
              </div>
              <div className="text-center">
                <div className="w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center mx-auto mb-3 font-bold">
                  2
                </div>
                <p className="text-sm">See automatic result</p>
              </div>
              <div className="text-center">
                <div className="w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center mx-auto mb-3 font-bold">
                  3
                </div>
                <p className="text-sm">Download your thumbnail</p>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
