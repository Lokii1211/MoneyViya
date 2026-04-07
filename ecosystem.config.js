module.exports = {
  apps: [{
    name: 'moneyviya-bot',
    script: 'index.js',
    cwd: './whatsapp-bot',
    watch: false,
    autorestart: true,
    restart_delay: 5000,
    max_restarts: 50,
    env: {
      NODE_ENV: 'production',
      API_URL: 'http://localhost:8000'
    },
    error_file: './logs/bot-error.log',
    out_file: './logs/bot-output.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    merge_logs: true
  }, {
    name: 'moneyviya-api',
    script: 'python',
    args: '-m uvicorn app:app --host 0.0.0.0 --port 8000',
    cwd: './',
    watch: false,
    autorestart: true,
    restart_delay: 3000,
    max_restarts: 50,
    interpreter: 'none',
    env: {
      NODE_ENV: 'production'
    },
    error_file: './logs/api-error.log',
    out_file: './logs/api-output.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    merge_logs: true
  }]
}
