Component({
  properties: {
    listData: {
      type: Array,
      value: [],
    },
  },

  data: {
    isRefreshing: false,
    rankMode: 'points',
    displayList: [] as any[],
    worstUser: null as any,
  },

  observers: {
    listData() {
      ;(this as any).updateDisplayList()
    },
  },

  lifetimes: {
    attached() {
      ;(this as any).updateDisplayList()
    },
  },

  methods: {
    updateDisplayList() {
      const list = Array.isArray((this as any).properties.listData) ? [...((this as any).properties.listData as any[])] : []
      const rankMode = this.data.rankMode
      const pointsSortedList = [...list].sort((a, b) => {
        if ((b.points || 0) !== (a.points || 0)) {
          return (b.points || 0) - (a.points || 0)
        }
        return (b.winCount || 0) - (a.winCount || 0)
      })
      const worstUser = pointsSortedList.length > 0
        ? {
            ...pointsSortedList[pointsSortedList.length - 1],
            worstPointsText: String(pointsSortedList[pointsSortedList.length - 1].points || 0),
            worstWinRateText: `${((((pointsSortedList[pointsSortedList.length - 1].winRate || 0) * 1000) / 10)).toFixed(1)}%`,
          }
        : null

      const sortedList = list.sort((a, b) => {
        if (rankMode === 'winRate') {
          if ((b.winRate || 0) !== (a.winRate || 0)) {
            return (b.winRate || 0) - (a.winRate || 0)
          }
          if ((b.totalGames || 0) !== (a.totalGames || 0)) {
            return (b.totalGames || 0) - (a.totalGames || 0)
          }
        } else if ((b.points || 0) !== (a.points || 0)) {
          return (b.points || 0) - (a.points || 0)
        }
        return (b.winCount || 0) - (a.winCount || 0)
      }).map((item) => ({
        ...item,
        rankMetricText: rankMode === 'winRate'
          ? `${(((item.winRate || 0) * 1000) / 10).toFixed(1)}%`
          : String(item.points || 0),
        rankMetricLabel: rankMode === 'winRate' ? '胜率' : '金币',
        rankMetricPositive: rankMode === 'winRate' ? true : (item.points || 0) >= 0,
      }))

      this.setData({
        displayList: sortedList,
        worstUser,
      })
    },
    switchRankMode(e: any) {
      const mode = e.currentTarget.dataset.mode
      if (!mode || mode === this.data.rankMode) {
        return
      }
      this.setData({
        rankMode: mode,
      }, () => {
        this.updateDisplayList()
      })
    },
    onRefresh() {
      if (this.data.isRefreshing) {
        return
      }

      this.setData({
        isRefreshing: true,
      })

      this.loadData().finally(() => {
        this.setData({
          isRefreshing: false,
        })
      })
    },
    async loadData() {
      try {
        // 触发父页面方法（带参数）
        this.triggerEvent(
          'load',
          {
            from: 'component',
          },
          {
            bubbles: true, // 是否冒泡
            composed: true, // 是否跨越组件边界
          }
        )
      } catch (e) {
        console.error(e)
      }
    },
    clickUserAvatar(e: any) {
      const id = e.target.dataset.id
      const username = e.target.dataset.username
      try {
        // 触发父页面方法（带参数）
        this.triggerEvent(
          'clickUserAvatar',
          {
            from: 'component',
            userId: id,
            username,
          },
          {
            bubbles: true, // 是否冒泡
            composed: true, // 是否跨越组件边界
          }
        )
      } catch (e) {
        console.error(e)
      }
    },
  },
})
