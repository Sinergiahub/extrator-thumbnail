import { useEffect, useRef } from "react";

const SCRIPT_SRC = "https://veedea.com/assets/js/vc-embed.js";

export const VeedeaPlayer = () => {
  const holderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (document.querySelector(`script[src="${SCRIPT_SRC}"]`)) return;
    const script = document.createElement("script");
    script.src = SCRIPT_SRC;
    script.async = true;
    document.body.appendChild(script);
  }, []);

  return (
    <section aria-labelledby="veedea-title" className="w-full py-12 md:py-16">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h2 id="veedea-title" className="text-2xl md:text-3xl font-bold text-foreground">
            Veja como usar a ferramenta
          </h2>
          <p className="mt-2 text-sm md:text-base text-muted-foreground">
            Aprenda em poucos minutos como aproveitar todos os recursos.
          </p>
        </div>

        <div
          ref={holderRef}
          className="mx-auto w-full max-w-4xl"
          style={{
            minHeight: "clamp(240px, 52vw, 620px)",
            height: "auto",
          }}
        >
          <iframe
            id="vidframe"
            title="Vídeo tutorial Veedea"
            src="https://veedea.com/t?v=c383dc"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            data-ready="true"
            style={{ width: "100%", height: "100%", minHeight: "inherit", display: "block", border: 0 }}
          />
        </div>
      </div>
    </section>
  );
};
