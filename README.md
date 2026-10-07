# وِردي — suivi du ورد quotidien

Application web qui remplace la « بطاقة متابعة » papier. Aucun serveur, aucun compte : tout fonctionne avec des liens.

## Fonctionnement

| Qui | Où | Quoi |
|---|---|---|
| Enseignant | `enseignant.html` | Crée les groupes (une fois). Chaque mois, pour chaque groupe, choisit **sourate + verset de début** et **sourate + verset de fin**. L'application découpe la plage en parts équilibrées et **vérifie qu'aucun verset n'est oublié ni répété**. L'enseignant envoie ensuite le lien au groupe WhatsApp. |
| Élève | `index.html` (le lien reçu) | Ouvre le lien : le programme du mois est enregistré dans son téléphone. Chaque jour, il voit son ورد et le coche. Il ajoute les rappels à l'agenda du téléphone. En fin de mois, il envoie la fiche PDF à l'enseignant par WhatsApp. |

- **Le programme voyage dans le lien.** Le lien contient le groupe, la date de début, les versets de début et de fin et le nombre de parts. L'élève recalcule exactement le même découpage. Une somme de contrôle refuse un lien tronqué ou modifié.
- **Date du téléphone** : le ورد affiché suit l'horloge du téléphone et change à minuit.
- **Données** : celles de l'enseignant (groupes, plans) restent dans son navigateur. Il peut les sauvegarder dans un fichier et les restaurer. Celles de l'élève (coches, nom) restent dans son téléphone.
- **Hors ligne** : une fois ouverte, l'application fonctionne sans connexion. Elle s'installe sur l'écran d'accueil comme une application.

## Mettre en ligne sur GitHub Pages (gratuit, environ 10 minutes)

1. Créez un compte sur **github.com** (gratuit) si vous n'en avez pas.
2. En haut à droite : **+ → New repository**.
   - *Repository name* : `wirdi` (ou un autre nom).
   - Cochez **Public**.
   - Cliquez **Create repository**.
3. Sur la page du dépôt, cliquez **uploading an existing file**. Faites glisser **tout le contenu** du dossier décompressé (`index.html`, `enseignant.html`, les dossiers `css`, `js`, `icons` et `vendor`, `manifest.webmanifest`, `sw.js`). Glissez le contenu du dossier, pas le dossier lui-même. Cliquez ensuite **Commit changes**.
4. **Settings → Pages** :
   - *Source* : **Deploy from a branch**.
   - *Branch* : **main**, dossier **/ (root)**.
   - Cliquez **Save**.
5. Après une à deux minutes, l'adresse du site apparaît en haut de la page Settings → Pages :
   - Application élève : `https://VOTRE-NOM.github.io/wirdi/`
   - Page enseignant : `https://VOTRE-NOM.github.io/wirdi/enseignant.html`

Les élèves n'ont jamais besoin de l'adresse de la page enseignant : ils reçoivent seulement les liens du wird.

## Chaque mois (enseignant)

1. Ouvrez `enseignant.html` sur votre téléphone ou votre ordinateur, toujours avec le même navigateur.
2. Pour chaque groupe : **تخطيط ورد الشهر**.
   - Choisissez la date de début (par défaut, le 1er du mois suivant), la sourate et le verset de début, la sourate et le verset de fin.
   - Ajustez le nombre de parts si besoin.
   - Vérifiez la ligne verte « ✓ تمّ التحقق ». L'enregistrement est bloqué si un verset manque.
3. **حفظ وإنشاء الرابط**, puis **إرسال إلى واتساب** : choisissez le groupe WhatsApp du فوج.
4. Faites de temps en temps **حفظ في ملف** (sauvegarde) pour ne pas perdre vos groupes.

## Côté élève

- **Première fois** : ouvrir le lien, écrire son nom, puis installer l'application.
  - Android (Chrome) : menu ⋮ → *Installer l'application*.
  - iPhone (Safari) : bouton Partager → *Sur l'écran d'accueil*.
- **Rappels** : *Réglages → التذكير اليومي*.
  - Android : bouton **Google Agenda**, qui ajoute un rappel chaque jour jusqu'à la fin du mois.
  - iPhone : bouton **fichier agenda**, puis *Tout ajouter*. Chaque jour du mois devient un rendez-vous qui indique le ورد du jour.
  - À refaire chaque mois, après avoir ouvert le nouveau lien.
- **Fin du mois** : onglet *Mois* → **إرسال البطاقة إلى المعلّم**. Le menu de partage s'ouvre, l'élève choisit WhatsApp puis l'enseignant.
- **iPhone avec l'application installée** : l'application installée ne voit pas les liens ouverts dans Safari. L'élève copie le lien du mois et le colle dans *Réglages → إضافة ورد من رابط*.

## Mettre à jour le site

Remplacez les fichiers modifiés dans le dépôt GitHub (*Add file → Upload files*). Changez aussi la ligne `const VERSION = "wirdi-v1"` dans `sw.js` (par exemple `wirdi-v2`) : les téléphones chargeront ainsi la nouvelle version.

## Détails techniques

- `js/core.js` : métadonnées du Coran (mushaf de Médine, 604 pages, 6236 versets ; source Tanzil via `fawazahmed0/quran-api`, vérifiée), découpage équilibré au verset près (une fin de sourate est préférée quand elle tombe à moins de 2 pages de la coupure idéale), vérification de couverture, lien signé.
- `js/teacher.js` : page enseignant. `js/student.js` : application élève (fiche PDF dessinée sur canvas puis assemblée par `vendor/pdf-lib.min.js`, sous licence MIT ; rappels Google Agenda et `.ics`).
- `sw.js` + `manifest.webmanifest` : installation et fonctionnement hors ligne.
