Component({
  properties: {
    username: {
      type: String,
      value: '游客',
    },
    points: {
      type: Number,
      value: 0,
    },
    avatar: {
      type: String,
      value: '',
    },
  },

  methods: {
    onSettingsClick() {
      wx.navigateTo({
        url: '../update/index',
      })
    },
  },
})
