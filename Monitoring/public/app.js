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
        // // NEW SECTION: Gestione Dati
        const btnBackup = document.getElementById('btnBackup');
        if (btnBackup) btnBackup.onclick = async () => {
            btnBackup.disabled = true;
            btnBackup.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Backup';
            try {
                const res = await fetch('/api/backup');
                if (!res.ok) throw new Error('Errore backup');
                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = res.headers.get('Content-Disposition')?.split('filename=')[1] || 'media-backup.zip';
                document.body.appendChild(a);
                a.click();
                a.remove();
                showDataToast('Backup completato!', 'success');
            } catch (e) {
                showDataToast('Errore backup', 'danger');
            }
            btnBackup.disabled = false;
            btnBackup.innerHTML = '<i class="fas fa-download me-1"></i>Backup';
        };
        const btnRestore = document.getElementById('btnRestore');
        if (btnRestore) btnRestore.onclick = async () => {
            if (!confirm('Sei sicuro di voler ripristinare lo stato iniziale?')) return;
            btnRestore.disabled = true;
            btnRestore.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Ripristina';
            try {
                const res = await fetch('/api/restore-clean-build', { method: 'POST' });
                if (!res.ok) throw new Error('Errore restore');
                showDataToast('Ripristino completato!', 'success');
            } catch (e) {
                showDataToast('Errore ripristino', 'danger');
            }
            btnRestore.disabled = false;
            btnRestore.innerHTML = '<i class="fas fa-undo me-1"></i>Ripristina';
        };
        const formImport = document.getElementById('formImport');
        if (formImport) formImport.onsubmit = async (e) => {
            e.preventDefault();
            const input = document.getElementById('inputImport');
            if (!input.files.length) return;
            const btn = formImport.querySelector('button[type=submit]');
            btn.disabled = true;
            btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Importa';
            const fd = new FormData(formImport);
            try {
                const res = await fetch('/api/import-backup', { method: 'POST', body: fd });
                if (!res.ok) throw new Error('Errore import');
                showDataToast('Import completato!', 'success');
            } catch (e) {
                showDataToast('Errore import', 'danger');
            }
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-upload me-1"></i>Importa';
        };
        function showDataToast(msg, type) {
            const toast = document.getElementById('dataToast');
            const toastMsg = document.getElementById('dataToastMsg');
            toastMsg.textContent = msg;
            toast.className = `toast align-items-center text-bg-${type} border-0 position-fixed bottom-0 end-0 m-4`;
            toast.style.display = 'block';
            setTimeout(() => { toast.style.display = 'none'; }, 4000);
        }
        // // NEW SECTION: Test
        const btnRunTest = document.getElementById('btnRunTest');
        const testOutput = document.getElementById('testOutput');
        const testStatus = document.getElementById('testStatus');
        if (btnRunTest) btnRunTest.onclick = async () => {
            btnRunTest.disabled = true;
            testOutput.textContent = '';
            testStatus.textContent = '';
            testStatus.className = 'badge ms-2';
            try {
                await fetch('/api/run-test', { method: 'POST' });
            } catch (e) {
                testOutput.textContent = 'Errore avvio test';
                testStatus.textContent = 'Errore';
                testStatus.className = 'badge bg-danger ms-2';
                btnRunTest.disabled = false;
            }
        };
        // WebSocket per output test/task
        if (!window.taskWSBound) {
            window.taskWSBound = true;
            const origWS = this.ws;
            const self = this;
            this.ws.addEventListener('message', function(event) {
                try {
                    const data = JSON.parse(event.data);
                    if (data.type === 'tasks' && data.data) {
                        if (data.data.event === 'test') {
                            if (data.data.stream) {
                                testOutput.textContent += data.data.stream;
                                testOutput.scrollTop = testOutput.scrollHeight;
                            }
                            if (data.data.status) {
                                if (data.data.status === 'success') {
                                    testStatus.textContent = 'Successo';
                                    testStatus.className = 'badge bg-success ms-2';
                                } else if (data.data.status === 'fail') {
                                    testStatus.textContent = 'Fallito';
                                    testStatus.className = 'badge bg-danger ms-2';
                                }
                                btnRunTest.disabled = false;
                            }
                        } else if (data.data.event === 'restore') {
                            showDataToast('Ripristino completato!', 'success');
                        } else if (data.data.event === 'import') {
                            showDataToast('Import completato!', 'success');
                        }
                    }
                } catch (e) {}
            });
        }
    }
}

// Initialize dashboard when page loads
document.addEventListener('DOMContentLoaded', () => {
    window.dashboard = new MonitoringDashboard();
}); 