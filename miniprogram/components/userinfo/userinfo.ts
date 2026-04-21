Component({
  properties: {
    user: { type: Object, value: null },
  },

  methods: {
    goToSettings() {
      wx.navigateTo({ url: '/pages/update/index' })
    },
  },
})
