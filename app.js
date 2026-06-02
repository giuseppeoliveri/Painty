/* ==========================================
   PAINTY JS APP CONTROLLER
   Fetches dynamic open access artworks, manages grids, 
   filters search queries, and controls the device preview mockups.
   ========================================== */

document.addEventListener('DOMContentLoaded', () => {
  // Initialize State
  let activeArtworks = [...curatedArtworks];
  let filteredArtworks = [];
  let apiArtworks = [];
  let currentArtwork = null;
  let deviceMode = 'desktop';
  let showOverlay = true;
  let searchQuery = '';
  let selectedMuseum = 'all';
  let selectedCategory = 'all';
  let isFetching = false;

  // DOM Elements
  const searchInput = document.getElementById('search-input');
  const clearSearchBtn = document.getElementById('clear-search-btn');
  const museumFiltersContainer = document.getElementById('museum-filters');
  const categoryFiltersContainer = document.getElementById('category-filters');
  const artworkGrid = document.getElementById('artwork-grid');
  const galleryCountText = document.getElementById('gallery-count-text');
  const loadingSpinner = document.getElementById('loading-spinner');
  const noResultsContainer = document.getElementById('no-results');
  const resetFiltersBtn = document.getElementById('reset-filters-btn');
  const liveSearchIndicator = document.getElementById('live-search-indicator');
  const loadMoreArea = document.getElementById('load-more-area');
  const loadMoreBtn = document.getElementById('load-more-btn');

  // Modal DOM Elements
  const previewModal = document.getElementById('preview-modal');
  const modalArtworkImg = document.getElementById('modal-artwork-img');
  const modalImageLoader = document.getElementById('modal-image-loader');
  const modalMuseumBadge = document.getElementById('modal-museum-badge');
  const modalTitle = document.getElementById('modal-title');
  const modalArtist = document.getElementById('modal-artist');
  const modalMeta = document.getElementById('modal-meta');
  const modalOriginalLink = document.getElementById('modal-original-link');
  const downloadBtn = document.getElementById('download-btn');
  
  // Preview Tabs / Screen DOM Elements
  const tabDesktop = document.getElementById('tab-desktop');
  const tabMobile = document.getElementById('tab-mobile');
  const screenFrame = document.getElementById('screen-frame');
  const previewWallpaper = document.getElementById('preview-wallpaper');
  const macosOverlay = document.getElementById('macos-overlay');
  const iosOverlay = document.getElementById('ios-overlay');
  const toggleOverlayBtn = document.getElementById('toggle-overlay-btn');
  const macosTimeEl = document.getElementById('macos-time');
  const iosTimeEl = document.getElementById('ios-time-status');
  const iosLockClockEl = document.getElementById('ios-lock-clock');
  const iosLockDateEl = document.getElementById('ios-lock-date');

  // Initialize Lucide Icons
  lucide.createIcons();

  // Initial setup
  updateLiveClocks();
  setInterval(updateLiveClocks, 30000); // Update clock every 30 seconds
  applyFiltersAndRender();

  // ==========================================
  // CLOCK LOGIC
  // ==========================================
  function updateLiveClocks() {
    const now = new Date();
    
    // Format Time: 15:15 or 09:41
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const timeStr = `${hours}:${minutes}`;

    macosTimeEl.textContent = timeStr;
    iosTimeEl.textContent = timeStr;
    iosLockClockEl.textContent = timeStr;

    // Format Date: e.g. "Tuesday, June 2"
    const options = { weekday: 'long', month: 'long', day: 'numeric' };
    const dateStr = now.toLocaleDateString('en-US', options);
    iosLockDateEl.textContent = dateStr;
  }

  // ==========================================
  // ARTWORK GRID RENDERING & FILTERING
  // ==========================================

  function applyFiltersAndRender() {
    // Show spinner while sorting
    loadingSpinner.style.display = 'none';
    
    // Combine curated and live-fetched artworks, removing duplicates by ID
    const allAvailable = [];
    const ids = new Set();
    
    [...curatedArtworks, ...apiArtworks].forEach(art => {
      if (!ids.has(art.id)) {
        ids.add(art.id);
        allAvailable.push(art);
      }
    });

    // Apply Filter Rules
    filteredArtworks = allAvailable.filter(art => {
      // 1. Search Query
      const q = searchQuery.toLowerCase().trim();
      const matchQuery = q === '' || 
        art.title.toLowerCase().includes(q) || 
        art.artist.toLowerCase().includes(q) || 
        art.movement.toLowerCase().includes(q) || 
        art.museum.toLowerCase().includes(q);
      
      // 2. Museum Filter
      const matchMuseum = selectedMuseum === 'all' || art.museumCode === selectedMuseum;
      
      // 3. Category/Movement Filter
      const matchCategory = selectedCategory === 'all' || 
        art.movement.toLowerCase() === selectedCategory.toLowerCase();

      return matchQuery && matchMuseum && matchCategory;
    });

    // Hide/Show Results Elements
    if (filteredArtworks.length === 0) {
      artworkGrid.style.display = 'none';
      noResultsContainer.style.display = 'block';
      galleryCountText.textContent = 'No artworks found';
      loadMoreArea.style.display = searchQuery ? 'block' : 'none'; // Allow search API fallback
    } else {
      noResultsContainer.style.display = 'none';
      artworkGrid.style.display = 'grid';
      galleryCountText.textContent = `Showing ${filteredArtworks.length} wallpaper${filteredArtworks.length > 1 ? 's' : ''}`;
      loadMoreArea.style.display = (searchQuery || selectedMuseum !== 'all') ? 'block' : 'none';
      renderGridItems(filteredArtworks);
    }
  }

  function renderGridItems(items) {
    artworkGrid.innerHTML = '';
    
    items.forEach(art => {
      const card = document.createElement('div');
      card.className = 'col artwork-card';
      card.innerHTML = `
        <div class="card-image-wrapper">
          <div class="shimmer" id="shimmer-${art.id}"></div>
          <img src="${art.previewUrl}" alt="${art.title} by ${art.artist}, collection of ${art.museum}" loading="lazy" id="img-${art.id}">
          <div class="card-overlay">
            <span class="museum-badge badge-${art.museumCode}">${getMuseumInitials(art.museumCode)}</span>
            <div class="overlay-action-group">
              <button class="overlay-btn preview-btn" title="Preview Wallpaper" aria-label="Preview ${art.title} on a device screen">
                <i data-lucide="eye"></i>
              </button>
              <button class="overlay-btn dl-btn" title="Download HD" aria-label="Download high-resolution wallpaper of ${art.title}">
                <i data-lucide="download"></i>
              </button>
            </div>
          </div>
        </div>
        <div class="card-details">
          <h4>${art.title}</h4>
          <div class="card-artist-meta">
            <span class="card-artist">${art.artist}</span>
            <span class="card-year">${art.year}</span>
          </div>
        </div>
      `;

      // Set up lazy-load transition
      const img = card.querySelector(`#img-${art.id}`);
      const shimmer = card.querySelector(`#shimmer-${art.id}`);
      
      img.onload = () => {
        shimmer.style.display = 'none';
      };
      
      // Fallback if image fails to load or takes too long
      img.onerror = () => {
        shimmer.style.display = 'none';
        img.src = 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?q=80&w=800&auto=format&fit=crop'; // Artistic placeholder
      };

      // Card click event triggers modal details
      card.addEventListener('click', (e) => {
        // Prevent click trigger if they clicked the download button directly
        if (e.target.closest('.dl-btn')) {
          e.stopPropagation();
          triggerImageDownload(art);
          return;
        }
        openPreviewModal(art);
      });

      artworkGrid.appendChild(card);
    });

    // Re-render icons on inserted nodes
    lucide.createIcons();
  }

  function getMuseumInitials(code) {
    switch (code) {
      case 'met': return 'MET';
      case 'chicago': return 'AIC';
      case 'rijksmuseum': return 'RIJKS';
      case 'nga': return 'NGA';
      case 'getty': return 'GETTY';
      default: return 'ART';
    }
  }

  // ==========================================
  // DYNAMIC API FETCHING
  // ==========================================
  
  async function fetchLiveArtworks(query) {
    if (isFetching) return;
    isFetching = true;
    
    liveSearchIndicator.style.display = 'flex';
    loadingSpinner.style.display = 'flex';
    loadMoreBtn.disabled = true;
    loadMoreBtn.innerHTML = `<div class="spinner" style="width:16px;height:16px;border-width:2px;margin:0"></div> Fetching Art...`;

    try {
      const q = query || 'painting';
      
      // We parallel fetch from Chicago, Met, and Wikidata collections (NGA, Rijks, Getty)
      const [chicagoResults, metResults, wikidataResults] = await Promise.allSettled([
        fetchFromChicago(q),
        fetchFromMet(q),
        fetchFromWikidata(q)
      ]);

      let newArtworks = [];
      if (chicagoResults.status === 'fulfilled') newArtworks = [...newArtworks, ...chicagoResults.value];
      if (metResults.status === 'fulfilled') newArtworks = [...newArtworks, ...metResults.value];
      if (wikidataResults.status === 'fulfilled') newArtworks = [...newArtworks, ...wikidataResults.value];

      if (newArtworks.length > 0) {
        // Add new items to state list
        apiArtworks = [...apiArtworks, ...newArtworks];
      }
    } catch (err) {
      console.error("Error fetching live archives:", err);
    } finally {
      isFetching = false;
      liveSearchIndicator.style.display = 'none';
      loadingSpinner.style.display = 'none';
      loadMoreBtn.disabled = false;
      loadMoreBtn.innerHTML = `<i data-lucide="plus"></i> Load More From Live Archives`;
      lucide.createIcons();
      applyFiltersAndRender();
    }
  }

  // Art Institute of Chicago API Adapter
  async function fetchFromChicago(query) {
    const url = `https://api.artic.edu/api/v1/artworks/search?q=${encodeURIComponent(query)}&query[term][is_public_domain]=true&limit=12&fields=id,title,artist_title,date_display,image_id,style_title`;
    const response = await fetch(url);
    const data = await response.json();
    
    if (!data.data) return [];
    
    return data.data
      .filter(item => item.image_id) // Only works with images
      .map(item => ({
        id: `chicago-${item.id}`,
        title: item.title,
        artist: item.artist_title || 'Unknown Artist',
        year: item.date_display || 'Unknown',
        movement: item.style_title || 'Impressionism',
        museum: 'Art Institute of Chicago',
        museumCode: 'chicago',
        previewUrl: `https://www.artic.edu/iiif/2/${item.image_id}/full/843,/0/default.jpg`,
        downloadUrl: `https://www.artic.edu/iiif/2/${item.image_id}/full/3000,/0/default.jpg`,
        originalUrl: `https://www.artic.edu/collection/artworks/${item.id}`
      }));
  }

  // Metropolitan Museum of Art API Adapter
  async function fetchFromMet(query) {
    // 1. Get List of Object IDs matching query
    const searchUrl = `https://collectionapi.metmuseum.org/public/collection/v1/search?q=${encodeURIComponent(query)}&q=painting&hasImages=true`;
    const searchResponse = await fetch(searchUrl);
    const searchData = await searchResponse.json();
    
    if (!searchData.objectIDs || searchData.objectIDs.length === 0) return [];
    
    // Take the top 8 objects to avoid spamming network requests
    const objectIds = searchData.objectIDs.slice(0, 8);
    
    // 2. Fetch object details in parallel
    const detailPromises = objectIds.map(async (id) => {
      try {
        const detailUrl = `https://collectionapi.metmuseum.org/public/collection/v1/objects/${id}`;
        const res = await fetch(detailUrl);
        return await res.json();
      } catch (e) {
        return null;
      }
    });
    
    const objects = await Promise.all(detailPromises);
    
    return objects
      .filter(obj => obj && obj.primaryImage && obj.isPublicDomain)
      .map(obj => ({
        id: `met-${obj.objectID}`,
        title: obj.title,
        artist: obj.artistDisplayName || 'Unknown Artist',
        year: obj.objectDate || 'Unknown',
        movement: obj.classification || 'Landscape',
        museum: 'The Metropolitan Museum of Art',
        museumCode: 'met',
        previewUrl: obj.primaryImageSmall || obj.primaryImage,
        downloadUrl: obj.primaryImage,
        originalUrl: obj.objectURL
      }));
  }

  // Wikidata SPARQL Adapter (Fetches live items from Rijksmuseum, NGA, and Getty collections)
  async function fetchFromWikidata(query) {
    const q = query.toLowerCase().trim();
    
    // Determine which museum collections to query based on active filter
    let collectionsFilter = '';
    if (selectedMuseum === 'rijksmuseum') {
      collectionsFilter = '(wd:Q190804 "rijksmuseum" "Rijksmuseum")';
    } else if (selectedMuseum === 'nga') {
      collectionsFilter = '(wd:Q214867 "nga" "National Gallery of Art, Washington D.C.")';
    } else if (selectedMuseum === 'getty') {
      collectionsFilter = '(wd:Q512684 "getty" "J. Paul Getty Museum")';
    } else {
      // Default: Search across all three Wikidata archives to supplement local grid
      collectionsFilter = `
        (wd:Q214867 "nga" "National Gallery of Art, Washington D.C.")
        (wd:Q190804 "rijksmuseum" "Rijksmuseum")
        (wd:Q512684 "getty" "J. Paul Getty Museum")
      `;
    }

    const filterClause = q && q !== 'painting' && q !== 'masterpiece' 
      ? `FILTER(CONTAINS(LCASE(?itemLabel), "${q}") || CONTAINS(LCASE(?creatorLabel), "${q}"))`
      : '';

    const sparqlQuery = `
      SELECT DISTINCT ?item ?itemLabel ?image ?creatorLabel ?date ?museumCode ?museumLabel ?officialUrl WHERE {
        ?item wdt:P31 wd:Q3305213 . # painting
        ?item wdt:P195 ?museum .
        VALUES (?museum ?museumCode ?museumLabel) {
          ${collectionsFilter}
        }
        ?item wdt:P18 ?image .
        ?item wdt:P170 ?creator .
        OPTIONAL { ?item wdt:P571 ?inception . BIND(YEAR(?inception) AS ?date) }
        OPTIONAL { ?item wdt:P973 ?officialUrl }
        ?item rdfs:label ?itemLabel . FILTER(LANG(?itemLabel) = "en")
        ?creator rdfs:label ?creatorLabel . FILTER(LANG(?creatorLabel) = "en")
        ${filterClause}
      } LIMIT 12
    `;

    const url = `https://query.wikidata.org/sparql?query=${encodeURIComponent(sparqlQuery)}&format=json`;
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/sparql-results+json',
        'User-Agent': 'PaintyWallpaperApp/1.0 (https://github.com/giuseppe/Painty)'
      }
    });
    
    if (!response.ok) return [];
    const data = await response.json();
    
    if (!data.results || !data.results.bindings) return [];
    
    return data.results.bindings.map(binding => {
      const rawImage = binding.image.value;
      const downloadUrl = rawImage;
      const previewUrl = getWikimediaThumbnail(rawImage, 1024);
      
      const museumCode = binding.museumCode.value;
      const id = `${museumCode}-${binding.item.value.split('/').pop()}`;
      
      let fallbackUrl = 'https://www.nga.gov';
      if (museumCode === 'rijksmuseum') fallbackUrl = 'https://www.rijksmuseum.nl';
      if (museumCode === 'getty') fallbackUrl = 'https://www.getty.edu';
      
      return {
        id: id,
        title: binding.itemLabel.value,
        artist: binding.creatorLabel.value || 'Unknown Artist',
        year: binding.date ? binding.date.value : 'Unknown',
        movement: 'Classical',
        museum: binding.museumLabel.value,
        museumCode: museumCode,
        previewUrl: previewUrl,
        downloadUrl: downloadUrl,
        originalUrl: binding.officialUrl ? binding.officialUrl.value : fallbackUrl
      };
    });
  }

  // Helper: Get Resized Wikimedia Commons Thumbnail Link to optimize load speeds (LCP)
  function getWikimediaThumbnail(imageUrl, width = 1024) {
    if (!imageUrl.includes('upload.wikimedia.org')) return imageUrl;
    if (imageUrl.includes('/thumb/')) return imageUrl;
    
    try {
      const parts = imageUrl.split('/');
      const filename = parts[parts.length - 1];
      const hash1 = parts[parts.length - 3];
      const hash2 = parts[parts.length - 2];
      return `https://upload.wikimedia.org/wikipedia/commons/thumb/${hash1}/${hash2}/${filename}/${width}px-${filename}`;
    } catch (e) {
      return imageUrl;
    }
  }

  // ==========================================
  // INTERACTIONS AND EVENT LISTENERS
  // ==========================================

  // Search input change with simple debounce
  let searchTimeout;
  searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value;
    clearSearchBtn.style.display = searchQuery ? 'block' : 'none';
    
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      applyFiltersAndRender();
      
      // If search returns nothing locally, trigger a background API fetch automatically!
      if (filteredArtworks.length === 0 && searchQuery.length > 2) {
        fetchLiveArtworks(searchQuery);
      }
    }, 400);
  });

  // Clear search button
  clearSearchBtn.addEventListener('click', () => {
    searchInput.value = '';
    searchQuery = '';
    clearSearchBtn.style.display = 'none';
    applyFiltersAndRender();
  });

  // Museum Source Toggle buttons
  museumFiltersContainer.addEventListener('click', (e) => {
    const btn = e.target.closest('.museum-btn');
    if (!btn) return;
    
    // Toggle active class states
    museumFiltersContainer.querySelectorAll('.museum-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    
    selectedMuseum = btn.dataset.museum;
    applyFiltersAndRender();

    // Trigger API fetch for active museum query if they aren't looking at local all catalog
    if (selectedMuseum !== 'all' && selectedMuseum !== 'other') {
      fetchLiveArtworks(searchQuery || 'masterpiece');
    }
  });

  // Category Pills filters
  categoryFiltersContainer.addEventListener('click', (e) => {
    const pill = e.target.closest('.category-pill');
    if (!pill) return;
    
    // Toggle active class states
    categoryFiltersContainer.querySelectorAll('.category-pill').forEach(p => p.classList.remove('active'));
    pill.classList.add('active');
    
    selectedCategory = pill.dataset.category;
    applyFiltersAndRender();
    
    // Auto query live archive for style category
    if (selectedCategory !== 'all') {
      fetchLiveArtworks(selectedCategory);
    }
  });

  // Reset Filters Button
  resetFiltersBtn.addEventListener('click', () => {
    searchInput.value = '';
    searchQuery = '';
    clearSearchBtn.style.display = 'none';
    
    museumFiltersContainer.querySelectorAll('.museum-btn').forEach(b => b.classList.remove('active'));
    museumFiltersContainer.querySelector('[data-museum="all"]').classList.add('active');
    selectedMuseum = 'all';
    
    categoryFiltersContainer.querySelectorAll('.category-pill').forEach(p => p.classList.remove('active'));
    categoryFiltersContainer.querySelector('[data-category="all"]').classList.add('active');
    selectedCategory = 'all';
    
    applyFiltersAndRender();
  });

  // Manual Load More Trigger
  loadMoreBtn.addEventListener('click', () => {
    fetchLiveArtworks(searchQuery || 'painting');
  });

  // ==========================================
  // MODAL DETAILS & DEVICE PREVIEW SYSTEM
  // ==========================================

  const bootstrapModal = new bootstrap.Modal(previewModal);

  function openPreviewModal(art) {
    currentArtwork = art;
    
    // Populate text details
    modalMuseumBadge.textContent = art.museum;
    // Set museum badge theme
    modalMuseumBadge.className = `badge badge-${art.museumCode} text-uppercase mb-3 small`;
    
    modalTitle.textContent = art.title;
    modalArtist.textContent = art.artist;
    modalMeta.innerHTML = `${art.year} &bull; ${art.movement}`;
    modalOriginalLink.href = art.originalUrl;
    modalArtworkImg.alt = `${art.title} by ${art.artist}, collection of ${art.museum}`;

    // Load preview image to modal
    modalArtworkImg.style.opacity = '0';
    modalImageLoader.style.display = 'flex';
    modalArtworkImg.src = art.previewUrl;
    
    modalArtworkImg.onload = () => {
      modalArtworkImg.style.opacity = '1';
      modalImageLoader.style.display = 'none';
    };

    modalArtworkImg.onerror = () => {
      modalArtworkImg.src = 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?q=80&w=800&auto=format&fit=crop';
      modalArtworkImg.style.opacity = '1';
      modalImageLoader.style.display = 'none';
    };

    // Load preview image onto screen mockup
    previewWallpaper.style.backgroundImage = `url('${art.previewUrl}')`;

    // Apply active device layout
    updateDeviceLayout();

    // Show modal using Bootstrap API
    bootstrapModal.show();
  }

  // Clear active artwork when modal is hidden
  previewModal.addEventListener('hidden.bs.modal', () => {
    currentArtwork = null;
  });

  // Device tab toggling
  tabDesktop.addEventListener('click', () => {
    tabDesktop.classList.add('active');
    tabMobile.classList.remove('active');
    deviceMode = 'desktop';
    updateDeviceLayout();
  });

  tabMobile.addEventListener('click', () => {
    tabMobile.classList.add('active');
    tabDesktop.classList.remove('active');
    deviceMode = 'mobile';
    updateDeviceLayout();
  });

  function updateDeviceLayout() {
    if (deviceMode === 'desktop') {
      screenFrame.className = 'screen-frame desktop-mode';
      macosOverlay.style.display = 'flex';
      iosOverlay.style.display = 'none';
    } else {
      screenFrame.className = 'screen-frame mobile-mode';
      macosOverlay.style.display = 'none';
      iosOverlay.style.display = 'flex';
    }

    if (!showOverlay) {
      screenFrame.classList.add('hide-overlay');
    } else {
      screenFrame.classList.remove('hide-overlay');
    }
  }

  // Toggle Overlay button
  toggleOverlayBtn.addEventListener('click', () => {
    showOverlay = !showOverlay;
    if (showOverlay) {
      screenFrame.classList.remove('hide-overlay');
      toggleOverlayBtn.innerHTML = `<i data-lucide="eye-off"></i> Hide Mock Desktop Icons`;
    } else {
      screenFrame.classList.add('hide-overlay');
      toggleOverlayBtn.innerHTML = `<i data-lucide="eye"></i> Show Mock Desktop Icons`;
    }
    lucide.createIcons();
  });

  // ==========================================
  // CROSS-ORIGIN HD DOWNLOAD TRIGGER
  // ==========================================

  downloadBtn.addEventListener('click', () => {
    if (currentArtwork) {
      triggerImageDownload(currentArtwork);
    }
  });

  async function triggerImageDownload(art) {
    const originalBtnHTML = downloadBtn.innerHTML;
    
    // Update button text to loading spinner
    const isModalTrigger = (currentArtwork && currentArtwork.id === art.id);
    let targetButton = isModalTrigger ? downloadBtn : null;
    
    if (targetButton) {
      targetButton.disabled = true;
      targetButton.innerHTML = `<div class="spinner" style="width:16px;height:16px;border-width:2px;margin:0"></div> Downloading High-Resolution...`;
    }

    try {
      const response = await fetch(art.downloadUrl);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = blobUrl;
      
      // Clean filename
      const cleanTitle = art.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      const cleanArtist = art.artist.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      link.download = `painty_${cleanArtist}_${cleanTitle}.jpg`;
      
      document.body.appendChild(link);
      link.click();
      
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.warn("Direct blob download failed (CORS restriction). Redirecting to direct image URL...", error);
      // Fallback: Open in new tab so user can right-click and save
      window.open(art.downloadUrl, '_blank');
    } finally {
      if (targetButton) {
        targetButton.disabled = false;
        targetButton.innerHTML = originalBtnHTML;
      }
    }
  }
});
