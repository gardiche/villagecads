-- Script de nettoyage complet pour réinitialisation
-- ATTENTION : Ce script supprime TOUTES les données utilisateurs

-- 1. Supprimer toutes les données des tables principales (dans l'ordre des dépendances)
DELETE FROM public.journal_entries;
DELETE FROM public.micro_commitments;
DELETE FROM public.attention_zones;
DELETE FROM public.attention_history;
DELETE FROM public.alignment_scores;
DELETE FROM public.alignment_history;
DELETE FROM public.maturity_scores;
DELETE FROM public.maturity_history;
DELETE FROM public.gauge_history;
DELETE FROM public.commitment_history;
DELETE FROM public.decisions;
DELETE FROM public.idea_documents;
DELETE FROM public.ideas;
DELETE FROM public.integration_events;
DELETE FROM public.astryd_sessions;
DELETE FROM public.posture_assessments;
DELETE FROM public.astryd_debug_logs;
DELETE FROM public.profile_shares;
DELETE FROM public.user_analytics_events;
DELETE FROM public.assessment_history;
DELETE FROM public.user_learning_profiles;
DELETE FROM public.user_context;
DELETE FROM public.schwartz_values;
DELETE FROM public.riasec_scores;
DELETE FROM public.big_five_traits;
DELETE FROM public.life_spheres;
DELETE FROM public.user_assessments;
DELETE FROM public.user_roles;

-- 2. Vider le cache
DELETE FROM public.persona_cache;
DELETE FROM public.guest_results_temp;

-- 3. Supprimer tous les utilisateurs (cela cascadera automatiquement vers les tables avec FK)
DELETE FROM auth.users;