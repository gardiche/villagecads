import { useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Mail, Send } from "lucide-react";

const contactSchema = z.object({
  name: z.string()
    .trim()
    .min(1, "Le nom est requis")
    .max(100, "Le nom doit faire moins de 100 caractères"),
  email: z.string()
    .trim()
    .email("Email invalide")
    .max(255, "L'email doit faire moins de 255 caractères"),
  subject: z.string()
    .trim()
    .min(1, "Le sujet est requis")
    .max(200, "Le sujet doit faire moins de 200 caractères"),
  message: z.string()
    .trim()
    .min(10, "Le message doit faire au moins 10 caractères")
    .max(2000, "Le message doit faire moins de 2000 caractères"),
});

type ContactFormData = z.infer<typeof contactSchema>;

const Contact = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
  });

  const onSubmit = async (data: ContactFormData) => {
    setIsSubmitting(true);
    
    try {
      const { error } = await supabase.functions.invoke("send-contact-email", {
        body: data,
      });

      if (error) throw error;

      toast({
        title: "Message envoyé !",
        description: "Nous vous répondrons dans les plus brefs délais.",
      });
      
      reset();
    } catch (error) {
      console.error("Error sending contact form:", error);
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer votre message. Réessayez plus tard.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-20 md:py-24 max-w-2xl">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-6">
            <Mail className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold mb-4 text-foreground">Contactez-nous</h1>
          <p className="text-lg md:text-xl text-muted-foreground">
            Une question ? Une suggestion ? N'hésitez pas à nous écrire.
          </p>
        </div>

        <div className="bg-card border border-border rounded-lg p-6 md:p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-2 text-foreground">
                Nom <span className="text-destructive">*</span>
              </label>
              <Input
                id="name"
                type="text"
                placeholder="Votre nom"
                {...register("name")}
                className={errors.name ? "border-destructive" : ""}
              />
              {errors.name && (
                <p className="text-sm text-destructive mt-1">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-2 text-foreground">
                Email <span className="text-destructive">*</span>
              </label>
              <Input
                id="email"
                type="email"
                placeholder="votre@email.com"
                {...register("email")}
                className={errors.email ? "border-destructive" : ""}
              />
              {errors.email && (
                <p className="text-sm text-destructive mt-1">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="subject" className="block text-sm font-medium mb-2 text-foreground">
                Sujet <span className="text-destructive">*</span>
              </label>
              <Input
                id="subject"
                type="text"
                placeholder="À propos de..."
                {...register("subject")}
                className={errors.subject ? "border-destructive" : ""}
              />
              {errors.subject && (
                <p className="text-sm text-destructive mt-1">{errors.subject.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="message" className="block text-sm font-medium mb-2 text-foreground">
                Message <span className="text-destructive">*</span>
              </label>
              <Textarea
                id="message"
                placeholder="Écrivez votre message ici..."
                rows={6}
                {...register("message")}
                className={errors.message ? "border-destructive" : ""}
              />
              {errors.message && (
                <p className="text-sm text-destructive mt-1">{errors.message.message}</p>
              )}
            </div>

            <Button 
              type="submit" 
              className="w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                "Envoi en cours..."
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Envoyer le message
                </>
              )}
            </Button>
          </form>
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground mb-4">
            Vous pouvez aussi nous contacter directement à{" "}
            <a href="mailto:tbo@alpact.vc" className="text-primary hover:underline">
              tbo@alpact.vc
            </a>
          </p>
          <Link 
            to="/" 
            className="text-primary hover:underline inline-flex items-center gap-2"
          >
            ← Retour à l'accueil
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Contact;
