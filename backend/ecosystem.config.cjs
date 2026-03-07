module.exports = {
  apps: [
    {
      name: "emlak-backend",
      cwd: "/var/www/emlak/backend",

      interpreter: "/root/.bun/bin/bun",
      script: "dist/index.js",

      exec_mode: "fork",
      instances: 1,
      watch: false,
      autorestart: true,
      max_memory_restart: "300M",

      // Kritik: crash loop kontrolü
      min_uptime: "20s",
      max_restarts: 10,
      restart_delay: 3000,

      // CPU’yu yakan log spam’i azaltır (opsiyonel)
      // log_date_format: "YYYY-MM-DD HH:mm:ss.SSS Z",

      env: {
        NODE_ENV: "production",
        HOST: "127.0.0.1",
        PORT: "8085",
      },

      out_file: "/var/log/pm2/emlak-backend.out.log",
      error_file: "/var/log/pm2/emlak-backend.err.log",
      combine_logs: true,
      time: true,
    },
  ],
};

