"""
Script de simulação para testar a geração de código JSX
Valida a lógica dos scripts sem precisar do Photoshop real
"""

import re
import os

def simulate_halftone_indexcolor_jsx(input_file=None, output_file="test_output.tiff", lpi=30):
    """
    Simula a geração do script JSX para halftone IndexColor
    Como seria gerado pelo TypeScript
    """
    normalized_output = output_file.replace('\\', '/')
    use_active_document = input_file is None
    
    # Calcular dither amount baseado no LPI
    dither_amount = max(30, min(100, 100 - (lpi - 25) * 2))
    
    if use_active_document:
        open_document_code = """// Usar documento ativo
        if (app.documents.length === 0) {
            throw new Error("Nenhum documento aberto no Photoshop.");
        }
        doc = app.activeDocument;"""
        close_document_code = "// Não fechar documento ativo, apenas salvar"
    else:
        normalized_input = input_file.replace('\\', '/')
        open_document_code = f"""// Abrir arquivo
        var inputFile = new File("{normalized_input}");
        if (!inputFile.exists) {
            throw new Error("Arquivo não encontrado: " + "{normalized_input}");
        }
        doc = app.open(inputFile);"""
        close_document_code = "doc.close(SaveOptions.DONOTSAVECHANGES);"
    
    jsx_script = f"""// Script para Halftone Indexed Color - {lpi} LPI
(function() {{
    var doc = null;
    try {{
        app.displayDialogs = DialogModes.NO;
        
        {open_document_code}
        
        // Converter para RGB se necessário (Indexed Color requer RGB primeiro)
        if (doc.mode !== DocumentMode.RGB) {{
            doc.changeMode(ChangeMode.RGB);
        }}
        
        // Aplicar halftone pattern usando Indexed Color
        var indexedOptions = new IndexedConversionOptions();
        
        // Configurar opções baseadas no LPI
        // Palette: LOCAL (ADAPTIVE) para melhor qualidade
        indexedOptions.palette = Palette.LOCALADAPTIVE;
        
        // Colors: 256 cores (padrão para halftone)
        indexedOptions.colors = 256;
        
        // Dither: DIFFUSION para halftone suave
        indexedOptions.dither = Dither.DIFFUSION;
        
        // Amount: ajustar baseado no LPI
        indexedOptions.ditherAmount = {dither_amount};
        
        // Converter para Indexed Color
        doc.changeMode(ChangeMode.INDEXEDCOLOR, indexedOptions);
        
        // Converter de volta para RGB para manter qualidade e transparência
        doc.changeMode(ChangeMode.RGB);
        
        // Salvar como TIFF
        var outputFile = new File("{normalized_output}");
        var outputFolder = outputFile.parent;
        if (!outputFolder.exists) {{
            outputFolder.create();
        }}
        
        var tiffOptions = new TiffSaveOptions();
        tiffOptions.transparency = true;
        tiffOptions.compression = TIFFEncoding.NONE;
        
        doc.saveAs(outputFile, tiffOptions);
        {close_document_code}
        
        return "SUCCESS";
    }} catch (error) {{
        try {{
            if (doc && !{str(use_active_document).lower()}) {{
                doc.close(SaveOptions.DONOTSAVECHANGES);
            }}
        }} catch (e) {{}}
        return "ERROR:" + error.toString();
    }}
}})();"""
    
    return jsx_script

def simulate_halftone_hybrid_jsx(input_file=None, output_file="test_output.tiff", lpi=35):
    """
    Simula a geração do script JSX para halftone Híbrido
    """
    normalized_output = output_file.replace('\\', '/')
    use_active_document = input_file is None
    
    # Para híbrido, usar dither mais suave
    dither_amount = max(20, min(80, 80 - (lpi - 30) * 1.5))
    
    if use_active_document:
        open_document_code = """// Usar documento ativo
        if (app.documents.length === 0) {
            throw new Error("Nenhum documento aberto no Photoshop.");
        }
        doc = app.activeDocument;"""
        close_document_code = "// Não fechar documento ativo, apenas salvar"
    else:
        normalized_input = input_file.replace('\\', '/')
        open_document_code = f"""// Abrir arquivo
        var inputFile = new File("{normalized_input}");
        if (!inputFile.exists) {
            throw new Error("Arquivo não encontrado: " + "{normalized_input}");
        }
        doc = app.open(inputFile);"""
        close_document_code = "doc.close(SaveOptions.DONOTSAVECHANGES);"
    
    jsx_script = f"""// Script para Halftone Híbrido - {lpi} LPI
(function() {{
    var doc = null;
    try {{
        app.displayDialogs = DialogModes.NO;
        
        {open_document_code}
        
        // Converter para RGB se necessário
        if (doc.mode !== DocumentMode.RGB) {{
            doc.changeMode(ChangeMode.RGB);
        }}
        
        // Processamento Híbrido: combina Indexed Color com ajustes adicionais
        
        // 2. Converter para Indexed Color com configurações otimizadas para híbrido
        var indexedOptions = new IndexedConversionOptions();
        indexedOptions.palette = Palette.LOCALADAPTIVE;
        indexedOptions.colors = 256;
        
        // Para híbrido, usar NOISE dither (mais suave que DIFFUSION)
        indexedOptions.dither = Dither.NOISE;
        indexedOptions.ditherAmount = {dither_amount};
        
        doc.changeMode(ChangeMode.INDEXEDCOLOR, indexedOptions);
        
        // 3. Converter de volta para RGB
        doc.changeMode(ChangeMode.RGB);
        
        // Salvar como TIFF
        var outputFile = new File("{normalized_output}");
        var outputFolder = outputFile.parent;
        if (!outputFolder.exists) {{
            outputFolder.create();
        }}
        
        var tiffOptions = new TiffSaveOptions();
        tiffOptions.transparency = true;
        tiffOptions.compression = TIFFEncoding.NONE;
        
        doc.saveAs(outputFile, tiffOptions);
        {close_document_code}
        
        return "SUCCESS";
    }} catch (error) {{
        try {{
            if (doc && !{str(use_active_document).lower()}) {{
                doc.close(SaveOptions.DONOTSAVECHANGES);
            }}
        }} catch (e) {{}}
        return "ERROR:" + error.toString();
    }}
}})();"""
    
    return jsx_script

