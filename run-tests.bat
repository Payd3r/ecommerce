@echo off
REM Script per eseguire i test su Windows

SET TEST_TYPE=%1
IF "%TEST_TYPE%"=="" SET TEST_TYPE=all

echo 🚀 ===== E-commerce Test Runner =====
echo.
echo Test disponibili:
echo   - unitari: Test unitari del backend
echo   - integrativi: Test integrativi del backend  
echo   - frontend: Test del frontend
echo   - performance: Test di performance e load testing
echo   - all: Tutti i test (default)
echo.
echo Esecuzione test: %TEST_TYPE%
echo.

REM Vai alla cartella Test
cd Test

REM Esegui i test con PowerShell
powershell -Command ".\RunTests.ps1 -TestType %TEST_TYPE% -Rebuild"

echo.
echo 🎉 Test completati!
echo 📁 Controlla i risultati JSON nella cartella Test\Output
echo.
pause 