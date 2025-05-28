param (
    [Parameter(Mandatory=$false)]
    [ValidateSet("integrativi", "unitari", "frontend", "all")]
    [string]$TestType = "all",
    
    [Parameter(Mandatory=$false)]
    [switch]$Rebuild = $false
)

Write-Host "===== Avvio dei Test E-commerce =====" -ForegroundColor Green

# Definiamo i percorsi per i file di log
$integrativiLogPath = "Backend-Integrativi/test-output.log"
$unitariLogPath = "Backend-Unitari/test-output.log"
$frontendLogPath = "Frontend/test-output.log"

# Funzione per eseguire un test specifico
function Run-Test {
    param (
        [string]$ServiceName,
        [string]$LogPath
    )
    
    # Rimuovi eventuali file di log precedenti
    if (Test-Path "$PSScriptRoot\$LogPath") {
        try {
            Remove-Item "$PSScriptRoot\$LogPath" -Force -ErrorAction Stop
        } catch {
            Write-Host "Impossibile rimuovere il file di log, potrebbe essere in uso. Continuo comunque..." -ForegroundColor Yellow
        }
        Start-Sleep -Milliseconds 500
    }
    
    # Vai nella directory principale del progetto
    $projectRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
    Set-Location $projectRoot
    
    Write-Host "Esecuzione test $ServiceName..." -ForegroundColor Yellow
    
    try {
        # Crea directory per il log se non esiste
        $logDir = Split-Path -Parent "$PSScriptRoot\$LogPath"
        if (!(Test-Path $logDir)) {
            New-Item -ItemType Directory -Path $logDir -Force | Out-Null
        }
        
        # Esegui il container con docker-compose run
        $cmd = "docker-compose run --rm $ServiceName | Out-String"
        Write-Host "Comando: $cmd" -ForegroundColor Gray
        
        # Esegui il comando e filtra l'output
        $output = Invoke-Expression $cmd
        
        # Filtra il messaggio "Container xyz Running" e altri messaggi di sistema
        $filteredOutput = $output -replace "(?m)^\s*Container\s+[^\s]+\s+Running\s*$", "" `
                                   -replace "(?m)^In riga:[0-9]+ car:[0-9]+", "" `
                                   -replace "(?m)^\s*\+\s+[^\n]+", "" `
                                   -replace "(?m)^\s*\+\s+CategoryInfo[^\n]+", "" `
                                   -replace "(?m)^\s*\+\s+FullyQualifiedErrorId[^\n]+", ""
        
        # Salva l'output filtrato nel file di log
        $filteredOutput | Out-File -FilePath "$PSScriptRoot\$LogPath" -Force
        
        # Mostra l'output filtrato a schermo
        $filteredOutput
        
        # Verifica se il log è stato creato
        if (Test-Path "$PSScriptRoot\$LogPath") {
            Write-Host "Test $ServiceName completato. Log salvato in: $PSScriptRoot\$LogPath" -ForegroundColor Green
        } else {
            Write-Host "Test $ServiceName completato ma il file di log non è stato creato." -ForegroundColor Yellow
        }
    }
    catch {
        Write-Host "Errore durante l'esecuzione dei test $ServiceName" -ForegroundColor Red
        Write-Host $_.Exception.Message -ForegroundColor Red
    }
    
    # Torna alla directory dello script
    Set-Location $PSScriptRoot
}

# Se è stato richiesto il rebuild
if ($Rebuild) {
    Write-Host "Ricostruzione di tutti i container di test..." -ForegroundColor Yellow
    $projectRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
    Set-Location $projectRoot
    
    switch ($TestType) {
        "integrativi" {
            Invoke-Expression "docker-compose build --no-cache test-integrativi"
        }
        "unitari" {
            Invoke-Expression "docker-compose build --no-cache test-unitari"
        }
        "frontend" {
            Invoke-Expression "docker-compose build --no-cache test-frontend"
        }
        "all" {
            Invoke-Expression "docker-compose build --no-cache test-integrativi test-unitari test-frontend"
        }
    }
    
    Set-Location $PSScriptRoot
}

# Esegui i test in base al parametro
switch ($TestType) {
    "integrativi" {
        Run-Test -ServiceName "test-integrativi" -LogPath $integrativiLogPath
    }
    "unitari" {
        Run-Test -ServiceName "test-unitari" -LogPath $unitariLogPath
    }
    "frontend" {
        Run-Test -ServiceName "test-frontend" -LogPath $frontendLogPath
    }
    "all" {
        # Esegui tutti i test in sequenza
        Write-Host "Esecuzione di tutti i test..." -ForegroundColor Magenta
        
        Run-Test -ServiceName "test-integrativi" -LogPath $integrativiLogPath
        Run-Test -ServiceName "test-unitari" -LogPath $unitariLogPath
        Run-Test -ServiceName "test-frontend" -LogPath $frontendLogPath
        
        Write-Host "Tutti i test sono stati completati." -ForegroundColor Green
    }
} 