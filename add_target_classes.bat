@echo off
cd /d "C:\Proj\S13P11C209"
echo "Adding SSAFY-DOCHI-BE/target/classes to git..."
git add SSAFY-DOCHI-BE/target/classes/
git status
echo "Committing..."
git commit -m "Add SSAFY-DOCHI-BE/target/classes folder"
echo "Pushing to origin..."
git push origin master
echo "Done!"
pause
