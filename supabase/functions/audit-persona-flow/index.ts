import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

import { getCorsHeaders } from '../_shared/corsHeaders.ts';

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { equilibreValues, motivations, scenarioAnswers, environnement, champsLibre } = await req.json();
    
    console.log('========================================');
    console.log('🔍 AUDIT COMPLET DU FLUX PERSONA');
    console.log('========================================');
    
    // 1. DONNÉES D'ENTRÉE (QUESTIONNAIRE)
    console.log('\n📥 DONNÉES D\'ENTRÉE REÇUES :');
    console.log('\n--- ÉQUILIBRE VALUES (Sphères de vie) ---');
    console.log(JSON.stringify(equilibreValues, null, 2));
    console.log(`\nRÉSUMÉ ÉQUILIBRE :`);
    console.log(`- Énergie: ${equilibreValues.energie}/100 ${equilibreValues.energie > 70 ? '(HAUTE)' : equilibreValues.energie < 40 ? '(BASSE)' : '(MOYENNE)'}`);
    console.log(`- Temps: ${equilibreValues.temps}/100 ${equilibreValues.temps > 70 ? '(DISPONIBLE)' : equilibreValues.temps < 40 ? '(LIMITÉ)' : '(MOYEN)'}`);
    console.log(`- Finances: ${equilibreValues.finances}/100 ${equilibreValues.finances > 70 ? '(AISÉES)' : equilibreValues.finances < 40 ? '(SERRÉES)' : '(MOYENNES)'}`);
    console.log(`- Soi: ${equilibreValues.soi}/100`);
    console.log(`- Santé: ${equilibreValues.sante}/100`);
    console.log(`- Soutien: ${equilibreValues.soutien}/100`);
    console.log(`- Famille: ${equilibreValues.famille}/100`);
    
    console.log('\n--- MOTIVATIONS DÉCLARÉES ---');
    console.log(motivations);
    
    console.log('\n--- RÉPONSES SCÉNARIOS (Cartes comportementales) ---');
    console.log(`Carte 1 (Doute/Dispersion/Cadre/Agit): ${scenarioAnswers[0]}`);
    console.log(`Carte 2 (Autonomie/Dispersion/etc.): ${scenarioAnswers[1]}`);
    console.log(`Carte 3 (Cadre/Pair/etc.): ${scenarioAnswers[2]}`);
    
    console.log('\n--- ENVIRONNEMENT ---');
    console.log(JSON.stringify(environnement, null, 2));
    
    console.log('\n--- TEXTE LIBRE (Étape 3/3) ---');
    console.log(`"${champsLibre || 'NON RENSEIGNÉ'}"`);
    
    // 2. DÉTECTION DU PERSONA (LOGIQUE ACTUELLE)
    const detectPersona = (): { id: string; reason: string } => {
      const energie = equilibreValues.energie || 50;
      const temps = equilibreValues.temps || 50;
      const soi = equilibreValues.soi || 50;
      const soutien = equilibreValues.soutien || 50;
      const famille = equilibreValues.famille || 50;
      const reseau = environnement.reseau || 50;
      
      const reponse0 = scenarioAnswers[0] || "";
      const reponse1 = scenarioAnswers[1] || "";
      const reponse2 = scenarioAnswers[2] || "";
      
      // Règles de détection
      if (reponse0 === "A" || reponse0 === "C") {
        return { id: "le_prudent_bloqué", reason: "Réponse explicite 'Je doute souvent' ou 'J'ai besoin d'un cadre'" };
      }
      
      if (reponse1 === "B" && energie > 60 && temps < 40) {
        return { id: "le_dynamique_pressé", reason: "J'agis vite + énergie haute + temps limité" };
      }
      
      if (reponse0 === "B" && champsLibre?.includes("idée")) {
        return { id: "le_créatif_dispersé", reason: "Je me disperse + mention 'idée' dans texte libre" };
      }
      
      if (soi < 40 || famille < 40) {
        return { id: "léquilibriste_surchargé", reason: `Soi (${soi}) ou Famille (${famille}) < 40` };
      }
      
      if (reseau < 40 && reponse2 === "A") {
        return { id: "lautonome_isolé", reason: "Réseau faible + préfère avancer seul" };
      }
      
      return { id: "léquilibriste_surchargé", reason: "Persona par défaut" };
    };

    const detectedPersona = detectPersona();
    
    console.log('\n========================================');
    console.log('🎯 PERSONA DÉTECTÉ :');
    console.log('========================================');
    console.log(`ID: ${detectedPersona.id}`);
    console.log(`RAISON: ${detectedPersona.reason}`);
    
    // 3. ANALYSE DE COHÉRENCE (DÉTECTION DES INCOHÉRENCES)
    console.log('\n========================================');
    console.log('⚠️ ANALYSE DE COHÉRENCE :');
    console.log('========================================');
    
    const incoherences: string[] = [];
    
    // Vérification finances
    if (equilibreValues.finances > 70) {
      const texteLibreFinancesMentions = champsLibre?.toLowerCase().match(/serr[ée]|difficult|contraint|budg[eé]t|manqu.*d'argent/gi) || [];
      if (texteLibreFinancesMentions.length > 0) {
        incoherences.push(`⚠️ INCOHÉRENCE FINANCES: Déclaré "Aisées" (${equilibreValues.finances}/100) mais texte libre mentionne: ${texteLibreFinancesMentions.join(', ')}`);
      } else {
        console.log(`✅ COHÉRENCE FINANCES: Déclaré "Aisées" (${equilibreValues.finances}/100) et pas de contradiction dans texte libre`);
      }
    } else if (equilibreValues.finances < 40) {
      console.log(`✅ FINANCES SERRÉES: ${equilibreValues.finances}/100 - normal de mentionner contraintes financières`);
    }
    
    // Vérification temps
    if (equilibreValues.temps > 70) {
      const texteLibreTemps = champsLibre?.toLowerCase().match(/pas.*temps|manqu.*temps|surcharg|d[eé]bord|trop.*choses/gi) || [];
      if (texteLibreTemps.length > 0) {
        incoherences.push(`⚠️ INCOHÉRENCE TEMPS: Déclaré "Disponible" (${equilibreValues.temps}/100) mais texte libre mentionne: ${texteLibreTemps.join(', ')}`);
      } else {
        console.log(`✅ COHÉRENCE TEMPS: Déclaré "Disponible" (${equilibreValues.temps}/100) et pas de contradiction dans texte libre`);
      }
    } else if (equilibreValues.temps < 40) {
      console.log(`✅ TEMPS LIMITÉ: ${equilibreValues.temps}/100 - normal de mentionner surcharge`);
    }
    
    // Vérification énergie
    if (equilibreValues.energie > 70) {
      const texteLibreEnergie = champsLibre?.toLowerCase().match(/[eé]puis[eé]|fatigue|burnout|bout.*forces|n'en.*peux.*plus/gi) || [];
      if (texteLibreEnergie.length > 0) {
        incoherences.push(`⚠️ INCOHÉRENCE ÉNERGIE: Déclaré "Haute" (${equilibreValues.energie}/100) mais texte libre mentionne: ${texteLibreEnergie.join(', ')}`);
      } else {
        console.log(`✅ COHÉRENCE ÉNERGIE: Déclaré "Haute" (${equilibreValues.energie}/100) et pas de contradiction dans texte libre`);
      }
    } else if (equilibreValues.energie < 40) {
      console.log(`✅ ÉNERGIE BASSE: ${equilibreValues.energie}/100 - normal de mentionner fatigue`);
    }
    
    // Affichage des incohérences détectées
    if (incoherences.length > 0) {
      console.log('\n🚨 INCOHÉRENCES DÉTECTÉES :');
      incoherences.forEach(inc => console.log(inc));
    } else {
      console.log('\n✅ AUCUNE INCOHÉRENCE MAJEURE DÉTECTÉE');
    }
    
    // 4. SIMULATION GÉNÉRATION PROFIL (PROMPT QUI SERA ENVOYÉ À L'IA)
    console.log('\n========================================');
    console.log('📝 PROMPT ENVOYÉ À L\'IA (EXTRAIT CLÉS) :');
    console.log('========================================');
    console.log(`\nFINANCES : ${equilibreValues.finances}/100 ${equilibreValues.finances > 70 ? '✓ AISÉES (capacité d\'investissement confortable)' : equilibreValues.finances > 50 ? 'CONFORTABLES (marge de manœuvre)' : equilibreValues.finances > 30 ? '⚠️ MOYENNES (tendues mais gérables)' : '⚠️ SERRÉES (contraintes fortes)'}`);
    console.log(`TEMPS : ${equilibreValues.temps}/100 ${equilibreValues.temps < 30 ? '⚠️ SURCHARGÉ' : equilibreValues.temps < 50 ? '⚠️ LIMITÉ' : equilibreValues.temps > 70 ? '✓ DISPONIBLE' : ''}`);
    console.log(`ÉNERGIE : ${equilibreValues.energie}/100`);
    console.log(`TEXTE LIBRE : "${champsLibre || 'Non renseigné'}"`);
    
    console.log('\n========================================');
    console.log('📋 RÈGLES STRICTES APPLIQUÉES PAR L\'IA :');
    console.log('========================================');
    if (equilibreValues.finances > 70) {
      console.log('✅ SI FINANCES > 70 → INTERDICTION de mentionner "contraintes financières", "finances serrées", "budget limité"');
    }
    if (equilibreValues.temps > 60) {
      console.log('✅ SI TEMPS > 60 → INTERDICTION de mentionner "manque de temps", "temps limité", "surcharge"');
    }
    
    // 5. RECOMMANDATIONS
    console.log('\n========================================');
    console.log('💡 RECOMMANDATIONS POUR EFFET WAOUH :');
    console.log('========================================');
    
    const recommandations: string[] = [];
    
    // Incohérences détectées
    if (incoherences.length > 0) {
      recommandations.push('🔧 Forcer l\'IA à DÉTECTER ET POINTER ces contradictions dans la synthèse (ex: "Vous déclarez X mais votre discours suggère Y")');
    }
    
    // Persona vs données
    if (detectedPersona.id === "léquilibriste_surchargé" && equilibreValues.temps > 70 && equilibreValues.finances > 70) {
      recommandations.push('🚨 PROBLÈME CRITIQUE: Persona "Équilibriste Surchargé" détecté mais temps ET finances AISÉES → logique de détection à revoir');
    }
    
    // Texte libre
    if (!champsLibre || champsLibre.length < 50) {
      recommandations.push('⚠️ Texte libre insuffisant pour personnalisation profonde → Encourager utilisateur à écrire davantage');
    } else {
      recommandations.push('✅ Texte libre riche → exploiter davantage pour forces/freins personnalisés');
    }
    
    // Visuels
    recommandations.push('🎨 Visuel Nano Banana: Intégrer TOUTES les dimensions (énergie→couleurs, RIASEC→accessoires, Big5→posture, Schwartz→ambiance)');
    
    recommandations.forEach(rec => console.log(rec));
    
    console.log('\n========================================');
    console.log('✅ AUDIT TERMINÉ');
    console.log('========================================\n');
    
    return new Response(
      JSON.stringify({ 
        success: true,
        audit: {
          donneesEntree: {
            equilibreValues,
            motivations,
            scenarioAnswers,
            environnement,
            champsLibre
          },
          personaDetecte: detectedPersona,
          incoherences,
          recommandations
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('❌ ERREUR AUDIT:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
