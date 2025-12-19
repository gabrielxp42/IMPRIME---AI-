# Script para copiar imagens para a pasta assets
$sourceDir = Get-Location
$targetDir = Join-Path $sourceDir "src\renderer\src\assets"

# Criar pasta se não existir
if (-not (Test-Path $targetDir)) {
    New-Item -ItemType Directory -Path $targetDir -Force | Out-Null
}

# Copiar imagens
$images = @("MODOECONOMI.png", "SPOTWHITEPADRAO.png")

foreach ($image in $images) {
    $sourcePath = Join-Path $sourceDir $image
    $targetPath = Join-Path $targetDir $image
    
    if (Test-Path $sourcePath) {
        Copy-Item $sourcePath $targetPath -Force
        Write-Host "Copiado: $image"
    } else {
        Write-Host "Arquivo não encontrado: $image"
    }
}

Write-Host "Concluído!"
