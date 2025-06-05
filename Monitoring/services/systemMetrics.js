const si = require('systeminformation');

async function getSystemMetrics() {
  try {
    const [cpu, memory, disk, network, osInfo, processes] = await Promise.all([
      si.cpu(),
      si.mem(),
      si.fsSize(),
      si.networkStats(),
      si.osInfo(),
      si.processes()
    ]);

    // Informazioni CPU
    const cpuInfo = {
      manufacturer: cpu.manufacturer,
      brand: cpu.brand,
      cores: cpu.cores,
      physicalCores: cpu.physicalCores,
      speed: cpu.speed,
      governor: cpu.governor
    };

    // Utilizzo CPU corrente
    const cpuLoad = await si.currentLoad();
    const cpuUsage = {
      currentLoad: parseFloat(cpuLoad.currentLoad.toFixed(2)),
      currentLoadUser: parseFloat(cpuLoad.currentLoadUser.toFixed(2)),
      currentLoadSystem: parseFloat(cpuLoad.currentLoadSystem.toFixed(2)),
      currentLoadNice: parseFloat(cpuLoad.currentLoadNice.toFixed(2)),
      currentLoadIdle: parseFloat(cpuLoad.currentLoadIdle.toFixed(2)),
      cpus: cpuLoad.cpus.map(cpu => ({
        load: parseFloat(cpu.load.toFixed(2)),
        loadUser: parseFloat(cpu.loadUser.toFixed(2)),
        loadSystem: parseFloat(cpu.loadSystem.toFixed(2))
      }))
    };

    // Utilizzo memoria
    const memoryInfo = {
      total: memory.total,
      free: memory.free,
      used: memory.used,
      active: memory.active,
      available: memory.available,
      buffers: memory.buffers,
      cached: memory.cached,
      slab: memory.slab,
      swapTotal: memory.swaptotal,
      swapUsed: memory.swapused,
      swapFree: memory.swapfree,
      usage: {
        totalGB: (memory.total / 1024 / 1024 / 1024).toFixed(2),
        usedGB: (memory.used / 1024 / 1024 / 1024).toFixed(2),
        freeGB: (memory.free / 1024 / 1024 / 1024).toFixed(2),
        usagePercent: ((memory.used / memory.total) * 100).toFixed(2)
      }
    };

    // Utilizzo disco
    const diskInfo = disk.map(fs => ({
      fs: fs.fs,
      type: fs.type,
      size: fs.size,
      used: fs.used,
      available: fs.available,
      use: fs.use,
      mount: fs.mount,
      usage: {
        sizeGB: (fs.size / 1024 / 1024 / 1024).toFixed(2),
        usedGB: (fs.used / 1024 / 1024 / 1024).toFixed(2),
        availableGB: (fs.available / 1024 / 1024 / 1024).toFixed(2),
        usagePercent: fs.use
      }
    }));

    // Informazioni rete
    const networkInfo = network.map(net => ({
      iface: net.iface,
      operstate: net.operstate,
      rx_bytes: net.rx_bytes,
      tx_bytes: net.tx_bytes,
      rx_sec: net.rx_sec,
      tx_sec: net.tx_sec,
      ms: net.ms
    }));

    // Informazioni sistema operativo
    const systemInfo = {
      platform: osInfo.platform,
      distro: osInfo.distro,
      release: osInfo.release,
      codename: osInfo.codename,
      kernel: osInfo.kernel,
      arch: osInfo.arch,
      hostname: osInfo.hostname,
      fqdn: osInfo.fqdn,
      codepage: osInfo.codepage,
      logofile: osInfo.logofile,
      serial: osInfo.serial,
      build: osInfo.build,
      servicepack: osInfo.servicepack,
      uefi: osInfo.uefi
    };

    // Top processi per CPU
    const topProcesses = processes.list
      .sort((a, b) => b.pcpu - a.pcpu)
      .slice(0, 10)
      .map(proc => ({
        pid: proc.pid,
        name: proc.name,
        cpu: proc.pcpu,
        memory: proc.pmem,
        priority: proc.priority,
        nice: proc.nice,
        started: proc.started,
        state: proc.state,
        tty: proc.tty,
        user: proc.user,
        command: proc.command
      }));

    return {
      cpu: {
        info: cpuInfo,
        usage: cpuUsage
      },
      memory: memoryInfo,
      disk: diskInfo,
      network: networkInfo,
      system: systemInfo,
      processes: {
        running: processes.running,
        blocked: processes.blocked,
        sleeping: processes.sleeping,
        unknown: processes.unknown,
        total: processes.all,
        top: topProcesses
      },
      timestamp: new Date()
    };

  } catch (error) {
    console.error('Errore nel recupero metriche di sistema:', error);
    return {
      error: error.message,
      timestamp: new Date()
    };
  }
}

module.exports = {
  getSystemMetrics
}; 