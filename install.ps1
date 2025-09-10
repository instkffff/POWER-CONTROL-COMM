# 1. 安装nrm
Write-Host "install nrm..." -ForegroundColor Green
npm install -g nrm

# 2. 切换taobao源
Write-Host "switch to taobao register..." -ForegroundColor Green
nrm use taobao

# 3. 安装pm2
Write-Host "install pm2..." -ForegroundColor Green
npm install -g pm2

# 4. pm2 安装 pm2-logrotate
Write-Host "install pm2-logrotate..." -ForegroundColor Green
pm2 install pm2-logrotate

Write-Host "done" -ForegroundColor Yellow