class MonitoringDashboard {
    constructor() {
        this.ws = null;
        this.reconnectInterval = null;
        this.charts = {};
        this.metricsHistory = {
            cpu: [],
            memory: [],
            timestamps: []
        };
        this.maxHistoryPoints = 50;
        
        this.init();
    }

    init() {
        this.connectWebSocket();
        this.initializeCharts();
        this.bindEvents();
        
        // Mostra loader per i report test
        const reportsList = document.getElementById('testReportsList');
        if (reportsList) {
            reportsList.innerHTML = '<li class="list-group-item text-center text-muted">Caricamento...</li>';
        }
        
        // Carica i dati iniziali
        this.loadTestReports();
        this.loadMediaBackups();
        this.loadDatabaseBackups();
        
        // Fallback per aggiornamenti HTTP se WebSocket non funziona
        setInterval(() => {
            if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
                this.fetchMetricsHTTP();
            }
        }, 300000);
    }

    connectWebSocket() {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}`;
        
        try {
            this.ws = new WebSocket(wsUrl);
            
            this.ws.onopen = () => {
                console.log('🔌 WebSocket connesso');
                this.updateConnectionStatus(true);
                if (this.reconnectInterval) {
                    clearInterval(this.reconnectInterval);
                    this.reconnectInterval = null;
                }
            };

            this.ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    if (data.type === 'metrics') {
                        this.updateDashboard(data.data);
                    }
                } catch (error) {
                    console.error('❌ Errore parsing messaggio WebSocket:', error);
                }
            };

            this.ws.onclose = () => {
                console.log('🔌 WebSocket disconnesso');
                this.updateConnectionStatus(false);
                this.reconnectWebSocket();
            };

            this.ws.onerror = (error) => {
                console.error('❌ Errore WebSocket:', error);
                this.updateConnectionStatus(false);
            };

        } catch (error) {
            console.error('❌ Errore creazione WebSocket:', error);
            this.updateConnectionStatus(false);
            this.reconnectWebSocket();
        }
    }

    reconnectWebSocket() {
        if (this.reconnectInterval) return;
        
        this.reconnectInterval = setInterval(() => {
            console.log('🔄 Tentativo riconnessione WebSocket...');
            this.connectWebSocket();
        }, 5000);
    }

    async fetchMetricsHTTP() {
        try {
            const response = await fetch('/api/metrics');
            if (response.ok) {
                const data = await response.json();
                this.updateDashboard(data);
            }
        } catch (error) {
            console.error('❌ Errore fetch HTTP metrics:', error);
        }
    }

    updateConnectionStatus(connected) {
        const statusEl = document.getElementById('connectionStatus');
        if (connected) {
            statusEl.className = 'connection-status connection-online';
            statusEl.innerHTML = '<i class="fas fa-circle"></i> Connesso';
        } else {
            statusEl.className = 'connection-status connection-offline';
            statusEl.innerHTML = '<i class="fas fa-circle"></i> Disconnesso';
        }
    }

    updateDashboard(metrics) {
        const scrollY = window.scrollY;
        this.updateSummaryCards(metrics);
        this.updateContainersList(metrics.docker);
        this.updateSystemInfo(metrics.system);
        this.updateStorageInfo(metrics.storage);
        this.updateCharts(metrics);
        this.updateLastUpdateTime(metrics.lastUpdate);
        window.scrollTo({ top: scrollY });
    }

    updateSummaryCards(metrics) {
        // Container totali e attivi
        const dockerSummary = metrics.docker.summary || {};
        document.getElementById('totalContainers').textContent = dockerSummary.total || 0;
        document.getElementById('runningContainers').textContent = dockerSummary.running || 0;

        // CPU Usage
        const cpuUsage = metrics.system?.cpu?.usage?.currentLoad || 0;
        document.getElementById('cpuUsage').textContent = `${cpuUsage}%`;

        // Memory Usage
        const memUsage = metrics.system?.memory?.usage?.usagePercent || 0;
        document.getElementById('memoryUsage').textContent = `${memUsage}%`;
    }

    updateContainersList(dockerMetrics) {
        const containersList = document.getElementById('containersList');
        if (!dockerMetrics || !dockerMetrics.containers) {
            containersList.innerHTML = '<div class="alert alert-warning">Nessun dato container disponibile</div>';
            return;
        }

        // Stato di quale container è espanso (persistente tra refresh)
        if (!window.expandedContainerName) window.expandedContainerName = null;

        // Separa container di produzione da quelli di test
        const productionContainers = dockerMetrics.containers.filter(c => 
            !c.name.includes('test') && !c.name.includes('-testing') && 
            !c.image.includes('test')
        );
        
        const testingContainers = dockerMetrics.containers.filter(c => 
            c.name.includes('test') || c.name.includes('-testing') || 
            c.image.includes('test')
        );

        let html = '';

        // Container di Produzione
        if (productionContainers.length > 0) {
            html += `
                <div class="mb-4">
                    <h5 class="text-primary mb-3">
                        <i class="fas fa-server me-2"></i>Container di Produzione
                        <span class="badge bg-primary ms-2">${productionContainers.length}</span>
                    </h5>
                    <div class="container-section">
            `;
            
            productionContainers.forEach((container, idx) => {
                html += this.renderContainerHtml(container, idx, 'production');
            });
            
            html += `
                    </div>
                </div>
            `;
        }

        // Container di Testing
        if (testingContainers.length > 0) {
            html += `
                <div class="mb-4">
                    <h5 class="text-warning mb-3">
                        <i class="fas fa-flask me-2"></i>Container di Testing
                        <span class="badge bg-warning ms-2">${testingContainers.length}</span>
                    </h5>
                    <div class="container-section">
            `;
            
            testingContainers.forEach((container, idx) => {
                html += this.renderContainerHtml(container, idx + productionContainers.length, 'testing');
            });
            
            html += `
                    </div>
                </div>
            `;
        }

        if (productionContainers.length === 0 && testingContainers.length === 0) {
            html = '<div class="alert alert-info">Nessun container in esecuzione</div>';
        }
        containersList.innerHTML = html;

        // Gestione click per espansione log per tutti i container
        this.setupContainerClickHandlers(dockerMetrics);

        // Se c'è un container espanso, carica i log (anche dopo refresh)
        if (window.expandedContainerName) {
            const expandedItem = document.querySelector(`.container-expandable[data-container-name='${window.expandedContainerName}']`);
            if (expandedItem) {
                const logSection = expandedItem.querySelector('.log-section');
                if (logSection && !logSection.innerHTML) {
                    logSection.innerHTML = '<div class="log-container">Caricamento log...</div>';
                    fetch(`/api/container/${window.expandedContainerName}/logs?lines=100`)
                        .then(res => res.text())
                        .then(text => {
                            logSection.innerHTML = `<div class=\"log-container\"><pre>${text.replace(/</g, '&lt;')}</pre></div>`;
                            // Auto-scroll in basso per vedere gli ultimi log
                            const logDiv = logSection.querySelector('.log-container');
                            if (logDiv) {
                                requestAnimationFrame(() => { 
                                    logDiv.scrollTop = logDiv.scrollHeight; 
                                });
                            }
                        })
                        .catch(() => {
                            logSection.innerHTML = '<div class="log-container">Errore nel caricamento log</div>';
                        });
                }
            }
        }
    }

    renderContainerHtml(container, idx, type) {
        const statusClass = container.state === 'running' ? 'status-running' : 'status-stopped';
        const iconClass = container.state === 'running' ? 'fa-play-circle' : 'fa-stop-circle';
        const expanded = window.expandedContainerName === container.name;
        const typeClass = type === 'testing' ? 'border-warning' : 'border-primary';
        const typeIcon = type === 'testing' ? 'fas fa-vial text-warning' : 'fas fa-cube text-primary';
        
        return `
            <div class="container-item container-expandable ${typeClass}${expanded ? ' expanded' : ''}" data-container-name="${container.name}" id="container-item-${idx}">
                <div class="row align-items-center">
                    <div class="col-md-4">
                        <h6>
                            <i class="${typeIcon} me-1"></i>
                            <i class="fas ${iconClass} me-1"></i>
                            ${container.name}
                        </h6>
                        <small class="text-muted">${container.image}</small>
                    </div>
                    <div class="col-md-2">
                        <span class="status-badge ${statusClass}">
                            ${container.state.toUpperCase()}
                        </span>
                    </div>
                    <div class="col-md-6">
                        ${container.metrics ? this.renderContainerMetrics(container.metrics) : '<small class="text-muted">Container non attivo</small>'}
                    </div>
                </div>
                <div class="log-section" style="display:${expanded ? 'block' : 'none'};"></div>
            </div>
        `;
    }

    setupContainerClickHandlers(dockerMetrics) {
        document.querySelectorAll('.container-expandable').forEach(item => {
            item.addEventListener('click', async (e) => {
                if (e.target.closest('.log-section')) return;
                const containerName = item.getAttribute('data-container-name');
                // Se già espanso, chiudi
                if (window.expandedContainerName === containerName) {
                    window.expandedContainerName = null;
                    this.updateContainersList(dockerMetrics); // forza refresh per chiudere
                    return;
                }
                window.expandedContainerName = containerName;
                this.updateContainersList(dockerMetrics); // forza refresh per aprire
                // Dopo il refresh, carica i log
                const newItem = document.querySelector(`.container-expandable[data-container-name='${containerName}']`);
                const logSection = newItem.querySelector('.log-section');
                logSection.innerHTML = '<div class="log-container">Caricamento log...</div>';
                try {
                    const res = await fetch(`/api/container/${containerName}/logs?lines=100`);
                    const text = await res.text();
                    logSection.innerHTML = `<div class=\"log-container\"><pre>${text.replace(/</g, '&lt;')}</pre></div>`;
                    // Auto-scroll in basso per vedere gli ultimi log
                    const logDiv = logSection.querySelector('.log-container');
                    if (logDiv) {
                        requestAnimationFrame(() => { 
                            logDiv.scrollTop = logDiv.scrollHeight; 
                        });
                    }
                } catch (err) {
                    logSection.innerHTML = '<div class="log-container">Errore nel caricamento log</div>';
                }
            });
        });
    }

    renderContainerMetrics(metrics) {
        return `
            <div class="row">
                <div class="col-3">
                    <small><strong>CPU:</strong> ${metrics.cpu}%</small>
                </div>
                <div class="col-3">
                    <small><strong>RAM:</strong> ${metrics.memory.percentage}%</small>
                </div>
                <div class="col-3">
                    <small><strong>Net RX:</strong> ${metrics.network.rxMB} MB</small>
                </div>
                <div class="col-3">
                    <small><strong>Disk R:</strong> ${metrics.disk.readMB} MB</small>
                </div>
            </div>
        `;
    }

    updateSystemInfo(systemMetrics) {
        if (!systemMetrics) return;

        // CPU Info
        const cpuInfoEl = document.getElementById('cpuInfo');
        if (systemMetrics.cpu && systemMetrics.cpu.info) {
            const cpu = systemMetrics.cpu.info;
            cpuInfoEl.innerHTML = `
                <p><strong>Processore:</strong> ${cpu.brand || 'N/A'}</p>
                <p><strong>Core:</strong> ${cpu.cores || 'N/A'} (${cpu.physicalCores || 'N/A'} fisici)</p>
                <p><strong>Frequenza:</strong> ${cpu.speed || 'N/A'} GHz</p>
                <p><strong>Architettura:</strong> ${systemMetrics.system?.arch || 'N/A'}</p>
            `;
        }

        // Memory Info
        const memoryInfoEl = document.getElementById('memoryInfo');
        if (systemMetrics.memory && systemMetrics.memory.usage) {
            const mem = systemMetrics.memory.usage;
            memoryInfoEl.innerHTML = `
                <p><strong>Totale:</strong> ${mem.totalGB} GB</p>
                <p><strong>Utilizzata:</strong> ${mem.usedGB} GB (${mem.usagePercent}%)</p>
                <p><strong>Libera:</strong> ${mem.freeGB} GB</p>
                <div class="progress progress-custom mt-2">
                    <div class="progress-bar bg-primary" role="progressbar" style="width: ${mem.usagePercent}%"></div>
                </div>
            `;
        }

        // Processes Table
        if (systemMetrics.processes && systemMetrics.processes.top) {
            this.updateProcessesTable(systemMetrics.processes.top);
        }
    }

    updateProcessesTable(processes) {
        const tbody = document.querySelector('#processesTable tbody');
        let html = '';
        
        processes.slice(0, 10).forEach(proc => {
            html += `
                <tr>
                    <td>${proc.pid}</td>
                    <td>${proc.name}</td>
                    <td>${proc.cpu}%</td>
                    <td>${proc.memory}%</td>
                    <td>${proc.user || 'N/A'}</td>
                    <td><span class="badge bg-secondary">${proc.state || 'N/A'}</span></td>
                </tr>
            `;
        });

        tbody.innerHTML = html;
    }

    updateStorageInfo(storageMetrics) {
        if (!storageMetrics) return;

        // Media Storage
        const mediaStorageEl = document.getElementById('mediaStorage');
        if (storageMetrics.media) {
            const media = storageMetrics.media;
            mediaStorageEl.innerHTML = `
                <p><strong>Percorso:</strong> ${media.path}</p>
                <p><strong>Dimensione:</strong> ${media.sizeFormatted || '0 B'}</p>
                <p><strong>File:</strong> ${media.files || 0}</p>
                <p><strong>Directory:</strong> ${media.directories || 0}</p>
                <p><strong>Stato:</strong> 
                    <span class="badge ${media.exists ? 'bg-success' : 'bg-warning'}">
                        ${media.exists ? 'Esistente' : 'Non trovata'}
                    </span>
                </p>
            `;
        }

        // Project Storage
        const projectStorageEl = document.getElementById('projectStorage');
        if (storageMetrics.summary) {
            const summary = storageMetrics.summary;
            projectStorageEl.innerHTML = `
                <p><strong>Dimensione Totale:</strong> ${summary.totalSizeFormatted}</p>
                <p><strong>File Totali:</strong> ${summary.totalFiles}</p>
                <p><strong>Cartelle Monitorate:</strong> ${summary.paths}</p>
            `;

            // Dettagli cartelle progetto
            if (storageMetrics.project && storageMetrics.project.length > 0) {
                let projectDetails = '<hr><h6>Dettagli Cartelle:</h6>';
                storageMetrics.project.forEach(folder => {
                    projectDetails += `
                        <div class="row mb-2">
                            <div class="col-6"><small><strong>${folder.path.split('/').pop()}:</strong></small></div>
                            <div class="col-6"><small>${folder.sizeFormatted}</small></div>
                        </div>
                    `;
                });
                projectStorageEl.innerHTML += projectDetails;
            }
        }
    }

    initializeCharts() {
        // CPU Chart
        const cpuCtx = document.getElementById('cpuChart').getContext('2d');
        this.charts.cpu = new Chart(cpuCtx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'CPU Usage (%)',
                    data: [],
                    borderColor: 'rgb(75, 192, 192)',
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100
                    }
                },
                animation: {
                    duration: 750
                }
            }
        });

        // Memory Chart
        const memCtx = document.getElementById('memoryChart').getContext('2d');
        this.charts.memory = new Chart(memCtx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Memory Usage (%)',
                    data: [],
                    borderColor: 'rgb(255, 99, 132)',
                    backgroundColor: 'rgba(255, 99, 132, 0.2)',
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100
                    }
                },
                animation: {
                    duration: 750
                }
            }
        });
    }

        updateCharts(metrics) {
        if (!metrics.system) return;
        
        const now = new Date().toLocaleTimeString();
        const cpuUsage = metrics.system.cpu?.usage?.currentLoad || 0;
        const memUsage = parseFloat(metrics.system.memory?.usage?.usagePercent || 0);

        // Aggiungi ai dati storici
        this.metricsHistory.timestamps.push(now);
        this.metricsHistory.cpu.push(cpuUsage);
        this.metricsHistory.memory.push(memUsage);

        // Mantieni solo gli ultimi N punti
        if (this.metricsHistory.timestamps.length > this.maxHistoryPoints) {
            this.metricsHistory.timestamps.shift();
            this.metricsHistory.cpu.shift();
            this.metricsHistory.memory.shift();
        }

        // Raggruppa i dati se ci sono troppi punti per una visualizzazione pulita
        const maxDisplayPoints = 15; // Massimo 15 punti sull'asse X
        const groupedData = this.groupDataPoints(
            this.metricsHistory.timestamps,
            [this.metricsHistory.cpu, this.metricsHistory.memory],
            maxDisplayPoints
        );

        // Aggiorna CPU Chart
        if (this.charts.cpu) {
            this.charts.cpu.data.labels = groupedData.labels;
            this.charts.cpu.data.datasets[0].data = groupedData.datasets[0];
            this.charts.cpu.update('none');
        }

        // Aggiorna Memory Chart
        if (this.charts.memory) {
            this.charts.memory.data.labels = groupedData.labels;
            this.charts.memory.data.datasets[0].data = groupedData.datasets[1];
            this.charts.memory.update('none');
        }
    }

    // Funzione per raggruppare i dati quando diventano troppi
    groupDataPoints(timestamps, datasets, maxPoints) {
        if (timestamps.length <= maxPoints) {
            return {
                labels: timestamps,
                datasets: datasets
            };
        }

        const groupSize = Math.ceil(timestamps.length / maxPoints);
        const groupedLabels = [];
        const groupedDatasets = datasets.map(() => []);

        // Raggruppa i dati in gruppi e calcola la media
        for (let i = 0; i < timestamps.length; i += groupSize) {
            const groupEndIndex = Math.min(i + groupSize, timestamps.length);
            
            // Label del gruppo (primo e ultimo timestamp del gruppo)
            const firstTime = timestamps[i];
            const lastTime = timestamps[groupEndIndex - 1];
            const groupLabel = groupSize === 1 ? firstTime : `${firstTime}-${lastTime}`;
            groupedLabels.push(groupLabel);

            // Media dei valori per ogni dataset nel gruppo
            datasets.forEach((dataset, datasetIndex) => {
                const groupValues = dataset.slice(i, groupEndIndex);
                const average = groupValues.reduce((sum, val) => sum + val, 0) / groupValues.length;
                groupedDatasets[datasetIndex].push(Math.round(average * 100) / 100); // Arrotonda a 2 decimali
            });
        }

        return {
            labels: groupedLabels,
            datasets: groupedDatasets
        };
    }

    updateLastUpdateTime(timestamp) {
        const lastUpdateEl = document.getElementById('lastUpdate');
        if (timestamp) {
            const date = new Date(timestamp);
            lastUpdateEl.textContent = date.toLocaleString('it-IT');
        }
    }

    bindEvents() {
        // Refresh manuale
        const refreshBtn = document.getElementById('refreshBtn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                const icon = refreshBtn.querySelector('i');
                icon.classList.add('spinning');
                this.fetchMetricsHTTP();
                setTimeout(() => icon.classList.remove('spinning'), 1000);
            });
        }

        // === GESTIONE TAB ===
        // Ricarica dati quando si cambia tab
        document.querySelectorAll('[data-bs-toggle="tab"]').forEach(tab => {
            tab.addEventListener('shown.bs.tab', (e) => {
                const targetId = e.target.getAttribute('data-bs-target');
                if (targetId === '#data') {
                    this.loadMediaBackups();
                    this.loadDatabaseBackups();
                } else if (targetId === '#test') {
                    this.loadTestReports();
                }
            });
        });

        // === GESTIONE TEST ===
        this.ws.addEventListener('message', (event) => {
            try {
                const data = JSON.parse(event.data);
                this.handleWebSocketMessage(data);
            } catch (error) {
                console.error('Errore parsing WebSocket:', error);
            }
        });
    }

    handleWebSocketMessage(data) {
        switch (data.type) {
            case 'test_start':
                this.showTestFeedback(data.data.type, 'running');
                break;
            case 'test_log':
                this.appendTestLog(data.data.text, data.data.type);
                break;
            case 'test_complete':
                this.showTestFeedback(data.data.type, data.data.success ? 'success' : 'error');
                this.loadTestReports(); // Aggiorna i report
                break;
            case 'rollback_start':
                this.showRollbackFeedback('start');
                break;
            case 'rollback_log':
                this.appendRollbackLog(data.data.text);
                break;
            case 'rollback_complete':
                this.showRollbackFeedback(data.data.success ? 'success' : 'error');
                break;
            case 'page_refresh':
                // Refresh della pagina
                setTimeout(() => {
                    window.location.reload();
                }, 1000);
                break;
        }
    }

    showTestFeedback(testType, status) {
        const statusDiv = document.getElementById('testStatus');
        if (!statusDiv) return;

        let html = '';
        let alertClass = '';
        
        switch (status) {
            case 'running':
                alertClass = 'alert-info';
                html = `<i class="fas fa-spinner fa-spin"></i> Esecuzione ${testType} in corso...`;
                break;
            case 'success':
                alertClass = 'alert-success';
                html = `<i class="fas fa-check-circle"></i> ${testType} completato con successo!`;
                break;
            case 'error':
                alertClass = 'alert-danger';
                html = `<i class="fas fa-exclamation-circle"></i> Errore durante ${testType}`;
                break;
        }

        statusDiv.innerHTML = `<div class="alert ${alertClass}">${html}</div>`;
        
        if (status !== 'running') {
            setTimeout(() => {
                statusDiv.innerHTML = '';
            }, 5000);
        }
    }

    appendTestLog(text, type) {
        const logContainer = document.getElementById('testLogContainer');
        if (!logContainer) return;

        const logDiv = logContainer.querySelector('.log-container') || this.createLogContainer(logContainer);
        const colorClass = type === 'stderr' ? 'text-danger' : 'text-light';
        
        logDiv.innerHTML += `<span class="${colorClass}">${text}</span>`;
        logDiv.scrollTop = logDiv.scrollHeight;
    }

    createLogContainer(parent) {
        const logDiv = document.createElement('div');
        logDiv.className = 'log-container';
        logDiv.style.maxHeight = '300px';
        logDiv.style.overflowY = 'auto';
        logDiv.style.backgroundColor = '#222';
        logDiv.style.color = '#fff';
        logDiv.style.padding = '10px';
        logDiv.style.borderRadius = '5px';
        logDiv.style.fontFamily = 'monospace';
        logDiv.style.fontSize = '12px';
        parent.appendChild(logDiv);
        return logDiv;
    }

    showRollbackFeedback(status) {
        const statusDiv = document.getElementById('rollbackStatus');
        if (!statusDiv) return;

        let html = '';
        let alertClass = '';

        switch (status) {
            case 'start':
                alertClass = 'alert-warning';
                html = `<i class="fas fa-spinner fa-spin"></i> Rollback in corso... Questo potrebbe richiedere alcuni minuti.`;
                break;
            case 'success':
                alertClass = 'alert-success';
                html = `<i class="fas fa-check-circle"></i> Rollback completato con successo!`;
                break;
            case 'error':
                alertClass = 'alert-danger';
                html = `<i class="fas fa-exclamation-circle"></i> Errore durante il rollback`;
                break;
        }

        statusDiv.innerHTML = `<div class="alert ${alertClass}">${html}</div>`;
        
        if (status !== 'start') {
            setTimeout(() => {
                statusDiv.innerHTML = '';
            }, 10000);
        }
    }

    appendRollbackLog(text) {
        const logContainer = document.getElementById('rollbackLogContainer');
        if (!logContainer) return;

        const logDiv = logContainer.querySelector('.log-container') || this.createLogContainer(logContainer);
        logDiv.innerHTML += `<span class="text-light">${text}</span>`;
        logDiv.scrollTop = logDiv.scrollHeight;
    }

    async loadTestReports() {
        try {
            const reportsList = document.getElementById('testReportsList');
            if (reportsList) {
                reportsList.innerHTML = '<li class="list-group-item text-center text-muted">Caricamento...</li>';
            }
            const response = await fetch('/api/test/reports');
            if (!response.ok) {
                throw new Error(`Errore recupero report: ${response.statusText}`);
            }
            const reports = await response.json();
            if (reportsList) {
                reportsList.innerHTML = '';
                if (!reports || reports.length === 0) {
                    reportsList.innerHTML = '<li class="list-group-item">Nessun report disponibile</li>';
                    return;
                }
                reports.forEach(report => {
                    const li = document.createElement('li');
                    li.className = 'list-group-item';
                    // Determina i valori passati/totali in modo robusto
                    let passed = 0, total = 0;
                    if (report.summary) {
                        passed = report.summary.numPassedTests ?? report.summary.passed ?? 0;
                        total = report.summary.numTotalTests ?? report.summary.total ?? 0;
                    } else if (report.testResults && Array.isArray(report.testResults)) {
                        passed = report.testResults.filter(t => t.status === 'passed' || t.success === true).length;
                        total = report.testResults.length;
                    }
                    const statusIcon = (report.status === 'success' || report.summary?.success || passed === total && total > 0) ? '✅' : '❌';
                    const statusClass = (report.status === 'success' || report.summary?.success || passed === total && total > 0) ? 'text-success' : 'text-danger';
                    li.innerHTML = `
                        <div class="d-flex justify-content-between align-items-center">
                            <div>
                                <span class="${statusClass}">${statusIcon}</span>
                                <strong>${report.testType}</strong>
                                <small class="text-muted ms-2">${new Date(report.timestamp).toLocaleString()}</small>
                            </div>
                            <div>
                                <span class="badge ${statusClass}">${passed}/${total} test passati</span>
                                <button class="btn btn-sm btn-outline-primary ms-2" onclick="showTestDetails('${report.testType}', '${report.timestamp}')">
                                    Dettagli
                                </button>
                            </div>
                        </div>
                    `;
                    reportsList.appendChild(li);
                });
            }
        } catch (error) {
            console.error('Errore caricamento report:', error);
            const reportsList = document.getElementById('testReportsList');
            if (reportsList) {
                reportsList.innerHTML = `<li class="list-group-item text-danger">Errore caricamento report: ${error.message}</li>`;
            }
        }
    }

    getTestTypeFromFilename(filename) {
        if (filename.includes('performance')) return 'Performance';
        if (filename.includes('integrativi')) return 'Integrativi';
        if (filename.includes('unitari')) return 'Unitari';
        if (filename.includes('frontend')) return 'Frontend';
        return 'Test';
    }

    getTestTypeBadgeColor(testType) {
        switch (testType.toLowerCase()) {
            case 'performance': return 'warning';
            case 'integrativi': return 'info';
            case 'unitari': return 'success';
            case 'frontend': return 'primary';
            default: return 'secondary';
        }
    }

    extractTestSummary(content) {
        if (!content) return null;
        
        try {
            // Se è un JSON, estrai le informazioni principali
            if (typeof content === 'object') {
                return {
                    totalTests: content.summary?.numTotalTests || content.numTotalTests || 0,
                    passedTests: content.summary?.numPassedTests || content.numPassedTests || 0,
                    failedTests: content.summary?.numFailedTests || content.numFailedTests || 0,
                    duration: content.summary?.duration || 0,
                    timestamp: content.timestamp || new Date().toISOString(),
                    success: content.summary?.success || content.success || false,
                    testType: content.testType || 'unknown'
                };
            }
        } catch (error) {
            console.warn('Errore parsing contenuto report:', error);
        }
        
        return null;
    }

    renderTestSummary(summary) {
        if (!summary) {
            return '<div class="text-muted">Anteprima non disponibile</div>';
        }

        const successRate = summary.totalTests > 0 ? 
            Math.round((summary.passedTests / summary.totalTests) * 100) : 0;
        
        const statusColor = summary.success ? 'success' : 'danger';
        const statusIcon = summary.success ? 'check-circle' : 'times-circle';
        
        return `
            <div class="row">
                <div class="col-md-6">
                    <div class="card border-${statusColor}">
                        <div class="card-body">
                            <h6 class="card-title">
                                <i class="fas fa-${statusIcon} text-${statusColor} me-2"></i>
                                Risultato Test
                            </h6>
                            <div class="d-flex justify-content-between">
                                <span>Test Totali:</span>
                                <strong>${summary.totalTests}</strong>
                            </div>
                            <div class="d-flex justify-content-between">
                                <span>Test Passati:</span>
                                <strong class="text-success">${summary.passedTests}</strong>
                            </div>
                            <div class="d-flex justify-content-between">
                                <span>Test Falliti:</span>
                                <strong class="text-danger">${summary.failedTests}</strong>
                            </div>
                            <div class="d-flex justify-content-between">
                                <span>Tasso di Successo:</span>
                                <strong class="text-${statusColor}">${successRate}%</strong>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="card">
                        <div class="card-body">
                            <h6 class="card-title">
                                <i class="fas fa-info-circle me-2"></i>
                                Informazioni
                            </h6>
                            <div class="d-flex justify-content-between">
                                <span>Tipo Test:</span>
                                <strong>${summary.testType}</strong>
                            </div>
                            <div class="d-flex justify-content-between">
                                <span>Durata:</span>
                                <strong>${this.formatDuration(summary.duration)}</strong>
                            </div>
                            <div class="d-flex justify-content-between">
                                <span>Eseguito:</span>
                                <strong>${new Date(summary.timestamp).toLocaleString('it-IT')}</strong>
                            </div>
                            <div class="d-flex justify-content-between">
                                <span>Stato:</span>
                                <span class="badge bg-${statusColor}">${summary.success ? 'Successo' : 'Fallito'}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    formatDuration(ms) {
        if (!ms || ms < 1000) return `${ms || 0}ms`;
        const seconds = Math.round(ms / 1000);
        if (seconds < 60) return `${seconds}s`;
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}m ${remainingSeconds}s`;
    }

    async loadMediaBackups() {
        try {
            const response = await fetch('/api/media/backups');
            const backups = await response.json();
            
            const tableBody = document.getElementById('mediaBackupsTable');
            if (!tableBody) return;

            if (backups.length === 0) {
                tableBody.innerHTML = '<tr><td colspan="4" class="text-center">Nessun backup disponibile</td></tr>';
                return;
            }

            tableBody.innerHTML = backups.map(backup => `
                <tr>
                    <td>${backup.name}</td>
                    <td>${this.formatFileSize(backup.size)}</td>
                    <td>${new Date(backup.created).toLocaleString('it-IT')}</td>
                    <td>
                        <button class="btn btn-sm btn-success" onclick="restoreMediaBackup('${backup.name}')">
                            <i class="fas fa-undo"></i> Ripristina
                        </button>
                    </td>
                </tr>
            `).join('');
        } catch (error) {
            console.error('Errore caricamento backup media:', error);
        }
    }

    async loadDatabaseBackups() {
        try {
            const response = await fetch('/api/database/backups');
            const backups = await response.json();
            
            const tableBody = document.getElementById('databaseBackupsTable');
            if (!tableBody) return;

            if (backups.length === 0) {
                tableBody.innerHTML = '<tr><td colspan="4" class="text-center">Nessun backup disponibile</td></tr>';
                return;
            }

            tableBody.innerHTML = backups.map(backup => `
                <tr>
                    <td>${backup.name}</td>
                    <td>${this.formatFileSize(backup.size)}</td>
                    <td>${new Date(backup.created).toLocaleString('it-IT')}</td>
                    <td>
                        <button class="btn btn-sm btn-success" onclick="restoreDatabaseBackup('${backup.name}')">
                            <i class="fas fa-undo"></i> Ripristina
                        </button>
                    </td>
                </tr>
            `).join('');
        } catch (error) {
            console.error('Errore caricamento backup database:', error);
        }
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    showToast(message, type = 'info') {
        const toastContainer = document.getElementById('toastContainer') || this.createToastContainer();
        
        const toast = document.createElement('div');
        toast.className = `alert alert-${type} alert-dismissible fade show`;
        toast.style.marginBottom = '10px';
        toast.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        toastContainer.appendChild(toast);
        
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 5000);
    }

    createToastContainer() {
        const container = document.createElement('div');
        container.id = 'toastContainer';
        container.style.position = 'fixed';
        container.style.top = '80px';
        container.style.right = '20px';
        container.style.zIndex = '9999';
        container.style.width = '350px';
        document.body.appendChild(container);
        return container;
    }
}

