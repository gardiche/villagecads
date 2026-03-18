# Documentation des Routes - Astryd

## 🏠 Pages Marketing (Publiques)

### `/`
- **Description**: Page d'accueil (landing page)
- **Accès**: Public
- **Paramètres**: Aucun
- **Composant**: `Index.tsx`

### `/faq`
- **Description**: Questions fréquentes
- **Accès**: Public
- **Paramètres**: Aucun
- **Composant**: `FAQ.tsx`

### `/contact`
- **Description**: Page de contact
- **Accès**: Public
- **Paramètres**: Aucun
- **Composant**: `Contact.tsx`

### `/pricing`
- **Description**: Page de tarification (plans Déclic, Cap, Élan)
- **Accès**: Public
- **Paramètres**: Aucun
- **Composant**: `Pricing.tsx`

### `/privacy`
- **Description**: Politique de confidentialité
- **Accès**: Public
- **Paramètres**: Aucun
- **Composant**: `Privacy.tsx`

### `/terms`
- **Description**: Conditions générales d'utilisation
- **Accès**: Public
- **Paramètres**: Aucun
- **Composant**: `Terms.tsx`

---

## 🔐 Authentification

### `/auth`
- **Description**: Page de connexion / inscription
- **Accès**: Public (redirige si déjà connecté)
- **Paramètres**: Aucun
- **Composant**: `Auth.tsx`

### `/auth-gate`
- **Description**: Gate d'authentification pour guests
- **Accès**: Public
- **Paramètres**: Aucun
- **Composant**: `AuthGate.tsx`

---

## 📝 Onboarding (Création de compte)

### `/onboarding`
- **Description**: Questionnaire profil entrepreneurial (3 étapes)
- **Accès**: Guest & Authenticated
- **Paramètres**: Aucun
- **Composant**: `OnboardingNew.tsx`
- **Détails**: 
  - Étape 1: Motivations (Schwartz) et sphères de vie
  - Étape 2: Big Five et environnement
  - Étape 3: Contexte libre (champs texte)
  - Génère: Nano Banana visual, profil entrepreneurial, forces/freins

### `/onboarding/idea`
- **Description**: Questionnaire idée de projet (3 étapes)
- **Accès**: Guest & Authenticated
- **Paramètres**: Aucun
- **Composant**: `OnboardingIdea.tsx`
- **Détails**:
  - Étape 1/3: Nom + description + contexte de l'idée
  - Étape 2/3: Jauges de contexte idée (5 sliders)
  - Étape 3/3: RIASEC + CV upload
  - Génère: Zones d'attention, micro-actions, parcours personnalisés

### `/onboarding/new-idea` (Redirect vers `/onboarding/idea`)
- **Description**: Ancienne route, redirige vers `/onboarding/idea`
- **Accès**: Guest & Authenticated
- **Composant**: Redirect

---

## 📊 Dashboard Principal

### `/profil-entrepreneurial`
- **Description**: Page principale affichant le profil entrepreneurial
- **Accès**: Guest & Authenticated
- **Paramètres**: `?ideaId=<uuid>` (optionnel)
- **Composant**: `ProfilEntrepreneurial.tsx`
- **Détails**:
  - Affiche Nano Banana visual
  - Titre + synthèse du profil
  - Forces et freins
  - CTA vers autres pages

### `/cap-parcours`
- **Description**: Objectifs et parcours de progression
- **Accès**: Guest & Authenticated
- **Paramètres**: `?ideaId=<uuid>` (optionnel)
- **Composant**: `CapEtParcours.tsx`
- **Détails**:
  - Objectif personnalisé (cap 2-4 semaines)
  - Parcours avec étapes (6-7 cards)
  - Validation/modification d'objectif

### `/idea`
- **Description**: Page de détails de l'idée projet
- **Accès**: Guest & Authenticated
- **Paramètres**: `?ideaId=<uuid>` (optionnel)
- **Composant**: `IdeaProject.tsx`
- **Détails**:
  - Affiche titre + description idée
  - CTA pour renseigner une idée (redirige vers `/onboarding/idea`)

### `/attention-zones`
- **Description**: Zones d'attention (observations pures)
- **Accès**: Guest & Authenticated
- **Paramètres**: `?ideaId=<uuid>` (optionnel)
- **Composant**: `AttentionZones.tsx`
- **Détails**:
  - Liste des zones d'attention
  - Niveau de sévérité (1-3)
  - Recommandations

### `/micro-actions`
- **Description**: Micro-actions suggérées
- **Accès**: Guest & Authenticated (interaction = login required)
- **Paramètres**: `?ideaId=<uuid>` (optionnel)
- **Composant**: `MicroActions.tsx`
- **Détails**:
  - Liste des micro-actions
  - Checkbox pour marquer accompli (auth required)
  - Suggestions personnalisées

