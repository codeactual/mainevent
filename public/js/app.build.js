({
  baseDir: '.',
  dir: '../../public-build/js',
  mainConfigFile: 'index.js',
  modules: [
    {name: 'index'},
    {
      name: 'controllers/ViewTimeline',
      exclude: [
      ]
    },
    {
      name: 'controllers/ViewDashboard'
    },
    {
      name: 'controllers/ViewEvent',
      exclude: [
      ]
    }
  ],
  optimize: "none",
  useStrict: true,
  wrap: false
})
