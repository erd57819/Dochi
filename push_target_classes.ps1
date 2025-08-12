Set-Location "C:\Proj\S13P11C209"
Write-Host "Current directory: $(Get-Location)"
Write-Host "Checking git status..."
git status
Write-Host "`n========================"
Write-Host "Adding SSAFY-DOCHI-BE/target/classes/ to git..."
git add "SSAFY-DOCHI-BE/target/classes/"
Write-Host "`nChecking status after add..."
git status
Write-Host "`n========================"
Write-Host "Committing..."
git commit -m "Add SSAFY-DOCHI-BE/target/classes folder"
Write-Host "`n========================"
Write-Host "Pushing to remote..."
git push origin master
Write-Host "Done!"
Read-Host "Press Enter to continue"
