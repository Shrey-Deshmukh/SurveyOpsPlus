# prerequisite.ps1 — Checks Windows system for SurveyOpsPlus backend requirements

$missing = @()

Write-Host "`nChecking SurveyOpsPlus Backend Prerequisites...`n" -ForegroundColor Cyan

# Python
try {
    $pyVersion = python --version 2>&1
    $pyNum = $pyVersion -replace "Python ", ""
    $parts = $pyNum.Split(".")
    if ([int]$parts[0] -ge 3 -and [int]$parts[1] -ge 10) {
        Write-Host "[OK] Python found: $pyVersion" -ForegroundColor Green
    } else {
        Write-Host "[FAIL] Python 3.10+ required. Found: $pyVersion" -ForegroundColor Red
        $missing += "Python (3.10+)"
    }
} catch {
    Write-Host "[MISSING] Python not found." -ForegroundColor Red
    $missing += "Python (3.10+)"
}

# Docker
try {
    $dockerVersion = docker --version 2>&1
    Write-Host "[OK] Docker found: $dockerVersion" -ForegroundColor Green
} catch {
    Write-Host "[MISSING] Docker not found." -ForegroundColor Red
    $missing += "Docker"
}

# Docker Compose
try {
    $composeVersion = docker compose version 2>&1
    Write-Host "[OK] Docker Compose found: $composeVersion" -ForegroundColor Green
} catch {
    Write-Host "[MISSING] Docker Compose not found." -ForegroundColor Red
    $missing += "Docker Compose"
}

# Git
try {
    $gitVersion = git --version 2>&1
    Write-Host "[OK] Git found: $gitVersion" -ForegroundColor Green
} catch {
    Write-Host "[MISSING] Git not found." -ForegroundColor Red
    $missing += "Git"
}

# pip
try {
    $pipVersion = pip --version 2>&1
    Write-Host "[OK] pip found: $pipVersion" -ForegroundColor Green
} catch {
    Write-Host "[MISSING] pip not found." -ForegroundColor Red
    $missing += "pip"
}

Write-Host ""
if ($missing.Count -eq 0) {
    Write-Host "All prerequisites met. You are good to go!" -ForegroundColor Green
} else {
    Write-Host "The following prerequisites are missing:" -ForegroundColor Red
    foreach ($item in $missing) {
        Write-Host "  - $item" -ForegroundColor Red
    }
    Write-Host ""
    Write-Host "Please install the missing tools before continuing." -ForegroundColor Red
}