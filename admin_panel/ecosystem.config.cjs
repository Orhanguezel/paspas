// =============================================================
// FILE: ecosystem.config.cjs
// Ensotek - admin_panel PM2 config
// =============================================================

module.exports = {
  apps: [
    {
      name: 'ensotek-admin-panel',
      cwd: '/var/www/Ensotek/admin_panel',
      script: '/home/orhan/.bun/bin/bun',
      args: 'run start -- -p 3022 -H 127.0.0.1',
      exec_mode: 'fork',
      instances: 1,
      watch: false,
      autorestart: true,
      max_memory_restart: '450M',
      min_uptime: '30s',
      max_restarts: 10,
      restart_delay: 5000,
      kill_timeout: 8000,
      listen_timeout: 10000,
      env: {
        NODE_ENV: 'production',
        PORT: '3022',
        HOSTNAME: '127.0.0.1',
        NEXT_TELEMETRY_DISABLED: '1',
      },
      out_file: '/home/orhan/.pm2/logs/ensotek-admin-panel.out.log',
      error_file: '/home/orhan/.pm2/logs/ensotek-admin-panel.err.log',
      combine_logs: true,
      time: true,
    },
  ],
};
