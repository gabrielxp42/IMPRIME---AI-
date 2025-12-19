' Script VBScript para automação do Photoshop via COM
' Pode ser executado via CMD: cscript photoshop-com.vbs <Action> <FilePath> <OutputPath> [ActionName] [ActionSet]

Option Explicit

Dim Action, FilePath, OutputPath, ActionName, ActionSet
Dim psApp, doc, tiffOptions, actionSets, currentActionSet, actions
Dim i, j, actionExists

' Obter argumentos da linha de comando
If WScript.Arguments.Count < 3 Then
    WScript.Echo "Uso: cscript photoshop-com.vbs <Action> <FilePath> <OutputPath> [ActionName] [ActionSet]"
    WScript.Quit 1
End If

Action = WScript.Arguments(0)
FilePath = WScript.Arguments(1)
OutputPath = WScript.Arguments(2)
ActionName = "SPOTWHITE-PHOTOSHOP"
ActionSet = "Mask Processing Economy"

If WScript.Arguments.Count >= 4 Then
    ActionName = WScript.Arguments(3)
End If

If WScript.Arguments.Count >= 5 Then
    ActionSet = WScript.Arguments(4)
End If

On Error Resume Next

' Criar objeto COM do Photoshop
Set psApp = CreateObject("Photoshop.Application")

If Err.Number <> 0 Then
    WScript.Echo "ERROR:Erro ao criar objeto COM do Photoshop: " & Err.Description
    WScript.Quit 1
End If

If Action = "OpenAndProcess" Then
    On Error Resume Next
    
    ' Abrir arquivo
    Set doc = psApp.Open(FilePath)
    
    If Err.Number <> 0 Then
        WScript.Echo "ERROR:Erro ao abrir arquivo: " & Err.Description
        WScript.Quit 1
    End If
    
    ' Executar ação
    psApp.DoAction ActionName, ActionSet
    
    If Err.Number <> 0 Then
        WScript.Echo "ERROR:Erro ao executar ação: " & Err.Description
        doc.Close 2 ' 2 = DoNotSaveChanges
        WScript.Quit 1
    End If
    
    ' Salvar como TIFF com transparência
    Set tiffOptions = CreateObject("Photoshop.TiffSaveOptions")
    tiffOptions.Transparency = True
    tiffOptions.Compression = 1 ' LZW compression
    
    doc.SaveAs OutputPath, tiffOptions
    
    If Err.Number <> 0 Then
        WScript.Echo "ERROR:Erro ao salvar arquivo: " & Err.Description
        doc.Close 2
        WScript.Quit 1
    End If
    
    ' Fechar documento
    doc.Close 2 ' 2 = DoNotSaveChanges
    
    WScript.Echo "SUCCESS:" & OutputPath
    
ElseIf Action = "CheckAction" Then
    On Error Resume Next
    
    actionExists = False
    Set actionSets = psApp.ActionSets
    
    If Err.Number <> 0 Then
        WScript.Echo "ERROR:Erro ao acessar ActionSets: " & Err.Description
        WScript.Quit 1
    End If
    
    For i = 1 To actionSets.Count
        Set currentActionSet = actionSets.Item(i)
        If currentActionSet.Name = ActionSet Then
            Set actions = currentActionSet.Actions
            For j = 1 To actions.Count
                If actions.Item(j).Name = ActionName Then
                    actionExists = True
                    Exit For
                End If
            Next
            If actionExists Then Exit For
        End If
    Next
    
    If actionExists Then
        WScript.Echo "EXISTS"
    Else
        WScript.Echo "NOT_FOUND"
    End If
    
Else
    WScript.Echo "ERROR:Ação desconhecida: " & Action
    WScript.Quit 1
End If

' Limpar objetos
Set tiffOptions = Nothing
Set doc = Nothing
Set psApp = Nothing
Set actionSets = Nothing
Set currentActionSet = Nothing
Set actions = Nothing

