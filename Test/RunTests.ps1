param (
    [Parameter(Mandatory=$false)]
    [ValidateSet("all", "unitari", "integrativi", "frontend", "performance")]
    [string]$TestType = "all",
    
    [Parameter(Mandatory=$false)]
    [switch]$Rebuild = $false,
    
    [Parameter(Mandatory=$false)]
    [switch]$CleanDb = $false
)

Write-Host "===== E-commerce Test System =====" -ForegroundColor Green

$projectRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
Set-Location $projectRoot

$outputDir = "$PSScriptRoot\Output"
if (-not (Test-Path $outputDir)) {
    New-Item -ItemType Directory -Path $outputDir -Force | Out-Null
    Write-Host "Created output directory" -ForegroundColor Gray
}

function Manage-TestDatabase {
    param([string]$Action)
    
    switch ($Action) {
        "start" {
            Write-Host "Starting test database..." -ForegroundColor Cyan
            $dbRunning = Invoke-Expression "docker-compose -f docker-compose-testing.yml ps -q mariadb-test-db" 2>$null
            if (-not $dbRunning) {
                Invoke-Expression "docker-compose -f docker-compose-testing.yml up -d mariadb-test-db" | Out-Null
                Write-Host "Waiting for DB initialization..." -ForegroundColor Yellow
                Start-Sleep -Seconds 10
            } else {
                Write-Host "Test DB already running" -ForegroundColor Green
            }
        }
        "reset" {
            Write-Host "Resetting test database..." -ForegroundColor Cyan
            try {
                Invoke-Expression "docker-compose -f docker-compose-testing.yml rm -f mariadb-test-db" | Out-Null
                Invoke-Expression "docker volume rm ecommerce_mariadb-test-data" -ErrorAction SilentlyContinue | Out-Null
            } catch {}
            Invoke-Expression "docker-compose -f docker-compose-testing.yml up -d mariadb-test-db" | Out-Null
            Start-Sleep -Seconds 15
        }
        "stop" {
            Write-Host "Stopping test database..." -ForegroundColor Gray
            try {
                Invoke-Expression "docker-compose -f docker-compose-testing.yml rm -f mariadb-test-db" | Out-Null
            } catch {}
        }
    }
}

function Run-Test {
    param (
        [string]$TestName,
        [string]$ServiceName,
        [string]$ResultFile
    )
    
    Write-Host "Running $TestName tests..." -ForegroundColor Yellow
    
    try {
        if ($Rebuild) {
            Write-Host "Rebuilding $ServiceName image..." -ForegroundColor Cyan
            Invoke-Expression "docker-compose -f docker-compose-testing.yml build --no-cache $ServiceName" | Out-Null
        }
        
        try {
            Invoke-Expression "docker-compose -f docker-compose-testing.yml rm -f $ServiceName" -ErrorAction SilentlyContinue | Out-Null
        } catch {}
        
        if ($ServiceName -eq "test-integrativi" -or $ServiceName -eq "test-performance") {
            if ($CleanDb) {
                Manage-TestDatabase -Action "reset"
            } else {
                Manage-TestDatabase -Action "start"
            }
        }
        
        $testCmd = "docker-compose -f docker-compose-testing.yml run --rm $ServiceName"
        Write-Host "   Command: $testCmd" -ForegroundColor Gray
        
        $output = Invoke-Expression $testCmd 2>&1
        
        $filteredOutput = $output | Where-Object { 
            $_ -notmatch "Container\s+.*\s+Running" -and
            $_ -notmatch "Creating\s+.*" -and
            $_ -notmatch "Removing\s+.*" -and
            $_ -notmatch "^$"
        }
        
        $filteredOutput | ForEach-Object { Write-Host $_ }
        
        $jsonFile = "$outputDir\$ResultFile"
        if (Test-Path $jsonFile) {
            $fileInfo = Get-Item $jsonFile
            $fileSize = [math]::Round($fileInfo.Length / 1KB, 2)
            Write-Host "$TestName tests completed. Results: $jsonFile ($fileSize KB)" -ForegroundColor Green
            
            try {
                $results = Get-Content $jsonFile | ConvertFrom-Json
                $summary = $results.summary
                if ($summary.success) {
                    Write-Host "Result: $($summary.numPassedTests)/$($summary.numTotalTests) passed [SUCCESS]" -ForegroundColor Green
                } else {
                    Write-Host "Result: $($summary.numPassedTests)/$($summary.numTotalTests) passed, $($summary.numFailedTests) failed [FAILURE]" -ForegroundColor Red
                }
            } catch {
                Write-Host "Results file created but summary unavailable" -ForegroundColor Yellow
            }
        } else {
            Write-Host "$TestName tests completed but no JSON results found" -ForegroundColor Yellow
        }
        
        try {
            Invoke-Expression "docker-compose -f docker-compose-testing.yml rm -f $ServiceName" -ErrorAction SilentlyContinue | Out-Null
        } catch {}
        
    } catch {
        Write-Host "Error running $TestName tests" -ForegroundColor Red
        Write-Host $_.Exception.Message -ForegroundColor Red
    }
}

