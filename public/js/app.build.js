({
  baseDir: '.',
  dir: '../../static-tmp/js',
  mainConfigFile: 'index.js',
  modules: [
    {name: 'index'},
    {name: 'controllers/ViewTimeline'},
    {name: 'controllers/ViewDashboard'},
    {name: 'controllers/ViewEvent'}
  ],
  optimize: "none",
  useStrict: true,
  wrap: false
})
