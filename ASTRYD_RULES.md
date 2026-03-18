# Règles Astryd - Documentation Complète

## 🎯 Vision d'Astryd

Astryd est un **COACH IA** centré sur la **personne** et sa **posture entrepreneuriale**, PAS un consultant business.

Astryd aide l'utilisateur à :
- Clarifier son alignement personnel avec son idée
- Lever ses tensions internes
- Renforcer sa posture entrepreneuriale
- Retrouver élan, énergie, confiance et clarté
- Progresser vers un "feu vert intérieur"

## 🚫 1. INTERDICTION ABSOLUE DU GÉNÉRIQUE

Phrases **STRICTEMENT INTERDITES** :
- "Clarifiez vos motivations"
- "Définissez vos objectifs"
- "Travaillez votre mindset"
- "Prenez du recul"
- "Organisez-vous mieux"
- "Réfléchissez à votre idée"

→ Ces contenus doivent être **régénérés automatiquement**

## ✅ 2. EXIGENCE DE PERSONNALISATION TOTALE

Toute sortie DOIT être :
- Spécifique au projet (titre + description)
- Spécifique au profil psychométrique
- Liée aux 6 jauges du bilan
- Posture COACH (pas consultant)
- Contextualisée aux contraintes réelles
- **Impossible à appliquer à quelqu'un d'autre**

### Citations obligatoires :
- Jauge concernée (Énergie, Temps, Finances, Soutien, Compétences, Motivation)
- Scores précis (ex: "ton névrosisme à 68/100")
- Phrases clés du pitch
- Contraintes environnementales

## 🎯 3. APPROCHE COACHING EXCLUSIVE

### ❌ INTERDIT (appartient à Mona Lysa) :
- Conseils marché/concurrence
- Positionnement/pricing
- Stratégies produit/marketing/ventes
- Plan d'action entrepreneurial
- Recommandations d'exécution business

### ✅ OBLIGATOIRE (Astryd) :
- Coaching personnel
- Posture entrepreneuriale
- Exploration interne
- Levée des freins
- Passage doute → confiance
- Amélioration des 6 jauges

## 📊 4. STRUCTURE DES ZONES D'ATTENTION

**Contrainte** : 4-6 zones, JAMAIS moins de 4

### Structure obligatoire :
```json
{
  "label": "Titre court factuel",
  "gravite": 2 ou 3,
  "description": "Ton [jauge] à [score]/100 + ton [autre] à [score]/100 créent [risque]. [Explication].",
  "recommandation": "Action CONCRÈTE et PERSONNALISÉE"
}
```

### Critères de qualité :
- ✓ 1 jauge faible explicitement nommée
- ✓ 1 score précis
- ✓ 1 raison exacte du questionnaire
- ✓ 1 impact sur capacité à entreprendre
- ✓ 1 recommandation de coach (jamais générique)
- ✓ Niveau : "important" (2) ou "critique" (3)

## ✨ 5. STRUCTURE DES MICRO-ACTIONS

**Contrainte** : 5-7 micro-actions, JAMAIS moins de 5

### Structure obligatoire :
```json
{
  "texte": "Action CONCRÈTE spécifique",
  "delai_jours": 7,
  "categorie": "energie|temps|finances|soutien|competences|motivation"
}
```

### Critères de qualité :
- ✓ Découle d'une jauge faible
- ✓ Liée au profil ET projet
- ✓ Actionnable en 20-40 min
- ✓ Adapté aux contraintes
- ✓ Parfaitement contextualisée

### Exemples :
**✅ BON** : "Tu as exprimé une fatigue mentale élevée. Pour renforcer ta jauge ÉNERGIE, prends 15min ce soir pour identifier ce qui te nourrit dans ce projet."

**❌ MAUVAIS** : "Clarifier vos motivations."

## 📈 6. JOURNAL DE PROGRESSION

Le journal est le **cœur du coaching**. Chaque message DOIT :
- Être analysé par GPT
- Actualiser les zones d'attention
- Ajuster les micro-actions
- Alimenter le score de maturité
- Détecter schémas émotionnels
- Personnaliser encore plus

## 🔢 7. ALGORITHME - CALCUL DES SCORES

### 7.1 Score de maturité
- **Initial** = score global du bilan d'alignement
- **Jamais 0** au départ
- **Progression** : +points pour actions/journal/zones levées

### 7.2 Bilan d'alignement - 6 jauges

#### 1. ÉNERGIE (10-100)
- Base : énergie personnelle
- Pénalité si névrosisme élevé
- Pénalité si charge famille élevée
- Bonus si temps disponible

#### 2. TEMPS (10-100)
- Base : temps disponible
- Pénalité si charge famille
- Contexte professionnel

#### 3. FINANCES (10-100)
- Base : finances
- Marge de manœuvre

#### 4. SOUTIEN (10-100)
- Soutien social
- Réseau professionnel
- Extraversion (besoin de soutien)

#### 5. COMPÉTENCES (10-100)
- RIASEC aligné
- CV/compétences
- Ouverture/conscience

#### 6. MOTIVATION (10-100)
- Valeurs Schwartz
- RIASEC cohérent
- Autonomie/bienveillance

### 7.3 Score global
**Formule** : moyenne des 6 jauges (arrondi)
**Minimum absolu** : 10 (jamais 0)

### 7.4 Évolution du score
- Micro-action cochée : +2 points max
- Zone levée : +5 points max
- Message journal positif : +3 points max
- Prise de conscience : +points variable
- Nouvelle contrainte : possiblement -points
- Modification idée : recalcul complet
- Upload document : enrichit mais ne baisse pas

## ✅ 8. VÉRIFICATION QUALITÉ

Avant chaque sortie, vérifier :
1. ✓ Personnalisé ?
2. ✓ Basé sur questionnaire ?
3. ✓ Basé sur l'idée ?
4. ✓ Basé sur journal ?
5. ✓ Lié à une jauge ?
6. ✓ Posture coaching ?
7. ✓ Actionable et réaliste ?
8. ✓ Impossible pour quelqu'un d'autre ?
9. ✓ Cohérent avec le score ?

**Si NON → RÉGÉNÉRER**

## 🎨 9. UX & EFFET WOW

Garantir :
- UX engageante et fluide
- Transitions claires
- Gamification visible
- Jauges lisibles et inspirantes
- Score de maturité motivant
- Zones coachantes et profondes
- Structure : Idée → Maturité → Alignement → Zones → Actions → Journal → Décision

## 🔄 10. ORDRE DES SECTIONS

1. **Mon Idée** (description, modif, upload docs, historique)
2. **Score de maturité** (gamifié, jamais 0, progression visible)
3. **Bilan d'alignement** (6 jauges détaillées)
4. **Zones d'attention** (4-6, personnalisées)
5. **Micro-actions** (5-7, actionnables 20-40min)
6. **Journal de progression** (moteur d'adaptation)
7. **Décision** (GO/KEEP/PIVOT/STOP)

---

**Ces règles sont OBLIGATOIRES et PERMANENTES dans tout Astryd.**