// === FUNZIONI GLOBALI PER I BOTTONI ===

// Funzione per eseguire i test
async function runTest(testType) {
    try {
        // Mostra il banner di esecuzione
        const testStatus = document.getElementById('testStatus');
        if (testStatus) {
            testStatus.innerHTML = `<div class="alert alert-info"><i class="fas fa-spinner fa-spin me-2"></i>🧪 Esecuzione test ${testType} in corso...</div>`;
        }
        
        // Disabilita il pulsante durante l'esecuzione
        const testButton = document.querySelector(`button[onclick="runTest('${testType}')"]`);
        if (testButton) {
            testButton.disabled = true;
        }

        const response = await fetch(`/api/test/${testType}`, {
            method: 'POST'
        });

        if (!response.ok) {
            throw new Error(`Errore test: ${response.statusText}`);
        }

        const result = await response.json();
        console.log('Risultato test:', result);

        // Attendi che il report venga scritto e poi aggiorna la lista
        setTimeout(async () => {
            await loadTestReports();
            dashboard.loadTestReports(); // Ricarica anche nella classe
        }, 3000);

        // Mostra il messaggio di successo
        if (testStatus) {
            testStatus.innerHTML = `<div class="alert alert-success"><i class="fas fa-check-circle me-2"></i>✅ Test ${testType} completati con successo!</div>`;
            
            // Nascondi il banner dopo 3 secondi
            setTimeout(() => {
                testStatus.innerHTML = '';
            }, 3000);
        }

    } catch (error) {
        console.error('Errore test:', error);
        
        // Mostra il messaggio di errore
        const testStatus = document.getElementById('testStatus');
        if (testStatus) {
            testStatus.innerHTML = `<div class="alert alert-danger"><i class="fas fa-exclamation-triangle me-2"></i>❌ Errore durante l'esecuzione dei test: ${error.message}</div>`;
            
            // Nascondi il banner dopo 5 secondi
            setTimeout(() => {
                testStatus.innerHTML = '';
            }, 5000);
        }
    } finally {
        // Riabilita il pulsante
        const testButton = document.querySelector(`button[onclick="runTest('${testType}')"]`);
        if (testButton) {
            testButton.disabled = false;
        }
    }
}

