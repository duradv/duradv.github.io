class CLGallery {
    constructor() {
        this.config = null;
        this.modal = null;
        this.init();
    }

    /**
     * Initialize the application
     */
    async init() {
        try {
            await this.loadConfig();
            this.setupModal();
            this.setupEventListeners();
            this.renderBenchmarks();
        } catch (error) {
            console.error('Failed to initialize CL Gallery:', error);
            this.showError('Failed to load application data');
        }
    }

    /**
     * Load configuration from embedded data
     */
    async loadConfig() {
        this.config = window.embeddedConfig;
        this.updateHeader();
    }

    /**
     * Update header information from config
     */
    updateHeader() {
        const paperLink = document.getElementById('paper-link');
        const codeLink = document.getElementById('code-link');
        const titleElement = document.getElementsByClassName('title')[0];
        const authorsElement = document.getElementsByClassName('subtitle')[0];

        if (titleElement && this.config.project.title) {
            titleElement.textContent = this.config.project.title;
        }

        if (authorsElement && this.config.project.authors) {
            authorsElement.textContent = this.config.project.authors.join(', ');
        }
        
        if (paperLink && this.config.project.paper_url) {
            paperLink.href = this.config.project.paper_url;
        }
        
        if (codeLink && this.config.project.code_url) {
            codeLink.href = this.config.project.code_url;
        }
    }

    /**
     * Setup modal functionality
     */
    setupModal() {
        this.modal = document.getElementById('image-modal');
        const closeBtn = this.modal.querySelector('.close');
        
        closeBtn.onclick = () => this.closeModal();
        
        window.onclick = (event) => {
            if (event.target === this.modal) {
                this.closeModal();
            }
        };
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.modal.style.display === 'block') {
                this.closeModal();
            }
        });
    }

    /**
     * Render all benchmarks
     */
    renderBenchmarks() {
        const container = document.getElementById('benchmarks-container');
        if (!container || !this.config) return;

        container.innerHTML = '';

        this.config.benchmarks.forEach(benchmark => {
            const benchmarkElement = this.createBenchmarkElement(benchmark);
            container.appendChild(benchmarkElement);
        });
    }

    /**
     * Create a benchmark section element
     */
    createBenchmarkElement(benchmark) {
        const section = document.createElement('section');
        section.className = 'benchmark-section';
        section.innerHTML = `
            <div class="benchmark-header">
                <h2 class="benchmark-title">Benchmark</h2>
                <h3 class="benchmark-subtitle">${benchmark.name}</h3>
                <h4 class="benchmark-dataset">${benchmark.dataset}</h4>
            </div>
            <div class="results-grid">
                ${benchmark.cil_methods.map(method => this.createMethodRow(method, benchmark)).join('')}
            </div>
        `;
        return section;
    }

    /**
     * Create a method row element
     */
    createMethodRow(method, benchmark) {
        let stat_items = "";
        for (const stat of method.stat) {
            stat_items += `
                <div class="stat-item">
                    <span class="stat-value">${stat.value}</span>
                    <span class="stat-label">${stat.name}</span>
                </div>
            `;
        }
        
        return `
            <div class="method-row">
                <div class="method-header">
                    <h4 class="method-name">${method.name}</h4>
                    <img class="method-legend" src="data/legend.png" alt="">
                    <div class="method-stats">
                        ${stat_items}
                    </div>
                </div>
                <div class="image-grid">
                    ${this.createImageGrid(method, benchmark)}
                </div>
            </div>
        `;
    }

    /**
     * Create image grid for a method
     */
    createImageGrid(method, benchmark) {
        const images = [];
        
        for (let i = 0; i < this.config.target_classes; i++) {
            const className = this.config.class_names[i] || `Class ${i}`;
            
            // Try multiple image formats in order of preference
            const imageFormats = ['png', 'jpg', 'jpeg', 'svg'];
            const imagePaths = imageFormats.map(format => `data/${method.results_path}/class_${i}.${format}`);
            
            images.push(`
                <div class="image-item" onclick="gallery.openModal('${imagePaths[0]}', '${method.name} - ${className}', '${benchmark.name} on ${benchmark.dataset}')">
                    ${this.createImageWithFallback(imagePaths, className)}
                    <div class="image-caption">${className}</div>
                </div>
            `);
        }
        
        return images.join('');
    }

    /**
     * Create image element with fallback to multiple formats
     */
    createImageWithFallback(imagePaths, altText) {
        let imageElements = '';
        
        imagePaths.forEach((path, index) => {
            const display = index === 0 ? 'block' : 'none';
            imageElements += `<img class="result-image" src="${path}" alt="${altText}" 
                style="display: ${display};" 
                onload="this.style.display='block'; this.nextElementSibling && (this.nextElementSibling.style.display='none');"
                onerror="this.style.display='none'; this.nextElementSibling && this.nextElementSibling.style.display='${index === imagePaths.length - 1 ? 'flex' : 'block'}';"/>`;
        });
        
        // Add placeholder as final fallback
        imageElements += `<div class="image-placeholder" style="display: none;">
            <span>No Image</span>
        </div>`;
        
        return imageElements;
    }

    /**
     * Open modal with image
     */
    openModal(imageSrc, title, description) {
        const modal = document.getElementById('image-modal');
        const modalImage = document.getElementById('modal-image');
        const modalTitle = document.getElementById('modal-title');
        const modalDescription = document.getElementById('modal-description');
        
        // Try to load the actual image, fallback to placeholder
        const img = new Image();
        img.onload = () => {
            modalImage.src = imageSrc;
        };
        img.onerror = () => {
            modalImage.src = this.createPlaceholderImage();
        };
        img.src = imageSrc;
        
        modalTitle.textContent = title;
        modalDescription.textContent = description;
        modal.style.display = 'block';
        
        // Add animation class
        modal.classList.add('modal-open');
    }

    /**
     * Close modal
     */
    closeModal() {
        const modal = document.getElementById('image-modal');
        modal.style.display = 'none';
        modal.classList.remove('modal-open');
    }

    /**
     * Create placeholder image data URL
     */
    createPlaceholderImage() {
        const canvas = document.createElement('canvas');
        canvas.width = 400;
        canvas.height = 300;
        const ctx = canvas.getContext('2d');
        
        ctx.fillStyle = '#f3f4f6';
        ctx.fillRect(0, 0, 400, 300);
        
        ctx.strokeStyle = '#6b7280';
        ctx.lineWidth = 2;
        
        ctx.beginPath();
        ctx.moveTo(50, 250);
        ctx.lineTo(350, 250);
        ctx.moveTo(50, 50);
        ctx.lineTo(50, 250);
        ctx.stroke();
        
        ctx.fillStyle = '#4a90e2';
        ctx.fillRect(80, 150, 30, 100);
        ctx.fillRect(140, 120, 30, 130);
        ctx.fillRect(200, 100, 30, 150);
        ctx.fillRect(260, 130, 30, 120);
        ctx.fillRect(320, 110, 30, 140);
        
        ctx.fillStyle = '#374151';
        ctx.font = 'bold 16px Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Attack Success Rate Comparison', 200, 30);
        
        ctx.font = '12px Arial, sans-serif';
        ctx.fillText('Method A', 95, 270);
        ctx.fillText('Method B', 155, 270);
        ctx.fillText('Method C', 215, 270);
        ctx.fillText('Method D', 275, 270);
        ctx.fillText('Method E', 335, 270);
        
        return canvas.toDataURL();
    }

    /**
     * Show error message
     */
    showError(message) {
        const container = document.getElementById('benchmarks-container');
        if (container) {
            container.innerHTML = `
                <div class="benchmark-section">
                    <div style="text-align: center; padding: 2rem; background: var(--bg-primary); border-radius: var(--border-radius-xl); border: 1px solid var(--border-color);">
                        <h3 style="color: var(--error-color); margin-bottom: 1rem;">Error</h3>
                        <p style="color: var(--text-secondary);">${message}</p>
                    </div>
                </div>
            `;
        }
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.gallery = new CLGallery();
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CLGallery;
}
