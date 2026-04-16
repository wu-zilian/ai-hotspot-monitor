
Set objPPT = CreateObject("PowerPoint.Application")
objPPT.Visible = True
Set objPresentation = objPPT.Presentations.Open("D:\\Claude code\\ai-hotspot-monitor\\AI热点监控工具_项目分享.html")
objPresentation.SaveAs "D:\\Claude code\\ai-hotspot-monitor\\AI热点监控工具_项目分享.pptx", 24
objPresentation.Close
objPPT.Quit
Set objPPT = Nothing
