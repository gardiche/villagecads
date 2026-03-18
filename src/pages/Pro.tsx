import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Eye, Clock, Layers, Shield, BookOpen, Share2, BarChart3, Check, Users, Building2, Network, ArrowRight, ArrowDown, FileText, Zap, Lock, HeartHandshake } from 'lucide-react';
import Footer from '@/components/Footer';

const Pro = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    structure_name: '',
    role: '',
    volume_clients: '',
    email: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 🔒 SÉCU 14: Client-side validation
    const trimmed = {
      first_name: formData.first_name.trim(),
      last_name: formData.last_name.trim(),
      structure_name: formData.structure_name.trim(),
      role: formData.role.trim(),
      volume_clients: formData.volume_clients.trim(),
      email: formData.email.trim().toLowerCase(),
    };

    if (!trimmed.first_name || !trimmed.last_name || !trimmed.structure_name || 
        !trimmed.role || !trimmed.volume_clients || !trimmed.email) {
      toast.error("Veuillez remplir tous les champs");
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed.email)) {
      toast.error("Veuillez saisir un email valide");
      return;
    }

    // Length validation
    if (trimmed.first_name.length > 100 || trimmed.last_name.length > 100 || 
        trimmed.structure_name.length > 100 || trimmed.role.length > 100) {
      toast.error("Les champs ne doivent pas dépasser 100 caractères");
      return;
    }
    if (trimmed.email.length > 255) {
      toast.error("L'email ne doit pas dépasser 255 caractères");
      return;
    }

    setIsSubmitting(true);
    
    try {
      const { error } = await supabase
        .from('pro_leads')
        .insert([trimmed]);

      if (error) throw error;

      toast.success("Votre demande d'accès est bien reçue. L'équipe Astryd vous contactera sous 24h.");
      setFormData({
        first_name: '',
        last_name: '',
        structure_name: '',
        role: '',
        volume_clients: '',
        email: ''
      });
    } catch (error) {
      console.error('Error submitting lead:', error);
      toast.error("Une erreur s'est produite. Veuillez réessayer.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Astryd Pro — Préparez vos séances à partir de la réalité terrain</title>
        <meta name="description" content="Accédez aux signaux entre les séances : météo, blocages, micro-actions. Intervenez au bon moment, sur les vrais enjeux, sans surveillance." />
        <meta property="og:title" content="Astryd Pro — Préparez vos séances à partir de la réalité terrain" />
        <meta property="og:description" content="Accédez aux signaux entre les séances : météo, blocages, micro-actions. Intervenez au bon moment, sur les vrais enjeux." />
        <meta property="og:image" content="https://astryd.app/og-pro.png" />
        <meta property="og:url" content="https://astryd.app/pro" />
        <meta property="og:type" content="website" />
      </Helmet>

      <div className="min-h-screen bg-background">
        {/* Navigation */}
        <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-lg border-b border-border">
          <div className="container mx-auto px-4 py-3 md:py-4 flex justify-between items-center">
            <button onClick={() => navigate('/')} className="flex items-center gap-2">
              <img src="/logo-gradient.svg" alt="Astryd" className="h-7 w-7 md:h-8 md:w-8" />
              <span className="font-display text-lg md:text-xl font-bold text-foreground">Astryd</span>
              <span className="text-[10px] md:text-xs bg-primary/10 text-primary px-1.5 md:px-2 py-0.5 rounded-full font-medium">PRO</span>
            </button>
            <Button 
              size="sm" 
              onClick={() => navigate('/')} 
              variant="outline"
              className="text-xs md:text-sm"
            >
              Espace Entrepreneur
            </Button>
          </div>
        </nav>

        {/* ═══════════════════════════════════════════════════════
            HERO
        ═══════════════════════════════════════════════════════ */}
        <section className="pt-24 md:pt-32 pb-16 md:pb-24 px-4">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="container mx-auto max-w-4xl text-center space-y-6"
          >
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-display font-bold text-foreground leading-tight">
              Préparez vos séances d'accompagnement à partir de la{' '}
              <span className="text-primary">réalité terrain</span>
            </h1>
            
            <p className="text-base md:text-lg lg:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Astryd vous donne accès aux signaux entre les séances : météo, blocages, micro-actions. Intervenez au bon moment, sur les vrais enjeux, sans surveillance.
            </p>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="pt-4"
            >
              <Button 
                size="lg"
                className="text-base md:text-lg px-6 md:px-8 py-5 md:py-6 group"
                onClick={() => document.getElementById('contact-form')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Rejoindre le programme partenaire
                <ArrowDown className="h-4 w-4 ml-2 group-hover:translate-y-1 transition-transform" />
              </Button>
            </motion.div>
          </motion.div>
        </section>

        {/* ═══════════════════════════════════════════════════════
            LES 3 ANGLES MORTS RÉSOLUS
        ═══════════════════════════════════════════════════════ */}
        <section className="py-16 md:py-24 px-4 bg-muted/30">
          <div className="container mx-auto max-w-5xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12 md:mb-16"
            >
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-display font-bold text-foreground mb-4">
                L'angle mort de l'accompagnement
              </h2>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
              {[
                {
                  icon: Eye,
                  title: 'Le Masque',
                  subtitle: 'Ce qui est dit en séance ≠ ce qui se passe au quotidien',
                  problem: "Entre les rendez-vous, vous n'avez accès qu'à ce que l'entrepreneur choisit de partager. Les blocages profonds restent sous le radar.",
                  solution: "Accédez aux signaux quotidiens (météo, zones d'attention, actions reportées) que l'entrepreneur partage de manière asynchrone. Préparez vos séances avec la réalité terrain, pas une reconstruction."
                },
                {
                  icon: Clock,
                  title: 'Le Retard',
                  subtitle: 'Vous découvrez le blocage quand il est déjà tard',
                  problem: "Un entrepreneur qui n'avance plus, c'est rarement détecté en temps réel. Quand il en parle, le problème dure depuis des semaines.",
                  solution: "Suivez les tendances sans être intrusif. Si la météo baisse + les actions stagnent + les check-ins s'espacent, vous le voyez. Vous pouvez proposer un échange avant que ça devienne critique."
                },
                {
                  icon: Layers,
                  title: 'La Surface',
                  subtitle: 'Vous accompagnez le projet, pas la posture',
                  problem: "L'IA permet aux entrepreneurs de construire un BP en 15 minutes. Votre valeur, c'est d'accompagner l'entrepreneur : sa capacité à prioriser, à gérer sa charge, à tenir dans la durée.",
                  solution: "Les données remontent la posture entrepreneuriale (énergie, clarté, blocages récurrents), pas juste l'avancement projet. Vous coachez la personne, pas le Trello."
                }
              ].map((item, index) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.15 }}
                >
                  <Card className="h-full border-border hover:border-primary/30 transition-colors">
                    <CardHeader className="pb-3">
                      <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                        <item.icon className="h-6 w-6 text-primary" />
                      </div>
                      <CardTitle className="text-xl text-foreground text-center">{item.title}</CardTitle>
                      <p className="text-sm text-muted-foreground italic text-center mt-1">"{item.subtitle}"</p>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-sm text-muted-foreground leading-relaxed">{item.problem}</p>
                      <div className="border-t border-border pt-4">
                        <p className="text-sm font-medium text-primary mb-1">Avec Astryd</p>
                        <p className="text-sm text-foreground/80 leading-relaxed">{item.solution}</p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════
            BÉNÉFICES STRUCTURES
        ═══════════════════════════════════════════════════════ */}
        <section className="py-16 md:py-24 px-4">
          <div className="container mx-auto max-w-5xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-display font-bold text-foreground mb-4">
                Bénéfices concrets
              </h2>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Pour les structures */}
              <div>
                <h3 className="text-lg font-bold text-foreground mb-6 flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-primary" />
                  Pour les structures d'accompagnement
                </h3>
                <div className="space-y-4">
                  {[
                    {
                      title: 'Séances plus percutantes',
                      desc: "Recevez un brief pré-séance (10 lignes, 2h avant le RDV) avec les signaux clés, une hypothèse, et 1-2 questions à poser. Fini les 20 premières minutes à reconstituer la semaine."
                    },
                    {
                      title: 'Actifs de connaissance',
                      desc: "Vos données d'accompagnement ne partent plus avec vos collaborateurs. En cas de turnover, le mentor suivant a accès à l'historique partagé (avec consentement de l'entrepreneur)."
                    },
                    {
                      title: "Mesure d'impact",
                      desc: "Objectivez l'évolution de vos cohortes : tendances météo, blocages récurrents, taux de progression. Justifiez vos budgets auprès de vos financeurs avec des données factuelles."
                    }
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-foreground text-sm">{item.title}</p>
                        <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pour les coachs */}
              <div>
                <h3 className="text-lg font-bold text-foreground mb-6 flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  Pour les coachs indépendants
                </h3>
                <div className="space-y-4">
                  {[
                    {
                      title: 'Visibilité inter-séance',
                      desc: "Maintenez le lien avec vos clients sans être intrusif."
                    },
                    {
                      title: 'Différenciation',
                      desc: "Proposez un accompagnement « augmenté » : coaching humain + outil de suivi quotidien."
                    }
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-foreground text-sm">{item.title}</p>
                        <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════
            COMMENT ÇA MARCHE (4 étapes)
        ═══════════════════════════════════════════════════════ */}
        <section className="py-16 md:py-24 px-4 bg-muted/30">
          <div className="container mx-auto max-w-5xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12 md:mb-16"
            >
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-display font-bold text-foreground mb-4">
                Comment ça marche
              </h2>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                {
                  numero: '1',
                  icon: BookOpen,
                  title: "L'entrepreneur utilise Astryd au quotidien",
                  desc: "Check-in météo (énergie, clarté, moral) + micro-actions prioritaires + journal entrepreneurial."
                },
                {
                  numero: '2',
                  icon: Share2,
                  title: "Il choisit ce qu'il partage",
                  desc: "Via un toggle simple, l'entrepreneur active le partage avec son mentor. Le partage n'est pas rétroactif : seules les données à partir de l'activation sont visibles."
                },
                {
                  numero: '3',
                  icon: FileText,
                  title: "Vous recevez un brief pré-séance",
                  desc: "Signal (ce qui a bougé), Hypothèse (ce que ça peut signifier), Questions (1-2 pour débloquer), Action suggérée (posture d'accompagnement recommandée)."
                },
                {
                  numero: '4',
                  icon: BarChart3,
                  title: "Vous pilotez en macro (optionnel)",
                  desc: "Si vous êtes une structure, accédez à la vue cohorte : météo moyenne, top blocages, tendances."
                }
              ].map((etape, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Card className="h-full border-border">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold flex-shrink-0">
                          {etape.numero}
                        </div>
                        <div>
                          <h3 className="font-bold text-foreground mb-2">{etape.title}</h3>
                          <p className="text-sm text-muted-foreground leading-relaxed">{etape.desc}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════
            GARDE-FOUS ÉTHIQUES
        ═══════════════════════════════════════════════════════ */}
        <section className="py-16 md:py-24 px-4">
          <div className="container mx-auto max-w-4xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-2xl md:text-3xl font-display font-bold text-foreground mb-4">
                Garde-fous éthiques
              </h2>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  icon: HeartHandshake,
                  title: 'Asynchrone choisi',
                  desc: "L'entrepreneur contrôle ce qu'il partage, entrée par entrée. Pas de surveillance en temps réel."
                },
                {
                  icon: Lock,
                  title: 'Confidentialité',
                  desc: "Les données sont hébergées sur serveurs sécurisés. Aucune revente à des tiers."
                },
                {
                  icon: Shield,
                  title: 'Guidelines incluses',
                  desc: "Chaque structure reçoit un document de guidelines déontologiques : comment utiliser Astryd, quand escalader vers un professionnel, frontière coach/psy."
                }
              ].map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <div className="text-center space-y-3">
                    <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
                      <item.icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="font-bold text-foreground">{item.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════
            OFFRES & TARIFS POC (8 semaines)
        ═══════════════════════════════════════════════════════ */}
        <section className="py-16 md:py-24 px-4 bg-muted/30">
          <div className="container mx-auto max-w-6xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12 md:mb-16"
            >
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-display font-bold text-foreground mb-3">
                Offres POC — 8 semaines
              </h2>
              <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto">
                Testez Astryd sur une cohorte pilote. Nous accompagnons votre équipe dans l'onboarding et l'usage.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
              {[
                {
                  name: 'Solo',
                  price: '190€',
                  desc: '1 entrepreneur accompagné',
                  subtitle: 'Idéal pour tester avec un client clé',
                  features: [
                    'Accès interface mentor',
                    'Briefs pré-séance',
                    'Dashboard admin',
                    'Guidelines déontologiques',
                    'Support prioritaire'
                  ],
                  icon: Users,
                  popular: false,
                },
                {
                  name: 'Portfolio',
                  price: '490€',
                  desc: '5 entrepreneurs accompagnés',
                  subtitle: 'Pour les coachs professionnels actifs',
                  features: [
                    'Accès interface mentor',
                    'Briefs pré-séance',
                    'Dashboard admin',
                    'Guidelines déontologiques',
                    'Support prioritaire'
                  ],
                  icon: Building2,
                  popular: true,
                },
                {
                  name: 'Écosystème',
                  price: '990€',
                  desc: '10 entrepreneurs accompagnés',
                  subtitle: "L'offre incontournable pour incubateurs et accélérateurs",
                  features: [
                    'Accès interface mentor',
                    'Briefs pré-séance',
                    'Dashboard admin (vue macro cohorte)',
                    'Guidelines déontologiques',
                    'Support prioritaire'
                  ],
                  icon: Network,
                  popular: false,
                }
              ].map((tier, index) => (
                <motion.div
                  key={tier.name}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                >
                  <Card className={`relative h-full ${tier.popular ? 'border-primary shadow-sm ring-1 ring-primary/20' : 'border-border'}`}>
                    {tier.popular && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <span className="bg-primary text-primary-foreground text-xs font-medium px-3 py-1 rounded-full">
                          Recommandé
                        </span>
                      </div>
                    )}
                    <CardHeader className="pt-8 pb-4">
                      <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                        <tier.icon className="h-6 w-6 text-primary" />
                      </div>
                      <CardTitle className="text-2xl text-foreground">{tier.name}</CardTitle>
                      <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-bold text-foreground">{tier.price}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">Paiement unique · 8 semaines</p>
                      <CardDescription className="pt-2 text-sm font-medium text-foreground/80">
                        {tier.desc}
                      </CardDescription>
                      <p className="text-xs text-muted-foreground">{tier.subtitle}</p>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <ul className="space-y-2">
                        {tier.features.map((feature) => (
                          <li key={feature} className="flex items-start gap-2 text-sm text-foreground/80">
                            <Check className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                      <Button 
                        variant={tier.popular ? "default" : "outline"}
                        className="w-full mt-4"
                        onClick={() => document.getElementById('contact-form')?.scrollIntoView({ behavior: 'smooth' })}
                      >
                        Rejoindre le programme
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════
            CTA FINAL & FORMULAIRE
        ═══════════════════════════════════════════════════════ */}
        <section id="contact-form" className="py-16 md:py-24 px-4">
          <div className="container mx-auto max-w-2xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <Card className="border-border">
                <CardHeader className="text-center pb-4">
                  <CardTitle className="text-xl md:text-2xl lg:text-3xl text-foreground">
                    Rejoindre le programme partenaire Astryd Pro
                  </CardTitle>
                  <CardDescription className="text-muted-foreground text-sm md:text-base">
                    Testez Astryd sur une cohorte pilote de 8 semaines. Nous accompagnons votre équipe dans l'onboarding et l'usage.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="first_name">Prénom</Label>
                        <Input
                          id="first_name"
                          value={formData.first_name}
                          onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                          placeholder="Jean"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="last_name">Nom</Label>
                        <Input
                          id="last_name"
                          value={formData.last_name}
                          onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                          placeholder="Dupont"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email professionnel</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="jean.dupont@structure.com"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="structure_name">Nom de votre structure</Label>
                      <Input
                        id="structure_name"
                        value={formData.structure_name}
                        onChange={(e) => setFormData({ ...formData, structure_name: e.target.value })}
                        placeholder="Incubateur / Cabinet / Réseau..."
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Rôle</Label>
                        <Select
                          value={formData.role}
                          onValueChange={(value) => setFormData({ ...formData, role: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="coach_independant">Coach indépendant</SelectItem>
                            <SelectItem value="responsable_programme">Responsable programme</SelectItem>
                            <SelectItem value="directeur">Directeur</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Volume clients</Label>
                        <Select
                          value={formData.volume_clients}
                          onValueChange={(value) => setFormData({ ...formData, volume_clients: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1-5">1 à 5</SelectItem>
                            <SelectItem value="5-20">5 à 20</SelectItem>
                            <SelectItem value="20+">20+</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <Button 
                      type="submit" 
                      size="lg"
                      className="w-full"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? 'Envoi en cours...' : 'Rejoindre le programme partenaire'}
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>

                    <p className="text-xs text-muted-foreground text-center">
                      En soumettant ce formulaire, vous acceptez d'être contacté par l'équipe Astryd.
                    </p>
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </section>

        {/* Footer */}
        <Footer />
      </div>
    </>
  );
};

export default Pro;