// Funzione per aggiornare la lista dei report (refresh forzato)
async function refreshTestReports() {
    try {
        console.log('🔄 Aggiornamento forzato lista report...');
        
        // Prima forza il refresh sul server
        const refreshResponse = await fetch('/api/test/reports/refresh', {
            method: 'POST'
        });
        
        if (!refreshResponse.ok) {
            throw new Error(`Errore refresh: ${refreshResponse.statusText}`);
        }
        
        // Poi ricarica la lista
        await loadTestReports();
        
        // Mostra messaggio di successo
        const testStatus = document.getElementById('testStatus');
        if (testStatus) {
            testStatus.innerHTML = `<div class="alert alert-success"><i class="fas fa-check-circle me-2"></i>Lista report aggiornata con successo!</div>`;
            setTimeout(() => {
                testStatus.innerHTML = '';
            }, 2000);
        }
        
    } catch (error) {
        console.error('Errore aggiornamento report:', error);
        const testStatus = document.getElementById('testStatus');
        if (testStatus) {
            testStatus.innerHTML = `<div class="alert alert-danger"><i class="fas fa-exclamation-triangle me-2"></i>Errore aggiornamento: ${error.message}</div>`;
        }
    }
}

// Funzione per aggiornare la lista dei report
async function loadTestReports() {
    try {
        const reportsList = document.getElementById('testReportsList');
        if (reportsList) {
            reportsList.innerHTML = '<li class="list-group-item text-center text-muted">Caricamento...</li>';
        }
        const response = await fetch('/api/test/reports');
        if (!response.ok) {
            throw new Error(`Errore recupero report: ${response.statusText}`);
        }
        const reports = await response.json();
        if (reportsList) {
            reportsList.innerHTML = '';
            if (!reports || reports.length === 0) {
                reportsList.innerHTML = '<li class="list-group-item">Nessun report disponibile</li>';
                return;
            }
            reports.forEach(report => {
                const li = document.createElement('li');
                li.className = 'list-group-item';
                // Determina i valori passati/totali in modo robusto
                let passed = 0, total = 0;
                if (report.summary) {
                    passed = report.summary.numPassedTests ?? report.summary.passed ?? 0;
                    total = report.summary.numTotalTests ?? report.summary.total ?? 0;
                } else if (report.testResults && Array.isArray(report.testResults)) {
                    passed = report.testResults.filter(t => t.status === 'passed' || t.success === true).length;
                    total = report.testResults.length;
                }
                const statusIcon = (report.status === 'success' || report.summary?.success || passed === total && total > 0) ? '✅' : '❌';
                const statusClass = (report.status === 'success' || report.summary?.success || passed === total && total > 0) ? 'text-success' : 'text-danger';
                li.innerHTML = `
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <span class="${statusClass}">${statusIcon}</span>
                            <strong>${report.testType}</strong>
                            <small class="text-muted ms-2">${new Date(report.timestamp).toLocaleString()}</small>
                        </div>
                        <div>
                            <span class="badge ${statusClass}">${passed}/${total} test passati</span>
                            <button class="btn btn-sm btn-outline-primary ms-2" onclick="showTestDetails('${report.testType}', '${report.timestamp}')">
                                Dettagli
                            </button>
                        </div>
                    </div>
                `;
                reportsList.appendChild(li);
            });
        }
    } catch (error) {
        console.error('Errore caricamento report:', error);
        const reportsList = document.getElementById('testReportsList');
        if (reportsList) {
            reportsList.innerHTML = `<li class="list-group-item text-danger">Errore caricamento report: ${error.message}</li>`;
        }
    }
}

