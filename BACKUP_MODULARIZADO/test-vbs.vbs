' Script de teste para verificar ação no Photoshop
Option Explicit

Dim psApp, actionSets, currentActionSet, actions
Dim i, j, foundAction, foundSet

On Error Resume Next

' Criar objeto COM do Photoshop
Set psApp = CreateObject("Photoshop.Application")

If Err.Number <> 0 Then
    WScript.Echo "ERROR:Erro ao criar objeto COM do Photoshop: " & Err.Description
    WScript.Quit 1
End If

WScript.Echo "Photoshop conectado com sucesso!"
WScript.Echo "Procurando ação 'SPOTWHITE-PHOTOSHOP'..."

Set actionSets = psApp.ActionSets
WScript.Echo "Total de conjuntos: " & actionSets.Count

foundAction = False
For i = 1 To actionSets.Count
    Set currentActionSet = actionSets.Item(i)
    WScript.Echo "Conjunto " & i & ": " & currentActionSet.Name
    
    ' Verificar se é DTF
    If currentActionSet.Name = "DTF" Then
        WScript.Echo "  -> Encontrou conjunto DTF!"
        Set actions = currentActionSet.Actions
        WScript.Echo "  -> Total de ações no DTF: " & actions.Count
        
        For j = 1 To actions.Count
            Dim actionName
            actionName = actions.Item(j).Name
            WScript.Echo "    Ação " & j & ": " & actionName
            
            If actionName = "SPOTWHITE-PHOTOSHOP" Then
                foundAction = True
                foundSet = currentActionSet.Name
                WScript.Echo "  -> *** AÇÃO ENCONTRADA! ***"
                Exit For
            End If
        Next
    End If
    
    If foundAction Then Exit For
Next

If foundAction Then
    WScript.Echo "SUCCESS: Ação encontrada no conjunto: " & foundSet
Else
    WScript.Echo "NOT_FOUND: Ação não encontrada"
End If

Set psApp = Nothing
Set actionSets = Nothing
Set currentActionSet = Nothing
Set actions = Nothing