def validate_jsx_script(jsx_code, test_name):
    """
    Valida a estrutura do script JSX gerado
    """
    print(f"\n{'='*60}")
    print(f"TESTE: {test_name}")
    print(f"{'='*60}")
    
    errors = []
    warnings = []
    
    # Verificar estrutura básica
    if "app.displayDialogs = DialogModes.NO" not in jsx_code:
        errors.append("❌ Falta: app.displayDialogs = DialogModes.NO")
    else:
        print("✓ app.displayDialogs configurado")
    
    # Verificar se usa documento ativo ou abre arquivo
    if "app.activeDocument" in jsx_code:
        print("✓ Usa documento ativo (app.activeDocument)")
        if "app.documents.length === 0" in jsx_code:
            print("✓ Verifica se há documentos abertos")
    elif "app.open" in jsx_code:
        print("✓ Abre arquivo (app.open)")
        if "inputFile.exists" in jsx_code:
            print("✓ Verifica se arquivo existe")
    else:
        errors.append("❌ Não detecta uso de documento ativo nem abertura de arquivo")
    
    # Verificar conversão RGB
    if "doc.changeMode(ChangeMode.RGB)" in jsx_code:
        print("✓ Converte para RGB")
    else:
        warnings.append("⚠ Pode não converter para RGB")
    
    # Verificar IndexedColor
    if "ChangeMode.INDEXEDCOLOR" in jsx_code:
        print("✓ Converte para IndexedColor")
        if "IndexedConversionOptions" in jsx_code:
            print("✓ Usa IndexedConversionOptions")
        if "Palette.LOCALADAPTIVE" in jsx_code:
            print("✓ Usa Palette.LOCALADAPTIVE")
        if "DitherType" in jsx_code:
            print("✓ Configura DitherType")
    else:
        errors.append("❌ Não converte para IndexedColor")
    
    # Verificar salvamento
    if "doc.saveAs" in jsx_code:
        print("✓ Salva arquivo (doc.saveAs)")
        if "TiffSaveOptions" in jsx_code:
            print("✓ Usa TiffSaveOptions")
        if "transparency = true" in jsx_code:
            print("✓ Mantém transparência")
    else:
        errors.append("❌ Não salva arquivo")
    
    # Verificar tratamento de erro
    if "try {" in jsx_code and "catch (error)" in jsx_code:
        print("✓ Tem tratamento de erro")
    else:
        warnings.append("⚠ Pode não ter tratamento de erro adequado")
    
    # Verificar se não fecha documento ativo quando usa documento ativo
    if "app.activeDocument" in jsx_code:
        if "doc.close" not in jsx_code or "// Não fechar documento ativo" in jsx_code:
            print("✓ Não fecha documento ativo (correto)")
        else:
            errors.append("❌ Fecha documento ativo quando não deveria")
    
    # Verificar retorno
    if 'return "SUCCESS"' in jsx_code:
        print("✓ Retorna SUCCESS em caso de sucesso")
    if 'return "ERROR:"' in jsx_code:
        print("✓ Retorna ERROR em caso de erro")
    
    # Mostrar resultado
    print(f"\n{'='*60}")
    if errors:
        print("❌ ERROS ENCONTRADOS:")
        for error in errors:
            print(f"  {error}")
        return False
    elif warnings:
        print("⚠ AVISOS:")
        for warning in warnings:
            print(f"  {warning}")
        print("\n✅ Script válido (com avisos)")
        return True
    else:
        print("✅ SCRIPT VÁLIDO - Todos os testes passaram!")
        return True

