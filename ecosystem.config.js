module.exports = {
  apps: [
    {
      name: 'cpay',
      script: 'npm',
      args: 'start',
      cwd: process.cwd(),
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      log_file: './logs/combined.log',
      time: true,
      max_memory_restart: '1G',
      min_uptime: '10s',
      max_restarts: 10,
      restart_delay: 4000,
      watch: false,
      ignore_watch: ['node_modules', 'logs', '.next'],
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000
      }
    }
  ]
}; 