import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

import { getCorsHeaders } from '../_shared/corsHeaders.ts';

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Verify admin role
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user } } = await supabase.auth.getUser(token);
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: adminRole } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!adminRole) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ═══════════════════════════════════════════════
    // 8 ENTREPRENEURS — La Traversée Pilote
    // ═══════════════════════════════════════════════
    const demoEntrepreneurs = [
      { email: "marie.dupont@demo.astryd.co", name: "Marie Dupont", project: "FoodBridge", projectDesc: "Marketplace de surplus alimentaires pour restaurants et producteurs locaux" },
      { email: "thomas.martin@demo.astryd.co", name: "Thomas Martin", project: "EduSpark", projectDesc: "Plateforme de micro-formations gamifiées pour les TPE" },
      { email: "sophie.leroy@demo.astryd.co", name: "Sophie Leroy", project: "VéloVert", projectDesc: "Service de logistique dernier kilomètre en vélo cargo en zone urbaine" },
      { email: "karim.benali@demo.astryd.co", name: "Karim Benali", project: "IncluWork", projectDesc: "Plateforme d'insertion professionnelle pour réfugiés qualifiés" },
      { email: "claire.moreau@demo.astryd.co", name: "Claire Moreau", project: "ArtisanConnect", projectDesc: "Place de marché pour artisans d'art et acheteurs professionnels" },
      { email: "lucas.petit@demo.astryd.co", name: "Lucas Petit", project: "MediFlow", projectDesc: "SaaS de coordination parcours de soins pour cabinets médicaux" },
      { email: "amina.diallo@demo.astryd.co", name: "Amina Diallo", project: "TerraLocal", projectDesc: "Coopérative digitale de circuits courts en milieu rural" },
      { email: "julien.roux@demo.astryd.co", name: "Julien Roux", project: "GreenStack", projectDesc: "Outil de mesure d'empreinte carbone pour PME industrielles" },
    ];

    const demoMentor = { email: "demo@astryd.co", name: "Demo Mentor", password: "DemoAstryd2024!" };
    const allDemoPassword = "DemoAstryd2024!";

    // Create or get all users
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existingUserMap = new Map(existingUsers?.users?.map(u => [u.email, u.id]) || []);

    const getOrCreateUser = async (email: string, name: string): Promise<string> => {
      const existing = existingUserMap.get(email);
      if (existing) return existing;
      const { data, error } = await supabase.auth.admin.createUser({
        email,
        password: allDemoPassword,
        email_confirm: true,
      });
      if (error) throw error;
      return data.user.id;
    };

    // Mentor
    const mentorId = await getOrCreateUser(demoMentor.email, demoMentor.name);
    await supabase.from("user_roles").upsert({ user_id: mentorId, role: "mentor" }, { onConflict: "user_id,role" });
    await supabase.from("user_roles").upsert({ user_id: mentorId, role: "admin" }, { onConflict: "user_id,role" });
    await supabase.from("user_profiles").upsert({ user_id: mentorId, display_name: demoMentor.name }, { onConflict: "user_id" });

    // Entrepreneurs
    const entrepreneurIds: string[] = [];
    for (const ent of demoEntrepreneurs) {
      const entId = await getOrCreateUser(ent.email, ent.name);
      entrepreneurIds.push(entId);
      await supabase.from("user_profiles").upsert({ user_id: entId, display_name: ent.name }, { onConflict: "user_id" });
    }

    // ═══════════════════════════════════════════════
    // COHORT
    // ═══════════════════════════════════════════════
    await supabase.from("cohort_members").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await supabase.from("cohorts").delete().neq("id", "00000000-0000-0000-0000-000000000000");

    const { data: cohort } = await supabase
      .from("cohorts")
      .insert({
        name: "La Traversée — Pilote",
        program_objective: "Accompagner 8 entrepreneurs dans la validation de leur projet en 6 mois",
        duration_months: 6,
        created_by: mentorId,
      })
      .select()
      .single();

    // ═══════════════════════════════════════════════
    // MENTOR SHARING & COHORT MEMBERS
    // Config: index 4 (Claire) has sharing DISABLED
    // ═══════════════════════════════════════════════
    const activatedAt = new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(); // 3 weeks ago

    for (let i = 0; i < entrepreneurIds.length; i++) {
      const isActive = i !== 4; // Claire = sharing disabled
      
      // Delete existing sharing for this pair first
      await supabase.from("mentor_sharing").delete()
        .eq("entrepreneur_id", entrepreneurIds[i])
        .eq("mentor_id", mentorId);
      
      await supabase.from("mentor_sharing").insert({
        entrepreneur_id: entrepreneurIds[i],
        mentor_id: mentorId,
        is_active: isActive,
        activated_at: isActive ? activatedAt : null,
      });

      if (cohort) {
        await supabase.from("cohort_members").insert({
          cohort_id: cohort.id,
          entrepreneur_id: entrepreneurIds[i],
          mentor_id: mentorId,
        });
      }
    }

    // ═══════════════════════════════════════════════
    // DAILY CHECKINS — 20-30 days per entrepreneur
    // Index 7 (Julien) = silent (last check-in > 12 days)
    // ═══════════════════════════════════════════════
    // Energy patterns (base values over ~25 days)
    const checkinConfigs = [
      { days: 25, baseEnergy: 7, baseClarity: 7, baseMood: 7, trend: 'up' },       // Marie - good, improving
      { days: 22, baseEnergy: 5, baseClarity: 5, baseMood: 5, trend: 'flat' },      // Thomas - average, flat
      { days: 28, baseEnergy: 7, baseClarity: 8, baseMood: 7, trend: 'up' },        // Sophie - good, consistent
      { days: 20, baseEnergy: 4, baseClarity: 3, baseMood: 4, trend: 'down' },      // Karim - low, declining (alert)
      { days: 15, baseEnergy: 6, baseClarity: 6, baseMood: 6, trend: 'flat' },      // Claire - moderate
      { days: 25, baseEnergy: 8, baseClarity: 7, baseMood: 8, trend: 'up' },        // Lucas - energetic
      { days: 18, baseEnergy: 6, baseClarity: 5, baseMood: 6, trend: 'down' },      // Amina - declining slowly
      { days: 25, baseEnergy: 7, baseClarity: 7, baseMood: 7, trend: 'flat', silentSince: 12 }, // Julien - silent
    ];

    // Delete existing demo checkins
    for (const entId of entrepreneurIds) {
      await supabase.from("daily_checkins").delete().eq("user_id", entId);
    }

    for (let i = 0; i < entrepreneurIds.length; i++) {
      const config = checkinConfigs[i];
      const silentSince = (config as any).silentSince || 0;
      
      for (let day = 0; day < config.days; day++) {
        const daysAgo = config.days - day;
        if (silentSince > 0 && daysAgo <= silentSince) continue; // silent period
        
        const trendFactor = config.trend === 'up' ? (day / config.days) * 2 : config.trend === 'down' ? -(day / config.days) * 2 : 0;
        const jitter = () => Math.floor(Math.random() * 3) - 1;
        const clamp = (v: number) => Math.max(1, Math.min(10, Math.round(v)));
        
        const date = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
        // Skip some random days to make it realistic (not every day)
        if (Math.random() < 0.15) continue;
        
        await supabase.from("daily_checkins").insert({
          user_id: entrepreneurIds[i],
          energy_level: clamp(config.baseEnergy + trendFactor + jitter()),
          clarity_level: clamp(config.baseClarity + trendFactor + jitter()),
          mood_level: clamp(config.baseMood + trendFactor + jitter()),
          shared_with_mentor: i !== 4, // Claire not sharing
          created_at: date.toISOString(),
        });
      }
    }

    // ═══════════════════════════════════════════════
    // IDEAS + ATTENTION ZONES + MICRO-ACTIONS
    // ═══════════════════════════════════════════════
    const allZoneLabels = [
      "Validation marché insuffisante", "Modèle économique flou", "Manque de réseau",
      "Charge mentale élevée", "Financement incertain", "Acquisition client",
      "Organisation interne", "Produit pas assez différencié"
    ];

    const allActionTexts = [
      "Interviewer 3 clients potentiels cette semaine",
      "Rédiger une landing page pour tester l'intérêt",
      "Calculer le coût d'acquisition client",
      "Contacter 2 mentors du secteur",
      "Documenter les retours utilisateurs",
      "Préparer un pitch de 2 minutes",
      "Lister les 5 concurrents directs et leurs forces",
      "Définir le persona principal",
      "Rédiger les 3 hypothèses clés à valider",
      "Planifier 1 test utilisateur cette semaine",
      "Identifier 3 canaux de distribution potentiels",
      "Structurer le plan financier prévisionnel",
      "Contacter un expert comptable pour statut juridique",
      "Écrire le mail de relance pour prospects",
      "Définir les métriques clés à suivre",
    ];

    const zoneAssignments = [
      [0, 3, 5],       // Marie
      [1, 2, 3, 6],    // Thomas
      [0, 5, 7],       // Sophie
      [2, 3, 4],       // Karim
      [0, 1, 6],       // Claire
      [1, 4, 7],       // Lucas
      [0, 2, 3, 5],    // Amina
      [3, 4, 6],       // Julien
    ];

    for (let i = 0; i < entrepreneurIds.length; i++) {
      // Delete existing ideas for this user
      const { data: existingIdeas } = await supabase.from("ideas").select("id").eq("user_id", entrepreneurIds[i]);
      if (existingIdeas) {
        for (const idea of existingIdeas) {
          await supabase.from("attention_zones").delete().eq("idea_id", idea.id);
          await supabase.from("micro_commitments").delete().eq("idea_id", idea.id);
          await supabase.from("journal_entries").delete().eq("idea_id", idea.id);
        }
        await supabase.from("ideas").delete().eq("user_id", entrepreneurIds[i]);
      }

      const { data: idea } = await supabase
        .from("ideas")
        .insert({
          user_id: entrepreneurIds[i],
          title: demoEntrepreneurs[i].project,
          description: demoEntrepreneurs[i].projectDesc,
        })
        .select()
        .single();

      if (!idea) continue;

      // Attention zones
      for (const zoneIdx of zoneAssignments[i]) {
        const createdAt = new Date(Date.now() - (20 - Math.floor(Math.random() * 5)) * 24 * 60 * 60 * 1000);
        await supabase.from("attention_zones").insert({
          user_id: entrepreneurIds[i],
          idea_id: idea.id,
          label: allZoneLabels[zoneIdx],
          severity: Math.floor(Math.random() * 3) + 2,
          created_at: createdAt.toISOString(),
        });
      }

      // Micro-actions (10-15 per entrepreneur)
      const numActions = 10 + Math.floor(Math.random() * 6);
      const statuses = ["done", "done", "done", "todo", "in_progress", "todo", "done", "abandoned"];
      for (let j = 0; j < numActions; j++) {
        const createdAt = new Date(Date.now() - (25 - j) * 24 * 60 * 60 * 1000);
        await supabase.from("micro_commitments").insert({
          user_id: entrepreneurIds[i],
          idea_id: idea.id,
          text: allActionTexts[(i * 3 + j) % allActionTexts.length],
          status: statuses[(i + j) % statuses.length],
          period: "weekly",
          created_at: createdAt.toISOString(),
        });
      }

      // Daily micro actions (for dashboard stats)
      const numDailyActions = 8 + Math.floor(Math.random() * 8);
      const dailyStatuses = ["done", "pending", "done", "done", "skipped", "done", "pending"];
      for (let j = 0; j < numDailyActions; j++) {
        const createdAt = new Date(Date.now() - (20 - j) * 24 * 60 * 60 * 1000);
        await supabase.from("daily_micro_actions").insert({
          user_id: entrepreneurIds[i],
          title: allActionTexts[(i * 2 + j) % allActionTexts.length],
          status: dailyStatuses[(i + j) % dailyStatuses.length],
          action_type: j % 3 === 0 ? "regeneration" : "progress",
          created_at: createdAt.toISOString(),
        });
      }

      // Journal entries (2-5 per entrepreneur)
      const journalContents = [
        "Aujourd'hui j'ai eu un bon échange avec un prospect qui m'a donné des retours constructifs sur l'offre. Je sens que ça avance mais je reste incertain sur le pricing.",
        "Semaine difficile. J'ai du mal à trouver du temps entre mon travail actuel et le projet. La charge mentale est lourde.",
        "J'ai enfin bouclé le prototype ! Les premiers retours sont encourageants, il faut maintenant passer à la validation terrain.",
        "Moment de doute. Est-ce que je fais le bon choix ? Mon entourage ne comprend pas forcément ma démarche.",
        "J'ai rencontré un partenaire potentiel hier. L'échange était riche et pourrait déboucher sur une collaboration intéressante.",
      ];

      const numJournalEntries = 2 + Math.floor(Math.random() * 4);
      for (let j = 0; j < numJournalEntries; j++) {
        const createdAt = new Date(Date.now() - (18 - j * 4) * 24 * 60 * 60 * 1000);
        const isDistress = i === 3 && j === numJournalEntries - 1; // Karim's last entry = distress
        
        await supabase.from("journal_entries").insert({
          user_id: entrepreneurIds[i],
          idea_id: idea.id,
          content: isDistress
            ? "Je me sens vraiment submergé. La pression financière monte et je ne sais plus si je peux continuer comme ça. J'ai des insomnies depuis 2 semaines."
            : journalContents[(i + j) % journalContents.length],
          sender: "user",
          entry_type: "note",
          psychological_distress_detected: isDistress,
          created_at: createdAt.toISOString(),
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Seed créé : ${entrepreneurIds.length} entrepreneurs, 1 cohorte "La Traversée — Pilote"`,
        mentorEmail: demoMentor.email,
        mentorPassword: allDemoPassword,
        entrepreneurCount: entrepreneurIds.length,
        details: {
          silentEntrepreneur: "Julien Roux (>12j sans check-in)",
          sharingDisabled: "Claire Moreau",
          distressFlag: "Karim Benali (1 entrée flaggée)",
        }
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Seed error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
