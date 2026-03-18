/**
 * Fonction utilitaire pour garantir le vouvoiement dans tous les textes générés.
 * Post-traite le texte pour corriger les glissements vers le tutoiement.
 * 
 * IMPORTANT: Utilise (?:^|[\s,.;:!?"«(]) comme lookbehind au lieu de \b
 * car \b ne gère pas les caractères accentués en JavaScript (ê, é, à...).
 * Sans ça, \btes\b matche "tes" dans "êtes" → bug "êvos".
 */
export function enforceVouvoiement(text: string): string {
  if (!text) return text;
  
  let result = text;
  
  // ===== PHASE 1: Remplacements "tu + verbe" (sûrs, pas de faux positifs) =====
  const tuVerbReplacements: [RegExp, string][] = [
    // Être
    [/\btu es\b/gi, 'vous êtes'],
    [/\btu étais\b/gi, 'vous étiez'],
    [/\btu seras\b/gi, 'vous serez'],
    [/\btu serais\b/gi, 'vous seriez'],
    // Avoir
    [/\btu as\b/gi, 'vous avez'],
    [/\btu avais\b/gi, 'vous aviez'],
    [/\btu auras\b/gi, 'vous aurez'],
    [/\btu aurais\b/gi, 'vous auriez'],
    // Pouvoir
    [/\btu peux\b/gi, 'vous pouvez'],
    [/\btu pouvais\b/gi, 'vous pouviez'],
    [/\btu pourras\b/gi, 'vous pourrez'],
    [/\btu pourrais\b/gi, 'vous pourriez'],
    // Vouloir
    [/\btu veux\b/gi, 'vous voulez'],
    [/\btu voulais\b/gi, 'vous vouliez'],
    [/\btu voudras\b/gi, 'vous voudrez'],
    [/\btu voudrais\b/gi, 'vous voudriez'],
    // Devoir
    [/\btu dois\b/gi, 'vous devez'],
    [/\btu devais\b/gi, 'vous deviez'],
    [/\btu devras\b/gi, 'vous devrez'],
    [/\btu devrais\b/gi, 'vous devriez'],
    // Faire
    [/\btu fais\b/gi, 'vous faites'],
    [/\btu faisais\b/gi, 'vous faisiez'],
    [/\btu feras\b/gi, 'vous ferez'],
    [/\btu ferais\b/gi, 'vous feriez'],
    // Aller
    [/\btu vas\b/gi, 'vous allez'],
    [/\btu allais\b/gi, 'vous alliez'],
    [/\btu iras\b/gi, 'vous irez'],
    [/\btu irais\b/gi, 'vous iriez'],
    // Savoir
    [/\btu sais\b/gi, 'vous savez'],
    [/\btu savais\b/gi, 'vous saviez'],
    [/\btu sauras\b/gi, 'vous saurez'],
    [/\btu saurais\b/gi, 'vous sauriez'],
    // Voir
    [/\btu vois\b/gi, 'vous voyez'],
    [/\btu voyais\b/gi, 'vous voyiez'],
    [/\btu verras\b/gi, 'vous verrez'],
    [/\btu verrais\b/gi, 'vous verriez'],
    // Venir
    [/\btu viens\b/gi, 'vous venez'],
    [/\btu venais\b/gi, 'vous veniez'],
    [/\btu viendras\b/gi, 'vous viendrez'],
    [/\btu viendrais\b/gi, 'vous viendriez'],
    // Prendre
    [/\btu prends\b/gi, 'vous prenez'],
    [/\btu prenais\b/gi, 'vous preniez'],
    [/\btu prendras\b/gi, 'vous prendrez'],
    [/\btu prendrais\b/gi, 'vous prendriez'],
    // 1er groupe courants
    [/\btu travailles\b/gi, 'vous travaillez'],
    [/\btu penses\b/gi, 'vous pensez'],
    [/\btu regardes\b/gi, 'vous regardez'],
    [/\btu essaies\b/gi, 'vous essayez'],
    [/\btu commences\b/gi, 'vous commencez'],
    [/\btu continues\b/gi, 'vous continuez'],
    [/\btu identifies\b/gi, 'vous identifiez'],
    [/\btu explores\b/gi, 'vous explorez'],
    [/\btu contactes\b/gi, 'vous contactez'],
    [/\btu demandes\b/gi, 'vous demandez'],
    [/\btu évalues\b/gi, 'vous évaluez'],
    [/\btu testes\b/gi, 'vous testez'],
    [/\btu crées\b/gi, 'vous créez'],
    [/\btu rédiges\b/gi, 'vous rédigez'],
    [/\btu planifies\b/gi, 'vous planifiez'],
    [/\btu organises\b/gi, 'vous organisez'],
    [/\btu cherches\b/gi, 'vous cherchez'],
    [/\btu trouves\b/gi, 'vous trouvez'],
    [/\btu réfléchis\b/gi, 'vous réfléchissez'],
    [/\btu définis\b/gi, 'vous définissez'],
  ];
  
  for (const [pattern, replacement] of tuVerbReplacements) {
    result = result.replace(pattern, replacement);
  }
  
  // ===== PHASE 2: Pronom "tu" isolé restant (après avoir traité "tu + verbe") =====
  // Remplace "tu" suivi d'un verbe non listé
  result = result.replace(/\btu\b/gi, 'vous');
  
  // ===== PHASE 3: Possessifs — UNIQUEMENT quand précédés d'un espace/ponctuation =====
  // Utilise une approche capture+replace pour éviter les faux positifs avec les accents
  // "ton " mais PAS "ton" dans "carton", et surtout PAS "tes" dans "êtes"
  result = result.replace(/(^|[\s,.;:!?'"«(])ton(\s)/gim, '$1votre$2');
  result = result.replace(/(^|[\s,.;:!?'"«(])ta(\s)/gim, '$1votre$2');
  result = result.replace(/(^|[\s,.;:!?'"«(])tes(\s)/gim, '$1vos$2');
  
  // ===== PHASE 4: Pronoms toniques =====
  result = result.replace(/(^|[\s,.;:!?'"«(])toi\b/gim, '$1vous');
  
  // ===== PHASE 5: Pronom réfléchi "te" (précédé d'espace uniquement) =====
  result = result.replace(/([\s])te(\s)/gi, '$1vous$2');
  result = result.replace(/([\s])t'(?=[aeiouyàâäéèêëïîôùûü])/gi, "$1vous ");
  
  // NOTE: Les formes impératives isolées (explore, commence, etc.) ne sont PAS
  // remplacées car elles causent trop de faux positifs ("on explore" → "on explorez").
  // Le system prompt garantit déjà le vouvoiement côté IA.
  
  return result;
}

/**
 * Directive de vouvoiement à ajouter en début de system prompt
 */
export const VOUVOIEMENT_DIRECTIVE = `RÈGLE ABSOLUE DE TON : Tu es un coach professionnel. Ta posture est bienveillante mais toujours respectueuse. Tu dois impérativement VOUVOYER l'utilisateur. L'usage du tutoiement est STRICTEMENT INTERDIT, quel que soit le contexte. Utilise "vous/votre/vos" et jamais "tu/ton/ta/tes". Cette règle est NON NÉGOCIABLE.

`;
