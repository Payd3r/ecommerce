class MonitoringDashboard {
    constructor() {
        this.ws = null;
        this.reconnectInterval = null;
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
        this.bindEvents();
        
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

        let html = '';
        dockerMetrics.containers.forEach((container, idx) => {
            const statusClass = container.state === 'running' ? 'status-running' : 'status-stopped';
            const iconClass = container.state === 'running' ? 'fa-play-circle' : 'fa-stop-circle';
            const expanded = window.expandedContainerName === container.name;
            html += `
                <div class="container-item container-expandable${expanded ? ' expanded' : ''}" data-container-name="${container.name}" id="container-item-${idx}">
                    <div class="row align-items-center">
                        <div class="col-md-4">
                            <h6><i class="fas ${iconClass} me-2"></i>${container.name}</h6>
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
        });
        containersList.innerHTML = html;

        // Gestione click per espansione log
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
                // Salva posizione scroll log
                let prevScroll = 0;
                const prevLog = logSection.querySelector('.log-container');
                if (prevLog) prevScroll = prevLog.scrollTop;
                logSection.innerHTML = '<div class="log-container">Caricamento log...</div>';
                try {
                    const res = await fetch(`/api/container/${containerName}/logs?lines=100`);
                    const text = await res.text();
                    logSection.innerHTML = `<div class=\"log-container\"><pre>${text.replace(/</g, '&lt;')}</pre></div>`;
                    // Ripristina posizione scroll log
                    const logDiv = logSection.querySelector('.log-container');
                    if (logDiv) {
                        requestAnimationFrame(() => { logDiv.scrollTop = prevScroll; });
                    }
                } catch (err) {
                    logSection.innerHTML = '<div class="log-container">Errore nel caricamento log</div>';
                }
            });
        });

        // Se c'è un container espanso, carica i log (anche dopo refresh)
        if (window.expandedContainerName) {
            const expandedItem = document.querySelector(`.container-expandable[data-container-name='${window.expandedContainerName}']`);
            if (expandedItem) {
                const logSection = expandedItem.querySelector('.log-section');
                if (logSection && !logSection.innerHTML) {
                    // Salva posizione scroll log
                    let prevScroll = 0;
                    const prevLog = logSection.querySelector('.log-container');
                    if (prevLog) prevScroll = prevLog.scrollTop;
                    logSection.innerHTML = '<div class="log-container">Caricamento log...</div>';
                    fetch(`/api/container/${window.expandedContainerName}/logs?lines=100`)
                        .then(res => res.text())
                        .then(text => {
                            logSection.innerHTML = `<div class=\"log-container\"><pre>${text.replace(/</g, '&lt;')}</pre></div>`;
                            // Ripristina posizione scroll log
                            const logDiv = logSection.querySelector('.log-container');
                            if (logDiv) {
                                requestAnimationFrame(() => { logDiv.scrollTop = prevScroll; });
                            }
                        })
                        .catch(() => {
                            logSection.innerHTML = '<div class="log-container">Errore nel caricamento log</div>';
                        });
                }
            }
        }
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
            const response = await fetch('/api/test/reports');
            if (!response.ok) {
                throw new Error(`Errore recupero report: ${response.statusText}`);
            }
            
            const reports = await response.json();
            const reportsList = document.getElementById('testReportsList');
            
            if (reportsList) {
                reportsList.innerHTML = '';
                
                if (reports.length === 0) {
                    reportsList.innerHTML = '<li class="list-group-item">Nessun report disponibile</li>';
                    return;
                }
                
                reports.forEach(report => {
                    const li = document.createElement('li');
                    li.className = 'list-group-item';
                    
                    const statusIcon = report.status === 'success' ? '✅' : '❌';
                    const statusClass = report.status === 'success' ? 'text-success' : 'text-danger';
                    
                    li.innerHTML = `
                        <div class="d-flex justify-content-between align-items-center">
                            <div>
                                <span class="${statusClass}">${statusIcon}</span>
                                <strong>${report.testType}</strong>
                                <small class="text-muted ms-2">${new Date(report.timestamp).toLocaleString()}</small>
                            </div>
                            <div>
                                <span class="badge ${statusClass}">${report.summary.passed}/${report.summary.total} test passati</span>
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
        const testBanner = document.getElementById('testBanner');
        testBanner.textContent = `🧪 Esecuzione test ${testType} in corso...`;
        testBanner.style.display = 'block';
        
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

        // Aggiorna la lista dei report
        await loadTestReports();

        // Mostra il messaggio di successo
        testBanner.textContent = `✅ Test ${testType} completati con successo!`;
        testBanner.style.backgroundColor = '#4CAF50';
        
        // Nascondi il banner dopo 3 secondi
        setTimeout(() => {
            testBanner.style.display = 'none';
            testBanner.style.backgroundColor = '#2196F3';
        }, 3000);

    } catch (error) {
        console.error('Errore test:', error);
        
        // Mostra il messaggio di errore
        const testBanner = document.getElementById('testBanner');
        testBanner.textContent = `❌ Errore durante l'esecuzione dei test: ${error.message}`;
        testBanner.style.backgroundColor = '#f44336';
        
        // Nascondi il banner dopo 5 secondi
        setTimeout(() => {
            testBanner.style.display = 'none';
            testBanner.style.backgroundColor = '#2196F3';
        }, 5000);
    } finally {
        // Riabilita il pulsante
        const testButton = document.querySelector(`button[onclick="runTest('${testType}')"]`);
        if (testButton) {
            testButton.disabled = false;
        }
    }
}

// Funzione per aggiornare la lista dei report
async function loadTestReports() {
    try {
        const response = await fetch('/api/test/reports');
        if (!response.ok) {
            throw new Error(`Errore recupero report: ${response.statusText}`);
        }
        
        const reports = await response.json();
        const reportsList = document.getElementById('testReportsList');
        
        if (reportsList) {
            reportsList.innerHTML = '';
            
            if (reports.length === 0) {
                reportsList.innerHTML = '<li class="list-group-item">Nessun report disponibile</li>';
                return;
            }
            
            reports.forEach(report => {
                const li = document.createElement('li');
                li.className = 'list-group-item';
                
                const statusIcon = report.status === 'success' ? '✅' : '❌';
                const statusClass = report.status === 'success' ? 'text-success' : 'text-danger';
                
                li.innerHTML = `
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <span class="${statusClass}">${statusIcon}</span>
                            <strong>${report.testType}</strong>
                            <small class="text-muted ms-2">${new Date(report.timestamp).toLocaleString()}</small>
                        </div>
                        <div>
                            <span class="badge ${statusClass}">${report.summary.passed}/${report.summary.total} test passati</span>
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
        const modalBody = modal.querySelector('.modal-body');
        
        // Popola il modal con i dettagli del test
        modalBody.innerHTML = `
            <div class="mb-3">
                <h5>Riepilogo</h5>
                <p>Test: ${report.testType}</p>
                <p>Data: ${new Date(report.timestamp).toLocaleString()}</p>
                <p>Stato: ${report.status === 'success' ? '✅ Successo' : '❌ Fallito'}</p>
                <p>Durata: ${report.duration}</p>
            </div>
            
            <div class="mb-3">
                <h5>Dettagli Test</h5>
                <ul class="list-group">
                    ${report.details.map(detail => `
                        <li class="list-group-item d-flex justify-content-between align-items-center">
                            <span>${detail.name}</span>
                            <span class="badge ${detail.status === 'passed' ? 'bg-success' : 'bg-danger'}">
                                ${detail.status === 'passed' ? '✅' : '❌'} ${detail.duration}
                            </span>
                        </li>
                    `).join('')}
                </ul>
            </div>
            
            ${report.output ? `
                <div class="mb-3">
                    <h5>Output</h5>
                    <pre class="bg-light p-3 rounded">${report.output}</pre>
                </div>
            ` : ''}
            
            ${report.errors ? `
                <div class="mb-3">
                    <h5>Errori</h5>
                    <pre class="bg-danger text-white p-3 rounded">${report.errors}</pre>
                </div>
            ` : ''}
        `;
        
        // Mostra il modal
        const modalInstance = new bootstrap.Modal(modal);
        modalInstance.show();
    } catch (error) {
        console.error('Errore visualizzazione dettagli:', error);
        alert(`Errore visualizzazione dettagli: ${error.message}`);
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

// Inizializza dashboard quando DOM è pronto
document.addEventListener('DOMContentLoaded', function() {
    window.dashboard = new MonitoringDashboard();
}); 