import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1';

import { getCorsHeaders } from '../_shared/corsHeaders.ts';

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Auth
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { action, actionIds, ideaId, updates } = await req.json();

    if (!action) {
      return new Response(JSON.stringify({ error: 'action is required (archive, delete, update, consolidate)' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    let result: any = { action, affected: 0 };

    switch (action) {
      case 'archive': {
        // Archive one or more micro-actions by IDs
        if (!actionIds || actionIds.length === 0) {
          return new Response(JSON.stringify({ error: 'actionIds required for archive' }), {
            status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        const { data, error } = await supabase
          .from('micro_commitments')
          .update({ archived: true, archived_at: new Date().toISOString(), status: 'archived' })
          .in('id', actionIds)
          .eq('user_id', user.id)
          .select('id');

        if (error) throw error;
        result.affected = data?.length || 0;
        result.archivedIds = data?.map((d: any) => d.id) || [];
        break;
      }

      case 'delete': {
        // Permanently delete micro-actions by IDs
        if (!actionIds || actionIds.length === 0) {
          return new Response(JSON.stringify({ error: 'actionIds required for delete' }), {
            status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        const { data, error } = await supabase
          .from('micro_commitments')
          .delete()
          .in('id', actionIds)
          .eq('user_id', user.id)
          .select('id');

        if (error) throw error;
        result.affected = data?.length || 0;
        result.deletedIds = data?.map((d: any) => d.id) || [];
        break;
      }

      case 'update': {
        // Update a single micro-action
        if (!actionIds || actionIds.length !== 1) {
          return new Response(JSON.stringify({ error: 'exactly 1 actionId required for update' }), {
            status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
        if (!updates || Object.keys(updates).length === 0) {
          return new Response(JSON.stringify({ error: 'updates object required' }), {
            status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        // Only allow safe fields
        const allowedFields = ['text', 'objectif', 'duree', 'impact_attendu', 'jauge_ciblee', 'status', 'user_notes'];
        const safeUpdates: any = {};
        for (const key of Object.keys(updates)) {
          if (allowedFields.includes(key)) {
            safeUpdates[key] = updates[key];
          }
        }

        const { data, error } = await supabase
          .from('micro_commitments')
          .update(safeUpdates)
          .eq('id', actionIds[0])
          .eq('user_id', user.id)
          .select()
          .single();

        if (error) throw error;
        result.affected = 1;
        result.updated = data;
        break;
      }

      case 'consolidate': {
        // Auto-consolidate: archive duplicates, keep top N actions
        if (!ideaId) {
          return new Response(JSON.stringify({ error: 'ideaId required for consolidate' }), {
            status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        const maxKeep = updates?.maxKeep || 5;

        // Fetch all active (non-archived, non-done) actions for this idea
        const { data: allActions, error: fetchError } = await supabase
          .from('micro_commitments')
          .select('*')
          .eq('idea_id', ideaId)
          .eq('user_id', user.id)
          .or('archived.is.null,archived.eq.false')
          .neq('status', 'done')
          .order('created_at', { ascending: false });

        if (fetchError) throw fetchError;

        if (!allActions || allActions.length <= maxKeep) {
          result.message = `Seulement ${allActions?.length || 0} actions actives, pas besoin de consolider.`;
          result.affected = 0;
          break;
        }

        // Keep the most recent N, archive the rest
        const toKeep = allActions.slice(0, maxKeep);
        const toArchive = allActions.slice(maxKeep);
        const archiveIds = toArchive.map((a: any) => a.id);

        if (archiveIds.length > 0) {
          const { error: archiveError } = await supabase
            .from('micro_commitments')
            .update({ archived: true, archived_at: new Date().toISOString(), status: 'archived' })
            .in('id', archiveIds)
            .eq('user_id', user.id);

          if (archiveError) throw archiveError;
        }

        result.affected = archiveIds.length;
        result.kept = toKeep.map((a: any) => ({ id: a.id, text: a.text }));
        result.archived = toArchive.map((a: any) => ({ id: a.id, text: a.text }));
        result.message = `${archiveIds.length} actions archivées, ${toKeep.length} conservées.`;
        break;
      }

      default:
        return new Response(JSON.stringify({ error: `Unknown action: ${action}` }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in manage-micro-actions:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
