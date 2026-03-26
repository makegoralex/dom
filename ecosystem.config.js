module.exports = {
  apps: [
    {
      name: "dom-backend",
      cwd: "/var/www/dom/backend",
      script: "npm",
      args: "run start",
      interpreter: "none",
      autorestart: true,
      watch: false,
      env: {
        NODE_ENV: "production",
        PORT: 3000
      }
    }
  ]
};
