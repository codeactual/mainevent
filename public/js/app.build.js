({
  baseDir: '.',
  dir: '../../public-build/js',
  wrap: false,
  optimize: "none",
  useStrict: true,
  modules: [
    {name: 'index'},
    {name: 'controllers/ViewTimeline'},
    {name: 'controllers/ViewDashboard'},
    {name: 'controllers/ViewEvent'}
  ]
})