// Funzione per mostrare i dettagli di un test
async function showTestDetails(testType, timestamp) {
    try {
        const response = await fetch(`/api/test/reports/${testType}/${timestamp}`);
        if (!response.ok) {
            throw new Error(`Errore recupero dettagli: ${response.statusText}`);
        }
        
        const report = await response.json();
        const modal = document.getElementById('testDetailsModal');
        const modalTitle = modal.querySelector('.modal-title');
        const modalBody = modal.querySelector('.modal-body');
        
        // Aggiorna il titolo del modal con il tipo di test
        modalTitle.innerHTML = `
            <i class="fas fa-${getTestIcon(testType)} me-2"></i>
            Dettagli Test: ${getTestDisplayName(testType)}
        `;
        
        let content = createTestHeader(report);
        
        // Aggiungi contenuto specifico per tipo di test
        switch(testType) {
            case 'backend-unitari':
            case 'backend-integrativi':
                content += createBackendTestDetails(report);
                break;
            case 'frontend':
                content += createFrontendTestDetails(report);
                break;
            case 'performance':
                content += createPerformanceTestDetails(report);
                break;
            case 'cross-browser':
                content += createCrossBrowserTestDetails(report);
                break;
            default:
                content += createGenericTestDetails(report);
        }
        

        modalBody.innerHTML = content;
        const modalInstance = new bootstrap.Modal(modal);
        modalInstance.show();
    } catch (error) {
        console.error('Errore caricamento dettagli test:', error);
        const modal = document.getElementById('testDetailsModal');
        const modalBody = modal.querySelector('.modal-body');
        modalBody.innerHTML = `<div class="alert alert-danger">Errore caricamento dettagli: ${error.message}</div>`;
        const modalInstance = new bootstrap.Modal(modal);
        modalInstance.show();
    }
}

