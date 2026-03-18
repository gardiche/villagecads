import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.78.0';

import { getCorsHeaders } from '../_shared/corsHeaders.ts';

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('No authorization header');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) throw new Error('User not authenticated');

    const formData = await req.formData();
    const file = formData.get('file') as File;
    if (!file) throw new Error('No file provided');

    console.log(`📄 Analyzing CV for user ${user.id}: ${file.name} (${file.size} bytes)`);

    // Get user assessment
    const { data: assessment } = await supabase
      .from('user_assessments')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!assessment) throw new Error('No assessment found');

    // Read file content
    const fileBuffer = await file.arrayBuffer();
    const base64Pdf = btoa(String.fromCharCode(...new Uint8Array(fileBuffer)));
    
    console.log(`📄 PDF converted to base64: ${base64Pdf.length} characters`);

    // Analyze CV using Lovable AI with the extracted text
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY not configured');

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `Tu es un expert en analyse de CV. Extrais les informations structurées suivantes du document PDF fourni :
- Compétences techniques (hard skills)
- Compétences transverses (soft skills)
- Domaines d'expertise
- Expériences professionnelles (postes, secteurs, durées)
- Niveau d'études et formations
- Signaux sur le style de travail (autonome, équipe, créatif, analytique, etc.)
- Secteurs d'activité récurrents
- Texte complet du CV (champ full_text)

Réponds UNIQUEMENT en JSON structuré via tool calling.`
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Analyse ce CV PDF et extrais les informations structurées. Fournis aussi le texte complet dans le champ full_text.'
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:application/pdf;base64,${base64Pdf}`
                }
              }
            ]
          }
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'extract_cv_insights',
              description: 'Extraire les insights structurés du CV',
              parameters: {
                type: 'object',
                properties: {
                  hard_skills: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Compétences techniques concrètes (ex: "Python", "Marketing digital", "Photoshop")'
                  },
                  soft_skills: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Compétences transverses (ex: "Leadership", "Communication", "Résolution de problèmes")'
                  },
                  domains: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Domaines d\'expertise (ex: "E-commerce", "Data Science", "Design UX")'
                  },
                  experiences: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        position: { type: 'string' },
                        sector: { type: 'string' },
                        duration_years: { type: 'number' }
                      }
                    },
                    description: 'Expériences professionnelles avec poste, secteur, durée en années'
                  },
                  education_level: {
                    type: 'string',
                    description: 'Niveau d\'études le plus élevé (ex: "Bac+5", "Bac+3", "CAP/BEP")'
                  },
                  work_style: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Style de travail déduit (ex: "Autonome", "Collaboratif", "Créatif")'
                  },
                  years_experience: {
                    type: 'number',
                    description: 'Nombre total d\'années d\'expérience professionnelle'
                  },
                  full_text: {
                    type: 'string',
                    description: 'Texte complet extrait du CV'
                  }
                },
                required: ['hard_skills', 'soft_skills', 'domains', 'experiences', 'education_level', 'work_style', 'years_experience', 'full_text']
              }
            }
          }
        ],
        tool_choice: { type: 'function', function: { name: 'extract_cv_insights' } }
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('❌ AI gateway error:', aiResponse.status, errorText);
      throw new Error(`AI analysis failed: ${errorText}`);
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    
    if (!toolCall) {
      console.error('❌ No tool call in AI response');
      throw new Error('AI did not return structured data');
    }

    const cvInsights = JSON.parse(toolCall.function.arguments);
    console.log('✅ CV analyzed successfully');
    console.log('📊 CV insights keys:', Object.keys(cvInsights));

    // Extract full text from AI response
    const rawText = (cvInsights.full_text || '').replace(/'''/g, '').trim();
    console.log(`📝 Full text length: ${rawText.length} characters`);
    console.log(`📝 Full text preview: ${rawText.substring(0, 200)}...`);

    // Store CV file in Supabase Storage
    const fileName = `${user.id}/${Date.now()}_${file.name}`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('cv-uploads')
      .upload(fileName, fileBuffer, {
        contentType: file.type,
        upsert: true
      });

    if (uploadError) {
      console.error('⚠️ Failed to upload CV file:', uploadError);
    }

    // Update learning profile with CV insights
    const { data: profile, error: profileError } = await supabase
      .from('user_learning_profiles')
      .select('*')
      .eq('assessment_id', assessment.id)
      .maybeSingle();

    const newUncertainty = profile?.uncertainty_level ? Math.max(0.10, profile.uncertainty_level * 0.7) : 0.25;

    const { error: updateError } = await supabase
      .from('user_learning_profiles')
      .upsert({
        assessment_id: assessment.id,
        cv_uploaded: true,
        cv_analyzed: true,
        cv_file_path: uploadData?.path || null,
        cv_insights: cvInsights,
        uncertainty_level: newUncertainty,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'assessment_id'
      });

    if (updateError) throw updateError;

    console.log(`✅ CV insights stored, uncertainty reduced to ${Math.round(newUncertainty * 100)}%`);

    return new Response(
      JSON.stringify({
        success: true,
        rawText,
        insights: cvInsights,
        newUncertainty,
        uncertainty: Math.round(newUncertainty * 100),
        message: 'CV analyzed successfully'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('❌ Error in analyze-cv:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
