# Script temporário para adicionar controles avançados
$file = "c:\Users\Direct\Videos\automação photoshop2\src\renderer\src\components\UpscaylView.tsx"
$content = Get-Content $file -Raw

# Encontrar a linha com preview-toolbar e adicionar os novos controles antes
$newControls = @"
            {/* Controles Avançados de Remoção de Fundo */}
            {inputPath && (
                <div className="bg-removal-advanced-controls">
                    <div className="advanced-control-item">
                        <label className="checkbox-label">
                            <input
                                type="checkbox"
                                checked={removeInternalBlacks}
                                onChange={(e) => setRemoveInternalBlacks(e.target.checked)}
                                disabled={processing || removingBg}
                            />
                            <span>✂️ Remover pretos internos também</span>
                        </label>
                    </div>

                    {removeInternalBlacks && (
                        <div className="advanced-control-item">
                            <label className="slider-label">
                                <span>Sensibilidade de Preto: <strong>{blackThreshold}</strong></span>
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    value={blackThreshold}
                                    onChange={(e) => setBlackThreshold(parseInt(e.target.value))}
                                    disabled={processing || removingBg}
                                    className="black-threshold-slider"
                                />
                                <div className="slider-labels">
                                    <span>Menos (0)</span>
                                    <span>Mais (100)</span>
                                </div>
                            </label>
                        </div>
                    )}
                </div>
            )}

"@

# Substituir a posição antes do <div className="upscayl-preview">
$content = $content -replace '(\s+<div className="upscayl-preview">)', "$newControls`$1"

Set-Content -Path $file -Value $content -NoNewline
