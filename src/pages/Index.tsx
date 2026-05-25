import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ResizeTab } from "@/components/ResizeTab";
import { ExtractTab } from "@/components/ExtractTab";
import { Image, Link2 } from "lucide-react";

const Index = () => {
  const [activeTab, setActiveTab] = useState("resize");

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-3">
            <button 
              onClick={() => setActiveTab("resize")}
              className="flex items-center gap-3 hover:opacity-80 transition-opacity"
              aria-label="Voltar ao início"
            >
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <svg
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="w-6 h-6 text-primary-foreground"
                >
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                </svg>
              </div>
              <h1 className="text-lg md:text-xl font-bold">Ferramentas para Thumbnails do YouTube</h1>
            </button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-8">
            <TabsTrigger value="resize" className="gap-2">
              <Image className="w-4 h-4" />
              Redimensionar
            </TabsTrigger>
            <TabsTrigger value="extract" className="gap-2">
              <Link2 className="w-4 h-4" />
              Extrair do YouTube
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="resize" className="mt-0">
            <ResizeTab />
          </TabsContent>
          
          <TabsContent value="extract" className="mt-0">
            <ExtractTab />
          </TabsContent>
        </Tabs>
      </main>

      <footer className="border-t border-border mt-16">
        <div className="container mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
          <p>Ferramentas para Thumbnails do YouTube - Ferramentas gratuitas para criadores de conteúdo</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
