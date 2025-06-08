param(
    [string]$TestType = "all"
)

Write-Host "🧪 Avvio test ecommerce - Tipo: $TestType" -ForegroundColor Green

# Funzione per pulire i container
function Clean-Containers {
    Write-Host "🧹 Pulizia container di test..." -ForegroundColor Yellow
    docker-compose -f docker-compose-testing.yml down -v --remove-orphans
    docker system prune -f
}

# Funzione per avviare l'infrastruttura di test
function Start-TestInfrastructure {
    Write-Host "🚀 Avvio infrastruttura di test..." -ForegroundColor Blue
    docker-compose -f docker-compose-testing.yml up -d db-test backend-test
    Start-Sleep -Seconds 10
}

# Logica principale
$TestTypeLower = $TestType.ToLower()

if ($TestTypeLower -eq "clean") {
    Clean-Containers
    Write-Host "✅ Pulizia completata!" -ForegroundColor Green
    exit 0
}
elseif ($TestTypeLower -eq "unitari") {
    Write-Host "🔬 Esecuzione test unitari..." -ForegroundColor Cyan
    docker-compose -f docker-compose-testing.yml run --rm test-unitari
}
elseif ($TestTypeLower -eq "integrativi") {
    Start-TestInfrastructure
    Write-Host "🔗 Esecuzione test integrativi..." -ForegroundColor Cyan
    docker-compose -f docker-compose-testing.yml run --rm test-integrativi
}
elseif ($TestTypeLower -eq "frontend") {
    Start-TestInfrastructure
    Write-Host "🎨 Esecuzione test frontend..." -ForegroundColor Cyan
    docker-compose -f docker-compose-testing.yml up -d frontend-test
    Start-Sleep -Seconds 10
    docker-compose -f docker-compose-testing.yml run --rm test-frontend
}
elseif ($TestTypeLower -eq "performance") {
    Start-TestInfrastructure
    Write-Host "⚡ Esecuzione test performance..." -ForegroundColor Cyan
    docker-compose -f docker-compose-testing.yml run --rm test-performance
}
elseif ($TestTypeLower -eq "all") {
    Write-Host "🔬 Esecuzione test unitari..." -ForegroundColor Cyan
    docker-compose -f docker-compose-testing.yml run --rm test-unitari
    Start-TestInfrastructure
    Write-Host "🔗 Esecuzione test integrativi..." -ForegroundColor Cyan
    docker-compose -f docker-compose-testing.yml run --rm test-integrativi
    Write-Host "🎨 Esecuzione test frontend..." -ForegroundColor Cyan
    docker-compose -f docker-compose-testing.yml up -d frontend-test
    Start-Sleep -Seconds 10
    docker-compose -f docker-compose-testing.yml run --rm test-frontend
    Write-Host "⚡ Esecuzione test performance..." -ForegroundColor Cyan
    docker-compose -f docker-compose-testing.yml run --rm test-performance
}
else {
    Write-Host "❌ Tipo di test non valido: $TestType" -ForegroundColor Red
    Write-Host "Tipi disponibili: unitari, integrativi, frontend, performance, all, clean" -ForegroundColor Yellow
    exit 1
}

Write-Host "🎉 Test completati!" -ForegroundColor Green 