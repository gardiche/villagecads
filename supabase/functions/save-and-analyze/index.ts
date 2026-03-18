import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1';

import { getCorsHeaders } from '../_shared/corsHeaders.ts';

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      ideaId,
      existingIdeaId,
      title,
      description,
      motivations,
      equilibreValues,
      scenarioAnswers,
      environnement,
      champsLibre,
      riasecRanking,
      cvContent,
      personaData
    } = await req.json();

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    
    // Use admin client for authentication check
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    
    if (userError || !user) {
      console.error('Authentication failed:', userError);
      throw new Error('Unauthorized');
    }

    console.log('User authenticated:', user.id);

    // Use admin client for all database operations to bypass RLS
    const supabase = supabaseAdmin;

    let ideaToUse: any;
    let assessmentToUse: any;

    // First, always check if user already has an assessment
    console.log('Checking for existing assessment for user:', user.id);
    const { data: existingAssessment } = await supabase
      .from("user_assessments")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    // Create or update idea
    if (existingIdeaId) {
      const { data: updatedIdea, error: ideaUpdateError } = await supabase
        .from("ideas")
        .update({ title, description: description || null })
        .eq("id", existingIdeaId)
        .eq("user_id", user.id)
        .select()
        .single();

      if (ideaUpdateError) throw ideaUpdateError;
      ideaToUse = updatedIdea;
      console.log('Idea updated successfully');
    } else {
      console.log('Creating new idea with title:', title);
      const { data: idea, error: ideaError } = await supabase
        .from("ideas")
        .insert({ user_id: user.id, title, description: description || null })
        .select()
        .single();
      
      if (ideaError) {
        console.error('Failed to create idea:', ideaError);
        throw new Error(`Failed to create idea: ${ideaError.message}`);
      }
      if (!idea) {
        console.error('Idea creation returned null data');
        throw new Error('Failed to create idea: no data returned');
      }
      ideaToUse = idea;
      console.log('Idea created successfully:', idea.id);
    }

    // Handle assessment - update existing or create new
    if (existingAssessment) {
      console.log('Found existing assessment, cleaning old data');
      assessmentToUse = existingAssessment;
      
      // Clean old assessment data
      await Promise.all([
        supabase.from("schwartz_values").delete().eq("assessment_id", assessmentToUse.id),
        supabase.from("big_five_traits").delete().eq("assessment_id", assessmentToUse.id),
        supabase.from("riasec_scores").delete().eq("assessment_id", assessmentToUse.id),
        supabase.from("life_spheres").delete().eq("assessment_id", assessmentToUse.id),
        supabase.from("user_context").delete().eq("assessment_id", assessmentToUse.id),
        supabase.from("user_learning_profiles").delete().eq("assessment_id", assessmentToUse.id)
      ]);

      // Update assessment as completed
      await supabase
        .from("user_assessments")
        .update({ completed: true, chosen_project_id: ideaToUse.id })
        .eq("id", assessmentToUse.id);
        
      console.log('Existing assessment updated successfully');
    } else {
      console.log('Creating new assessment for user:', user.id);
      const { data: assessment, error: assessmentError } = await supabase
        .from("user_assessments")
        .insert({ user_id: user.id, completed: true, chosen_project_id: ideaToUse.id })
        .select()
        .single();
      
      if (assessmentError) {
        console.error('Failed to create assessment:', assessmentError);
        throw new Error(`Failed to create assessment: ${assessmentError.message}`);
      }
      if (!assessment) {
        console.error('Assessment creation returned null data');
        throw new Error('Failed to create assessment: no data returned');
      }
      assessmentToUse = assessment;
      console.log('Assessment created successfully:', assessment.id);
    }

    // Prepare Schwartz values
    const schwartzMapping: Record<string, string> = {
      securite: "securite",
      autonomie: "autonomie",
      bienveillance: "bienveillance",
      ambition: "accomplissement",
    };
    const schwartzValues: Record<string, number> = {
      autonomie: 50, accomplissement: 50, stimulation: 50, bienveillance: 50,
      securite: 50, pouvoir: 50, hedonisme: 50, universalisme: 50,
      tradition: 50, conformite: 50,
    };
    motivations.forEach((mot: string) => {
      const key = schwartzMapping[mot];
      if (key) schwartzValues[key] = 75;
    });

    // Prepare RIASEC values
    const riasecValues: Record<string, number> = {
      realiste: 50, investigateur: 50, artistique: 50,
      social: 50, entreprenant: 50, conventionnel: 50,
    };
    riasecRanking.forEach((key: string, index: number) => {
      const mapping: Record<string, string> = {
        R: "realiste", I: "investigateur", A: "artistique",
        S: "social", E: "entreprenant", C: "conventionnel",
      };
      const mappingKey = mapping[key];
      if (mappingKey) riasecValues[mappingKey] = 100 - index * 10;
    });

    // Final validation before inserting related data
    if (!assessmentToUse || !assessmentToUse.id) {
      console.error('Assessment validation failed before inserts:', assessmentToUse);
      throw new Error('Invalid assessment object');
    }
    if (!ideaToUse || !ideaToUse.id) {
      console.error('Idea validation failed before inserts:', ideaToUse);
      throw new Error('Invalid idea object');
    }

    console.log('Inserting assessment data for assessment_id:', assessmentToUse.id);
    
    // ÉTAPE 1 : Toujours insérer Schwartz + Life Spheres + User Context (données de base)
    const baseInserts = [
      supabase.from("schwartz_values").insert({ assessment_id: assessmentToUse.id, ...schwartzValues }),
      supabase.from("life_spheres").insert({
        assessment_id: assessmentToUse.id,
        soi: equilibreValues.soutien,
        couple: equilibreValues.couple,
        famille: equilibreValues.famille,
        amis: equilibreValues.reseau,
        loisirs: equilibreValues.loisirs,
        pro: equilibreValues.pro,
      }),
      supabase.from("user_context").insert({
        assessment_id: assessmentToUse.id,
        temps_disponible: equilibreValues.temps.toString(),
        situation_pro: equilibreValues.pro.toString(),
        situation_financiere: equilibreValues.finances.toString(),
        energie_sociale: equilibreValues.energie.toString(),
        charge_mentale: equilibreValues.famille.toString(),
        budget_test_30j: equilibreValues.finances >= 70 ? "comfortable" : equilibreValues.finances >= 40 ? "moderate" : "limited",
        tolerance_risque: motivations.includes("ambition") ? "high" : motivations.includes("securite") ? "low" : "moderate",
        soutien_entourage: equilibreValues.reseau.toString(),
        // Stocker en JSON natif (pas stringifié) pour pouvoir le relire facilement
        competences_techniques: {
          champsLibre: champsLibre || "",
          scenarioAnswers: scenarioAnswers || {},
          environnement: environnement || {}
        }
      }),
    ];

    // ÉTAPE 2+ : Insérer Big Five, RIASEC, CV UNIQUEMENT s'ils sont fournis
    // (Pour profiling express initial, on ne les insère pas)
    if (scenarioAnswers && Array.isArray(scenarioAnswers) && scenarioAnswers.length > 0) {
      console.log('→ Scénarios comportementaux fournis, insertion Big Five');
      baseInserts.push(
        supabase.from("big_five_traits").insert({
          assessment_id: assessmentToUse.id,
          ouverture: 50, conscienciosite: 50, extraversion: 50, agreabilite: 50, nevrosisme: 50
        })
      );
    }

    if (riasecRanking && Array.isArray(riasecRanking) && riasecRanking.length > 0) {
      console.log('→ Ranking RIASEC fourni, insertion RIASEC scores');
      baseInserts.push(
        supabase.from("riasec_scores").insert({ assessment_id: assessmentToUse.id, ...riasecValues })
      );
    }

    if (cvContent && cvContent.trim().length > 0) {
      console.log('→ CV fourni, insertion learning profile');
      baseInserts.push(
        supabase.from("user_learning_profiles").insert({
          assessment_id: assessmentToUse.id,
          cv_insights: { cv_text: cvContent },
        })
      );
    }

    await Promise.all(baseInserts);

    console.log('━━━ SAVE_AND_ANALYZE - CREATING INITIAL ASTRYD_SESSION ━━━');
    
    // Generate persona visual if personaData exists
    let personaVisualUrl = null;
    if (personaData && personaData.personaId) {
      try {
        console.log('→ Generating persona visual for:', personaData.personaId);
        const visualResponse = await fetch(`${supabaseUrl}/functions/v1/generate-persona-visual`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ personaId: personaData.personaId })
        });
        
        if (visualResponse.ok) {
          const visualData = await visualResponse.json();
          if (visualData.imageUrls && visualData.imageUrls.length > 0) {
            personaVisualUrl = visualData.imageUrls[0]; // Premier visuel
            console.log('→ Persona visual generated:', personaVisualUrl);
          }
        }
      } catch (error) {
        console.error('→ Error generating persona visual:', error);
      }
    }

    // Generate attention zones based on profile only
    const attentionZones = [];
    if (personaData && personaData.verrous && personaData.verrous.length > 0) {
      try {
        console.log('→ Generating attention zones from profile');
        const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
        const zonesPrompt = `En tant que coach entrepreneurial, analysez ce profil et générez 3-5 zones d'attention concrètes basées UNIQUEMENT sur le profil personnel (pas sur l'idée).

PROFIL:
- Titre: ${personaData.titre}
- Synthèse: ${personaData.synthese}
- Forces: ${personaData.forces.join(', ')}
- Freins: ${personaData.verrous.join(', ')}

CONTRAINTES:
- Une des zones DOIT être: "Affiner avec votre idée - Renseignez votre idée de projet pour personnaliser davantage vos zones d'attention et micro-actions" (severity: 1)
- Les autres zones doivent être des risques/points à travailler PERSONNELS détectés dans les freins
- Severity: 3 = critique, 2 = attention, 1 = info
- Langage vulgarisé, bienveillant, vouvoiement

FORMAT JSON STRICT:
{
  "zones": [
    {"label": "Titre court", "recommendation": "Action concrète à faire", "severity": 1-3}
  ]
}`;

        const zonesResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${LOVABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: [
              { role: 'user', content: zonesPrompt }
            ],
            temperature: 0.7,
            response_format: { type: "json_object" }
          }),
        });

        if (zonesResponse.ok) {
          const zonesData = await zonesResponse.json();
          const parsedZones = JSON.parse(zonesData.choices[0].message.content);
          if (parsedZones.zones && Array.isArray(parsedZones.zones)) {
            attentionZones.push(...parsedZones.zones);
            console.log('→ Generated attention zones:', attentionZones.length);
          }
        }
      } catch (error) {
        console.error('→ Error generating attention zones:', error);
      }
    }

    // Ensure the "Renseigner idée" zone is always present if no idea yet
    if (!title || title === "Mon idée") {
      const hasIdeaZone = attentionZones.some(z => z.label && z.label.includes("Affiner"));
      if (!hasIdeaZone) {
        attentionZones.unshift({
          label: "Affiner avec votre idée",
          recommendation: "Renseignez votre idée de projet pour personnaliser davantage vos zones d'attention et micro-actions",
          severity: 1
        });
      }
    }

    // Créer ou mettre à jour une session Astryd INITIALE avec les données persona + visual
    if (personaData) {
      const { data: existingSession } = await supabase
        .from('astryd_sessions')
        .select('id')
        .eq('idea_id', ideaToUse.id)
        .eq('user_id', user.id)
        .maybeSingle();

      const sessionPayload = {
        user_id: user.id,
        idea_id: ideaToUse.id,
        idea_title: ideaToUse.title,
        idea_summary: ideaToUse.description,
        maturity_score_initial: 0,
        maturity_score_current: 0,
        micro_actions: {
          persona_profil: {
            ...(personaData.persona_profil || personaData),
            visualUrl: personaVisualUrl
          },
          actions: personaData.micro_actions || []
        },
        updated_at: new Date().toISOString()
      };

      if (existingSession) {
        await supabase
          .from('astryd_sessions')
          .update(sessionPayload)
          .eq('id', existingSession.id);
        console.log('→ astryd_sessions updated with persona_profil + visual');
      } else {
        await supabase
          .from('astryd_sessions')
          .insert({
            ...sessionPayload,
            created_at: new Date().toISOString()
          });
        console.log('→ astryd_sessions created with persona_profil + visual');
      }
    }

    // Save attention zones to database
    if (attentionZones.length > 0) {
      console.log('→ Saving attention zones to database:', attentionZones.length);
      for (const zone of attentionZones) {
        await supabase
          .from('attention_zones')
          .insert({
            user_id: user.id,
            idea_id: ideaToUse.id,
            label: zone.label,
            recommendation: zone.recommendation,
            severity: zone.severity
          });
      }
      console.log('→ Attention zones saved successfully');
    }

    // Save micro-actions from personaData if provided
    if (personaData && personaData.micro_actions && Array.isArray(personaData.micro_actions)) {
      console.log('→ Saving micro-actions to database:', personaData.micro_actions.length);
      for (const action of personaData.micro_actions) {
        await supabase
          .from('micro_commitments')
          .insert({
            user_id: user.id,
            idea_id: ideaToUse.id,
            text: action.titre,
            duree: action.duree,
            impact_attendu: action.impact,
            status: 'todo'
          });
      }
      console.log('→ Micro-actions saved successfully');
    }

    // Call astryd-analyse in background
    console.log('━━━ SAVE_AND_ANALYZE - CALLING ASTRYD_ANALYSE ━━━');
    console.log('→ ideaId:', ideaToUse.id);
    console.log('→ userId:', user.id);
    console.log('→ title:', ideaToUse.title);
    console.log('→ personaData:', personaData);
    
    fetch(`${supabaseUrl}/functions/v1/astryd-analyse`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        ideaId: ideaToUse.id,
        userId: user.id,
        personaData: personaData || null
      })
    }).then(response => {
      console.log('━━━ SAVE_AND_ANALYZE - ASTRYD_ANALYSE RESPONSE ━━━');
      console.log('→ status:', response.status);
      return response.text();
    }).then(text => {
      console.log('→ response:', text);
    }).catch(err => {
      console.error('━━━ SAVE_AND_ANALYZE - ASTRYD_ANALYSE ERROR ━━━');
      console.error('→ error:', err);
    });

    return new Response(
      JSON.stringify({ success: true, ideaId: ideaToUse.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
