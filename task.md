# Projet terminé
- [x] Plan validé : démo web locale fidèle aux captures.
- [x] Infrastructure et design.
- [x] Rail, discussions, accueil, papier peint extrait d’une zone sans messages, contact et recherche.
- [x] Messages persistés, réponses, réactions, importants, épinglage, transfert, sélection et suppression.
- [x] Fichiers locaux (8 Mo max), images, visionneuse, audio avec permission micro, contact, sondage, événement.
- [x] Groupes locaux, profil, préférences, archive, favoris, statuts.
- [x] Appels explicitement simulés et historique local.
- [x] Build et lint sans erreurs ; tests Chromium desktop/mobile sans erreurs JS.
- Tests : envoi et rechargement, contact, appels, sondage, mobile/paramètres, réponse, important, fichier, groupe, statut.
- Limites : pas de réseau WhatsApp ; aucun chiffrement réel ; IA/chaînes et certaines options sont des interfaces de démo. Les messages éphémères sont une préférence seulement. Fichiers des captures : aperçu uniquement.

# Amélioration demandée
- [x] Nouvelle surface d’appel plein écran et mode réduit.
- [x] Grille/focus, conversation, participants, contrôles et réactions animées.
- [x] Modernisation modérée des transitions de l’interface.
- [x] Tests desktop/mobile et lint/build réussis.
- [x] Livraison précédente effectuée.

Tests appels : plein écran applicatif, chat envoyé, micro/caméra simulés, réactions, focus/grille, partage simulé, réduire/restaurer, ajouter participant, mobile et raccrocher. Aucun erreur JavaScript. Caméra locale optionnelle avec consentement navigateur ; pas de transmission.

# Correction grille adaptative
- [x] Calcul dimensionnel ResizeObserver et tuiles adaptatives.
- [x] Focus/partage plein espace, pagination lisible et retrait des invités.
- [x] 42 cas grille/focus/partage : 4/5/8/12/16/20/32 personnes desktop et mobile. Tests 2 personnes précédents.

Vérification finale : régressions messagerie et appel passées, ajout/retrait, caméra/micro simulés, réactions, focus/grille, partage simulé, pagination, réduire/restaurer, chat, fermeture. 8 personnes connectées : portrait et paysage passés. Aucun erreur JS observé. Le nombre de tuiles par page tient aussi compte de la hauteur disponible. Limites existantes inchangées : appels réseau/IA non connectés ; certaines préférences démonstratives.
