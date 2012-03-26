({
  baseDir: '.',
  dir: '../../public-build/js',
  wrap: false,
  optimize: "none",
  useStrict: true,
  modules: [
    {name: 'index'},
    {
      name: 'controllers/ViewTimeline',
      exclude: [
        'bootstrap-modal',
        'order'
      ]
    },
    {
      name: 'controllers/ViewDashboard'
    },
    {
      name: 'controllers/ViewEvent',
      exclude: [
        'bootstrap-modal',
        'order'
      ]
    }
  ]
})
