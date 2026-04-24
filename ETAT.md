# Projet Paternum — État du projet

## Concept
Application web open source de gestion de dossiers judiciaires.
Connectée à Nextcloud pour l'auth et le stockage fichiers.
IA intégrée (API Anthropic) avec système de fiches résumé (RAG).

## Stack technique
- **Backend** : Node.js + Express
- **BDD** : PostgreSQL
- **Cache** : Redis
- **Proxy** : Nginx
- **Auth** : Nextcloud OAuth2
- **Stockage fichiers** : Nextcloud (WebDAV)
- **IA** : API Anthropic (Claude Haiku)
- **Déploiement** : Docker Compose sur OMV home server

## Architecture IA (RAG)
- Upload document → IA lit une fois → génère une fiche résumé JSON
- Fiche stockée en PostgreSQL
- Prochaines questions → IA lit la fiche, pas le document complet
- Rapide + peu coûteux

## Modules prévus
- [ ] Core : dossiers, documents, utilisateurs
- [ ] Auth Nextcloud OAuth2
- [ ] Upload + stockage Nextcloud
- [ ] Fiches IA (RAG)
- [ ] Numérotation pièces + bordereau PDF
- [ ] Timeline + alertes
- [ ] Export ZIP + PDF
- [ ] Commentaires
- [ ] QR codes

## Ordre de développement
1. Structure projet + Docker Compose
2. Auth Nextcloud OAuth2
3. CRUD dossiers + documents
4. Upload fichiers vers Nextcloud
5. Génération fiches IA
6. Interface frontend
7. Modules suivants un par un

## État actuel
- [x] Concept défini
- [x] Stack choisie
- [x] Architecture IA définie
- [x] ETAT.md créé
- [ ] Repo GitHub créé
- [ ] Structure projet créée
- [ ] Docker Compose fonctionnel

## Fichiers créés
- `docker-compose.yml` ✅
- `.env` ✅
- `nginx/default.conf` ✅
- `backend/Dockerfile` ✅
- `backend/package.json` ✅
- `backend/src/index.js` ❌ à faire
- `backend/sql/init.sql` ❌ à faire
- `frontend/index.html` ❌ à faire

## Comment reprendre une session
1. Ouvrir ce fichier : `cat ETAT.md`
2. Coller le contenu à Claude
3. Claude est immédiatement à jour

## Liens
- Repo GitHub : (à renseigner)
- Nextcloud : (ton URL locale)