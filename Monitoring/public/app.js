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
        
        // Fallback per aggiornamenti HTTP se WebSocket non funziona
        setInterval(() => {
            if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
                this.fetchMetricsHTTP();
            }
        }, 15000);
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
        this.updateSummaryCards(metrics);
        this.updateContainersList(metrics.docker);
        this.updateSystemInfo(metrics.system);
        this.updateStorageInfo(metrics.storage);
        this.updateCharts(metrics);
        this.updateLastUpdateTime(metrics.lastUpdate);
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

        let html = '';
        dockerMetrics.containers.forEach(container => {
            const statusClass = container.state === 'running' ? 'status-running' : 'status-stopped';
            const iconClass = container.state === 'running' ? 'fa-play-circle' : 'fa-stop-circle';
            
            html += `
                <div class="container-item">
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
                </div>
            `;
        });

        containersList.innerHTML = html;
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

        // Aggiorna CPU Chart
        if (this.charts.cpu) {
            this.charts.cpu.data.labels = [...this.metricsHistory.timestamps];
            this.charts.cpu.data.datasets[0].data = [...this.metricsHistory.cpu];
            this.charts.cpu.update('none');
        }

        // Aggiorna Memory Chart
        if (this.charts.memory) {
            this.charts.memory.data.labels = [...this.metricsHistory.timestamps];
            this.charts.memory.data.datasets[0].data = [...this.metricsHistory.memory];
            this.charts.memory.update('none');
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
        // Refresh button
        window.refreshData = () => {
            const refreshIcon = document.getElementById('refreshIcon');
            refreshIcon.classList.add('spinning');
            
            this.fetchMetricsHTTP();
            
            setTimeout(() => {
                refreshIcon.classList.remove('spinning');
            }, 1000);
        };
    }
}

// Initialize dashboard when page loads
document.addEventListener('DOMContentLoaded', () => {
    window.dashboard = new MonitoringDashboard();
}); 