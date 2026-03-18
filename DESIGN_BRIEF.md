# Brief UX/UI - Astryd

## 📋 Vue d'ensemble
**Nom du projet** : Astryd  
**Tagline** : Quand tout s'aligne  
**Description** : Plateforme de découverte d'idées personnalisées basée sur le profiling psychologique

---

## 🎨 Identité visuelle

### Logo
**Fichier principal** : `src/assets/logo-gradient.svg`

**Description** :
- Symbole abstrait en réseau connecté (nodes et lignes)
- 7 cercles interconnectés formant une constellation
- Gradient bicolore bleu-rose appliqué sur tous les éléments
- Format SVG vectoriel 48x48px

**Variantes disponibles** :
- `logo-gradient.svg` - Logo principal avec gradient
- `astryd-logo-new.svg` - Version alternative
- `astryd-logo-transparent.png` - Version PNG avec transparence
- `astryd-logo.svg` - Version basique

---

## 🎨 Palette de couleurs

### Couleurs principales

#### Primary (Bleu)
```
Light mode: hsl(220, 75%, 55%) - #3B7FE8
Dark mode: hsl(220, 75%, 60%) - #4D8EF7
Usage: Boutons principaux, liens, éléments interactifs majeurs
```

#### Accent (Rose)
```
Light mode: hsl(340, 75%, 60%) - #E54D89
Dark mode: hsl(340, 70%, 65%) - #E86399
Usage: Éléments secondaires, accents visuels, call-to-actions
```

#### Primary Glow (Variante lumineuse du bleu)
```
Light mode: hsl(220, 80%, 65%)
Dark mode: hsl(220, 80%, 70%)
Usage: Effets de glow, états hover
```

### Couleurs sémantiques

#### Background & Foreground
```
Light mode:
- Background: hsl(0, 0%, 100%) - Blanc pur
- Foreground: hsl(220, 40%, 20%) - Bleu très foncé

Dark mode:
- Background: hsl(220, 40%, 12%) - Bleu noir profond
- Foreground: hsl(0, 0%, 98%) - Blanc cassé
```

#### Secondary
```
Light mode:
- Secondary: hsl(220, 20%, 96%) - Gris bleuté très clair
- Secondary-foreground: hsl(220, 40%, 20%)

Dark mode:
- Secondary: hsl(220, 30%, 22%) - Bleu foncé désaturé
- Secondary-foreground: hsl(0, 0%, 98%)
```

#### Muted
```
Light mode:
- Muted: hsl(220, 18%, 97%) - Gris très clair
- Muted-foreground: hsl(220, 25%, 45%) - Gris moyen

Dark mode:
- Muted: hsl(220, 30%, 20%) - Bleu très foncé
- Muted-foreground: hsl(220, 25%, 65%) - Gris clair
```

#### Success
```
Light mode: hsl(142, 76%, 45%) - Vert
Dark mode: hsl(142, 76%, 50%) - Vert légèrement plus clair
Usage: Messages de succès, validations
```

#### Destructive
```
Light mode: hsl(0, 84%, 60%) - Rouge
Dark mode: hsl(0, 72%, 55%) - Rouge légèrement plus foncé
Usage: Erreurs, suppressions, alertes
```

#### Card
```
Light mode: hsl(0, 0%, 100%) - Blanc
Dark mode: hsl(220, 35%, 16%) - Bleu noir
Usage: Cartes, conteneurs surélevés
```

#### Border & Input
```
Light mode: hsl(220, 18%, 90%) - Gris bleuté clair
Dark mode: hsl(220, 30%, 26%) - Gris bleuté foncé
Usage: Bordures, contours de champs
```

### Couleurs des sphères de vie
```
Soi: hsl(330, 70%, 60%) - Rose-magenta
Couple: hsl(280, 65%, 60%) - Violet
Famille: hsl(220, 70%, 60%) - Bleu
Amis: hsl(45, 85%, 60%) - Jaune-orangé
Loisirs: hsl(142, 65%, 55%) - Vert
Pro: hsl(25, 75%, 60%) - Orange
```

---

## ✨ Gradients

### Gradient Hero (Principal)
```css
Light: linear-gradient(135deg, hsl(220 75% 55%), hsl(340 75% 60%))
Dark: linear-gradient(135deg, hsl(220 75% 60%), hsl(340 70% 65%))
```
Bleu vers rose, angle 135°. Utilisé pour les CTA, le hero, éléments majeurs.

### Gradient Card
```css
Light: linear-gradient(180deg, hsl(0 0% 100%), hsl(220 18% 98%))
Dark: linear-gradient(180deg, hsl(220 35% 16%), hsl(220 30% 20%))
```
Vertical, subtil pour les backgrounds de cartes.

### Gradient Glow
```css
Light: radial-gradient(circle at 50% 0%, hsl(220 75% 55% / 0.15), transparent 70%)
Dark: radial-gradient(circle at 50% 0%, hsl(220 75% 60% / 0.12), transparent 70%)
```
Effet de lueur radiale pour les backgrounds.

---

## 🔤 Typographie

### Polices

#### Font Display - DM Sans
```
Weights: 400, 500, 600, 700, 800, 900
Usage: Titres (h1, h2, h3, h4, h5, h6), éléments de display
```

