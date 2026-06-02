# Painty 🎨 — Masterpiece Wallpaper Archive

Painty is a premium, client-side web application designed to browse, search, preview, and download high-resolution wallpapers of iconic, public-domain paintings from the world's greatest open-access museum archives.

Browse masterpieces from the **National Gallery of Art (NGA)**, **Rijksmuseum**, **J. Paul Getty Museum**, **The Metropolitan Museum of Art**, and the **Art Institute of Chicago** in a sleek, glassmorphic layout.

---

## Key Features

- **Double-Tiered Image Delivery**: Loads lightweight thumbnails (800px) for super-fast browsing, but downloads ultra-high-resolution files (3000px+) directly from official museum IIIF repositories.
- **Multi-Source Sourcing**: 
  - *Curated Database*: Hand-picked selection of ~30 of the most famous paintings in history with verified high-res download links.
  - *Live Search integration*: Direct integrations with the **Met Museum API** and **Art Institute of Chicago API** to dynamically search and fetch thousands of additional public domain works on demand.
- **Interactive Device Preview Mockup**: Clicking on a painting opens a details modal with a device preview engine. See exactly how the painting crops and fits on:
  - 🖥️ **Mac Desktop (16:10)** (includes mock Menu Bar, Dock, and macOS Finder window).
  - 📱 **iPhone (9:19.5)** (includes mock lock screen Date/Clock and home indicator).
  - Toggle overlays on/off to see a clean wallpaper preview.
- **Smart Downloader**: Bypasses the browser's default behavior of opening images in a new tab by fetching images as Blobs and prompting a direct local download with clean filenames (`painty_artist_title.jpg`).

---

## How to Run Locally

Since this is a static website with zero dependencies, you do not need to install `npm` or compile any code. You can run it instantly using any local web server.

### Using Python (Recommended)
1. Open your Terminal.
2. Navigate to the project folder:
   ```bash
   cd /Users/giuseppe/Desktop/Painty
   ```
3. Start a local server:
   ```bash
   python3 -m http.server 8000
   ```
4. Open your browser and go to [http://localhost:8000](http://localhost:8000).

---

## How to Upload to GitHub

We have initialized a Git repository in this folder and committed the files. To upload this project to your GitHub account:

1. Create a new repository named `Painty` on your GitHub account ([github.com/new](https://github.com/new)). Keep it public, and **do not** initialize it with a README, gitignore, or license (since we already have them).
2. Copy your new repository's URL (e.g., `https://github.com/YOUR-USERNAME/Painty.git`).
3. Run the following commands in your local Terminal inside the project folder:
   ```bash
   # Add your GitHub repository as the remote origin
   git remote add origin https://github.com/YOUR-USERNAME/Painty.git
   
   # Rename the branch to main (if not already main)
   git branch -M main
   
   # Push the code to GitHub
   git push -u origin main
   ```

---

## How to Deploy Free on GitHub Pages

Once your code is pushed to GitHub, you can publish the website for free so anyone can use it:

1. Go to your repository page on GitHub.
2. Click on the **Settings** tab at the top.
3. In the left sidebar under the **Code and automation** section, click on **Pages**.
4. Under **Build and deployment**:
   - Source: **Deploy from a branch**
   - Branch: Select **main** (or `master`) and leave the folder as `/ (root)`.
5. Click **Save**.
6. Wait 1–2 minutes. GitHub will generate a link at the top of the Pages settings screen:
   `Your site is live at https://<YOUR-USERNAME>.github.io/Painty/`

---

## Image Archives Reference
- **The Metropolitan Museum of Art**: [Met Open Access API](https://metmuseum.github.io/)
- **Art Institute of Chicago**: [AIC API Documentation](https://api.artic.edu/docs/)
- **Rijksmuseum**: [Rijksstudio Data Portal](https://data.rijksmuseum.nl/)
- **National Gallery of Art**: [NGA Open Data Initiatives](https://www.nga.gov/open-access-images.html)
- **J. Paul Getty Museum**: [Getty Open Content Program](https://www.getty.edu/projects/open-content-program/)
