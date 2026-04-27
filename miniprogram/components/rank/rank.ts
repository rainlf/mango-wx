Component({
  properties: {
    listData: {
      type: Array,
      value: [],
    },
  },

  data: {
    isRefreshing: false,
  },

  methods: {
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