def test_all_scenarios():
    """
    Testa todos os cenários possíveis
    """
    print("\n" + "="*60)
    print("SIMULAÇÃO DE TESTES - Geração de Scripts JSX")
    print("="*60)
    
    results = []
    
    # TESTE 1: IndexColor com documento ativo
    print("\n[TESTE 1] IndexColor - Documento Ativo (null input)")
    jsx1 = simulate_halftone_indexcolor_jsx(
        input_file=None,
        output_file="C:/Users/Test/Desktop/output_30lpi.tiff",
        lpi=30
    )
    result1 = validate_jsx_script(jsx1, "IndexColor - Documento Ativo")
    results.append(("IndexColor - Documento Ativo", result1))
    
    # TESTE 2: IndexColor com arquivo
    print("\n[TESTE 2] IndexColor - Abrir Arquivo")
    jsx2 = simulate_halftone_indexcolor_jsx(
        input_file="C:/Users/Test/Desktop/input.png",
        output_file="C:/Users/Test/Desktop/output_30lpi.tiff",
        lpi=30
    )
    result2 = validate_jsx_script(jsx2, "IndexColor - Abrir Arquivo")
    results.append(("IndexColor - Abrir Arquivo", result2))
    
    # TESTE 3: Híbrido com documento ativo
    print("\n[TESTE 3] Híbrido - Documento Ativo (null input)")
    jsx3 = simulate_halftone_hybrid_jsx(
        input_file=None,
        output_file="C:/Users/Test/Desktop/output_hybrid_35lpi.tiff",
        lpi=35
    )
    result3 = validate_jsx_script(jsx3, "Híbrido - Documento Ativo")
    results.append(("Híbrido - Documento Ativo", result3))
    
    # TESTE 4: Híbrido com arquivo
    print("\n[TESTE 4] Híbrido - Abrir Arquivo")
    jsx4 = simulate_halftone_hybrid_jsx(
        input_file="C:/Users/Test/Desktop/input.png",
        output_file="C:/Users/Test/Desktop/output_hybrid_35lpi.tiff",
        lpi=35
    )
    result4 = validate_jsx_script(jsx4, "Híbrido - Abrir Arquivo")
    results.append(("Híbrido - Abrir Arquivo", result4))
    
    # TESTE 5: Diferentes valores de LPI
    print("\n[TESTE 5] IndexColor - Diferentes LPIs")
    for lpi in [25, 30, 35, 45]:
        jsx = simulate_halftone_indexcolor_jsx(
            input_file=None,
            output_file=f"C:/Users/Test/Desktop/output_{lpi}lpi.tiff",
            lpi=lpi
        )
        dither_match = re.search(r'ditherAmount = (\d+)', jsx)
        if dither_match:
            dither = dither_match.group(1)
            print(f"  LPI {lpi}: ditherAmount = {dither} ✓")
    
    # Resumo final
    print("\n" + "="*60)
    print("RESUMO DOS TESTES")
    print("="*60)
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for name, result in results:
        status = "✅ PASSOU" if result else "❌ FALHOU"
        print(f"{status}: {name}")
    
    print(f"\nTotal: {passed}/{total} testes passaram")
    
    if passed == total:
        print("\n🎉 TODOS OS TESTES PASSARAM!")
        print("Os scripts JSX estão sendo gerados corretamente.")
        return True
    else:
        print(f"\n⚠ {total - passed} teste(s) falharam. Verifique os erros acima.")
        return False

if __name__ == "__main__":
    success = test_all_scenarios()
    
    # Salvar exemplos de scripts gerados
    print("\n" + "="*60)
    print("SALVANDO EXEMPLOS DE SCRIPTS GERADOS...")
    print("="*60)
    
    os.makedirs("test_output", exist_ok=True)
    
    # Exemplo 1: Documento ativo
    jsx_active = simulate_halftone_indexcolor_jsx(
        input_file=None,
        output_file="C:/Users/Test/Desktop/output.tiff",
        lpi=30
    )
    with open("test_output/example_active_document.jsx", "w", encoding="utf-8") as f:
        f.write(jsx_active)
    print("✓ Salvo: test_output/example_active_document.jsx")
    
    # Exemplo 2: Abrir arquivo
    jsx_file = simulate_halftone_indexcolor_jsx(
        input_file="C:/Users/Test/Desktop/input.png",
        output_file="C:/Users/Test/Desktop/output.tiff",
        lpi=30
    )
    with open("test_output/example_open_file.jsx", "w", encoding="utf-8") as f:
        f.write(jsx_file)
    print("✓ Salvo: test_output/example_open_file.jsx")
    
    print("\n✅ Simulação concluída!")
    print("\nVocê pode verificar os scripts gerados em: test_output/")
    
    exit(0 if success else 1)

