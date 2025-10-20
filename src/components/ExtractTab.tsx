import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Link2, Monitor, Download as DownloadIcon, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ThumbnailQuality {
  label: string;
  resolution: string;
  url: string;
}

export const ExtractTab = () => {
  const [videoUrl, setVideoUrl] = useState("");
  const [videoId, setVideoId] = useState<string | null>(null);
  const [thumbnails, setThumbnails] = useState<ThumbnailQuality[]>([]);
  const { toast } = useToast();

  const extractVideoId = (url: string): string | null => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/,
      /youtube\.com\/embed\/([^&\s]+)/,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
  };

  const handleExtract = () => {
    const id = extractVideoId(videoUrl);
    
    if (!id) {
      toast({
        title: "URL inválida",
        description: "Por favor, insira uma URL válida do YouTube",
        variant: "destructive",
      });
      return;
    }

    setVideoId(id);
    
    const thumbnailQualities: ThumbnailQuality[] = [
      {
        label: "Máxima Qualidade",
        resolution: "1280x720",
        url: `https://img.youtube.com/vi/${id}/maxresdefault.jpg`,
      },
      {
        label: "Alta Qualidade",
        resolution: "480x360",
        url: `https://img.youtube.com/vi/${id}/hqdefault.jpg`,
      },
      {
        label: "Qualidade Média",
        resolution: "320x180",
        url: `https://img.youtube.com/vi/${id}/mqdefault.jpg`,
      },
      {
        label: "Qualidade Padrão",
        resolution: "120x90",
        url: `https://img.youtube.com/vi/${id}/default.jpg`,
      },
      {
        label: "Qualidade Baixa",
        resolution: "120x90",
        url: `https://img.youtube.com/vi/${id}/sddefault.jpg`,
      },
    ];

    setThumbnails(thumbnailQualities);
    
    toast({
      title: "Thumbnails encontradas!",
      description: "Escolha a qualidade e baixe",
    });
  };

  const handleDownload = (url: string, label: string) => {
    fetch(url)
      .then((response) => response.blob())
      .then((blob) => {
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `thumbnail-${label.toLowerCase().replace(/\s+/g, "-")}.jpg`;
        link.click();
      });
  };

  const handleNewSearch = () => {
    setVideoUrl("");
    setVideoId(null);
    setThumbnails([]);
  };

  return (
    <div className="space-y-8">
      <div className="text-center space-y-4">
        <h2 className="text-3xl md:text-4xl font-bold">
          Extraia Thumbnails{" "}
          <span className="text-primary">Direto do YouTube</span>
        </h2>
        <p className="text-muted-foreground text-sm md:text-base max-w-2xl mx-auto">
          Cole a URL de qualquer vídeo do YouTube e baixe todas as thumbnails disponíveis
          em diferentes qualidades
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
        <div className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 bg-accent rounded-lg flex items-center justify-center">
            <Link2 className="w-6 h-6 text-accent-foreground" />
          </div>
          <h3 className="font-semibold">URL Simples</h3>
          <p className="text-sm text-muted-foreground">
            Cole apenas o link do vídeo
          </p>
        </div>
        <div className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 bg-accent rounded-lg flex items-center justify-center">
            <Monitor className="w-6 h-6 text-accent-foreground" />
          </div>
          <h3 className="font-semibold">Múltiplas Qualidades</h3>
          <p className="text-sm text-muted-foreground">
            Todas as resoluções disponíveis
          </p>
        </div>
        <div className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 bg-accent rounded-lg flex items-center justify-center">
            <DownloadIcon className="w-6 h-6 text-accent-foreground" />
          </div>
          <h3 className="font-semibold">Download Direto</h3>
          <p className="text-sm text-muted-foreground">
            Baixe em alta qualidade
          </p>
        </div>
      </div>

      <Card className="max-w-2xl mx-auto p-6">
        <div className="flex gap-3">
          <Input
            placeholder="Cole aqui a URL do vídeo do YouTube..."
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleExtract()}
            className="flex-1"
          />
          <Button onClick={handleExtract} className="px-8">
            Extrair Thumbnails
          </Button>
        </div>
      </Card>

      {thumbnails.length > 0 && (
        <div className="space-y-6 max-w-5xl mx-auto">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-semibold text-lg">Thumbnails Encontradas</h3>
              <p className="text-sm text-muted-foreground">Vídeo ID: {videoId}</p>
            </div>
            <Button onClick={handleNewSearch} variant="outline">
              Nova Busca
            </Button>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {thumbnails.map((thumb, index) => (
              <Card key={index} className="overflow-hidden">
                <div className="aspect-video bg-muted">
                  <img
                    src={thumb.url}
                    alt={thumb.label}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
                <div className="p-4 space-y-3">
                  <div>
                    <h4 className="font-semibold">{thumb.label}</h4>
                    <p className="text-sm text-muted-foreground">{thumb.resolution}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleDownload(thumb.url, thumb.label)}
                      className="flex-1 gap-2"
                      size="sm"
                    >
                      <DownloadIcon className="w-4 h-4" />
                      Baixar
                    </Button>
                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="px-3"
                    >
                      <a href={thumb.url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <div className="bg-accent/50 rounded-lg p-4 space-y-2 text-sm">
            <p className="font-semibold">💡 Dicas:</p>
            <ul className="space-y-1 text-muted-foreground">
              <li>• Clique em "Baixar" para salvar a thumbnail em seu dispositivo</li>
              <li>• Use o ícone de link externo para abrir a imagem em uma nova aba</li>
              <li>• Nem todos os vídeos possuem thumbnails em todas as qualidades</li>
            </ul>
          </div>
        </div>
      )}

      <div className="max-w-2xl mx-auto">
        <h3 className="font-semibold text-center mb-6">Como usar:</h3>
        <div className="flex flex-wrap justify-center gap-8">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold flex-shrink-0">
              1
            </div>
            <p className="text-sm">Cole a URL do vídeo</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold flex-shrink-0">
              2
            </div>
            <p className="text-sm">Veja as thumbnails</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold flex-shrink-0">
              3
            </div>
            <p className="text-sm">Baixe a que preferir</p>
          </div>
        </div>
      </div>
    </div>
  );
};