// Funzioni per export
async function exportMedia() {
    try {
        dashboard.showToast('Avvio export Media...', 'info');
        
        const response = await fetch('/api/media/export');
        if (!response.ok) throw new Error('Errore durante l\'export');
        
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `media-export-${new Date().toISOString().split('T')[0]}.zip`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        dashboard.showToast('Export Media completato!', 'success');
    } catch (error) {
        console.error('Errore export media:', error);
        dashboard.showToast(`Errore export: ${error.message}`, 'danger');
    }
}

async function exportDatabase() {
    try {
        dashboard.showToast('Avvio export Database...', 'info');
        
        const response = await fetch('/api/database/export');
        if (!response.ok) throw new Error('Errore durante l\'export');
        
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `database-export-${new Date().toISOString().split('T')[0]}.sql`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        dashboard.showToast('Export Database completato!', 'success');
    } catch (error) {
        console.error('Errore export database:', error);
        dashboard.showToast(`Errore export: ${error.message}`, 'danger');
    }
}

// Funzioni per backup
async function backupMedia() {
    try {
        dashboard.showToast('Creazione backup Media in corso...', 'info');
        
        const response = await fetch('/api/media/backup', {
            method: 'POST'
        });
        
        if (!response.ok) throw new Error('Errore durante il backup');
        
        const result = await response.json();
        dashboard.showToast(`Backup Media creato: ${result.backup}`, 'success');
        dashboard.loadMediaBackups(); // Aggiorna la tabella
        
    } catch (error) {
        console.error('Errore backup media:', error);
        dashboard.showToast(`Errore backup: ${error.message}`, 'danger');
    }
}

