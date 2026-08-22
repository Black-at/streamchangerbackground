# StreamDock Remote

Projet complet pour envoyer une image/vidéo depuis un site public vers ton StreamDock N3.

## Structure
- `site/` : à publier sur GitHub Pages.
- `worker/` : API Cloudflare Worker + stockage R2/KV.
- `plugin/` : plugin Stream Controller qui vérifie la room et affiche le média sur les 15 touches.

## 1. Backend Cloudflare
Il faut un compte Cloudflare gratuit.
1. Crée un bucket R2 nommé `streamdock-remote-media`.
2. Crée un namespace KV.
3. Dans `worker/wrangler.toml`, remplace `REMPLACE_PAR_TON_KV_NAMESPACE_ID`.
4. Installe Wrangler : `npm install -g wrangler`
5. Connecte-toi : `wrangler login`
6. Dans le dossier `worker` : `wrangler deploy`
7. Note l'URL du Worker, ex. `https://streamdock-remote-api.ton-compte.workers.dev`.

## 2. Site GitHub Pages
1. Mets le contenu du dossier `site/` dans ton repo GitHub Pages.
2. Active Pages dans Settings > Pages.
3. Ouvre le site.
4. Entre l'URL du Worker + ta room.
5. Partage le lien du site à tes potes. Ils auront seulement besoin de la même room.

## 3. Plugin StreamDock
Avant installation :
1. Ouvre `plugin/com.zedrox.streamdock.remote.sdPlugin/plugin/index.js`.
2. Remplace `API_BASE` par l'URL de ton Worker.
3. Remplace `ROOM` par ta room.
4. Recrée le package si tu modifies le fichier :
   - zippe le **contenu** du dossier `.sdPlugin` à la racine du ZIP
   - renomme/copie le ZIP en `.package.sdPlugin`
5. Importe `StreamDockRemote.package.sdPlugin` dans Stream Controller.
6. Place Partie 01 à Partie 15 sur la grille 5×3.

## Sécurité
La room joue le rôle de secret partagé. Utilise une room longue et imprévisible, par exemple :
`zedrox-7f4k92-83pqs2`

Le Worker limite les fichiers à 40 Mo et aux formats image/vidéo courants.
