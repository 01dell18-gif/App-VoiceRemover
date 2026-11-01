module.exports = {
  apps: [{
    name: 'fyj-voice-remover',
    script: 'server.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '2G',
    env: {
      NODE_ENV: 'production',
      PORT: 3032,
      HOST: '0.0.0.0'
    }
  }]
};
