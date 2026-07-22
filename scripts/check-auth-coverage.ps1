# check-auth-coverage.ps1
# Build-time check: verifies that every route handler under protected directories
# imports requireAuth or requireAdmin from lib/session.ts.
#
# Run: .\scripts\check-auth-coverage.ps1
# Exit code 0 = pass, 1 = fail (missing auth import).

$ErrorActionPreference = "Stop"

$adminRoutes = Get-ChildItem -Path "app\admin" -Recurse -Filter "route.ts" -ErrorAction SilentlyContinue
$dashboardRoutes = Get-ChildItem -Path "app\(dashboard)" -Recurse -Filter "route.ts" -ErrorAction SilentlyContinue
$apiAdminRoutes = Get-ChildItem -Path "app\api" -Recurse -Filter "route.ts" -ErrorAction SilentlyContinue | Where-Object { $_.FullName -match "admin" }

$failed = @()

foreach ($file in @($adminRoutes) + @($dashboardRoutes) + @($apiAdminRoutes)) {
    $content = Get-Content $file.FullName -Raw
    $needsAdmin = $file.FullName -match "admin"
    $needsAuth = $needsAdmin -or $file.FullName -match "dashboard"

    if ($needsAdmin -and $content -notmatch "requireAdmin") {
        $failed += "$($file.FullName) — missing requireAdmin import"
    }
    elseif ($needsAuth -and $content -notmatch "requireAuth") {
        $failed += "$($file.FullName) — missing requireAuth import"
    }
}

if ($failed.Count -gt 0) {
    Write-Host "`nAUTH COVERAGE CHECK FAILED:`n" -ForegroundColor Red
    $failed | ForEach-Object { Write-Host "  - $_" -ForegroundColor Yellow }
    Write-Host "`nEvery route handler under app/admin/ and app/(dashboard)/ must import requireAdmin/requireAuth." -ForegroundColor Gray
    exit 1
}

Write-Host "AUTH COVERAGE CHECK PASSED — all route handlers have auth imports." -ForegroundColor Green
exit 0
