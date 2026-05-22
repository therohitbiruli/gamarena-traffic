# LDPlayer Optimization Script for 5 Gmail Workers
$ldPath = "D:\LDPlayer\LDPlayer9\dnconsole.exe"

# 1. Create/Update 5 instances
for ($i = 0; $i -lt 5; $i++) {
    $name = "Worker-$($i + 1)"
    Write-Host "⚙️ Configuring $name..."
    
    # Check if exists, if not create
    $exists = & $ldPath list2 | Select-String $name
    if (-not $exists) {
        Write-Host "Creating $name..."
        & $ldPath add --name $name
    }

    # Set Lightweight Settings
    # 1 Core, 1024MB RAM, 240x320 Resolution (DPI 120), 10 FPS, Enable ADB
    & $ldPath modify --name $name --cpu 1 --memory 1024 --width 240 --height 320 --dpi 120 --fps 10 --adb 1
    
    # Ensure Google Play is available (default in LDPlayer 9)
    Write-Host "✅ $name configured."
}

Write-Host "`n🚀 You can now start the workers from the dashboard."
