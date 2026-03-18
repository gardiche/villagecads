import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createHash } from "https://deno.land/std@0.177.0/node/crypto.ts";

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

    const { operation, data, cacheKey } = await req.json();

    if (operation === 'get') {
      // Récupérer du cache
      console.log('Cache GET:', cacheKey);
      
      const { data: cached, error } = await supabase
        .from('persona_cache')
        .select('*')
        .eq('cache_key', cacheKey)
        .gt('expires_at', new Date().toISOString())
        .maybeSingle();

      if (error) {
        console.error('Cache GET error:', error);
      }

      if (cached) {
        console.log('✅ Cache HIT');
        return new Response(
          JSON.stringify({ 
            success: true,
            cached: true,
            data: cached.persona_data
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200
          }
        );
      } else {
        console.log('❌ Cache MISS');
        return new Response(
          JSON.stringify({ 
            success: true,
            cached: false
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200
          }
        );
      }
    } else if (operation === 'set') {
      // Sauvegarder en cache (expiration 7 jours)
      console.log('Cache SET:', cacheKey);
      
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      const { error } = await supabase
        .from('persona_cache')
        .upsert({
          cache_key: cacheKey,
          persona_data: data,
          expires_at: expiresAt.toISOString(),
          created_at: new Date().toISOString()
        });

      if (error) {
        console.error('Cache SET error:', error);
        throw error;
      }

      console.log('✅ Cache SAVED');
      
      return new Response(
        JSON.stringify({ 
          success: true,
          cached: true
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      );
    } else {
      throw new Error('Invalid operation. Use "get" or "set"');
    }
  } catch (error: any) {
    console.error('Error in persona-cache:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    );
  }
});
