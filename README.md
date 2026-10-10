# Filigrane Privé 🛡️ (100% Local & Hors-Ligne)

> **Réplique locale et sécurisée de [filigrane.beta.gouv.fr](https://filigrane.beta.gouv.fr/)**.
> Ajoutez un filigrane officiel à vos documents sensibles (**passeport, carte d'identité, fiches de paie, avis d'impôt**) **sans jamais les téléverser sur internet**.

---

## 🔒 Pourquoi cette réplique locale ?

Le service public officiel *FiligraneFacile* fonctionne très bien, mais requiert l'envoi de vos pièces d'identité sur des serveurs distants. Si vous préférez **ne jamais faire transiter votre passeport sur le réseau**, cet outil résout exactement ce problème :

* **100% Hors-ligne / In-Memory** : L'ensemble du traitement (lecture, application du filigrane, rastérisation, création du PDF) s'effectue dans votre navigateur local. Aucun octet ne quitte votre ordinateur.
* **Infalsifiable (Aplatissement Raster)** : Dans les outils de filigrane basiques, le texte est un calque vectoriel superposé que n'importe quel fraudeur peut effacer en 2 clics avec Adobe Acrobat ou Illustrator. Cet outil **rastérise les pages en haute résolution** : le filigrane est fusionné avec les pixels du document, rendant sa suppression impossible.
* **Formats pris en charge** : PDF (multi-pages), JPEG, PNG, WebP.

---

## 🚀 Démarrage rapide

### Option 1 : Interface Web (Recommandé)

1. Double-cliquez sur **`start.bat`** (sous Windows)  
   *ou lancez dans votre terminal :*
   ```bash
   python start_app.py
   # ou
   npm start
   ```
2. Votre navigateur s'ouvre automatiquement sur : `http://localhost:8080`
3. Glissez-déposez votre passeport ou votre document.
4. Ajustez le texte ou utilisez les suggestions (Location, Emploi, Banque, etc.).
5. Cliquez sur **"Télécharger le PDF filigrané"**.

> **💡 Vérification de sécurité** : Vous pouvez couper votre Wi-Fi ou passer en mode avion avant de charger votre passeport : l'application continuera de fonctionner parfaitement, prouvant qu'aucune connexion réseau n'est requise.

---

### Option 2 : Ligne de commande (CLI Python)

Si vous préférez automatiser ou traiter un document depuis votre terminal :

```bash
# Filigrane standard avec date du jour
python watermark.py passeport.pdf -t "COPIE DESTINÉE À LA LOCATION APPARTEMENT" --date

# Options personnalisées
python watermark.py passeport.jpg -t "DOSSIER EMPLOI CONFIDENTIEL" --opacity 0.30 --angle -35 -o passeport_securise.pdf
```

#### Paramètres disponibles :
* `-t, --text` : Texte du filigrane (ex: `"Document destiné à l'agence X"`)
* `--date` : Ajoute automatiquement la date du jour à la fin du texte
* `-o, --output` : Chemin du fichier PDF de sortie
* `--opacity` : Opacité du filigrane (ex: `0.25`)
* `--angle` : Inclinaison en degrés (ex: `-32`)
* `--dpi` : Résolution de rastérisation (défaut : `200` DPI pour une netteté optimale)

---

## 📁 Architecture du projet

```text
watermark/
├── index.html         # Interface utilisateur moderne et responsive
├── styles.css         # Styles DSFR / Marianne & composants modernes
├── app.js             # Moteur de filigrane et export PDF client-side
├── watermark.py       # Utilitaire CLI autonome en Python (PyMuPDF + Pillow)
├── start_app.py       # Serveur local et lanceur automatique
├── start.bat          # Raccourci Windows double-clic
├── vendor/            # Librairies locales (zéro CDN, zéro tracking)
│   ├── pdf.min.js
│   ├── pdf.worker.min.js
│   └── jspdf.umd.min.js
└── package.json
```

---

## 📄 Licence
Libre d'utilisation personnelle et professionnelle pour la protection de l'identité numérique.
