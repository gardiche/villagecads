import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

import { getCorsHeaders } from '../_shared/corsHeaders.ts';

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      personaId, 
      equilibreValues, 
      motivations, 
      riasecScores, 
      schwartzValues,
      bigFiveTraits,
      ideaTitle,
      ideaDescription,
      champsLibre
    }: {
      personaId: string;
      equilibreValues?: { energie?: number; temps?: number; [key: string]: any };
      motivations?: string[];
      riasecScores?: Record<string, number>;
      schwartzValues?: Record<string, number>;
      bigFiveTraits?: Record<string, number>;
      ideaTitle?: string;
      ideaDescription?: string;
      champsLibre?: string;
    } = await req.json();
    
    console.log('🎨 Generating hyper-personalized Nano Banana visual with full profile data...');

    // ========== CONSTRUCTION DU PROMPT DYNAMIQUE ULTRA-PERSONNALISÉ (EFFET WAOUH) ==========
    // Chaque élément du prompt est construit dynamiquement selon TOUTES les données du profil
    // (Energie, Temps, RIASEC, Big Five, Schwartz, Projet, Contexte libre)
    // OBJECTIF: Chaque image générée doit être 100% UNIQUE et impossible à reproduire
    
    // 1. STYLE (Immuable - Artistique premium Nano Banana signature)
    const baseStyle = "MASTERPIECE-LEVEL artistic illustration combining flat design with photorealistic rendering, signature Nano Banana premium style, museum-quality composition with rich vibrant color palette, professional cinematic color grading, modern minimalist aesthetic with intentional storytelling, trending on Dribbble and Behance, gallery-worthy visual narrative, 8K ultra-sharp resolution";
    
    // 2. PERSONNAGE (Basé sur Profil + Énergie)
    const energie = equilibreValues?.energie || 50;
    const temps = equilibreValues?.temps || 50;
    
    const postureMap: Record<string, string> = {
      le_dynamique_pressé: energie > 70 
        ? "character in explosive forward motion, running with determination and speed, wind in hair, dynamic energy radiating"
        : "character moving purposefully but showing signs of fatigue, determined stride despite tiredness",
      le_prudent_bloqué: energie < 40
        ? "character in deeply contemplative pose, sitting with chin on hands, surrounded by thought bubbles and question marks, introspective atmosphere"
        : "character standing still in thoughtful pause, hand on chin, cautious but alert posture",
      léquilibriste_surchargé: temps < 30
        ? "character desperately juggling multiple heavy objects, strained expression, objects barely staying in air, overwhelmed posture"
        : "character carefully balancing on tightrope, steady focus, controlled breathing, multiple elements balanced gracefully",
      le_créatif_dispersé: energie > 60
        ? "character surrounded by explosive burst of colorful floating objects and wild ideas, gaze directed at multiple directions, creative chaos in motion"
        : "character gently surrounded by floating soft shapes and dreamy ideas, peaceful scattered thoughts, serene creative state",
      lautonome_isolé: energie > 50
        ? "character standing confidently alone in protected transparent bubble, serene self-sufficient presence, peaceful solitude"
        : "character sitting alone in cozy isolated space, protective bubble around, calm but slightly withdrawn presence"
    };
    const posture = postureMap[personaId] || postureMap.le_prudent_bloqué;
    
    // 3. ACCESSOIRES (Basés sur RIASEC/Projet/Big Five)
    let accessories = "";
    
    // RIASEC detection
    if (riasecScores && typeof riasecScores === 'object') {
      const entries = Object.entries(riasecScores) as [string, number][];
      const maxRiasec = entries.reduce((a, b) => a[1] > b[1] ? a : b);
      const riasecType = maxRiasec[0];
      
      const riasecAccessories: Record<string, string> = {
        artistique: "paintbrushes, musical instruments, colorful chaos surrounding",
        conventionnel: "laptop, organized grids, square geometric patterns",
        realiste: "tools, plants, raw materials and building blocks",
        investigateur: "magnifying glass, books, scientific elements",
        social: "hearts, hands reaching out, tea cups and warm elements",
        entreprenant: "chart arrows, lightbulbs, growth symbols"
      };
      
      accessories += riasecAccessories[riasecType] || "";
    }
    
    // Big Five influence on accessories
    if (bigFiveTraits && typeof bigFiveTraits === 'object') {
      const ouverture = bigFiveTraits.ouverture || 50;
      const conscienciosite = bigFiveTraits.conscienciosite || 50;
      const extraversion = bigFiveTraits.extraversion || 50;
      const agreabilite = bigFiveTraits.agreabilite || 50;
      
      if (ouverture > 70) {
        accessories += ", abstract shapes, creative chaos, imaginative elements, books of ideas";
      } else if (ouverture < 40) {
        accessories += ", structured elements, conventional tools, organized workspace";
      }
      
      if (conscienciosite > 70) {
        accessories += ", checklist, organized files, planners, neat arrangement";
      } else if (conscienciosite < 40) {
        accessories += ", creative mess, scattered papers, spontaneous arrangement";
      }
      
      if (agreabilite > 70) {
        accessories += ", warm collaborative elements, group symbols, caring objects";
      } else if (agreabilite < 40) {
        accessories += ", independent symbols, solo workspace, self-sufficient tools";
      }
    }
    
    // Projet detection (Tech, Care/Social, etc.)
    if (ideaTitle || ideaDescription || champsLibre) {
      const projectText = `${ideaTitle} ${ideaDescription} ${champsLibre}`.toLowerCase();
      
      if (projectText.includes('tech') || projectText.includes('digital') || projectText.includes('app') || projectText.includes('site')) {
        accessories += ", screens showing code, network nodes, digital interface elements";
      } else if (projectText.includes('care') || projectText.includes('social') || projectText.includes('accompagnement') || projectText.includes('coaching')) {
        accessories += ", caring hands, warm tea, supportive symbols";
      } else if (projectText.includes('éducation') || projectText.includes('formation') || projectText.includes('enseign')) {
        accessories += ", books, learning materials, growth symbols";
      } else if (projectText.includes('créat') || projectText.includes('art') || projectText.includes('design')) {
        accessories += ", artistic tools, color palettes, creative chaos";
      }
    }
    
    // 4. AMBIANCE ARTISTIQUE DYNAMIQUE (Basée sur Énergie/Santé/Temps/Motivations croisées)
    let ambiance = "";
    const sante = equilibreValues?.sante || 50;
    const soi = equilibreValues?.soi || 50;
    
    // Analyse croisée énergie + santé pour ambiance ULTRA-PRÉCISE et VARIÉE
    if (energie > 75 && sante > 60) {
      ambiance = "EXPLOSIVE vibrant colors with electric energy bursts (orange fluo, jaune électrique, rouge feu), dynamic motion blur effects, powerful wind streams, high-voltage atmosphere radiating unstoppable vitality, impression of forward momentum and explosive force";
    } else if (energie > 60 && sante > 50) {
      ambiance = "bright energetic colors (turquoise vif, corail dynamique, vert lime) with subtle movement effects, gentle breeze, optimistic warm lighting, lively balanced atmosphere, feeling of controlled energy and positive flow";
    } else if (energie < 30 || sante < 30 || soi < 30) {
      ambiance = "ULTRA-SOFT pastel colors with healing tones (bleu pastel, lavande pâle, vert d'eau, beige rosé), cozy protective cushions and soft blankets, gentle moonlight glow, deeply peaceful restorative atmosphere, impression of rest and recovery sanctuary";
    } else if (energie < 45) {
      ambiance = "muted calming colors (gris perle, beige doux, bleu poudré), comfortable steady environment, soft diffused lighting, gentle contemplative atmosphere, feeling of quiet stability and inner reflection";
    } else {
      ambiance = "balanced harmonious color palette (turquoise clair, rose poudré, beige chaud), steady grounded environment, natural warm lighting, stable peaceful atmosphere, impression of centered equilibrium";
    }
    
    // Layer temps/bande passante influence
    if (temps < 30) {
      ambiance += ", clock elements subtly integrated, time pressure symbols, compressed space feeling";
    } else if (temps > 70) {
      ambiance += ", open spacious composition, expansive breathing room, freedom of movement";
    }
    
    // Schwartz dominant value influence (ENHANCED)
    if (schwartzValues && typeof schwartzValues === 'object') {
      const entries = Object.entries(schwartzValues) as [string, number][];
      const maxSchwartz = entries.reduce((a, b) => a[1] > b[1] ? a : b);
      const schwartzType = maxSchwartz[0];
      const schwartzScore = maxSchwartz[1];
      
      const schwartzAmbiances: Record<string, string> = {
        autonomie: "symbols of freedom and independence, open spaces, liberation elements",
        accomplissement: "achievement stars and success symbols, upward arrows, victory elements",
        hedonisme: "pleasure and joy elements, playful touches, celebration symbols, vibrant energy",
        stimulation: "exciting dynamic elements, adventure symbols, novelty and discovery vibes",
        bienveillance: "warm caring atmosphere, protective elements, nurturing symbols, soft embracing light",
        universalisme: "global symbols, unity elements, nature and humanity connection, world embrace",
        tradition: "heritage and stability symbols, roots and grounding, timeless elements",
        conformite: "order and structure elements, rules and frameworks, organized harmony",
        securite: "safety and protection symbols, stable foundation, shield and comfort elements",
        pouvoir: "leadership and influence elements, strength symbols, commanding presence"
      };
      
      if (schwartzAmbiances[schwartzType] && schwartzScore > 60) {
        ambiance += `, ${schwartzAmbiances[schwartzType]}`;
      }
    }
    
    // POSTURE DU PERSONNAGE = Basée sur BIG FIVE (expression corporelle et émotionnelle UNIQUE)
    let characterPosture = "";
    if (bigFiveTraits && typeof bigFiveTraits === 'object') {
      const extraversion = bigFiveTraits.extraversion || 50;
      const nevrosisme = bigFiveTraits.nevrosisme || 50;
      const ouverture = bigFiveTraits.ouverture || 50;
      const agreabilite = bigFiveTraits.agreabilite || 50;
      const conscienciosite = bigFiveTraits.conscienciosite || 50;
      
      if (nevrosisme > 60) {
        characterPosture += " POSTURE du personnage : tendu, légèrement crispé, sourcils froncés, regard inquiet ou sur le qui-vive, mains serrées ou sur les tempes, petits nuages d'orage au-dessus de la tête, impression de vigilance nerveuse";
      }
      if (ouverture > 60) {
        characterPosture += " POSTURE du personnage : curieux et rêveur, regard levé vers le ciel ou l'horizon, tête penchée sur le côté, main sur le menton en réflexion, étoiles scintillantes ou ampoule lumineuse au-dessus de la tête, impression d'imagination débordante";
      }
      if (extraversion > 60) {
        characterPosture += " POSTURE du personnage : souriant largement, bras grands ouverts vers l'extérieur, posture accueillante et dynamique, bulles de dialogue colorées ou réseaux de connexions autour, impression d'ouverture sociale et de rayonnement";
      } else if (extraversion < 40) {
        characterPosture += " POSTURE du personnage : introspectif et calme, posture refermée sur soi de façon sereine, regard intérieur, atmosphère de solitude choisie et paisible, impression de concentration interne";
      }
      if (agreabilite > 60) {
        characterPosture += " POSTURE du personnage : doux et bienveillant, visage apaisant avec sourire chaleureux, main tendue en geste de soutien, cœurs flottants ou fleurs délicates autour, impression de soin et d'empathie naturelle";
      }
      if (conscienciosite > 60) {
        characterPosture += " POSTURE du personnage : organisé et méthodique, posture droite et structurée, liste de tâches ou checklist visible, grilles ou tableaux ordonnés en arrière-plan, impression de contrôle et de rigueur maîtrisée";
      }
    }
    
    // Ajouter la posture BF au prompt
    if (characterPosture) {
      ambiance += characterPosture;
    }
    
    // CONSTRUCTION DU PROMPT FINAL ULTRA-DÉTAILLÉ (EFFET WAOUH - UNICITÉ MAXIMALE)
    const contextualDetails = champsLibre ? `\n\n🎯 PERSONAL LIFE CONTEXT (INTEGRATE INTO VISUAL STORYTELLING): "${champsLibre.substring(0, 250)}"` : '';
    
    const hyperPersonalizedPrompt = `${baseStyle}. 

🎭 CHARACTER & DYNAMIC POSTURE: ${posture}

🎨 HYPER-PERSONAL ACCESSORIES & SYMBOLIC ELEMENTS: ${accessories || 'minimalist clean composition with intentional negative space'}

🌈 ATMOSPHERIC STORYTELLING & EMOTIONAL LANDSCAPE: ${ambiance}

💫 EMOTIONAL SIGNATURE & UNIQUENESS MANDATE: 
This visual MUST capture the IRREPLACEABLE essence of THIS SPECIFIC person's entrepreneurial moment in time. Not a template, not a generic illustration - a PORTRAIT of their exact life situation.
- Energy level defines color intensity and dynamism
- Time constraints shape spatial composition and breathing room
- Personal context influences symbolic elements and background story
- Every pixel must whisper "This is about YOU, not entrepreneurs in general"${contextualDetails}

⚠️ ABSOLUTE TECHNICAL PROHIBITIONS: 
- NO text, NO words, NO letters, NO numbers anywhere in the image
- NO generic stock illustration vibes
- NO repetitive patterns that could apply to another profile
- NO AI art clichés (floating geometric shapes without meaning, random gradients)

🎯 UNIQUENESS REQUIREMENT: This image must be IMPOSSIBLE to generate twice. Even with similar inputs, the artistic interpretation, composition, color story, and emotional resonance must be 100% unique to THIS person's data constellation.

The viewer must instantly react: "Holy shit, this is EXACTLY how my entrepreneurial journey FEELS right now."`;

    console.log('🎨 WAOUH Prompt:', hyperPersonalizedPrompt);
    
    // Generate SINGLE 100% UNIQUE hyper-personalized image using GEMINI 3 PRO
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${Deno.env.get('LOVABLE_API_KEY')}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image-preview",
        messages: [
          {
            role: "user",
            content: `Create a MASTERPIECE-LEVEL artistic illustration that will make the viewer say "WOW, how does this know me so well?!"

${hyperPersonalizedPrompt}

CRITICAL ARTISTIC REQUIREMENTS FOR UNIQUENESS:
- Gallery-worthy composition with museum-quality artistic direction
- Photorealistic rendering with premium flat design aesthetic fusion
- Perfect square aspect ratio (1:1) optimized for profile hero display
- Profound emotional resonance - this must capture THIS person's exact life moment
- Professional color grading that matches the specified energy and atmosphere EXACTLY
- Symbolic elements that tell a personal story only THIS person will fully understand
- Cinematic lighting with intentional mood direction (match the energy level specified)
- Ultra-sharp focus on character with atmospheric depth of field
- 8K resolution with pixel-perfect crisp details
- Modern premium Nano Banana signature style
- ZERO generic elements - every pixel must be intentionally personal
- Color palette must reflect the EXACT emotional state described (high energy = explosive vibrant, low energy = soft healing tones)

This image must be IMPOSSIBLE to replicate. It represents ONE person's unique entrepreneurial moment.`
          }
        ],
        modalities: ["image", "text"],
        temperature: 0.9
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      throw new Error(`AI generation failed: ${response.status}`);
    }

    const imageData = await response.json();
    const imageUrl = imageData.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!imageUrl) {
      throw new Error("No image generated");
    }

    console.log('✅ Hyper-personalized Nano Banana visual generated successfully');

    return new Response(
      JSON.stringify({ 
        imageUrl,
        imageUrls: [imageUrl] // Backward compatibility
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error generating persona visual:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
