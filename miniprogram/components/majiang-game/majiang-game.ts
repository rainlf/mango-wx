import { getMajiangPlayers, saveMaJiangGame, updatePlayers } from '../../services/majiang-service'

Component({
  properties: {
    showDrawer: {
      type: Boolean,
      value: true,
    },
  },
  data: {
    gameType: '胡牌', // 默认选中胡牌
    allPlayers: [] as User[],
    currentTablePlayers: [] as any[],
    winPlayers: [] as User[],
    losePlayers: [] as User[],
    changingPlayers: false,
    selectUserToPlayList: [] as number[],

    // 底分
    points: [
      { name: 3, point: 3, selected: false },
      { name: 4, point: 4, selected: false },
      { name: 5, point: 5, selected: false },
      { name: 6, point: 6, selected: false },
      { name: 7, point: 7, selected: false },
      { name: '🍒', point: 10, selected: false },
    ],

    // 牌型
    winTypes: [
      { code: 'yi_tiao_long', name: '一条龙', multi: 2, selected: false },
      { code: 'da_diao_che', name: '大吊车', multi: 2, selected: false },
      { code: 'peng_peng_hu', name: '碰碰胡', multi: 2, selected: false },
      { code: 'men_qian_qing', name: '门前清', multi: 2, selected: false },
      { code: 'hun_yi_se', name: '混一色', multi: 2, selected: false },
      { code: 'qing_yi_se', name: '清一色', multi: 4, selected: false },
      { code: 'xiao_qi_dui', name: '小七对', multi: 4, selected: false },
      { code: 'long_qi_dui', name: '龙七对', multi: 8, selected: false },
      { code: 'gang_kai_hua', name: '杠开花', multi: 2, selected: false },
    ],
  },
  observers: {
    showDrawer(val) {
      if (val) {
        this.loadData()
      }
    },
  },

  methods: {
    buildTablePlayers(selectedIds: number[], preferredPlayers: User[] = []) {
      const playerMap = new Map<number, User>()
      preferredPlayers.forEach((player: User) => {
        playerMap.set(player.id, player)
      })
      this.data.allPlayers.forEach((player: User) => {
        if (!playerMap.has(player.id)) {
          playerMap.set(player.id, player)
        }
      })

      const selectedPlayers = selectedIds
        .map((id: number) => playerMap.get(id))
        .filter((player: User | undefined): player is User => !!player)

      const tablePlayers = selectedPlayers.map((player: User) => ({
        ...player,
        empty: false,
      }))

      while (tablePlayers.length < 4) {
        tablePlayers.push({
          id: 0,
          username: '空位',
          avatar: '',
          empty: true,
        })
      }

      return tablePlayers.slice(0, 4)
    },

    createGamePlayers(gameType: string, players: User[], allPlayers: User[]) {
      const recorder = wx.getStorageSync('user')
      let winPlayers: User[] = []

      if (gameType === '运动') {
        const recorderPlayer = allPlayers.find((player: User) => player.id === recorder.id)
        if (recorderPlayer) {
          winPlayers = [
            {
              ...recorderPlayer,
              selected: true,
              lastSelected: true,
              gameInfo: { basePoints: 10, winTypes: [], multi: 1 },
            },
          ]
        } else {
          winPlayers = [
            {
              id: recorder.id || 0,
              username: recorder.username || '当前用户',
              avatar: recorder.avatar || '',
              selected: true,
              lastSelected: true,
              gameInfo: { basePoints: 10, winTypes: [], multi: 1 },
            } as User,
          ]
        }
      } else {
        winPlayers = players.map((player: User, index: number) => ({
          ...player,
          selected: index === 0,
          lastSelected: index === 0,
          gameInfo: { basePoints: 0, winTypes: [], multi: 1 },
        }))
      }

      const selectedWinPlayer = winPlayers.find((player: any) => player.selected)
      const selectedWinPlayerId = selectedWinPlayer ? selectedWinPlayer.id : 0
      const losePlayers = players
        .filter((player: User) => player.id !== selectedWinPlayerId)
        .map((player: User) => ({
          ...player,
          selected: false,
        }))

      return { winPlayers, losePlayers }
    },

    // 数据初始化
    loadData() {
      getMajiangPlayers().then((res) => {
        const currentPlayers = res.currentPlayers
        const currentIds = currentPlayers.map((player: User) => player.id)
        const allPlayers = res.allPlayers.map((player: User) => {
          if (currentIds.includes(player.id)) {
            return { ...player, selected: true }
          } else {
            return { ...player, selected: false }
          }
        })

        const currentTablePlayers = this.buildTablePlayers(currentIds, currentPlayers)
        const activePlayers = currentTablePlayers.filter((player: any) => !player.empty) as User[]
        const { winPlayers, losePlayers } = this.createGamePlayers(this.data.gameType, activePlayers, allPlayers)

        this.setData({
          winPlayers,
          losePlayers,
          allPlayers,
          currentTablePlayers,
          selectUserToPlayList: currentIds,
          changingPlayers: false,
        })
      })
    },

    // 清空按钮
    handleDelete(e: any) {
      const userId = e.currentTarget.dataset.id
      if (!userId || typeof userId !== 'number') {
        return
      }
      const winPlayers = this.data.winPlayers.map((player: User) =>
        player.id === userId ? { ...player, gameInfo: { basePoints: 0, winTypes: [], multi: 1 } } : player
      )
      const points = this.data.points.map((point: any) => ({ ...point, selected: false }))
      const winTypes = this.data.winTypes.map((winType: any) => ({ ...winType, selected: false }))

      this.setData({
        winPlayers,
        points,
        winTypes,
      })
    },

    selectBasePoints(e: any) {
      const name = e.currentTarget.dataset.name
      const point = e.currentTarget.dataset.point
      const userId = e.currentTarget.dataset.userid
      if (!userId || typeof userId !== 'number') {
        return
      }

      this.setData({
        points: this.data.points.map((item: any) => (item.name === name ? { ...item, selected: true } : { ...item, selected: false })),
        winPlayers: this.data.winPlayers.map((user: User) => {
          if (user.id === userId) {
            return { ...user, selected: true, gameInfo: { ...user.gameInfo, basePoints: point } }
          } else {
            return user
          }
        }),
      })
    },
    handleDecrease(e: any) {
      const userId = e.currentTarget.dataset.userid
      if (!userId || typeof userId !== 'number') {
        return
      }

      const user = this.data.winPlayers.filter((x: User) => x.id === userId)[0]
      const target = user.gameInfo.basePoints - 1
      const minPoints = this.data.gameType === '运动' ? 10 : 0
      if (target < minPoints) {
        wx.showToast({
          title: this.data.gameType === '运动' ? '运动分数不能小于 10 哦 🍑' : '底分不能小于 0 呀 😏',
          icon: 'none',
          duration: 1000,
        })
        return
      }
      this.setData({
        winPlayers: this.data.winPlayers.map((player: User) => {
          if (player.id === userId) {
            return { ...player, selected: true, gameInfo: { ...player.gameInfo, basePoints: target } }
          } else {
            return player
          }
        }),
        points: this.data.points.map((point: any) => ({ ...point, selected: point.point === target })),
      })
    },
    handleIncrease(e: any) {
      const userId = e.currentTarget.dataset.userid
      if (!userId || typeof userId !== 'number') {
        return
      }

      const user = this.data.winPlayers.filter((x: User) => x.id === userId)[0]
      const target = user.gameInfo.basePoints + 1
      if (this.data.gameType !== '运动' && target > 20) {
        wx.showToast({
          title: '底分是不是太大了呀 😏',
          icon: 'none',
          duration: 1000,
        })
        return
      }
      this.setData({
        winPlayers: this.data.winPlayers.map((player: User) => {
          if (player.id === userId) {
            return { ...player, selected: true, gameInfo: { ...player.gameInfo, basePoints: target } }
          } else {
            return player
          }
        }),
        points: this.data.points.map((point: any) => ({ ...point, selected: point.point === target })),
      })
    },

    toggleWinType(e: any) {
      const name = e.currentTarget.dataset.name
      const code = e.currentTarget.dataset.code
      const multi = e.currentTarget.dataset.multi
      const selected = e.currentTarget.dataset.selected
      const userId = e.currentTarget.dataset.userid

      this.setData({
        winTypes: this.data.winTypes.map((type: any) => (type.code === code ? { ...type, selected: !type.selected } : type)),
        winPlayers: this.data.winPlayers.map((player: User) => {
          if (player.id === userId) {
            let totalMulti = player.gameInfo.multi
            let totalWinTypes = player.gameInfo.winTypes
            if (selected) {
              totalMulti /= multi
              totalWinTypes = totalWinTypes.filter((x: string) => x !== code)
            } else {
              totalMulti *= multi
              totalWinTypes = [...totalWinTypes, code]
            }
            return {
              ...player,
              selected: true,
              gameInfo: { ...player.gameInfo, winTypes: totalWinTypes, multi: totalMulti },
            }
          } else {
            return player
          }
        }),
      })
    },

    selectWinType(e: any) {
      const type = e.currentTarget.dataset.type
      const recorder = wx.getStorageSync('user')

      const data: any = {
        gameType: type,
        points: this.data.points.map((point: any) => ({ ...point, selected: false })),
        winTypes: this.data.winTypes.map((winType: any) => ({ ...winType, selected: false })),
      }

      const activePlayers = this.data.currentTablePlayers.filter((player: any) => !player.empty) as User[]
      const { winPlayers, losePlayers } = this.createGamePlayers(type, activePlayers, this.data.allPlayers)
      data.winPlayers = winPlayers
      data.losePlayers = losePlayers

      if (type === '运动') {
        data.points = this.data.points.map((point: any) => ({
          ...point,
          selected: point.point === 10,
        }))
      }

      this.setData(data)
    },

    selectWinPlayer(e: any) {
      const playerId = e.currentTarget.dataset.id
      const selected = e.currentTarget.dataset.selected
      const lastSelected = e.currentTarget.dataset.lastselected

      if (this.data.gameType === '胡牌') {
        let count = 0
        this.data.winPlayers.forEach((player: User) => {
          if (player.selected) {
            count++
          }
        })
        if (selected === false && count >= 3) {
          wx.showToast({
            title: '最多 3 个赢家 😏',
            icon: 'none',
            duration: 1000,
          })
          return
        }

        if (selected && lastSelected) {
          this.setData({
            winPlayers: this.data.winPlayers.map((player: User) =>
              player.id === playerId ? { ...player, selected: false, lastSelected: false } : { ...player, lastSelected: false }
            ),
          })
          let firstSelectId = -1
          this.data.winPlayers.forEach((player: User) => {
            if (firstSelectId === -1 && player.selected) {
              firstSelectId = player.id
            }
          })
          if (firstSelectId !== -1) {
            this.setData({
              winPlayers: this.data.winPlayers.map((player: User) =>
                player.id === firstSelectId ? { ...player, lastSelected: true } : player
              ),
            })
          }
        } else {
          this.setData({
            winPlayers: this.data.winPlayers.map((player: User) =>
              player.id === playerId ? { ...player, selected: true, lastSelected: true } : { ...player, lastSelected: false }
            ),
          })
        }

        if (!lastSelected) {
          const user = this.data.winPlayers.filter((x: User) => x.id === playerId)[0]
          const targetPoints = user.gameInfo.basePoints
          const targetWinTypes = user.gameInfo.winTypes
          this.setData({
            points: this.data.points.map((point: any) => ({
              ...point,
              selected: point.point === targetPoints,
            })),
            winTypes: this.data.winTypes.map((winType: any) => ({
              ...winType,
              selected: targetWinTypes.includes(winType.code),
            })),
          })
        }
      }

      if (this.data.gameType === '自摸' || this.data.gameType === '相公') {
        this.setData({
          winPlayers: this.data.winPlayers.map((player: User) =>
            player.id === playerId
              ? { ...player, selected: true, lastSelected: true }
              : { ...player, selected: false, lastSelected: false, gameInfo: { basePoints: 0, winTypes: [], multi: 1 } }
          ),
        })
        if (!lastSelected) {
          this.setData({
            points: this.data.points.map((point: any) => ({ ...point, selected: false })),
            winTypes: this.data.winTypes.map((winType: any) => ({ ...winType, selected: false })),
          })
        }
      }

      const selectedPlayerId: number[] = this.data.winPlayers.filter((player: User) => player.selected).map((player: User) => player.id)
      this.setData({
        losePlayers: this.data.winPlayers.filter((x: User) => !selectedPlayerId.includes(x.id)).map((player: User) => ({
          ...player,
          selected: false,
        })),
      })
    },
    selectLosePlayer(e: any) {
      const playerId = e.currentTarget.dataset.id

      const winIds = this.data.winPlayers.filter((player: User) => player.selected).map((player: User) => player.id)
      if (winIds.includes(playerId)) {
        return
      }

      this.setData({
        losePlayers: this.data.losePlayers.map((player: User) => {
          if (player.id === playerId) {
            return { ...player, selected: true }
          } else {
            return { ...player, selected: false }
          }
        }),
      })
    },
    selectPlayerToPlay(e: any) {
      const playerId = e.currentTarget.dataset.id
      const selected = e.currentTarget.dataset.selected

      if (selected === false && this.data.selectUserToPlayList.length >= 4) {
        wx.showToast({
          title: '最多 4 人 PLAY 😏',
          icon: 'none',
          duration: 1000,
        })
        return
      }
      let nextSelectedIds = [...this.data.selectUserToPlayList]
      if (this.data.selectUserToPlayList.includes(playerId)) {
        nextSelectedIds.splice(this.data.selectUserToPlayList.indexOf(playerId), 1)
      } else {
        nextSelectedIds = [...nextSelectedIds, playerId]
      }
      const currentTablePlayers = this.buildTablePlayers(nextSelectedIds)
      this.setData({
        selectUserToPlayList: nextSelectedIds,
        currentTablePlayers,
        allPlayers: this.data.allPlayers.map((player: User) => {
          if (player.id === playerId) {
            return { ...player, selected: !player.selected }
          } else {
            return player
          }
        }),
      })
    },
    startChangePlayers() {
      if (this.data.gameType === '运动') {
        wx.showToast({
          title: '先切换到麻将对局类型再换人',
          icon: 'none',
          duration: 1000,
        })
        return
      }
      this.setData({
        changingPlayers: true,
      })
    },
    cancelChangePlayers() {
      this.loadData()
    },
    saveCurrentPlayers() {
      const selectedIds = this.data.selectUserToPlayList
      if (selectedIds.length !== 4) {
        wx.showToast({
          title: '游戏需要 4 名玩家哦 😏',
          icon: 'none',
          duration: 1000,
        })
        return
      }
      wx.showLoading({ title: '保存中...' })
      updatePlayers(selectedIds).then(() => {
        wx.hideLoading()
        wx.showToast({
          title: '牌桌人员已更新',
          icon: 'success',
          duration: 1200,
        })
        this.loadData()
      }).catch((err) => {
        wx.hideLoading()
        wx.showToast({
          title: typeof err === 'string' ? err : '保存失败',
          icon: 'none',
          duration: 1200,
        })
      })
    },

    closeDrawer() {
      this.setData({
        showDrawer: false,
        changingPlayers: false,
        points: this.data.points.map((point: any) => ({ ...point, selected: false })),
        winTypes: this.data.winTypes.map((winType: any) => ({ ...winType, selected: false })),
      })
      this.triggerEvent('closeDrawer')
    },

    showSubmit() {
      let winners: User[] = []
      let losers: User[] = []
      if (this.data.gameType === '胡牌' || this.data.gameType === '自摸') {
        winners = this.data.winPlayers.filter((player: User) => player.selected)
        losers = this.data.losePlayers.filter((player: User) => player.selected)
      }
      if (this.data.gameType === '相公') {
        winners = this.data.winPlayers.filter((player: User) => !player.selected)
        losers = this.data.winPlayers.filter((player: User) => player.selected)
        winners.forEach((player: User) => {
          player.gameInfo.basePoints = 1
        })
        losers.forEach((player: User) => {
          player.gameInfo.basePoints = 3
        })
      }
      if (this.data.gameType === '运动') {
        const recorder = wx.getStorageSync('user')
        winners = this.data.winPlayers.filter((player: User) => player.id === recorder.id)
        losers = []
      }

      let exit = false
      winners.forEach((player: User) => {
        if (this.data.gameType !== '运动' && player.gameInfo.basePoints <= 0) {
          exit = true
        }
      })
      if (exit) {
        wx.showToast({
          title: '赢家得分必须大于 0 哦 🍑',
          icon: 'none',
          duration: 1000,
        })
        return
      }

      if (this.data.gameType === '胡牌') {
        if (winners.length < 1) {
          wx.showToast({
            title: '请至少选择一个赢家 🥕',
            icon: 'none',
            duration: 1000,
          })
          return
        }
        if (losers.length !== 1) {
          wx.showToast({
            title: '请选择一个输家 🍌',
            icon: 'none',
            duration: 1000,
          })
          return
        }
      }
      if (this.data.gameType === '自摸') {
        if (winners.length !== 1) {
          wx.showToast({
            title: '请选择一个赢家 🥕',
            icon: 'none',
            duration: 1000,
          })
          return
        }
        losers = this.data.losePlayers.filter((player: User) => player.id !== winners[0].id)
      }
      if (this.data.gameType === '相公') {
        if (losers.length !== 1) {
          wx.showToast({
            title: '是谁相公了呀 🦆',
            icon: 'none',
            duration: 1000,
          })
          return
        }
      }

      let gameType = 1
      if (this.data.gameType === '胡牌') {
        if (winners.length === 1) {
          gameType = 1
        } else if (winners.length === 2) {
          gameType = 3
        } else if (winners.length === 3) {
          gameType = 4
        }
      } else if (this.data.gameType === '自摸') {
        gameType = 2
      } else if (this.data.gameType === '相公') {
        gameType = 5
      } else if (this.data.gameType === '运动') {
        gameType = 6
      }

      let message = ''
      winners.forEach((player: User) => {
        message += `赢家：${player.username}, 得分: ${player.gameInfo.basePoints * player.gameInfo.multi} 分\n`
      })

      if (this.data.gameType === '运动') {
        message += `输家: 银行`
      } else {
        message += `输家: `
        losers.forEach((player: User) => {
          message += `${player.username}, `
        })
        message = message.replace(/..$/, '')
      }

      wx.showModal({
        title: '提交确认',
        content: message,
        confirmText: '确定',
        cancelText: '记错了',
        success: (res) => {
          if (res.confirm) {
            this.submit(gameType, winners, losers)
          }
        },
      })
    },

    submit(gameType: number, winners: User[], losers: User[]) {
      const data = {
        gameType: gameType,
        players: this.data.winPlayers.map((player: User) => player.id),
        recorderId: wx.getStorageSync('user').id,
        winners: winners.map((player: User) => ({
          userId: player.id,
          basePoints: player.gameInfo.basePoints,
          winTypes: player.gameInfo.winTypes,
        })),
        losers: losers.map((player: User) => player.id),
      }
      saveMaJiangGame(data as any).then(() => {
        this.closeDrawer()
        wx.showToast({
          title: '提交成功',
          icon: 'success',
          duration: 1500,
        })
        try {
          this.triggerEvent(
            'refreshData',
            {
              from: 'component',
            },
            {
              bubbles: true,
              composed: true,
            }
          )
        } catch (e) {
          console.error(e)
        }
      })
    },
  },
})