function Clear-PreviousResults {
    param([string]$Type)
    
    $filesToRemove = @()
    
    switch ($Type) {
        "integrativi" { $filesToRemove += "$outputDir\backend-integrativi-results.json" }
        "unitari" { $filesToRemove += "$outputDir\backend-unitari-results.json" }
        "frontend" { $filesToRemove += "$outputDir\frontend-results.json" }
        "performance" { $filesToRemove += "$outputDir\performance-results.json" }
        "all" { 
            $filesToRemove += "$outputDir\backend-integrativi-results.json"
            $filesToRemove += "$outputDir\backend-unitari-results.json"
            $filesToRemove += "$outputDir\frontend-results.json"
            $filesToRemove += "$outputDir\performance-results.json"
        }
    }
    
    foreach ($file in $filesToRemove) {
        if (Test-Path $file) {
            Remove-Item $file -Force
            Write-Host "Removed previous result: $(Split-Path $file -Leaf)" -ForegroundColor Gray
        }
    }
}

Clear-PreviousResults -Type $TestType

switch ($TestType) {
    "integrativi" {
        Run-Test -TestName "Backend Integration" -ServiceName "test-integrativi" -ResultFile "backend-integrativi-results.json"
    }
    "unitari" {
        Run-Test -TestName "Backend Unit" -ServiceName "test-unitari" -ResultFile "backend-unitari-results.json"
    }
    "frontend" {
        Run-Test -TestName "Frontend" -ServiceName "test-frontend" -ResultFile "frontend-results.json"
    }
    "performance" {
        Run-Test -TestName "Performance" -ServiceName "test-performance" -ResultFile "performance-results.json"
    }
    "all" {
        Write-Host "Running complete test suite..." -ForegroundColor Magenta
        
        Run-Test -TestName "Backend Unit" -ServiceName "test-unitari" -ResultFile "backend-unitari-results.json"
        Write-Host ""
        
        Run-Test -TestName "Backend Integration" -ServiceName "test-integrativi" -ResultFile "backend-integrativi-results.json"
        Write-Host ""
        
        Run-Test -TestName "Frontend" -ServiceName "test-frontend" -ResultFile "frontend-results.json"
        Write-Host ""
        
        Run-Test -TestName "Performance" -ServiceName "test-performance" -ResultFile "performance-results.json"
        
        Write-Host ""
        Write-Host "All tests completed!" -ForegroundColor Green
        Write-Host "Detailed results available in Test\Output directory" -ForegroundColor Green
        
        Write-Host ""
        Write-Host "=== FINAL SUMMARY ===" -ForegroundColor Cyan
        
        $resultFiles = @(
            @{Name="Backend Unit"; File="backend-unitari-results.json"},
            @{Name="Backend Integration"; File="backend-integrativi-results.json"},
            @{Name="Frontend"; File="frontend-results.json"},
            @{Name="Performance"; File="performance-results.json"}
        )

        foreach ($result in $resultFiles) {
            $filePath = "$outputDir\$($result.File)"
            if (Test-Path $filePath) {
                try {
                    $data = Get-Content $filePath | ConvertFrom-Json
                    $status = if ($data.summary.success) { "PASS" } else { "FAIL" }
                    $color = if ($data.summary.success) { "Green" } else { "Red" }
                    Write-Host "$($result.Name): $($data.summary.numPassedTests)/$($data.summary.numTotalTests) [$status]" -ForegroundColor $color
                } catch {
                    Write-Host "$($result.Name): Result parsing failed" -ForegroundColor Yellow
                }
            } else {
                Write-Host "$($result.Name): No results file found" -ForegroundColor Yellow
            }
        }
    }
}

Set-Location $PSScriptRoot

Write-Host ""
Write-Host "Test execution completed!" -ForegroundColor Green 