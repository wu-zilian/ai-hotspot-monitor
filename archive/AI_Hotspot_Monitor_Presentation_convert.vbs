
Set objPPT = CreateObject("PowerPoint.Application")
objPPT.Visible = True
Set objPresentation = objPPT.Presentations.Open("D:\\Claude code\\ai-hotspot-monitor\\AI_Hotspot_Monitor_Presentation.html")
objPresentation.SaveAs "D:\\Claude code\\ai-hotspot-monitor\\AI_Hotspot_Monitor_Presentation.pptx", 24
objPresentation.Close
objPPT.Quit
Set objPPT = Nothing
MsgBox "PPTX file created successfully!", 0, "Conversion Complete"
