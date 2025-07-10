@echo off
cd .\ctk
set API_URL=https://tmf-communication-api.up.railway.app
npm install && npm start

REM Run CTK with correct environment
npx newman run TMF681-Communication-v4.0.0.testkit.json ^
  -e TMFENV-V4.0.0.postman_environment.json ^
  -r cli,html ^
  --reporter-html-export report.html

cmd