async function backupDatabase() {
    try {
        dashboard.showToast('Creazione backup Database in corso...', 'info');
        
        const response = await fetch('/api/database/backup', {
            method: 'POST'
        });
        
        if (!response.ok) throw new Error('Errore durante il backup');
        
        const result = await response.json();
        dashboard.showToast(`Backup Database creato: ${result.backup}`, 'success');
        dashboard.loadDatabaseBackups(); // Aggiorna la tabella
        
    } catch (error) {
        console.error('Errore backup database:', error);
        dashboard.showToast(`Errore backup: ${error.message}`, 'danger');
    }
}

// Funzioni per restore backup
async function restoreMediaBackup(backupName) {
    if (!confirm(`Sei sicuro di voler ripristinare il backup "${backupName}"? Questa operazione sovrascriverà i dati attuali.`)) {
        return;
    }
    
    try {
        dashboard.showToast('Ripristino backup Media in corso...', 'warning');
        
        const response = await fetch(`/api/media/restore/${backupName}`, {
            method: 'POST'
        });
        
        if (!response.ok) throw new Error('Errore durante il ripristino');
        
        dashboard.showToast('Backup Media ripristinato con successo!', 'success');
        
    } catch (error) {
        console.error('Errore ripristino backup media:', error);
        dashboard.showToast(`Errore ripristino: ${error.message}`, 'danger');
    }
}

async function restoreDatabaseBackup(backupName) {
    if (!confirm(`Sei sicuro di voler ripristinare il backup "${backupName}"? Questa operazione sovrascriverà i dati attuali.`)) {
        return;
    }
    
    try {
        dashboard.showToast('Ripristino backup Database in corso...', 'warning');
        
        const response = await fetch(`/api/database/restore/${backupName}`, {
            method: 'POST'
        });
        
        if (!response.ok) throw new Error('Errore durante il ripristino');
        
        dashboard.showToast('Backup Database ripristinato con successo!', 'success');
        
    } catch (error) {
        console.error('Errore ripristino backup database:', error);
        dashboard.showToast(`Errore ripristino: ${error.message}`, 'danger');
    }
}

// Funzioni per ripristino versioni safe
async function restoreSafeMedia() {
    if (!confirm('Sei sicuro di voler ripristinare la versione safe Media? Questa operazione sovrascriverà i dati attuali.')) {
        return;
    }
    
    try {
        dashboard.showToast('Ripristino versione safe Media in corso...', 'warning');
        
        const response = await fetch('/api/media/restore-safe', {
            method: 'POST'
        });
        
        if (!response.ok) throw new Error('Errore durante il ripristino');
        
        dashboard.showToast('Versione safe Media ripristinata con successo!', 'success');
        
    } catch (error) {
        console.error('Errore ripristino safe media:', error);
        dashboard.showToast(`Errore ripristino: ${error.message}`, 'danger');
    }
}

async function restoreSafeDatabase() {
    if (!confirm('Sei sicuro di voler ripristinare la versione safe Database? Questa operazione sovrascriverà i dati attuali.')) {
        return;
    }
    
    try {
        dashboard.showToast('Ripristino versione safe Database in corso...', 'warning');
        
        const response = await fetch('/api/database/restore-safe', {
            method: 'POST'
        });
        
        if (!response.ok) throw new Error('Errore durante il ripristino');
        
        dashboard.showToast('Versione safe Database ripristinata con successo!', 'success');
        
    } catch (error) {
        console.error('Errore ripristino safe database:', error);
        dashboard.showToast(`Errore ripristino: ${error.message}`, 'danger');
    }
}