#### Font Sans - Inter
```
Weights: 400, 500, 600, 700, 800
Usage: Corps de texte, paragraphes, UI
```

### Hiérarchie typographique
- **H1-H6** : Font-family `DM Sans` (font-display)
- **Body text** : Font-family `Inter` (font-sans)
- **Anti-aliasing** : Activé sur tous les textes

---

## 🎭 Ombres

### Shadow Soft
```css
Light: 0 2px 8px -2px hsl(220 40% 20% / 0.08)
Dark: 0 2px 8px -2px hsl(0 0% 0% / 0.3)
```
Ombre légère pour les éléments légèrement surélevés.

### Shadow Medium
```css
Light: 0 4px 16px -4px hsl(220 40% 20% / 0.12)
Dark: 0 4px 16px -4px hsl(0 0% 0% / 0.4)
```
Ombre moyenne pour les cartes, modales.

### Shadow Float
```css
Light: 0 8px 32px -8px hsl(220 40% 20% / 0.2), 0 2px 8px -2px hsl(220 40% 20% / 0.1)
Dark: 0 8px 32px -8px hsl(0 0% 0% / 0.5), 0 2px 8px -2px hsl(0 0% 0% / 0.3)
```
Ombre prononcée pour les éléments flottants (dropdowns, tooltips).

---

## 🎬 Animations & Transitions

### Transitions
```css
Smooth: all 0.3s cubic-bezier(0.4, 0, 0.2, 1)
Bounce: all 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55)
```

### Keyframes animations
- **accordion-down / accordion-up** : 0.2s ease-out
- **fade-in** : 0.5s ease-out (opacity + translateY)
- **fade-in-up** : 0.6s ease-out (opacity + translateY 20px)
- **scale-in** : 0.3s ease-out (scale 0.95 → 1)
- **slide-in-right** : 0.4s ease-out (translateX 100% → 0)
- **slide-in-left** : 0.4s ease-out (translateX -100% → 0)
- **float** : 3s infinite ease-in-out (translateY oscillant)
- **pulse-glow** : 2s infinite ease-in-out (opacity + scale)

---

## 📐 Espacements & Bordures

### Border Radius
```
--radius: 1rem (16px)
- lg: 1rem
- md: calc(1rem - 2px)
- sm: calc(1rem - 4px)
```

### Container
```
Max-width: 1400px (2xl breakpoint)
Padding: 2rem
Centré horizontalement
```

---

## 🖼️ Assets & Images

### Images disponibles
```
src/assets/
├── logo-gradient.svg (Logo principal)
├── astryd-logo-new.svg
├── astryd-logo-transparent.png
├── astryd-logo.svg
├── ayana-logo.png
├── ayana-logo.svg
├── elyana-logo.png
├── eyana-logo.png
├── hero-bg.jpg (Background hero section)
└── hero-woman-vision.jpg (Image hero principale)
```

---

## 🎯 Principes UX

### Design System
- **Semantic tokens** : Toutes les couleurs utilisent des tokens sémantiques (primary, accent, muted, etc.)
- **Dark mode natif** : Support complet du mode sombre
- **HSL uniquement** : Toutes les couleurs en format HSL pour facilité de manipulation
- **Composants réutilisables** : Architecture basée sur Shadcn/ui
- **Accessibilité** : Focus states, ring, contraste optimisé

### Responsive Design
- **Mobile-first** : Design adaptatif à partir de mobile
- **Breakpoints Tailwind** : sm, md, lg, xl, 2xl
- **Container responsive** : Max 1400px centré

### Interactions
- **Hover states** : Tous les éléments interactifs ont des états hover
- **Focus visible** : Ring de focus pour l'accessibilité clavier
- **Transitions fluides** : Animations douces sur toutes les interactions
- **Feedback visuel** : Loading states, success/error messages

---

## 🛠️ Stack technique

- **Framework** : React 18 + TypeScript
- **Styling** : Tailwind CSS + CSS Variables
- **Build** : Vite
- **UI Components** : Shadcn/ui (Radix UI)
- **Icons** : Lucide React
- **Animations** : Framer Motion + Tailwind Animate
- **Routing** : React Router DOM

---

## 📱 Composants clés

### Navigation
- Navbar fixe avec backdrop blur
- Logo + tagline responsive
- CTA bouton arrondi

### Hero
- Background avec image + gradient overlay
- Texte grand format avec gradient
- Call-to-action proéminent

### Cards
- Ombres douces multi-niveaux
- Border radius 1rem
- Hover effects avec scale

### Boutons
- Variants : default, secondary, outline, ghost
- Border radius arrondi (rounded-full pour CTA)
- Transitions smooth

### Footer
- Layout flexible responsive
- Logo + liens + copyright
- Couleurs muted

---

## 📝 Notes de mise en œuvre

1. **Toujours utiliser les tokens** : Ne jamais hardcoder de couleurs directement
2. **Gradients via CSS vars** : Utiliser `var(--gradient-hero)` etc.
3. **HSL format** : `hsl(var(--primary))` pour utilisation dans Tailwind
4. **Dark mode** : Automatique via `.dark` class
5. **Composants Shadcn** : Customiser via variants, pas de styles inline

---

*Document généré le : ${new Date().toLocaleDateString('fr-FR')}*  
*Version : 1.0*
