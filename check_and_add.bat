@echo off
cd /d "C:\Proj\S13P11C209"
echo "Checking git status..."
git status
echo "========================"
echo "Adding target/classes folder..."
git add SSAFY-DOCHI-BE/target/classes/
echo "Checking git status after add..."
git status
pause
