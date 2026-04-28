Component({
  properties: {
    listData: {
      type: Array,
      value: [],
    },
    isInitialLoading: {
      type: Boolean,
      value: false,
    },
  },

  data: {
    isRefreshing: false,
    rankMode: 'points',
    displayList: [] as any[],
    worstUser: null as any,
    expandedTagUserIds: [] as number[],
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
      const expandedTagUserIds = Array.isArray(this.data.expandedTagUserIds) ? this.data.expandedTagUserIds : []
      const compareParticipation = (a: any, b: any) => {
        const aHasGames = (a.totalGames || 0) > 0
        const bHasGames = (b.totalGames || 0) > 0
        if (aHasGames !== bHasGames) {
          return aHasGames ? -1 : 1
        }
        return 0
      }
      const worstSortedList = [...list].sort((a, b) => {
        if ((a.points || 0) !== (b.points || 0)) {
          return (a.points || 0) - (b.points || 0)
        }
        if ((a.winRate || 0) !== (b.winRate || 0)) {
          return (a.winRate || 0) - (b.winRate || 0)
        }
        return (a.totalGames || 0) - (b.totalGames || 0)
      })
      const worstUser = worstSortedList.length > 0
        ? {
            ...worstSortedList[0],
            worstPointsText: String(worstSortedList[0].points || 0),
            worstWinRateText: `${((((worstSortedList[0].winRate || 0) * 1000) / 10)).toFixed(1)}%`,
          }
        : null

      const sortedList = list.sort((a, b) => {
        const participationResult = compareParticipation(a, b)
        if (participationResult !== 0) {
          return participationResult
        }
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
        showNoBattleTag: (item.totalGames || 0) <= 0,
        isTagsExpanded: expandedTagUserIds.includes(item.id),
        canToggleTags: Array.isArray(item.lastTags) && item.lastTags.length > 3,
        displayTags: Array.isArray(item.lastTags)
          ? (expandedTagUserIds.includes(item.id) ? item.lastTags : item.lastTags.slice(0, 3))
          : [],
        hiddenTagCount: Array.isArray(item.lastTags) && !expandedTagUserIds.includes(item.id) && item.lastTags.length > 3
          ? item.lastTags.length - 3
          : 0,
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
    toggleTags(e: any) {
      const userId = Number(e.currentTarget.dataset.id || 0)
      if (!userId) {
        return
      }
      const expandedTagUserIds = Array.isArray(this.data.expandedTagUserIds) ? [...this.data.expandedTagUserIds] : []
      const userIndex = expandedTagUserIds.indexOf(userId)
      if (userIndex >= 0) {
        expandedTagUserIds.splice(userIndex, 1)
      } else {
        expandedTagUserIds.push(userId)
      }
      this.setData({
        expandedTagUserIds,
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
