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
    totalGames: {
      type: Number,
      value: 0,
    },
    winCount: {
      type: Number,
      value: 0,
    },
    winRate: {
      type: Number,
      value: 0,
    },
  },

  data: {
    winRateText: '0%',
  },

  observers: {
    'winRate,totalGames,winCount'(winRate: number, totalGames: number, winCount: number) {
      let normalizedRate = Number(winRate) || 0
      if (normalizedRate <= 0 && totalGames > 0) {
        normalizedRate = winCount / totalGames
      }
      if (normalizedRate > 1) {
        normalizedRate = normalizedRate / 100
      }
      const safeRate = Math.max(0, Math.min(normalizedRate, 1))
      const percentage = safeRate * 100
      const winRateText =
        percentage % 1 === 0 ? `${percentage.toFixed(0)}%` : `${percentage.toFixed(1)}%`
      this.setData({ winRateText })
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
