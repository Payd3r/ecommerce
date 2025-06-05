const Docker = require('dockerode');
const docker = new Docker({ socketPath: '/var/run/docker.sock' });

async function getDockerMetrics() {
  try {
    const containers = await docker.listContainers({ all: true });
    const containerMetrics = [];

    for (const containerInfo of containers) {
      try {
        const container = docker.getContainer(containerInfo.Id);
        const stats = containerInfo.State === 'running' 
          ? await container.stats({ stream: false }) 
          : null;
        
        const containerData = {
          id: containerInfo.Id.substring(0, 12),
          name: containerInfo.Names[0].replace('/', ''),
          image: containerInfo.Image,
          state: containerInfo.State,
          status: containerInfo.Status,
          created: new Date(containerInfo.Created * 1000),
          ports: containerInfo.Ports || [],
          labels: containerInfo.Labels || {},
          command: containerInfo.Command
        };

        if (stats && containerInfo.State === 'running') {
          // Calcola utilizzo CPU
          const cpuUsage = calculateCPUUsage(stats);
          
          // Calcola utilizzo memoria
          const memoryUsage = {
            used: stats.memory_stats.usage || 0,
            limit: stats.memory_stats.limit || 0,
            percentage: stats.memory_stats.limit ? 
              ((stats.memory_stats.usage || 0) / stats.memory_stats.limit * 100).toFixed(2) : 0
          };

          // Calcola I/O di rete
          const networkIO = calculateNetworkIO(stats);
          
          // Calcola I/O del disco
          const diskIO = calculateDiskIO(stats);

          containerData.metrics = {
            cpu: cpuUsage,
            memory: memoryUsage,
            network: networkIO,
            disk: diskIO,
            timestamp: new Date()
          };
        }

        containerMetrics.push(containerData);
      } catch (error) {
        console.error(`Errore nel recupero metriche per container ${containerInfo.Names[0]}:`, error.message);
      }
    }

    // Statistiche generali
    const runningContainers = containerMetrics.filter(c => c.state === 'running').length;
    const totalContainers = containerMetrics.length;

    return {
      containers: containerMetrics,
      summary: {
        total: totalContainers,
        running: runningContainers,
        stopped: totalContainers - runningContainers,
        timestamp: new Date()
      }
    };

  } catch (error) {
    console.error('Errore nel recupero metriche Docker:', error);
    return {
      containers: [],
      summary: {
        total: 0,
        running: 0,
        stopped: 0,
        error: error.message,
        timestamp: new Date()
      }
    };
  }
}

function calculateCPUUsage(stats) {
  try {
    const cpuDelta = (stats.cpu_stats.cpu_usage?.total_usage || 0) - 
                     (stats.precpu_stats.cpu_usage?.total_usage || 0);
    const systemDelta = (stats.cpu_stats.system_cpu_usage || 0) - 
                        (stats.precpu_stats.system_cpu_usage || 0);
    
    const numberOfCores = stats.cpu_stats.online_cpus || 1;
    
    if (systemDelta > 0 && cpuDelta > 0) {
      const cpuUsagePercent = (cpuDelta / systemDelta) * numberOfCores * 100;
      return parseFloat(cpuUsagePercent.toFixed(2));
    }
    
    return 0;
  } catch (error) {
    return 0;
  }
}

function calculateNetworkIO(stats) {
  try {
    let rxBytes = 0;
    let txBytes = 0;

    if (stats.networks) {
      Object.values(stats.networks).forEach(network => {
        rxBytes += network.rx_bytes || 0;
        txBytes += network.tx_bytes || 0;
      });
    }

    return {
      rxBytes,
      txBytes,
      rxMB: (rxBytes / 1024 / 1024).toFixed(2),
      txMB: (txBytes / 1024 / 1024).toFixed(2)
    };
  } catch (error) {
    return { rxBytes: 0, txBytes: 0, rxMB: '0.00', txMB: '0.00' };
  }
}

function calculateDiskIO(stats) {
  try {
    let readBytes = 0;
    let writeBytes = 0;

    if (stats.blkio_stats?.io_service_bytes_recursive) {
      stats.blkio_stats.io_service_bytes_recursive.forEach(io => {
        if (io.op === 'Read') readBytes += io.value || 0;
        if (io.op === 'Write') writeBytes += io.value || 0;
      });
    }

    return {
      readBytes,
      writeBytes,
      readMB: (readBytes / 1024 / 1024).toFixed(2),
      writeMB: (writeBytes / 1024 / 1024).toFixed(2)
    };
  } catch (error) {
    return { readBytes: 0, writeBytes: 0, readMB: '0.00', writeMB: '0.00' };
  }
}

module.exports = {
  getDockerMetrics
}; 