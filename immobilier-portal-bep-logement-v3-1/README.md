# BEP Logement — Portail abonnés (Agence Immobilière) — Next.js + Supabase

Ce projet fournit un MVP complet :
- Auth email/mot de passe (Supabase)
- Rôles `client` / `agent` / `admin`
- Espace client : biens filtrés selon critères + demandes de coordonnées + affichage coordonnées après validation
- Espace agent : création de clients, saisie critères, gestion biens (photos), traitement demandes (accepter/refuser)
- Sécurité : RLS (Row Level Security) pour empêcher l’accès aux coordonnées tant que non approuvé

## 1) Prérequis
- Node.js 18+
- Un projet Supabase (gratuit)

## 2) Configuration Supabase
1. Crée un projet sur Supabase
2. Dans **SQL Editor**, exécute : `supabase/schema.sql`
3. Dans **Storage**, crée un bucket : `property-images` (public: false)
4. Ajoute une policy Storage (exemple dans le SQL) ou laisse privé et utilise uniquement les upload via server actions.

## 3) Variables d'environnement
Copie `.env.example` vers `.env.local` et remplis :
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

## 4) Lancer en local
```bash
npm install
npm run dev
```
Puis ouvre http://localhost:3000

## 5) Premier agent/admin
Tu peux créer un utilisateur via Supabase Auth (Dashboard > Authentication > Users).
Ensuite, ajoute son profil dans `profiles` avec role `agent` ou `admin`.
(Plus simple : utilise la requête dans `supabase/seed.sql`.)

## 6) Déploiement (aperçu public)
Le plus simple : Vercel
- Importe le repo sur Vercel
- Ajoute les variables d'env (mêmes clés que `.env.local`)
- Deploy → Vercel fournit un lien de preview

## Notes
- La création de comptes clients utilise `SUPABASE_SERVICE_ROLE_KEY` côté serveur (server actions), donc **à héberger** côté serveur (Vercel ok).
- Le “sync du matin” est fourni comme endpoint sécurisé placeholder : `POST /api/sync-daily` (à appeler via cron externe).
