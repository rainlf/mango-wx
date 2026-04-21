Component({
  properties: {
    logList: { type: Array, value: [] },
    title: { type: String, value: '对局记录' },
  },

  data: {
    isLoadingMore: false,
    isRefreshing: false,
    noMore: false,
    loadMoreTimer: null as any,
  },

  methods: {
    onScrollToLower() {
      if (this.data.isLoadingMore) return
      this.setData({ isLoadingMore: true })

      // 超时防死锁保护
      const timer = setTimeout(() => {
        this.setData({ isLoadingMore: false })
      }, 3000)
      this.setData({ loadMoreTimer: timer })

      this.triggerEvent('loadMore')
    },

    loadMoreComplete() {
      if (this.data.loadMoreTimer) {
        clearTimeout(this.data.loadMoreTimer)
      }
      this.setData({ isLoadingMore: false })
    },

    setNoMore(val: boolean) {
      this.setData({ noMore: val })
    },

    onRefresh() {
      this.setData({ isRefreshing: true })
      this.triggerEvent('refresh')
      setTimeout(() => {
        this.setData({ isRefreshing: false })
      }, 1000)
    },

    onDeleteTap(e: any) {
      const gameId = e.currentTarget.dataset.gameId
      this.triggerEvent('deleteLog', { gameId })
    },
  },
})
