Write-Host "starting..." -ForegroundColor Yellow

# 启动 index.js
Write-Host "start index.js..." -ForegroundColor Cyan
pm2 start index.js --no-monitor

# 启动 server.js
Write-Host "start server.js..." -ForegroundColor Cyan
pm2 start server.js --no-monitor

Write-Host "pm2-logrotate setting..." -ForegroundColor Cyan
pm2 set pm2-logrotate:retain 4

# 显示当前运行的应用列表
Write-Host "list:" -ForegroundColor Yellow
pm2 list

Write-Host "finish" -ForegroundColor Green