Component({
  properties: {
    rankList: { type: Array, value: [] },
  },

  data: {
    isRefreshing: false,
  },

  methods: {
    onAvatarTap(e: any) {
      const user = e.currentTarget.dataset.user
      this.triggerEvent('clickUserAvatar', user)
    },

    onRefresh() {
      this.setData({ isRefreshing: true })
      this.triggerEvent('refresh')
      setTimeout(() => {
        this.setData({ isRefreshing: false })
      }, 1000)
    },
  },
})
