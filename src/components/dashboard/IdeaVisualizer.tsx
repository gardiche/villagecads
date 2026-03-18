import { useState, useEffect } from "react";
import { Lightbulb, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface IdeaVisualizerProps {
  ideaTitle: string;
  ideaDescription?: string;
}

const IdeaVisualizer = ({ ideaTitle, ideaDescription }: IdeaVisualizerProps) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const generateImage = async () => {
    setLoading(true);
    setError(false);

    try {
      const prompt = `Create a modern, minimalist, professional illustration representing this business idea: ${ideaTitle}. ${ideaDescription ? `Context: ${ideaDescription.slice(0, 200)}` : ''}. Style: clean, vibrant colors, abstract, inspiring, entrepreneurial. No text in image.`;

      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-image-preview",
          messages: [
            {
              role: "user",
              content: prompt
            }
          ],
          modalities: ["image", "text"]
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const generatedImageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

      if (generatedImageUrl) {
        setImageUrl(generatedImageUrl);
      } else {
        throw new Error("No image URL in response");
      }
    } catch (err) {
      console.error("Error generating image:", err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Auto-generate on mount if we have a description
    if (ideaDescription && ideaDescription.length > 20) {
      generateImage();
    }
  }, [ideaTitle]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 text-center p-8">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Génération de l'image IA...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 text-center p-8">
        <Lightbulb className="h-16 w-16 text-primary/50" />
        <p className="text-sm text-muted-foreground">Impossible de générer l'image</p>
        <Button size="sm" variant="outline" onClick={generateImage}>
          Réessayer
        </Button>
      </div>
    );
  }

  if (!imageUrl) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 text-center p-8">
        <Lightbulb className="h-16 w-16 text-primary/70" />
        <p className="text-sm text-muted-foreground mb-2">Visualisez votre idée</p>
        <Button size="sm" onClick={generateImage}>
          Générer une image IA
        </Button>
      </div>
    );
  }

  return (
    <div className="relative group">
      <img 
        src={imageUrl} 
        alt={`Illustration de ${ideaTitle}`}
        className="w-full h-auto rounded-lg shadow-lg"
      />
      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
        <Button size="sm" variant="secondary" onClick={generateImage}>
          Régénérer
        </Button>
      </div>
    </div>
  );
};

export default IdeaVisualizer;
