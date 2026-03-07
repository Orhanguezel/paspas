module.exports = {
  apps: [
    {
      name: "paspas-backend",
      cwd: "/var/www/paspas/backend",

      interpreter: "/home/orhan/.bun/bin/bun",
      script: "dist/index.js",

      exec_mode: "fork",
      instances: 1,
      watch: false,
      autorestart: true,
      max_memory_restart: "300M",

      min_uptime: "20s",
      max_restarts: 10,
      restart_delay: 3000,

      env: {
        NODE_ENV: "production",
        HOST: "127.0.0.1",
        PORT: "8078",
      },

      out_file: "/home/orhan/.pm2/logs/paspas-backend.out.log",
      error_file: "/home/orhan/.pm2/logs/paspas-backend.err.log",
      combine_logs: true,
      time: true,
    },
  ],
};

