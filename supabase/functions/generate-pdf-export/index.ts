import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { jsPDF } from "https://esm.sh/jspdf@2.5.1";

import { getCorsHeaders } from '../_shared/corsHeaders.ts';

// Helper to sanitize text for jsPDF (remove unsupported unicode characters)
const sanitizeText = (text: string | null | undefined): string => {
  if (!text) return '';
  return text
    // Remove emojis and special symbols that jsPDF can't render
    .replace(/[\u{1F600}-\u{1F64F}]/gu, '') // Emoticons
    .replace(/[\u{1F300}-\u{1F5FF}]/gu, '') // Misc Symbols and Pictographs
    .replace(/[\u{1F680}-\u{1F6FF}]/gu, '') // Transport and Map
    .replace(/[\u{1F1E0}-\u{1F1FF}]/gu, '') // Flags
    .replace(/[\u{2600}-\u{26FF}]/gu, '')   // Misc symbols
    .replace(/[\u{2700}-\u{27BF}]/gu, '')   // Dingbats
    .replace(/[\u{FE00}-\u{FE0F}]/gu, '')   // Variation Selectors
    .replace(/[\u{1F900}-\u{1F9FF}]/gu, '') // Supplemental Symbols
    .replace(/[\u{1FA00}-\u{1FA6F}]/gu, '') // Chess Symbols
    .replace(/[\u{1FA70}-\u{1FAFF}]/gu, '') // Symbols and Pictographs Extended-A
    .replace(/[\u{231A}-\u{231B}]/gu, '')   // Watch, Hourglass
    .replace(/[\u{23E9}-\u{23F3}]/gu, '')   // Various symbols
    .replace(/[\u{23F8}-\u{23FA}]/gu, '')   // Various symbols
    .replace(/[\u{25AA}-\u{25AB}]/gu, '')   // Squares
    .replace(/[\u{25B6}]/gu, '')            // Play button
    .replace(/[\u{25C0}]/gu, '')            // Reverse button
    .replace(/[\u{25FB}-\u{25FE}]/gu, '')   // Squares
    .replace(/✓/g, '[OK]')                  // Replace checkmarks
    .replace(/✗/g, '[X]')                   // Replace X marks
    .replace(/→/g, '->')                    // Replace arrows
    .replace(/←/g, '<-')
    .replace(/↑/g, '^')
    .replace(/↓/g, 'v')
    .replace(/↗/g, '/^')
    .replace(/↘/g, '\\v')
    .replace(/•/g, '-')                     // Replace bullets
    .replace(/–/g, '-')                     // Replace en-dash
    .replace(/—/g, '-')                     // Replace em-dash
    .replace(/'/g, "'")                     // Replace smart quotes
    .replace(/'/g, "'")
    .replace(/"/g, '"')
    .replace(/"/g, '"')
    .replace(/…/g, '...')                   // Replace ellipsis
    .replace(/[\u00A0]/g, ' ')              // Replace non-breaking space
    .trim();
};

// Couleurs de la charte Astryd (HSL vers RGB)
const COLORS = {
  primary: { r: 59, g: 100, b: 217 }, // hsl(220, 75%, 55%)
  accent: { r: 230, g: 77, b: 130 },  // hsl(340, 75%, 60%)
  foreground: { r: 30, g: 38, b: 55 }, // hsl(220, 40%, 20%)
  muted: { r: 110, g: 120, b: 140 },
  success: { r: 34, g: 163, b: 89 },   // hsl(142, 76%, 45%)
  warning: { r: 230, g: 160, b: 50 },
  white: { r: 255, g: 255, b: 255 },
};

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Authorization header requis');
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      throw new Error('Non authentifié');
    }

    const body = await req.json();
    const { ideaId, personaTitle } = body;

    if (!ideaId) {
      throw new Error('ideaId requis');
    }

    console.log(`[PDF Export] Generating PDF for user ${user.id}, idea ${ideaId}, persona: ${personaTitle || 'default'}`);

    // Récupérer toutes les données nécessaires incluant le persona
    const [
      ideaRes,
      zonesRes,
      actionsRes,
      journalRes,
      alignmentHistoryRes,
      commitmentHistoryRes,
      attentionHistoryRes,
      assessmentRes,
      maturityRes,
      alignmentScoreRes
    ] = await Promise.all([
      supabase.from('ideas').select('*').eq('id', ideaId).maybeSingle(),
      supabase.from('attention_zones').select('*').eq('idea_id', ideaId).order('severity', { ascending: false }),
      supabase.from('micro_commitments').select('*').eq('idea_id', ideaId).order('created_at', { ascending: false }),
      supabase.from('journal_entries').select('*').eq('idea_id', ideaId).order('created_at', { ascending: false }).limit(15),
      supabase.from('alignment_history').select('*').eq('idea_id', ideaId).order('created_at', { ascending: false }).limit(10),
      supabase.from('commitment_history').select('*').eq('idea_id', ideaId).order('created_at', { ascending: false }).limit(10),
      supabase.from('attention_history').select('*').eq('idea_id', ideaId).order('created_at', { ascending: false }).limit(10),
      supabase.from('user_assessments').select('*').eq('user_id', user.id).maybeSingle(),
      supabase.from('maturity_scores').select('*').eq('idea_id', ideaId).maybeSingle(),
      supabase.from('alignment_scores').select('*').eq('idea_id', ideaId).maybeSingle()
    ]);

    const idea = ideaRes.data;
    const zones = zonesRes.data || [];
    const actions = actionsRes.data || [];
    const journal = journalRes.data || [];
    const alignmentHistory = alignmentHistoryRes.data || [];
    const commitmentHistory = commitmentHistoryRes.data || [];
    const attentionHistory = attentionHistoryRes.data || [];
    const maturity = maturityRes.data;
    const alignmentScore = alignmentScoreRes.data;
    
    // Couleurs personnalisées selon le persona
    const PERSONA_COLORS: Record<string, { primary: typeof COLORS.primary; accent: typeof COLORS.accent }> = {
      'Dynamique Pressé': { 
        primary: { r: 220, g: 80, b: 60 },   // Rouge dynamique
        accent: { r: 255, g: 140, b: 50 }    // Orange énergie
      },
      'Prudent Bloqué': { 
        primary: { r: 70, g: 130, b: 180 },  // Bleu rassurant
        accent: { r: 100, g: 180, b: 160 }   // Vert-bleu apaisant
      },
      'Créatif Dispersé': { 
        primary: { r: 160, g: 90, b: 200 },  // Violet créatif
        accent: { r: 255, g: 100, b: 150 }   // Rose inspiration
      },
      'Autonome Isolé': { 
        primary: { r: 60, g: 160, b: 120 },  // Vert nature
        accent: { r: 100, g: 200, b: 180 }   // Turquoise connexion
      },
      'Équilibriste Surchargé': { 
        primary: { r: 80, g: 100, b: 160 },  // Bleu-gris équilibré
        accent: { r: 180, g: 140, b: 100 }   // Terre stabilité
      }
    };

    // Appliquer les couleurs du persona si détecté
    const personaColors = personaTitle && PERSONA_COLORS[personaTitle] 
      ? PERSONA_COLORS[personaTitle] 
      : { primary: COLORS.primary, accent: COLORS.accent };
    
    const THEME = {
      ...COLORS,
      primary: personaColors.primary,
      accent: personaColors.accent
    };

    // Créer le PDF avec jsPDF
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 18;
    const contentWidth = pageWidth - 2 * margin;
    let y = 20;

    const checkNewPage = (neededHeight: number = 30) => {
      if (y + neededHeight > pageHeight - 25) {
        addFooter();
        doc.addPage();
        y = 25;
      }
    };

    const setColor = (color: { r: number, g: number, b: number }) => {
      doc.setTextColor(color.r, color.g, color.b);
    };

    const addFooter = () => {
      const footerY = pageHeight - 12;
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      setColor(COLORS.muted);
      doc.text('Généré par Astryd — Coach IA Entrepreneurial', margin, footerY);
      setColor(THEME.primary);
      doc.text('https://astryd.app', pageWidth - margin - 38, footerY);
    };

    const addTitle = (text: string, fontSize: number = 16) => {
      checkNewPage(25);
      doc.setFontSize(fontSize);
      doc.setFont('helvetica', 'bold');
      setColor(THEME.primary);
      doc.text(sanitizeText(text), margin, y);
      y += fontSize * 0.5 + 6;
    };

    const addSubtitle = (text: string) => {
      checkNewPage(15);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      setColor(COLORS.foreground);
      doc.text(sanitizeText(text), margin, y);
      y += 7;
    };

    const addText = (text: string, indent: number = 0, color = COLORS.foreground) => {
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      setColor(color);
      
      const sanitized = sanitizeText(text);
      const lines = doc.splitTextToSize(sanitized, contentWidth - indent);
      for (const line of lines) {
        checkNewPage(7);
        doc.text(line, margin + indent, y);
        y += 5.5;
      }
    };

    const addSpacer = (height: number = 8) => {
      y += height;
    };

    const addDivider = () => {
      checkNewPage(12);
      // Ligne gradient simulée
      doc.setDrawColor(THEME.primary.r, THEME.primary.g, THEME.primary.b);
      doc.setLineWidth(0.8);
      doc.line(margin, y, margin + 40, y);
      doc.setDrawColor(THEME.accent.r, THEME.accent.g, THEME.accent.b);
      doc.line(margin + 40, y, margin + 80, y);
      y += 10;
    };

    // ===== HEADER =====
    // Gradient header simulé avec rectangles
    doc.setFillColor(THEME.primary.r, THEME.primary.g, THEME.primary.b);
    doc.rect(0, 0, pageWidth * 0.6, 42, 'F');
    doc.setFillColor(THEME.accent.r, THEME.accent.g, THEME.accent.b);
    doc.rect(pageWidth * 0.6, 0, pageWidth * 0.4, 42, 'F');
    
    // Dessiner le logo Astryd (constellation stylisée)
    const logoX = margin;
    const logoY = 21;
    const logoSize = 8;
    
    // Centre du logo
    doc.setFillColor(COLORS.white.r, COLORS.white.g, COLORS.white.b);
    doc.circle(logoX, logoY, 2, 'F');
    
    // Branches avec cercles aux extrémités (constellation)
    const branches = [
      { angle: 0, length: logoSize },
      { angle: 45, length: logoSize * 0.8 },
      { angle: 90, length: logoSize },
      { angle: 135, length: logoSize * 0.8 },
      { angle: 180, length: logoSize },
      { angle: 225, length: logoSize * 0.8 },
      { angle: 270, length: logoSize },
      { angle: 315, length: logoSize * 0.8 },
    ];
    
    doc.setDrawColor(COLORS.white.r, COLORS.white.g, COLORS.white.b);
    doc.setLineWidth(0.5);
    
    branches.forEach(({ angle, length }) => {
      const rad = (angle * Math.PI) / 180;
      const endX = logoX + Math.cos(rad) * length;
      const endY = logoY - Math.sin(rad) * length;
      doc.line(logoX, logoY, endX, endY);
      const circleSize = angle % 90 === 0 ? 1.2 : 0.8;
      doc.circle(endX, endY, circleSize, 'F');
    });
    
    // Nom ASTRYD à côté du logo
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    setColor(COLORS.white);
    doc.text('ASTRYD', logoX + logoSize + 8, logoY + 3);
    
    // Sous-titre avec persona si disponible
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const subtitleText = personaTitle 
      ? `Profil ${personaTitle}` 
      : 'Votre progression entrepreneuriale';
    doc.text(subtitleText, logoX + logoSize + 8, logoY + 11);
    
    // Date
    const dateStr = new Date().toLocaleDateString('fr-FR', { 
      day: 'numeric', month: 'long', year: 'numeric' 
    });
    doc.setFontSize(9);
    const dateWidth = doc.getTextWidth(dateStr);
    doc.text(dateStr, pageWidth - margin - dateWidth, logoY + 11);
    
    y = 55;

    // ===== SECTION STATISTIQUES CLÉS =====
    const completedActions = actions.filter((a: any) => a.status === 'done').length;
    const totalActions = actions.filter((a: any) => !a.archived).length;
    const resolvedZonesCount = zones.filter((z: any) => z.archived).length;
    const activeZonesCount = zones.filter((z: any) => !z.archived).length;
    const journalCount = journal.length;
    
    // Calculer la tendance (comparaison 7 derniers jours vs 7 jours avant)
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    
    const recentActivity = commitmentHistory.filter((h: any) => 
      new Date(h.created_at) >= sevenDaysAgo && h.status_after === 'done'
    ).length + attentionHistory.filter((h: any) => 
      new Date(h.created_at) >= sevenDaysAgo && h.resolved
    ).length;
    
    const previousActivity = commitmentHistory.filter((h: any) => {
      const d = new Date(h.created_at);
      return d >= fourteenDaysAgo && d < sevenDaysAgo && h.status_after === 'done';
    }).length + attentionHistory.filter((h: any) => {
      const d = new Date(h.created_at);
      return d >= fourteenDaysAgo && d < sevenDaysAgo && h.resolved;
    }).length;
    
    const trend = recentActivity > previousActivity ? 'hausse' : 
                  recentActivity < previousActivity ? 'baisse' : 'stable';
    const trendIcon = trend === 'hausse' ? '↗' : trend === 'baisse' ? '↘' : '→';
    const trendColor = trend === 'hausse' ? COLORS.success : 
                       trend === 'baisse' ? COLORS.warning : COLORS.muted;
    
    // Ratio d'accomplissement
    const accomplishmentRatio = totalActions > 0 
      ? Math.round((completedActions / totalActions) * 100) 
      : 0;
    
    // Dessiner les 4 cartes statistiques
    const cardWidth = (contentWidth - 12) / 4;
    const cardHeight = 28;
    const cardY = y;
    
    const stats = [
      { label: 'Actions', value: `${completedActions}/${totalActions}`, subtext: 'accomplies', color: THEME.primary },
      { label: 'Zones', value: `${resolvedZonesCount}`, subtext: 'résolues', color: COLORS.success },
      { label: 'Tendance', value: trendIcon, subtext: trend, color: trendColor },
      { label: 'Ratio', value: `${accomplishmentRatio}%`, subtext: 'réussite', color: THEME.accent }
    ];
    
    stats.forEach((stat, i) => {
      const cardX = margin + i * (cardWidth + 4);
      
      // Fond de la carte
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(cardX, cardY, cardWidth, cardHeight, 2, 2, 'F');
      
      // Bordure colorée en haut
      doc.setFillColor(stat.color.r, stat.color.g, stat.color.b);
      doc.rect(cardX, cardY, cardWidth, 3, 'F');
      
      // Valeur
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      setColor(stat.color);
      doc.text(stat.value, cardX + cardWidth / 2, cardY + 14, { align: 'center' });
      
      // Label
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      setColor(COLORS.muted);
      doc.text(stat.subtext, cardX + cardWidth / 2, cardY + 22, { align: 'center' });
    });
    
    y = cardY + cardHeight + 12;

    // ===== MINI-GRAPHIQUE DE TENDANCE =====
    const drawTrendChart = () => {
      // Construire les données des 14 derniers jours
      const today = new Date();
      const days: { date: Date; actions: number; zones: number }[] = [];
      
      for (let i = 13; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        days.push({ date: d, actions: 0, zones: 0 });
      }
      
      // Compter les actions complétées par jour
      commitmentHistory.forEach((h: any) => {
        if (h.status_after === 'done') {
          const hDate = new Date(h.created_at);
          const dayIndex = days.findIndex(d => 
            d.date.toDateString() === hDate.toDateString()
          );
          if (dayIndex >= 0) days[dayIndex].actions++;
        }
      });
      
      // Compter les zones résolues par jour
      attentionHistory.forEach((h: any) => {
        if (h.resolved) {
          const hDate = new Date(h.created_at);
          const dayIndex = days.findIndex(d => 
            d.date.toDateString() === hDate.toDateString()
          );
          if (dayIndex >= 0) days[dayIndex].zones++;
        }
      });
      
      // Calculer l'engagement cumulé
      let cumulativeData: number[] = [];
      let total = 0;
      days.forEach(d => {
        total += d.actions + d.zones;
        cumulativeData.push(total);
      });
      
      // Si pas de données, ne pas dessiner
      if (total === 0) return;
      
      const chartX = margin;
      const chartY = y;
      const chartWidth = contentWidth;
      const chartHeight = 40;
      const maxValue = Math.max(...cumulativeData, 1);
      
      // Titre du graphique
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      setColor(THEME.primary);
      doc.text('Votre engagement sur 14 jours', chartX, chartY);
      
      const graphY = chartY + 8;
      
      // Fond du graphique
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(chartX, graphY, chartWidth, chartHeight, 2, 2, 'F');
      
      // Grille horizontale légère
      doc.setDrawColor(230, 230, 240);
      doc.setLineWidth(0.2);
      for (let i = 1; i < 4; i++) {
        const gridY = graphY + (chartHeight / 4) * i;
        doc.line(chartX + 5, gridY, chartX + chartWidth - 5, gridY);
      }
      
      // Points et ligne de progression
      const points: { x: number; y: number }[] = [];
      const barWidth = (chartWidth - 20) / 14;
      
      cumulativeData.forEach((val, i) => {
        const px = chartX + 10 + i * barWidth + barWidth / 2;
        const py = graphY + chartHeight - 8 - ((val / maxValue) * (chartHeight - 16));
        points.push({ x: px, y: py });
      });
      
      // Dessiner la zone sous la courbe (gradient simulé)
      if (points.length > 1) {
        doc.setFillColor(THEME.primary.r, THEME.primary.g, THEME.primary.b);
        doc.setGState(new doc.GState({ opacity: 0.15 }));
        
        doc.moveTo(points[0].x, graphY + chartHeight - 8);
        points.forEach(p => doc.lineTo(p.x, p.y));
        doc.lineTo(points[points.length - 1].x, graphY + chartHeight - 8);
        doc.fill();
        
        doc.setGState(new doc.GState({ opacity: 1 }));
      }
      
      // Dessiner la ligne de tendance
      doc.setDrawColor(THEME.primary.r, THEME.primary.g, THEME.primary.b);
      doc.setLineWidth(1.5);
      for (let i = 1; i < points.length; i++) {
        doc.line(points[i - 1].x, points[i - 1].y, points[i].x, points[i].y);
      }
      
      // Points
      points.forEach((p, i) => {
        // Point externe
        doc.setFillColor(COLORS.white.r, COLORS.white.g, COLORS.white.b);
        doc.circle(p.x, p.y, 2.5, 'F');
        // Point interne coloré
        doc.setFillColor(THEME.primary.r, THEME.primary.g, THEME.primary.b);
        doc.circle(p.x, p.y, 1.5, 'F');
      });
      
      // Labels de dates (premier et dernier jour)
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      setColor(COLORS.muted);
      const firstDay = days[0].date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
      const lastDay = days[13].date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
      doc.text(firstDay, chartX + 10, graphY + chartHeight + 5);
      doc.text(lastDay, chartX + chartWidth - 25, graphY + chartHeight + 5);
      
      // Total engagement
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      setColor(THEME.accent);
      doc.text(`${total} actions`, chartX + chartWidth - 35, chartY);
      
      y = graphY + chartHeight + 12;
    };
    
    drawTrendChart();
    addSpacer(8);
    
    // ===== GRAPHIQUE DES JAUGES D'ALIGNEMENT =====
    const drawAlignmentGauges = () => {
      // Récupérer les détails d'alignement
      const details = alignmentScore?.details as { energie?: number; temps?: number; finances?: number; soutien?: number; competences?: number; motivation?: number } | null;
      
      if (!details) return;
      
      const gauges = [
        { label: 'Energie', value: details.energie || 0, color: { r: 234, g: 88, b: 12 } },    // Orange
        { label: 'Temps', value: details.temps || 0, color: { r: 59, g: 130, b: 246 } },       // Blue
        { label: 'Finances', value: details.finances || 0, color: { r: 34, g: 197, b: 94 } },  // Green
        { label: 'Soutien', value: details.soutien || 0, color: { r: 168, g: 85, b: 247 } },   // Purple
        { label: 'Competences', value: details.competences || 0, color: { r: 236, g: 72, b: 153 } }, // Pink
        { label: 'Motivation', value: details.motivation || 0, color: { r: 245, g: 158, b: 11 } }   // Amber
      ];
      
      // Vérifier si au moins une jauge a une valeur
      const hasData = gauges.some(g => g.value > 0);
      if (!hasData) return;
      
      checkNewPage(70);
      
      const chartX = margin;
      const chartY = y;
      const chartWidth = contentWidth;
      const barHeight = 8;
      const barSpacing = 16;
      
      // Titre
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      setColor(THEME.primary);
      doc.text('Jauges d\'alignement', chartX, chartY);
      
      let barY = chartY + 12;
      
      gauges.forEach((gauge) => {
        // Label
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        setColor(COLORS.foreground);
        doc.text(gauge.label, chartX, barY - 2);
        
        // Valeur
        doc.setFont('helvetica', 'bold');
        setColor(gauge.color);
        doc.text(`${gauge.value}%`, chartX + chartWidth - 20, barY - 2);
        
        // Fond de la barre
        doc.setFillColor(235, 238, 245);
        doc.roundedRect(chartX, barY, chartWidth - 25, barHeight, 2, 2, 'F');
        
        // Barre de progression
        const progressWidth = Math.max(0, ((gauge.value / 100) * (chartWidth - 25)));
        if (progressWidth > 0) {
          doc.setFillColor(gauge.color.r, gauge.color.g, gauge.color.b);
          doc.roundedRect(chartX, barY, progressWidth, barHeight, 2, 2, 'F');
        }
        
        barY += barSpacing;
      });
      
      // Score global si disponible
      if (alignmentScore?.score_global) {
        barY += 4;
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        setColor(THEME.accent);
        doc.text(`Score global : ${alignmentScore.score_global}%`, chartX + chartWidth / 2, barY, { align: 'center' });
        barY += 8;
      }
      
      y = barY + 8;
    };
    
    drawAlignmentGauges();
    addDivider();

    // ===== IDÉE DE PROJET =====
    if (idea) {
      addTitle('Votre idée de projet');
      
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      setColor(COLORS.foreground);
      checkNewPage(12);
      doc.text(sanitizeText(idea.title) || 'Projet sans titre', margin, y);
      y += 10;
      
      if (idea.description) {
        addText(idea.description);
      }
      
      addSpacer(12);
      addDivider();
    }

    // ===== ZONES D'ATTENTION =====
    const activeZones = zones.filter((z: any) => !z.archived);
    const resolvedZones = zones.filter((z: any) => z.archived);
    
    if (activeZones.length > 0 || resolvedZones.length > 0) {
      addTitle("Points d'attention identifiés");
      
      if (activeZones.length > 0) {
        addSubtitle('A surveiller');
        activeZones.forEach((zone: any) => {
          const severity = zone.severity || 5;
          const icon = severity >= 7 ? '[!]' : severity >= 4 ? '[*]' : '[i]';
          
          checkNewPage(25);
          doc.setFontSize(10);
          doc.setFont('helvetica', 'bold');
          setColor(severity >= 7 ? COLORS.warning : COLORS.foreground);
          doc.text(`${icon} ${sanitizeText(zone.label)}`, margin + 3, y);
          y += 7;
          
          if (zone.recommendation) {
            addText(zone.recommendation, 6, COLORS.muted);
          }
          y += 4;
        });
      }
      
      if (resolvedZones.length > 0) {
        addSpacer(6);
        addSubtitle('Zones resolues');
        resolvedZones.slice(0, 5).forEach((zone: any) => {
          checkNewPage(10);
          doc.setFontSize(9);
          doc.setFont('helvetica', 'normal');
          setColor(COLORS.success);
          doc.text(`[OK] ${sanitizeText(zone.label)}`, margin + 3, y);
          y += 6;
        });
      }
      
      addSpacer(10);
      addDivider();
    }

    // ===== MICRO-ACTIONS =====
    if (actions.length > 0) {
      addTitle('Vos micro-actions');
      
      const completed = actions.filter((a: any) => a.status === 'done');
      const inProgress = actions.filter((a: any) => a.status === 'in_progress' && !a.archived);
      const pending = actions.filter((a: any) => a.status === 'todo' && !a.archived);
      
      if (completed.length > 0) {
        addSubtitle(`Actions accomplies (${completed.length})`);
        completed.slice(0, 8).forEach((action: any) => {
          checkNewPage(12);
          doc.setFontSize(9);
          doc.setFont('helvetica', 'normal');
          setColor(COLORS.success);
          const actionText = `[OK] ${sanitizeText(action.text)}`.substring(0, 90);
          doc.text(actionText, margin + 3, y);
          y += 6;
          
          if (action.user_notes) {
            doc.setFontSize(8);
            setColor(COLORS.muted);
            const noteText = `   -> ${sanitizeText(action.user_notes).substring(0, 70)}${action.user_notes.length > 70 ? '...' : ''}`;
            doc.text(noteText, margin + 3, y);
            y += 5;
          }
        });
        addSpacer(6);
      }

      if (inProgress.length > 0) {
        addSubtitle(`En cours (${inProgress.length})`);
        inProgress.slice(0, 5).forEach((action: any) => {
          checkNewPage(8);
          doc.setFontSize(9);
          doc.setFont('helvetica', 'normal');
          setColor(COLORS.warning);
          const actionText = `[...] ${sanitizeText(action.text)}`.substring(0, 90);
          doc.text(actionText, margin + 3, y);
          y += 6;
        });
        addSpacer(6);
      }

      if (pending.length > 0) {
        addSubtitle(`A venir (${pending.length})`);
        pending.slice(0, 5).forEach((action: any) => {
          checkNewPage(8);
          doc.setFontSize(9);
          doc.setFont('helvetica', 'normal');
          setColor(COLORS.muted);
          const actionText = `[ ] ${sanitizeText(action.text)}`.substring(0, 90);
          doc.text(actionText, margin + 3, y);
          y += 6;
        });
      }
      
      addSpacer(10);
      addDivider();
    }

    // ===== HISTORIQUE DE PROGRESSION =====
    const hasHistory = alignmentHistory.length > 0 || commitmentHistory.length > 0 || attentionHistory.length > 0;
    
    if (hasHistory) {
      addTitle('Votre historique de progression');
      
      // Créer une timeline unifiée
      const allEvents: { date: string; type: string; label: string }[] = [];
      
      commitmentHistory.forEach((h: any) => {
        allEvents.push({
          date: h.created_at,
          type: 'action',
          label: `Action "${sanitizeText(h.text)?.substring(0, 40)}..." -> ${h.status_after === 'done' ? 'accomplie' : h.status_after}`
        });
      });
      
      attentionHistory.forEach((h: any) => {
        if (h.resolved) {
          allEvents.push({
            date: h.created_at,
            type: 'zone',
            label: `Zone "${sanitizeText(h.label)}" resolue`
          });
        }
      });
      
      // Trier par date décroissante
      allEvents.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      if (allEvents.length > 0) {
        allEvents.slice(0, 12).forEach((event) => {
          const date = new Date(event.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
          checkNewPage(10);
          doc.setFontSize(8);
          doc.setFont('helvetica', 'bold');
          setColor(COLORS.muted);
          doc.text(`[${date}]`, margin, y);
          
          doc.setFont('helvetica', 'normal');
          setColor(event.type === 'zone' ? COLORS.success : COLORS.foreground);
          doc.text(sanitizeText(event.label), margin + 22, y);
          y += 6;
        });
      } else {
        addText('Votre historique s\'enrichira au fil de vos actions.', 0, COLORS.muted);
      }
      
      addSpacer(10);
      addDivider();
    }

    // ===== JOURNAL ENTREPRENEURIAL =====
    if (journal.length > 0) {
      addTitle('Extraits de votre journal');
      
      // Regrouper les échanges par conversation
      const conversations: { date: string; messages: any[] }[] = [];
      let currentConvo: any[] = [];
      let lastDate = '';
      
      journal.forEach((entry: any) => {
        const entryDate = new Date(entry.created_at).toLocaleDateString('fr-FR');
        if (entryDate !== lastDate && currentConvo.length > 0) {
          conversations.push({ date: lastDate, messages: currentConvo });
          currentConvo = [];
        }
        currentConvo.push(entry);
        lastDate = entryDate;
      });
      if (currentConvo.length > 0) {
        conversations.push({ date: lastDate, messages: currentConvo });
      }
      
      // Afficher les 3 dernieres conversations
      conversations.slice(0, 3).forEach((convo) => {
        checkNewPage(20);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        setColor(COLORS.primary);
        doc.text(convo.date, margin, y);
        y += 7;
        
        convo.messages.slice(0, 4).forEach((msg: any) => {
          const isUser = msg.sender === 'user';
          const prefix = isUser ? 'Vous' : 'Coach IA';
          const content = sanitizeText(msg.content).substring(0, 120) + (msg.content.length > 120 ? '...' : '');
          
          checkNewPage(15);
          doc.setFontSize(8);
          doc.setFont('helvetica', 'bold');
          setColor(isUser ? COLORS.accent : COLORS.primary);
          doc.text(`${prefix}:`, margin + 3, y);
          y += 5;
          
          doc.setFont('helvetica', 'normal');
          setColor(COLORS.foreground);
          const lines = doc.splitTextToSize(content, contentWidth - 8);
          lines.forEach((line: string) => {
            checkNewPage(5);
            doc.text(line, margin + 6, y);
            y += 4.5;
          });
          y += 3;
        });
        y += 6;
      });
    }

    // ===== FOOTER FINAL =====
    addFooter();

    // Générer le PDF en bytes
    const pdfOutput = doc.output('arraybuffer');
    const pdfBytes = new Uint8Array(pdfOutput);

    // Nom de fichier propre
    const ideaTitle = idea?.title || 'mon-projet';
    const cleanTitle = ideaTitle
      .toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 30);
    const dateFileName = new Date().toISOString().split('T')[0];
    const fileName = `astryd-progression-${cleanTitle}-${dateFileName}.pdf`;
    const filePath = `${user.id}/${fileName}`;

    console.log(`[PDF Export] Uploading PDF: ${fileName}, size: ${pdfBytes.length} bytes`);

    // Upload vers Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('pdf-exports')
      .upload(filePath, pdfBytes, {
        contentType: 'application/pdf',
        upsert: true
      });

    if (uploadError) {
      console.error('[PDF Export] Upload error:', uploadError);
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    // Sauvegarder l'enregistrement
    const insights = {
      zonesActives: activeZones.length,
      zonesResolues: resolvedZones.length,
      actionsCompleted: actions.filter((a: any) => a.status === 'done').length,
      actionsTotal: actions.length,
      journalEntries: journal.length,
      message_coach: `Export complet de votre progression entrepreneuriale avec ${activeZones.length} zones actives et ${actions.filter((a: any) => a.status === 'done').length} actions accomplies.`
    };

    const { data: exportRecord, error: insertError } = await supabase
      .from('pdf_exports')
      .insert({
        user_id: user.id,
        idea_id: ideaId,
        file_path: uploadData.path,
        export_type: 'complete',
        insights_summary: insights
      })
      .select()
      .single();

    if (insertError) {
      console.error('[PDF Export] Insert error:', insertError);
    }

    // URL signée (1 heure d'expiration) - bucket privé
    const { data: signedData, error: signedError } = await supabase.storage
      .from('pdf-exports')
      .createSignedUrl(uploadData.path, 3600);

    if (signedError) throw signedError;

    console.log(`[PDF Export] Success: signed URL generated`);

    return new Response(
      JSON.stringify({
        success: true,
        exportId: exportRecord?.id,
        downloadUrl: signedData.signedUrl,
        fileName: fileName,
        insights
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error: any) {
    console.error('[PDF Export] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Erreur lors de la génération du PDF' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});