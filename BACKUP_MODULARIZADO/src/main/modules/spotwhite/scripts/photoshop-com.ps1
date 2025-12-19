# Script PowerShell para automação do Photoshop via COM
param(
    [string]$Action,
    [string]$FilePath,
    [string]$OutputPath,
    [string]$ActionName = "SPOTWHITE-PHOTOSHOP",
    [string]$ActionSet = "Mask Processing Economy"
)

try {
    # Criar objeto COM do Photoshop
    $psApp = New-Object -ComObject Photoshop.Application
    
    if ($Action -eq "OpenAndProcess") {
        # Abrir arquivo
        $doc = $psApp.Open($FilePath)
        
        # Executar ação
        try {
            $psApp.DoAction($ActionName, $ActionSet)
        } catch {
            Write-Error "Erro ao executar ação: $_"
            $doc.Close(2) # 2 = DoNotSaveChanges
            exit 1
        }
        
        # Salvar como TIFF com transparência
        $tiffOptions = New-Object -ComObject Photoshop.TiffSaveOptions
        $tiffOptions.Transparency = $true
        $tiffOptions.Compression = 1 # LZW compression
        
        $doc.SaveAs($OutputPath, $tiffOptions)
        
        # Fechar documento
        $doc.Close(2) # 2 = DoNotSaveChanges
        
        Write-Output "SUCCESS:$OutputPath"
    } elseif ($Action -eq "CheckAction") {
        # Verificar se a ação existe
        $actionExists = $false
        try {
            $actionSets = $psApp.ActionSets
            for ($i = 1; $i -le $actionSets.Count; $i++) {
                $actionSet = $actionSets.Item($i)
                if ($actionSet.Name -eq $ActionSet) {
                    $actions = $actionSet.Actions
                    for ($j = 1; $j -le $actions.Count; $j++) {
                        if ($actions.Item($j).Name -eq $ActionName) {
                            $actionExists = $true
                            break
                        }
                    }
                }
            }
        } catch {
            Write-Output "ERROR:$_"
            exit 1
        }
        
        if ($actionExists) {
            Write-Output "EXISTS"
        } else {
            Write-Output "NOT_FOUND"
        }
    }
    
} catch {
    Write-Error "Erro COM: $_"
    exit 1
}


