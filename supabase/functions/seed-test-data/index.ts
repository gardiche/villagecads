import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
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

    // 🔒 SECURITY: Vérification stricte du rôle admin
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('❌ SECURITY: No authorization header');
      return new Response(
        JSON.stringify({ error: 'Unauthorized - No token provided' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.error('❌ SECURITY: Invalid token', authError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Invalid token' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    // Vérifier le rôle admin dans la table user_roles
    const { data: roleData, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single();

    if (roleError || !roleData) {
      console.error('❌ SECURITY: User is not admin', user.email);
      return new Response(
        JSON.stringify({ error: 'Forbidden - Admin access required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
      );
    }

    console.log('✅ SECURITY: Admin access verified for', user.email);

    const { numUsers = 3 } = await req.json().catch(() => ({ numUsers: 3 }));

    const testUsers = [];
    const personas = ['dynamique_presse', 'prudent_bloque', 'equilibriste_surcharge', 'creatif_disperse', 'autonome_isole'];
    const ideasTemplates = [
      { title: 'Plateforme de coaching en ligne', description: 'Une plateforme pour connecter des coachs et leurs clients' },
      { title: 'Application de gestion du temps', description: 'Outil pour optimiser la productivité personnelle' },
      { title: 'Service de livraison locale', description: 'Livraison rapide de produits locaux' },
      { title: 'Boutique e-commerce artisanale', description: 'Vente en ligne de produits faits main' },
      { title: 'Agence de marketing digital', description: 'Services de marketing pour petites entreprises' }
    ];

    for (let i = 0; i < numUsers; i++) {
      const email = `test.user${i + 1}@astryd-test.com`;
      const password = 'TestPassword123!';

      // Créer l'utilisateur
      const { data: userData, error: userError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          first_name: `Test${i + 1}`,
        }
      });

      if (userError) {
        console.error(`Error creating user ${i + 1}:`, userError);
        continue;
      }

      const userId = userData.user.id;
      testUsers.push({ email, password, userId });

      // Créer l'assessment
      const { data: assessment, error: assessmentError } = await supabase
        .from('user_assessments')
        .insert({
          user_id: userId,
          completed: true,
          version: 1
        })
        .select()
        .single();

      if (assessmentError) {
        console.error(`Error creating assessment for user ${i + 1}:`, assessmentError);
        continue;
      }

      // Créer les valeurs Schwartz
      await supabase.from('schwartz_values').insert({
        assessment_id: assessment.id,
        pouvoir: Math.floor(Math.random() * 30) + 10,
        accomplissement: Math.floor(Math.random() * 30) + 50,
        hedonisme: Math.floor(Math.random() * 30) + 30,
        stimulation: Math.floor(Math.random() * 30) + 40,
        autonomie: Math.floor(Math.random() * 30) + 50,
        universalisme: Math.floor(Math.random() * 30) + 40,
        bienveillance: Math.floor(Math.random() * 30) + 45,
        tradition: Math.floor(Math.random() * 30) + 20,
        conformite: Math.floor(Math.random() * 30) + 30,
        securite: Math.floor(Math.random() * 30) + 40
      });

      // Créer les Big Five
      await supabase.from('big_five_traits').insert({
        assessment_id: assessment.id,
        ouverture: Math.floor(Math.random() * 30) + 50,
        conscienciosite: Math.floor(Math.random() * 30) + 40,
        extraversion: Math.floor(Math.random() * 40) + 30,
        agreabilite: Math.floor(Math.random() * 30) + 45,
        nevrosisme: Math.floor(Math.random() * 40) + 20
      });

      // Créer les scores RIASEC
      await supabase.from('riasec_scores').insert({
        assessment_id: assessment.id,
        realiste: Math.floor(Math.random() * 30) + 30,
        investigateur: Math.floor(Math.random() * 30) + 40,
        artistique: Math.floor(Math.random() * 30) + 50,
        social: Math.floor(Math.random() * 30) + 45,
        entreprenant: Math.floor(Math.random() * 30) + 60,
        conventionnel: Math.floor(Math.random() * 30) + 25
      });

      // Créer les sphères de vie
      await supabase.from('life_spheres').insert({
        assessment_id: assessment.id,
        soi: Math.floor(Math.random() * 30) + 40,
        couple: Math.floor(Math.random() * 40) + 30,
        famille: Math.floor(Math.random() * 40) + 30,
        amis: Math.floor(Math.random() * 30) + 35,
        loisirs: Math.floor(Math.random() * 40) + 20,
        pro: Math.floor(Math.random() * 30) + 45
      });

      // Créer le contexte utilisateur
      await supabase.from('user_context').insert({
        assessment_id: assessment.id,
        temps_disponible: ['moins_5h', '5_10h', '10_20h'][Math.floor(Math.random() * 3)],
        situation_pro: ['salarie', 'freelance', 'recherche'][Math.floor(Math.random() * 3)],
        situation_financiere: ['confortable', 'limite', 'difficile'][Math.floor(Math.random() * 3)],
        reseau_professionnel: ['large', 'moyen', 'limite'][Math.floor(Math.random() * 3)],
        experience_entrepreneuriat: ['aucune', 'premiere', 'plusieurs'][Math.floor(Math.random() * 3)],
        energie_sociale: ['haute', 'moyenne', 'basse'][Math.floor(Math.random() * 3)],
        budget_test_30j: ['moins_500', '500_2000', 'plus_2000'][Math.floor(Math.random() * 3)],
        soutien_entourage: ['fort', 'moyen', 'faible'][Math.floor(Math.random() * 3)],
        tolerance_risque: ['haute', 'moyenne', 'faible'][Math.floor(Math.random() * 3)],
        charge_mentale: ['legere', 'moderee', 'elevee'][Math.floor(Math.random() * 3)]
      });

      // Créer une idée
      const ideaTemplate = ideasTemplates[i % ideasTemplates.length];
      const { data: idea, error: ideaError } = await supabase
        .from('ideas')
        .insert({
          user_id: userId,
          title: ideaTemplate.title,
          description: ideaTemplate.description
        })
        .select()
        .single();

      if (!ideaError && idea) {
        // Créer des zones d'attention
        const attentionZones = [
          { label: 'Énergie personnelle limitée', severity: 2, recommendation: 'Commencez par déléguer certaines tâches non essentielles' },
          { label: 'Budget restreint', severity: 3, recommendation: 'Explorez des solutions low-cost et testez avant d\'investir' },
          { label: 'Réseau professionnel à développer', severity: 1, recommendation: 'Participez à des événements de networking dans votre secteur' }
        ];

        for (const zone of attentionZones) {
          await supabase.from('attention_zones').insert({
            user_id: userId,
            idea_id: idea.id,
            ...zone
          });
        }

        // Créer des micro-actions
        const microActions = [
          { text: 'Valider votre idée auprès de 3 personnes de confiance cette semaine', period: 'weekly', status: 'todo' },
          { text: 'Consacrer 2h ce week-end à préciser votre offre', period: 'weekly', status: 'todo' },
          { text: 'Identifier un mentor potentiel dans votre réseau', period: 'biweekly', status: 'todo' },
          { text: 'Créer un tableau de bord simple pour suivre vos premiers tests', period: 'weekly', status: 'done' }
        ];

        for (const action of microActions) {
          await supabase.from('micro_commitments').insert({
            user_id: userId,
            idea_id: idea.id,
            ...action
          });
        }

        // Créer un score d'alignement
        await supabase.from('alignment_scores').insert({
          user_id: userId,
          idea_id: idea.id,
          score_global: Math.floor(Math.random() * 30) + 50,
          details: {
            energie: Math.floor(Math.random() * 30) + 40,
            temps: Math.floor(Math.random() * 30) + 45,
            finances: Math.floor(Math.random() * 30) + 35,
            soutien: Math.floor(Math.random() * 30) + 50,
            competences: Math.floor(Math.random() * 30) + 55,
            motivation: Math.floor(Math.random() * 30) + 60
          }
        });

        // Créer un score de maturité
        await supabase.from('maturity_scores').insert({
          user_id: userId,
          idea_id: idea.id,
          score: Math.floor(Math.random() * 30) + 45,
          base_alignment_score: Math.floor(Math.random() * 30) + 40,
          progression_bonus: Math.floor(Math.random() * 15) + 5
        });

        // Créer des entrées de journal
        const journalEntries = [
          { content: 'Je me sens motivé mais un peu stressé par l\'ampleur du projet', sender: 'user' },
          { content: 'C\'est normal de ressentir cela. Concentrons-nous sur les premières étapes concrètes pour réduire l\'incertitude.', sender: 'ai' },
          { content: 'J\'ai peur de manquer de temps avec mon travail actuel', sender: 'user' },
          { content: 'Votre énergie professionnelle est déjà sollicitée. Commençons par de petites actions de 30 minutes maximum.', sender: 'ai' }
        ];

        for (const entry of journalEntries) {
          await supabase.from('journal_entries').insert({
            user_id: userId,
            idea_id: idea.id,
            ...entry
          });
        }

        // Créer une session Astryd
        await supabase.from('astryd_sessions').insert({
          user_id: userId,
          idea_id: idea.id,
          idea_title: idea.title,
          idea_summary: idea.description,
          maturity_score_initial: Math.floor(Math.random() * 20) + 40,
          maturity_score_current: Math.floor(Math.random() * 30) + 45,
          journal_message_count: journalEntries.filter(e => e.sender === 'user').length,
          micro_actions_completed_count: 1
        });
      }
    }

    console.log(`Successfully created ${testUsers.length} test users with complete profiles`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Created ${testUsers.length} test users`,
        users: testUsers.map(u => ({ email: u.email, password: u.password }))
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );
  } catch (error: any) {
    console.error('Error in seed-test-data:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    );
  }
});
