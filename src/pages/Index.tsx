import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Zap, Monitor, Download as DownloadIcon, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
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
        title: "Arquivo muito grande",
        description: "O tamanho máximo é 10MB",
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
            title: "Imagem processada!",
            description: "Sua thumbnail está pronta para download",
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
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <svg
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="w-6 h-6 text-primary-foreground"
                >
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                </svg>
              </div>
              <h1 className="text-lg md:text-xl font-bold">YouTube Thumbnail Tools</h1>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        {!originalImage ? (
          <>
            <div className="text-center mb-12 max-w-4xl mx-auto">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
                Redimensione Imagens para <span className="text-primary">Thumbnails do YouTube</span>
              </h2>
              <p className="text-muted-foreground text-sm md:text-base">
                Converta qualquer imagem para o tamanho perfeito de 1280×720 pixels para thumbnails profissionais do YouTube
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 mb-12 max-w-4xl mx-auto">
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
                <h3 className="font-semibold mb-2">Tamanho Perfeito</h3>
                <p className="text-sm text-muted-foreground">
                  Sempre 1280×720px, ideal para o YouTube
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
            </div>

            <Card className="max-w-2xl mx-auto p-12 transition-all duration-300 hover:border-primary hover:border-2 hover:shadow-xl hover:shadow-primary/20">
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
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center transition-transform duration-300 hover:scale-110">
                  <Upload className="w-8 h-8 text-muted-foreground" />
                </div>
                <div className="text-center space-y-3">
                  <p className="font-semibold text-lg">Faça upload da sua imagem</p>
                  <p className="text-sm text-muted-foreground">
                    Arraste e solte ou clique para selecionar
                  </p>
                  <p className="text-xs text-muted-foreground">
                    JPG, PNG, WEBP até 10MB
                  </p>
                  <Button type="button" className="mt-2 transition-transform duration-300 hover:scale-105">
                    Selecionar Imagem
                  </Button>
                </div>
              </label>
            </Card>

            <div className="mt-16 max-w-4xl mx-auto">
              <h3 className="text-center font-semibold text-lg mb-8">Como usar:</h3>
              <div className="grid md:grid-cols-3 gap-8">
                <div className="text-center">
                  <div className="w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center mx-auto mb-3 font-bold">
                    1
                  </div>
                  <p className="text-sm">Faça upload da imagem</p>
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
                Baixar Thumbnail
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
                  <p className="text-sm">Faça upload da imagem</p>
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
      </main>

      <footer className="border-t border-border mt-16">
        <div className="container mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
          <p>YouTube Thumbnail Tools - Ferramentas gratuitas para criadores de conteúdo</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
