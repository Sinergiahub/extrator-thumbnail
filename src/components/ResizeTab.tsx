import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Upload, Zap, Monitor, Download as DownloadIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export const ResizeTab = () => {
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Maximum size is 10MB",
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        setOriginalImage(event.target?.result as string);
        setOriginalDimensions({ width: img.width, height: img.height });
        
        const canvas = document.createElement("canvas");
        canvas.width = 1280;
        canvas.height = 720;
        const ctx = canvas.getContext("2d");
        
        if (ctx) {
          ctx.fillStyle = "#000";
          ctx.fillRect(0, 0, 1280, 720);
          
          const scale = Math.max(1280 / img.width, 720 / img.height);
          const x = (1280 - img.width * scale) / 2;
          const y = (720 - img.height * scale) / 2;
          
          ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
          
          const resized = canvas.toDataURL("image/jpeg", 0.9);
          setResizedImage(resized);
          
          setImageInfo({
            format: `JPG (90%)`,
            originalSize: file.size / 1024,
            aspectRatio: "16:9",
          });
          
          toast({
            title: "Image processed!",
            description: "Your thumbnail is ready for download",
          });
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleDownload = () => {
    if (!resizedImage) return;
    
    const link = document.createElement("a");
    link.download = "youtube-thumbnail.jpg";
    link.href = resizedImage;
    link.click();
  };

  const handleNewImage = () => {
    setOriginalImage(null);
    setResizedImage(null);
    setOriginalDimensions(null);
    setImageInfo(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <Card className="p-6 md:p-8">
        <CardHeader className="px-0 pt-0">
          <CardTitle className="text-2xl md:text-3xl">Resize Thumbnail</CardTitle>
          <CardDescription>
            Convert your image to the ideal YouTube size (1280×720)
          </CardDescription>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          {!originalImage ? (
            <div className="uploader">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                id="image-upload"
              />
              <label
                htmlFor="image-upload"
                className="cursor-pointer flex flex-col items-center gap-4"
              >
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <Upload className="w-8 h-8 text-primary" />
                </div>
                <div className="upload-actions">
                  <p className="upload-hint" aria-live="polite">
                    <span className="hint-icon" role="img" aria-label="Attachments">📎</span>
                    <span className="hint-text">JPG, PNG, WEBP up to 10MB</span>
                  </p>
                  <button className="btn-upload" type="button">
                    Select Image
                  </button>
                </div>
              </label>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <Card className="p-4 space-y-2">
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
                <Card className="p-4 space-y-2">
                  <div className="flex justify-between items-center">
                    <h3 className="font-semibold">YouTube Thumbnail</h3>
                    <span className="text-xs text-muted-foreground">1280 × 720</span>
                  </div>
                  <div className="aspect-video bg-muted rounded-lg overflow-hidden">
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
                  <Card className="p-4 text-center">
                    <p className="text-xs text-muted-foreground mb-1">📎 Format</p>
                    <p className="font-semibold">{imageInfo.format}</p>
                  </Card>
                  <Card className="p-4 text-center">
                    <p className="text-xs text-muted-foreground mb-1">📊 Size</p>
                    <p className="font-semibold">{imageInfo.originalSize.toFixed(2)} KB</p>
                  </Card>
                  <Card className="p-4 text-center">
                    <p className="text-xs text-muted-foreground mb-1">📐 Aspect Ratio</p>
                    <p className="font-semibold">{imageInfo.aspectRatio}</p>
                  </Card>
                </div>
              )}

              <div className="flex gap-3 justify-center flex-wrap">
                <Button onClick={handleDownload} size="lg" className="gap-2">
                  <DownloadIcon className="w-4 h-4" />
                  Download Thumbnail
                </Button>
                <Button onClick={handleNewImage} variant="outline" size="lg" className="gap-2">
                  🔄 New Image
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