// Funzione per rollback completo
async function performRollback() {
    if (!confirm('ATTENZIONE: Il rollback resetterà completamente il sistema alle versioni safe. Questa operazione è irreversibile. Continuare?')) {
        return;
    }
    
    try {
        // Pulisci log precedenti
        const logContainer = document.getElementById('rollbackLogContainer');
        if (logContainer) {
            logContainer.innerHTML = '';
        }
        
        dashboard.showRollbackFeedback('start');
        
        const response = await fetch('/api/rollback', {
            method: 'POST'
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Errore durante il rollback');
        }
        
    } catch (error) {
        console.error('Errore rollback:', error);
        dashboard.showRollbackFeedback('error');
        dashboard.showToast(`Errore rollback: ${error.message}`, 'danger');
    }
}

// Funzioni per import
async function importMedia(file) {
    if (!file) return;
    
    try {
        dashboard.showToast('Upload Media in corso...', 'info');
        
        const formData = new FormData();
        formData.append('mediaZip', file);
        
        const response = await fetch('/api/media/import', {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) throw new Error('Errore durante l\'import');
        
        dashboard.showToast('Import Media completato!', 'success');
        dashboard.loadMediaBackups(); // Aggiorna la tabella
        
    } catch (error) {
        console.error('Errore import media:', error);
        dashboard.showToast(`Errore import: ${error.message}`, 'danger');
    }
}

async function importDatabase(file) {
    if (!file) return;
    
    try {
        const formData = new FormData();
        formData.append('database', file);
        
        const response = await fetch('/api/import/database', {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        if (result.success) {
            dashboard.showToast('✅ Database importato con successo!', 'success');
            dashboard.loadDatabaseBackups();
        } else {
            dashboard.showToast('❌ Errore durante l\'importazione del database: ' + result.error, 'error');
        }
    } catch (error) {
        console.error('Errore importazione database:', error);
        dashboard.showToast('❌ Errore durante l\'importazione del database', 'error');
    }
}

// Funzione per aggiornare manualmente i dati
function refreshData() {
    console.log('🔄 Aggiornamento manuale dati...');
    dashboard.showToast('🔄 Aggiornamento dati in corso...', 'info');
    
    // Forza l'aggiornamento tramite fetch HTTP
    dashboard.fetchMetricsHTTP();
    
    // Ricarica anche i report e backup
    dashboard.loadTestReports();
    dashboard.loadMediaBackups();
    dashboard.loadDatabaseBackups();
}

// === FUNZIONI README ===

async function loadReadme() {
    const readmeContent = document.getElementById('readmeContent');
    
    // Mostra loader
    readmeContent.innerHTML = `
        <div class="text-center text-muted p-3">
            <i class="fas fa-spinner fa-spin me-2"></i>Caricamento...
        </div>
    `;
    
    try {
        const response = await fetch('/api/readme');
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        // Converti markdown in HTML (versione semplificata)
        const htmlContent = convertMarkdownToHtml(data.content);
        
        readmeContent.innerHTML = `
            <div class="readme-container">
                <div class="mb-2 text-muted small">
                    <i class="fas fa-clock me-1"></i>
                    Ultima modifica: ${new Date(data.lastModified).toLocaleString('it-IT')}
                </div>
                <div class="readme-content">
                    ${htmlContent}
                </div>
            </div>
        `;
        
        // Applica stili per code blocks
        readmeContent.querySelectorAll('pre code').forEach(block => {
            block.style.background = '#f8f9fa';
            block.style.padding = '10px';
            block.style.borderRadius = '5px';
            block.style.border = '1px solid #e9ecef';
        });
        
    } catch (error) {
        console.error('❌ Errore caricamento README:', error);
        readmeContent.innerHTML = `
            <div class="alert alert-danger">
                <i class="fas fa-exclamation-triangle me-2"></i>
                <strong>Errore:</strong> Impossibile caricare il README.
                <br><small>${error.message}</small>
            </div>
        `;
    }
}

function convertMarkdownToHtml(markdown) {
    let html = markdown;
    
    // Headers
    html = html.replace(/^### (.*$)/gim, '<h3 class="mt-4 mb-3 text-primary">$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2 class="mt-4 mb-3 text-primary border-bottom pb-2">$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1 class="mt-4 mb-3 text-primary">$1</h1>');
    
    // Bold and Italic
    html = html.replace(/\*\*\*(.*)\*\*\*/gim, '<strong><em>$1</em></strong>');
    html = html.replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>');
    html = html.replace(/\*(.*)\*/gim, '<em>$1</em>');
    
    // Links
    html = html.replace(/\[([^\]]*)\]\(([^\)]*)\)/gim, '<a href="$2" target="_blank" class="text-decoration-none">$1 <i class="fas fa-external-link-alt ms-1" style="font-size: 0.8em;"></i></a>');
    
    // Code blocks
    html = html.replace(/```([\s\S]*?)```/gim, '<pre class="bg-light p-3 rounded border"><code>$1</code></pre>');
    
    // Inline code
    html = html.replace(/`([^`]*)`/gim, '<code class="bg-light px-2 py-1 rounded">$1</code>');
    
    // Lists (migliore gestione dell'indentazione)
    let lines = html.split('\n');
    let inList = false;
    let processedLines = [];
    
    for (let i = 0; i < lines.length; i++) {
        let line = lines[i];
        
        // Lista non ordinata
        if (/^\s*[\-\*\+]\s+/.test(line)) {
            if (!inList) {
                processedLines.push('<ul class="list-unstyled ps-3">');
                inList = 'ul';
            }
            line = line.replace(/^\s*[\-\*\+]\s+(.*)$/, '<li class="mb-1">$1</li>');
        }
        // Lista ordinata  
        else if (/^\s*\d+\.\s+/.test(line)) {
            if (!inList) {
                processedLines.push('<ol class="ps-3">');
                inList = 'ol';
            }
            line = line.replace(/^\s*\d+\.\s+(.*)$/, '<li class="mb-1">$1</li>');
        }
        // Fine lista
        else if (inList && line.trim() === '') {
            processedLines.push(`</${inList}>`);
            inList = false;
        }
        
        processedLines.push(line);
    }
    
    // Chiudi lista se è ancora aperta
    if (inList) {
        processedLines.push(`</${inList}>`);
    }
    
    html = processedLines.join('\n');
    
    // Paragraphs
    html = html.replace(/\n\n/gim, '</p><p class="mb-3">');
    html = '<p class="mb-3">' + html + '</p>';
    
    // Clean up empty paragraphs
    html = html.replace(/<p[^>]*><\/p>/gim, '');
    html = html.replace(/<p[^>]*>\s*<\/p>/gim, '');
    
    // Horizontal rules
    html = html.replace(/^---$/gim, '<hr class="my-4">');
    
    return html;
}

// Funzioni di utility globali
function formatDuration(ms) {
    if (!ms || ms < 1000) return `${ms || 0}ms`;
    const seconds = Math.round(ms / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
}

function downloadReport(testType, timestamp) {
    try {
        // Trova il report corrispondente
        fetch(`/api/test/reports/${testType}/${timestamp}`)
            .then(response => response.json())
            .then(report => {
                const dataStr = JSON.stringify(report, null, 2);
                const dataBlob = new Blob([dataStr], { type: 'application/json' });
                
                const url = URL.createObjectURL(dataBlob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `${testType}-${new Date(timestamp).toISOString().split('T')[0]}.json`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
                
                dashboard.showToast('✅ Report scaricato con successo!', 'success');
            })
            .catch(error => {
                console.error('Errore download report:', error);
                dashboard.showToast('❌ Errore durante il download', 'danger');
            });
    } catch (error) {
        console.error('Errore download report:', error);
        dashboard.showToast('❌ Errore durante il download', 'danger');
    }
}

function openImageModal(imageName, browser, testName) {
    const modal = document.getElementById('imageModal') || createImageModal();
    const modalTitle = modal.querySelector('.modal-title');
    const modalImage = modal.querySelector('#modalImage');
    
    modalTitle.textContent = `${testName} - ${browser.charAt(0).toUpperCase() + browser.slice(1)}`;
    modalImage.src = `http://101.58.39.17:3017/api/test/screenshot/${browser}/${imageName}`;
    modalImage.alt = `${browser} screenshot for ${testName}`;
    
    const modalInstance = new bootstrap.Modal(modal);
    modalInstance.show();
}

function createImageModal() {
    const modalHtml = `
        <div class="modal fade" id="imageModal" tabindex="-1" aria-labelledby="imageModalLabel" aria-hidden="true">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="imageModalLabel">Screenshot</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body text-center">
                        <img id="modalImage" class="img-fluid rounded" src="" alt="">
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    return document.getElementById('imageModal');
}

// === FUNZIONI HELPER PER MODAL SPECIFICI ===

function getTestIcon(testType) {
    switch(testType) {
        case 'backend-unitari': return 'flask';
        case 'backend-integrativi': return 'link';
        case 'frontend': return 'desktop';
        case 'performance': return 'tachometer-alt';
        case 'cross-browser': return 'globe';
        default: return 'vial';
    }
}

function getTestDisplayName(testType) {
    switch(testType) {
        case 'backend-unitari': return 'Backend Unitari';
        case 'backend-integrativi': return 'Backend Integrativi';
        case 'frontend': return 'Frontend';
        case 'performance': return 'Performance';
        case 'cross-browser': return 'Cross-Browser Compatibility';
        default: return testType.charAt(0).toUpperCase() + testType.slice(1);
    }
}

function createTestHeader(report) {
    return `
        <div class="row mb-4">
            <div class="col-md-8">
                <div class="card border-${(report.status === 'success' || report.summary?.success) ? 'success' : 'danger'}">
                    <div class="card-header bg-${(report.status === 'success' || report.summary?.success) ? 'success' : 'danger'} text-white">
                        <h5 class="mb-0">
                            <i class="fas fa-${(report.status === 'success' || report.summary?.success) ? 'check-circle' : 'times-circle'} me-2"></i>
                            Riepilogo Esecuzione
                        </h5>
                    </div>
                    <div class="card-body">
                        <div class="row">
                            <div class="col-6">
                                <small class="text-muted">Data Esecuzione</small>
                                <div class="fw-bold">${new Date(report.timestamp).toLocaleString('it-IT')}</div>
                            </div>
                            <div class="col-6">
                                <small class="text-muted">Durata</small>
                                <div class="fw-bold">${formatDuration(report.summary?.duration || report.duration) || 'N/A'}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-md-4">
                <div class="card h-100">
                    <div class="card-body text-center">
                        <h6><i class="fas fa-chart-pie me-2"></i>Risultati</h6>
                        <div class="display-4 ${(report.status === 'success' || report.summary?.success) ? 'text-success' : 'text-danger'}">
                            ${report.summary?.numPassedTests || 0}/${report.summary?.numTotalTests || 0}
                        </div>
                        <small class="text-muted">Test Passati</small>
                        <div class="mt-3">
                            <button class="btn btn-outline-primary btn-sm" onclick="downloadReport('${report.testType}', '${report.timestamp}')">
                                <i class="fas fa-download me-1"></i>Scarica Report
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function createBackendTestDetails(report) {
    if (!report.testResults) return '<div class="alert alert-info">Nessun dettaglio disponibile</div>';
    
    let content = `
        <div class="mb-4">
            <h5><i class="fas fa-list-alt me-2"></i>Dettagli Test</h5>
            <div class="accordion" id="testAccordion">
    `;
    
    report.testResults.forEach((testFile, index) => {
        const passedTests = testFile.assertionResults?.filter(a => a.status === 'passed').length || 0;
        const totalTests = testFile.assertionResults?.length || 0;
        const fileName = testFile.name.split('/').pop();
        
        content += `
            <div class="accordion-item">
                <h2 class="accordion-header">
                    <button class="accordion-button ${index === 0 ? '' : 'collapsed'}" type="button" data-bs-toggle="collapse" data-bs-target="#collapse${index}">
                        <div class="d-flex w-100 justify-content-between">
                            <div>
                                <i class="fas fa-file-code me-2"></i>
                                <strong>${fileName}</strong>
                            </div>
                            <div>
                                <span class="badge bg-success me-2">${passedTests}/${totalTests}</span>
                                <small class="text-muted">${testFile.duration}ms</small>
                            </div>
                        </div>
                    </button>
                </h2>
                <div id="collapse${index}" class="accordion-collapse collapse ${index === 0 ? 'show' : ''}">
                    <div class="accordion-body">
                        ${testFile.assertionResults ? `
                            <div class="list-group">
                                ${testFile.assertionResults.map(assertion => `
                                    <div class="list-group-item d-flex justify-content-between align-items-center">
                                        <div>
                                            <i class="fas fa-${assertion.status === 'passed' ? 'check text-success' : 'times text-danger'} me-2"></i>
                                            ${assertion.title}
                                        </div>
                                        <small class="text-muted">${assertion.duration}ms</small>
                                    </div>
                                `).join('')}
                            </div>
                        ` : '<div class="text-muted">Nessun dettaglio disponibile</div>'}
                    </div>
                </div>
            </div>
        `;
    });
    
    content += `
            </div>
        </div>
    `;
    
    return content;
}

function createFrontendTestDetails(report) {
    return createBackendTestDetails(report); // Stessa struttura per frontend
}

function createPerformanceTestDetails(report) {
    let content = createBackendTestDetails(report);
    
    if (report.performanceMetrics) {
        content += `
            <div class="mb-4">
                <h5><i class="fas fa-tachometer-alt me-2"></i>Metriche Performance</h5>
                <div class="row">
                    <div class="col-md-6">
                        <div class="card">
                            <div class="card-header">Tempi di Risposta</div>
                            <div class="card-body">
                                <div class="text-muted">Dati non disponibili nel report</div>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="card">
                            <div class="card-header">Throughput</div>
                            <div class="card-body">
                                <div class="text-muted">Dati non disponibili nel report</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    return content;
}

function createCrossBrowserTestDetails(report) {
    if (!report.testResults) return '<div class="alert alert-info">Nessun dettaglio disponibile</div>';
    
    let content = `
        <div class="mb-4">
            <h5><i class="fas fa-globe me-2"></i>Compatibilità Cross-Browser</h5>
            <div class="row mb-3">
                <div class="col-md-4">
                    <div class="card bg-primary text-white">
                        <div class="card-body text-center">
                            <h4>${report.summary.compatibilityScore}%</h4>
                            <small>Score Compatibilità</small>
                        </div>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="card bg-success text-white">
                        <div class="card-body text-center">
                            <h4>${report.summary.browsers?.length || 3}</h4>
                            <small>Browser Testati</small>
                        </div>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="card bg-info text-white">
                        <div class="card-body text-center">
                            <h4>${report.summary.visualConsistency}</h4>
                            <small>Consistenza Visiva</small>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="mb-4">
            <h5><i class="fas fa-images me-2"></i>Test Risultati</h5>
            <div class="accordion" id="crossBrowserAccordion">
    `;
    
    report.testResults.forEach((test, index) => {
        const browsers = Object.keys(test.browser_results || {});
        content += `
            <div class="accordion-item">
                <h2 class="accordion-header">
                    <button class="accordion-button ${index === 0 ? '' : 'collapsed'}" type="button" data-bs-toggle="collapse" data-bs-target="#crossCollapse${index}">
                        <div class="d-flex w-100 justify-content-between">
                            <div>
                                <span class="badge ${test.status === 'PASS' ? 'bg-success' : 'bg-danger'} me-2">${test.status}</span>
                                <strong>${test.name}</strong>
                            </div>
                            <small class="text-muted">${test.compatibility_score}% compatibilità</small>
                        </div>
                    </button>
                </h2>
                <div id="crossCollapse${index}" class="accordion-collapse collapse ${index === 0 ? 'show' : ''}">
                    <div class="accordion-body">
                        <p class="mb-3 text-muted">${test.description}</p>
                        
                        <div class="row">
                            ${browsers.map(browser => `
                                <div class="col-md-4 mb-3">
                                    <div class="card h-100">
                                        <div class="card-header text-center">
                                            <strong>${browser.charAt(0).toUpperCase() + browser.slice(1)}</strong>
                                            <span class="badge ${test.browser_results[browser].passed ? 'bg-success' : 'bg-danger'} ms-2">
                                                ${test.browser_results[browser].passed ? '✓' : '✗'}
                                            </span>
                                        </div>
                                        <div class="card-body p-2">
                                            <div class="screenshot-container position-relative mb-2">
                                                <img src="http://101.58.39.17:3017/api/test/screenshot/${browser}/${test.browser_results[browser].screenshot}" 
                                                     alt="${browser} screenshot" 
                                                     class="img-fluid rounded border screenshot-img"
                                                     style="height: 150px; width: 100%; object-fit: cover; cursor: pointer;"
                                                     onclick="openImageModal('${test.browser_results[browser].screenshot}', '${browser}', '${test.name}')">
                                                <div class="screenshot-overlay position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center" 
                                                     style="background: rgba(0,0,0,0.7); opacity: 0; transition: opacity 0.3s; cursor: pointer;"
                                                     onmouseenter="this.style.opacity='1'"
                                                     onmouseleave="this.style.opacity='0'"
                                                     onclick="openImageModal('${test.browser_results[browser].screenshot}', '${browser}', '${test.name}')">
                                                    <i class="fas fa-search-plus fa-lg text-white"></i>
                                                </div>
                                            </div>
                                            <div class="small">
                                                <div><strong>Dimensione:</strong> ${test.browser_results[browser].fileSize}</div>
                                                <div><strong>Render:</strong> ${test.browser_results[browser].renderTime}</div>
                                                ${test.browser_results[browser].issues && test.browser_results[browser].issues.length > 0 ? `
                                                    <div class="mt-1">
                                                        <strong class="text-warning">Issues:</strong>
                                                        <ul class="list-unstyled mb-0">
                                                            ${test.browser_results[browser].issues.map(issue => `<li class="small text-warning">• ${issue}</li>`).join('')}
                                                        </ul>
                                                    </div>
                                                ` : ''}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                        
                        <div class="mt-3">
                            <div class="card bg-light">
                                <div class="card-body text-center py-2">
                                    <div class="row">
                                        <div class="col-4">
                                            <div class="badge bg-primary">Score: ${test.compatibility_score}%</div>
                                        </div>
                                        <div class="col-4">
                                            <div class="badge ${test.status === 'PASS' ? 'bg-success' : 'bg-danger'}">${test.status}</div>
                                        </div>
                                        <div class="col-4">
                                            <div class="badge bg-info">
                                                ${browsers.filter(b => test.browser_results[b].passed).length}/${browsers.length} Browser OK
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    });
    
    content += `
            </div>
        </div>
    `;
    
    return content;
}

function createGenericTestDetails(report) {
    return `
        <div class="alert alert-info">
            <h6><i class="fas fa-info-circle me-2"></i>Test completato</h6>
            <p class="mb-0">Tipo: ${report.testType}</p>
            <p class="mb-0">Timestamp: ${new Date(report.timestamp).toLocaleString('it-IT')}</p>
        </div>
    `;
}

// Inizializza dashboard quando DOM è pronto
document.addEventListener('DOMContentLoaded', function() {
    window.dashboard = new MonitoringDashboard();
    
    // Listener per quando si clicca sulla tab README
    const readmeTab = document.getElementById('readme-tab');
    if (readmeTab) {
        readmeTab.addEventListener('shown.bs.tab', loadReadme);
    }
    
    // Se la tab README è già attiva al caricamento della pagina
    if (readmeTab && readmeTab.classList.contains('active')) {
        loadReadme();
    }
}); 