### `/journal`
- **Description**: Journal entrepreneurial (chat avec coach IA)
- **Accès**: Guest & Authenticated (écriture = login required)
- **Paramètres**: `?ideaId=<uuid>` (optionnel)
- **Composant**: `Journal.tsx`
- **Détails**:
  - Interface conversationnelle
  - Messages user + IA coach
  - Scroll to bottom automatique

---

## 🎯 Pages Premium (Plan Cap)

### `/history`
- **Description**: Historique complet de progression
- **Accès**: Premium (Plan Cap) uniquement
- **Paramètres**: `?ideaId=<uuid>` (optionnel)
- **Composant**: `History.tsx`
- **Détails**:
  - Évolution score de maturité
  - Historique zones d'attention levées
  - Historique micro-actions accomplies
  - Export PDF

---

## 👤 Gestion de Compte

### `/account/profile`
- **Description**: Profil utilisateur
- **Accès**: Authenticated
- **Paramètres**: Aucun
- **Composant**: `AccountProfile.tsx`

### `/account/settings`
- **Description**: Paramètres compte (email, password)
- **Accès**: Authenticated
- **Paramètres**: Aucun
- **Composant**: `AccountSettings.tsx`

### `/account/subscription`
- **Description**: Gestion abonnement (plans, upgrade, paiement Stripe)
- **Accès**: Authenticated
- **Paramètres**: Aucun
- **Composant**: `AccountSubscription.tsx`

---

## 🔧 Admin (Restricted to tbo@alpact.vc)

### `/account/admin`
- **Description**: Dashboard administrateur centralisé
- **Accès**: Admin uniquement (tbo@alpact.vc)
- **Paramètres**: Aucun
- **Composant**: `AdminDashboard.tsx`
- **Détails**:
  - Support chat management
  - Beta codes management
  - Debug logs
  - Navigation debugger
  - Routes documentation

### `/account/admin/support-chat`
- **Description**: Gestion conversations support
- **Accès**: Admin uniquement
- **Paramètres**: Aucun
- **Composant**: `AdminSupport.tsx`

### `/account/admin/debug-logs`
- **Description**: Logs de debug Astryd
- **Accès**: Admin uniquement
- **Paramètres**: Aucun
- **Composant**: `AdminDebugLogs.tsx`

### `/account/admin/debug-persona-audit`
- **Description**: Audit génération persona
- **Accès**: Admin uniquement
- **Paramètres**: Aucun
- **Composant**: `AdminDebugPersonaAudit.tsx`

### `/account/admin/navigation-debugger`
- **Description**: Navigation debugger
- **Accès**: Admin uniquement
- **Paramètres**: Aucun
- **Composant**: `AdminNavigationDebugger.tsx`

---

## 🔄 Redirections et Routes Spéciales

### `/profile` → `/profil-entrepreneurial`
- **Type**: Redirect
- **Raison**: Ancien nom de route

### `/onboarding-idea` → `/onboarding/idea`
- **Type**: Redirect
- **Raison**: Harmonisation naming

### `/handoff-mona-lysa`
- **Description**: Page de handoff vers Mona Lysa (coming soon)
- **Accès**: Authenticated
- **Paramètres**: Aucun
- **Composant**: `HandoffMonaLysa.tsx`

### `/share/:shareCode`
- **Description**: Profil partagé publiquement
- **Accès**: Public
- **Paramètres**: `:shareCode` (code unique de partage)
- **Composant**: `ShareProfile.tsx`

### `*` (404)
- **Description**: Page introuvable
- **Accès**: Public
- **Composant**: `NotFound.tsx`

---

## 📦 Paramètres URL Communs

### `ideaId`
- **Type**: UUID
- **Description**: Identifiant unique d'une idée projet
- **Utilisation**: Présent sur la plupart des pages dashboard pour contextualiser les données
- **Optionnel**: Oui (si absent, on charge l'idée la plus récente ou affiche message "renseigner idée")

---

## 🎨 Patterns de Navigation

### Glass Wall Pattern (Guests)
Les visiteurs non authentifiés peuvent naviguer et consulter TOUTES les pages en mode lecture seule. Au moment d'une interaction (clic checkbox, écriture journal), redirection vers `/auth` avec retour automatique après signup.

### Authenticated Flow
Après signup/login, l'utilisateur retrouve son dernier état (profile + idea si renseignée) et peut interagir pleinement avec toutes les fonctionnalités.

### Premium Gating
Certaines fonctionnalités (Historique, export PDF) nécessitent un plan Cap ou supérieur. Affichage d'une modale de pricing au clic.
