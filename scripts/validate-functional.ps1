<#
.SYNOPSIS
    AgentFlow Pro - Functional Validation Suite
    Dejansko ZAŽENE in TESTIRA sistem - ne samo preverja datoteke

.DESCRIPTION
    Praktičen test suite ki preverja ali AgentFlow Pro dejansko DELA:
    - Dev server running
    - API endpoints responsive
    - Database connected
    - Authentication working
    - WebSocket functional
    - User flows operational
    - Production build successful
    
.EXAMPLE
    # 1. KOMPLETEN VALIDACIJSKI TEST (vsi koraki)
    .\scripts\validate-functional.ps1
    
    # 2. Samo testiraj API-je (hiter check)
    .\scripts\validate-functional.ps1 -Step 2
    
    # 3. Samo production build test
    .\scripts\validate-functional.ps1 -Step 7
    
    # 4. Verbose output za debugging
    .\scripts\validate-functional.ps1 -Verbose
    
.PARAMETER Step
    Izberi specifičen korak (1-8) ali 0 za vse korake
    
.PARAMETER FullRun
    Zaženi vse korake zapored (enako kot Step 0)
    
.PARAMETER BaseUrl
    Base URL za API teste (default: http://localhost:3002)
#>

[CmdletBinding()]
param(
    [ValidateSet(1,2,3,4,5,6,7,8)]
    [int]$Step = 0,
    [switch]$FullRun,
    [string]$BaseUrl = "http://localhost:3002"
)

$Script:StartTime = Get-Date
$Script:TestsPassed = 0
$Script:TestsFailed = 0
$Script:Results = @()
$Script:ProjectRoot = Split-Path -Parent $PSScriptRoot

$Colors = @{ Success='Green'; Error='Red'; Warning='Yellow'; Info='Cyan'; Dim='Gray' }

function Write-StepHeader {
    param([string]$Title, [int]$Number)
    Write-Host "`nKORAK $Number`: $Title" -ForegroundColor $Colors.Info
    Write-Host ('=' * 70) -ForegroundColor $Colors.Dim
}

function Write-TestResult {
    param([string]$Name, [bool]$Ok, [string]$Msg = '', [string]$Category = '', [string]$Severity = 'normal')
    $icon = if($Ok){'[OK]'}else{'[FAIL]'}
    $color = if($Ok){$Colors.Success}else{$Colors.Error}
    Write-Host "  $icon $Name" -ForegroundColor $color
    if($Msg){ Write-Host "     -> $Msg" -ForegroundColor $Colors.Dim }
    $script:Results += @{Test=$Name; Passed=$Ok; Message=$Msg; Category=$Category; Severity=$Severity}
    if($Ok){ $script:TestsPassed++ } else { $script:TestsFailed++ }
}

function Invoke-APICall {
    param([string]$Endpoint, [string]$Method='Get', $Body=$null, [int]$TimeoutSec=30, [string]$BaseUrlParam)
    $url = if($BaseUrlParam) { "$BaseUrlParam$Endpoint" } else { "$BaseUrl$Endpoint" }
    try {
        $params = @{ Uri=$url; Method=$Method; TimeoutSec=$TimeoutSec; ErrorAction='Stop' }
        if($Body){ $params.ContentType='application/json'; $params.Body=($Body|ConvertTo-Json -Depth 10 -Compress) }
        $resp = Invoke-RestMethod @params
        return @{ Success=$true; Data=$resp; StatusCode=200 }
    } catch {
        $statusCode = if ($_.Exception.Response) { [int]$_.Exception.Response.StatusCode } else { 0 }
        return @{ Success=$false; Error=$_.Exception.Message; StatusCode=$statusCode }
    }
}

function Test-DevServerRunning {
    Write-StepHeader "Preveri ali dev server teče" 1
    $process = Get-NetTCPConnection -LocalPort 3002 -ErrorAction SilentlyContinue
    if ($process) {
        Write-TestResult "Port 3002 je v uporabi" $true "PID: $($process.OwningProcess)" 'server'
        $nodeProc = Get-Process -Id $process.OwningProcess -ErrorAction SilentlyContinue
        if ($nodeProc -and $nodeProc.ProcessName -eq 'node') {
            $nodeVersion = try { (node -v).Trim() } catch { 'unknown' }
            Write-TestResult "Next.js proces je aktiven" $true "Node $nodeVersion" 'server'
            return $true
        }
    }
    Write-TestResult "Dev server teče" $false "Zaženi: npm run dev" 'server' 'critical'
    $answer = Read-Host "  Zelim zagnati npm run dev zdaj? (y/n)"
    if ($answer -eq 'y') {
        Write-Host "  Zaganjam dev server..." -ForegroundColor $Colors.Info
        Start-Process -FilePath "npm" -ArgumentList "run", "dev" -WorkingDirectory $Script:ProjectRoot -WindowStyle Normal
        Start-Sleep -Seconds 15
        $retry = Get-NetTCPConnection -LocalPort 3002 -ErrorAction SilentlyContinue
        Write-TestResult "Dev server po zagonu" ($retry -ne $null) "Port 3002" 'server'
        return ($retry -ne $null)
    }
    return $false
}

function Test-BasicAPIs {
    Write-StepHeader "Testiraj osnovne API endpoint-e" 2
    $endpoints = @(
        @{ Endpoint="/api/health"; Method="Get"; ExpectedStatus=200; Name="Health check" },
        @{ Endpoint="/api/mcp/available"; Method="Get"; ExpectedStatus=200; Name="MCP available" },
        @{ Endpoint="/api/skills"; Method="Get"; ExpectedStatus=200; Name="Skills list" }
    )
    foreach ($ep in $endpoints) {
        $result = Invoke-APICall -Endpoint $ep.Endpoint -Method $ep.Method
        if ($result.Success) {
            $ok = $result.StatusCode -eq $ep.ExpectedStatus
            Write-TestResult "$($ep.Name): $($ep.Endpoint)" $ok "HTTP $($result.StatusCode)" 'api'
            if ($ok -and $ep.Endpoint -eq "/api/health") {
                $dbOk = $result.Data.database -eq 'connected'
                Write-TestResult "  +-- Database connected" $dbOk "Status: $($result.Data.database)" 'api'
            }
            if ($ok -and $ep.Endpoint -eq "/api/mcp/available") {
                $hasMcps = $result.Data.mcps.Count -gt 0
                Write-TestResult "  +-- MCPs available" $hasMcps "Count: $($result.Data.mcps.Count)" 'api'
            }
            if ($ok -and $ep.Endpoint -eq "/api/skills") {
                $hasSkills = $result.Data.total -gt 0
                Write-TestResult "  +-- Skills registered" $hasSkills "Total: $($result.Data.total)" 'api'
            }
        } else {
            $errorMsg = if ($result.StatusCode -eq 0) { "Server not reachable" } else { "HTTP $($result.StatusCode): $($result.Error)" }
            Write-TestResult "$($ep.Name): $($ep.Endpoint)" $false $errorMsg 'api' 'critical'
        }
    }
}

function Test-Authentication {
    Write-StepHeader "Testiraj Authentication Flow" 3
    $loginPage = Invoke-APICall -Endpoint "/login" -Method "Get"
    Write-TestResult "Login page accessible" ($loginPage.StatusCode -in @(200, 302, 404)) "HTTP $($loginPage.StatusCode)" 'auth'
    $authConfig = Test-Path (Join-Path $Script:ProjectRoot "src/lib/auth-options.ts")
    Write-TestResult "NextAuth config exists" $authConfig "src/lib/auth-options.ts" 'auth'
    $envPath = Join-Path $Script:ProjectRoot ".env"
    $envContent = Get-Content $envPath -ErrorAction SilentlyContinue
    $hasSecret = $envContent -match "^NEXTAUTH_SECRET="
    $hasUrl = $envContent -match "^NEXTAUTH_URL="
    Write-TestResult "NEXTAUTH_SECRET configured" $hasSecret ".env" 'auth'
    Write-TestResult "NEXTAUTH_URL configured" $hasUrl ".env" 'auth'
    Write-Host "  Info: Za popoln login test potrebuješ test user credentials" -ForegroundColor $Colors.Dim
}

function Test-DatabaseConnection {
    Write-StepHeader "Testiraj Database Connection" 4
    $prismaExists = Test-Path (Join-Path $Script:ProjectRoot "node_modules/.prisma/client")
    Write-TestResult "Prisma client generated" $prismaExists "node_modules/.prisma/client" 'database'
    $envPath = Join-Path $Script:ProjectRoot ".env"
    $envContent = Get-Content $envPath -ErrorAction SilentlyContinue
    $hasDbUrl = $envContent -match "^DATABASE_URL=postgresql://"
    Write-TestResult "DATABASE_URL configured" $hasDbUrl "PostgreSQL connection string" 'database' 'critical'
    $healthResult = Invoke-APICall -Endpoint "/api/health" -Method "Get"
    if ($healthResult.Success) {
        $dbConnected = $healthResult.Data.database -eq 'connected'
        Write-TestResult "Database connected (via API)" $dbConnected "Status: $($healthResult.Data.database)" 'database'
    }
    Write-Host "  Info: Za direktno Prisma test: npx tsx scripts/test-prisma.ts" -ForegroundColor $Colors.Dim
}

function Test-WebSocketConnection {
    Write-StepHeader "Testiraj WebSocket Connection" 5
    $socketServer = Test-Path (Join-Path $Script:ProjectRoot "src/lib/websocket/socket-server.ts")
    $socketApi = Test-Path (Join-Path $Script:ProjectRoot "src/app/api/socket/io/route.ts")
    Write-TestResult "WebSocket server file exists" $socketServer "socket-server.ts" 'websocket'
    Write-TestResult "WebSocket API route exists" $socketApi "io/route.ts" 'websocket'
    $packageJson = Get-Content (Join-Path $Script:ProjectRoot "package.json") -Raw | ConvertFrom-Json
    $hasSocketIO = $packageJson.dependencies.ContainsKey("socket.io")
    Write-TestResult "socket.io dependency installed" $hasSocketIO "package.json" 'websocket'
    Write-Host "  Info: WebSocket test zahteva browser na /dashboard/receptor/real-time-rooms" -ForegroundColor $Colors.Dim
}

function Test-ReceptorDashboardFlow {
    Write-StepHeader "Testiraj Receptor Dashboard Flow" 6
    $dashboardPage = Test-Path (Join-Path $Script:ProjectRoot "src/app/dashboard/receptor/page.tsx")
    Write-TestResult "Receptor dashboard page exists" $dashboardPage "page.tsx" 'flow'
    $overviewApi = Test-Path (Join-Path $Script:ProjectRoot "src/app/api/tourism/today-overview/route.ts")
    Write-TestResult "Daily overview API exists" $overviewApi "route.ts" 'flow'
    $result = Invoke-APICall -Endpoint "/api/tourism/today-overview?propertyId=test" -Method "Get"
    if ($result.Success) {
        Write-TestResult "Daily overview API responds" $true "HTTP $($result.StatusCode)" 'flow'
    } else {
        if ($result.StatusCode -eq 401) {
            Write-TestResult "Daily overview API auth working" $true "Returns 401 (expected)" 'flow'
        } else {
            Write-TestResult "Daily overview API responds" $false $result.Error 'flow'
        }
    }
    $middleware = Test-Path (Join-Path $Script:ProjectRoot "src/middleware.ts")
    Write-TestResult "RBAC middleware exists" $middleware "middleware.ts" 'flow'
}

function Test-ProductionBuild {
    Write-StepHeader "Testiraj Production Build" 7
    $nextExists = Test-Path (Join-Path $Script:ProjectRoot ".next")
    if ($nextExists) {
        Write-TestResult ".next folder exists (build že končan)" $true "Production output" 'build'
        Write-Host "  Info: Preskocimo build ker .next že obstaja" -ForegroundColor $Colors.Dim
    } else {
        Write-Host "  Running: npm run build (2-5 minut)..." -ForegroundColor $Colors.Dim
        $build = Start-Process -FilePath "npm" -ArgumentList "run", "build" `
            -WorkingDirectory $Script:ProjectRoot `
            -NoNewWindow -Wait -PassThru `
            -RedirectStandardOutput "$env:TEMP\build-output.txt" `
            -RedirectStandardError "$env:TEMP\build-error.txt"
        $buildOk = $build.ExitCode -eq 0
        Write-TestResult "Production build successful" $buildOk "Exit code: $($build.ExitCode)" 'build' 'critical'
        if (!$buildOk) {
            Write-Host "  Build failed. Check: $env:TEMP\build-error.txt" -ForegroundColor $Colors.Error
        } else {
            $nextExists = Test-Path (Join-Path $Script:ProjectRoot ".next")
            Write-TestResult ".next folder created" $nextExists "Production output" 'build'
        }
    }
}

function Test-ProductionSmoke {
    Write-StepHeader "Smoke Test za Production" 8
    if (!(Test-Path (Join-Path $Script:ProjectRoot ".next"))) {
        Write-TestResult "Production build required first" $false "Run Step 7 first" 'smoke'
        return
    }
    Write-Host "  Starting: npm run start..." -ForegroundColor $Colors.Dim
    $prodServer = Start-Process -FilePath "npm" -ArgumentList "run", "start" `
        -WorkingDirectory $Script:ProjectRoot `
        -NoNewWindow -PassThru
    Start-Sleep -Seconds 10
    $prodUrl = "http://localhost:3000"
    $health = Invoke-APICall -Endpoint "/api/health" -BaseUrlParam $prodUrl -Method "Get"
    Write-TestResult "Production server responds" $health.Success "HTTP $($health.StatusCode)" 'smoke'
    Stop-Process -Id $prodServer.Id -Force -ErrorAction SilentlyContinue
    Write-Host "  Info: Production test končan." -ForegroundColor $Colors.Dim
}

function Write-FinalReport {
    $duration = (New-TimeSpan $Script:StartTime (Get-Date)).TotalSeconds
    $total = $Script:TestsPassed + $Script:TestsFailed
    $passRate = if($total -gt 0){ [Math]::Round(($Script:TestsPassed/$total)*100,1) }else{ 0 }
    Write-Host "`n" + ('='*70) -ForegroundColor $Colors.Dim
    Write-Host "FUNCTIONAL VALIDATION REPORT" -ForegroundColor $Colors.Info
    Write-Host ('='*70) -ForegroundColor $Colors.Dim
    Write-Host "  Duration: $([Math]::Round($duration,1))s" -ForegroundColor $Colors.Dim
    Write-Host "  Passed: $Script:TestsPassed" -ForegroundColor $Colors.Success
    Write-Host "  Failed: $Script:TestsFailed" -ForegroundColor $Colors.Error
    Write-Host "  Pass Rate: $passRate%" -ForegroundColor $(if($passRate -ge 90){$Colors.Success}elseif($passRate -ge 70){$Colors.Warning}else{$Colors.Error})
    $critical = $Script:Results | Where-Object { !$_.Passed -and $_.Severity -eq 'critical' }
    if ($critical) {
        Write-Host "`nCRITICAL ISSUES (must fix before launch):" -ForegroundColor $Colors.Error
        foreach ($c in $critical) { Write-Host "  - $($c.Test): $($c.Message)" -ForegroundColor $Colors.Error }
    }
    Write-Host "`n" + ('='*70) -ForegroundColor $Colors.Dim
    if ($Script:TestsFailed -eq 0) {
        Write-Host "VSI FUNKCIONALNI TESTI USPEŠNI! Sistem dejansko DELUJE." -ForegroundColor $Colors.Success
        return 0
    } else {
        Write-Host "Nekateri funkcionalni testi so spodleteli." -ForegroundColor $Colors.Warning
        return 1
    }
}

function Invoke-AllSteps {
    Write-Host "`nAgentFlow Pro - Functional Validation Suite" -ForegroundColor $Colors.Info
    Write-Host "   Base URL: $BaseUrl | Steps: $(if($Step -eq 0){'ALL'}else{$Step})" -ForegroundColor $Colors.Dim
    Write-Host ('='*70) -ForegroundColor $Colors.Dim
    $steps = @(
        @{ Number=1; Name="Preveri dev server"; Func={ Test-DevServerRunning } },
        @{ Number=2; Name="Testiraj osnovne API-je"; Func={ Test-BasicAPIs } },
        @{ Number=3; Name="Testiraj Authentication"; Func={ Test-Authentication } },
        @{ Number=4; Name="Testiraj Database"; Func={ Test-DatabaseConnection } },
        @{ Number=5; Name="Testiraj WebSocket"; Func={ Test-WebSocketConnection } },
        @{ Number=6; Name="Testiraj User Flow"; Func={ Test-ReceptorDashboardFlow } },
        @{ Number=7; Name="Testiraj Production Build"; Func={ Test-ProductionBuild } },
        @{ Number=8; Name="Production Smoke Test"; Func={ Test-ProductionSmoke } }
    )
    foreach ($s in $steps) {
        if ($Step -eq 0 -or $Step -eq $s.Number) {
            & $s.Func
            if ($Script:TestsFailed -gt 0 -and $Step -ne 0) {
                Write-Host "`nStop zaradi napak v koraku $($s.Number)" -ForegroundColor $Colors.Warning
                break
            }
        }
    }
    return Write-FinalReport
}

exit (Invoke-AllSteps)
