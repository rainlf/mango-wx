import { getPlayers, updatePlayers, recordMaJiangGame } from '../../services/majiang-service'
import { convertUserDTO } from '../../utils/util'

// 番型定义
const WIN_TYPES = [
  { code: 'yitiaolong', name: '一条龙', multiplier: 2, selected: false },
  { code: 'dadiaoche', name: '大吊车', multiplier: 2, selected: false },
  { code: 'pengpenghu', name: '碰碰胡', multiplier: 2, selected: false },
  { code: 'menqianqing', name: '门前清', multiplier: 2, selected: false },
  { code: 'hunyise', name: '混一色', multiplier: 2, selected: false },
  { code: 'qingyise', name: '清一色', multiplier: 4, selected: false },
  { code: 'xiaoqidui', name: '小七对', multiplier: 4, selected: false },
  { code: 'longqidui', name: '龙七对', multiplier: 8, selected: false },
  { code: 'gangkaihua', name: '杠开花', multiplier: 2, selected: false },
]

Component({
  properties: {
    user: { type: Object, value: null },
  },

  data: {
    showPanel: false,
    step: 0, // 0=选人, 1=选类型, 2=记分
    // 玩家相关
    currentPlayers: [] as any[],
    allPlayers: [] as any[],
    selectedCount: 0,
    // 游戏类型
    gameType: '', // hu/zimo/xiangong/yundong
    // 记分相关
    gamePlayers: [] as any[],
    basePoints: 3,
    basePointsList: [3, 4, 5, 6, 7, 10],
    winTypeList: JSON.parse(JSON.stringify(WIN_TYPES)),
    currentMulti: 1,
  },

  methods: {
    // === 面板控制 ===
    openPanel() {
      this.setData({ showPanel: true })
      this.loadPlayers()
    },

    closePanel() {
      this.setData({ showPanel: false })
      this.resetAll()
    },

    togglePanel() {
      if (this.data.showPanel) {
        this.closePanel()
      } else {
        this.openPanel()
      }
    },

    // === 加载玩家 ===
    loadPlayers() {
      getPlayers()
        .then((res) => {
          const currentPlayers = (res.current_players || []).map((dto: UserDTO) => {
            const u = convertUserDTO(dto)
            u.selected = true
            return u
          })
          // 补齐4个座位
          while (currentPlayers.length < 4) {
            currentPlayers.push({ id: 0, nickname: '', username: '', avatar: '', selected: false })
          }

          const allPlayers = (res.all_players || []).map((dto: UserDTO) => {
            const u = convertUserDTO(dto)
            // 标记已在牌桌上的玩家
            u.selected = currentPlayers.some((cp: any) => cp.id && cp.id === u.id)
            return u
          })

          this.setData({
            currentPlayers,
            allPlayers,
            selectedCount: currentPlayers.filter((p: any) => p.id).length,
            step: 0,
          })
        })
        .catch((err) => {
          console.error('获取玩家失败:', err)
        })
    },

    // === 座位点击（踢人） ===
    onSeatTap(e: any) {
      const index = e.currentTarget.dataset.index
      const player = this.data.currentPlayers[index]
      if (!player.id) return

      // 从座位移除
      const currentPlayers = [...this.data.currentPlayers]
      currentPlayers[index] = { id: 0, nickname: '', username: '', avatar: '', selected: false }

      // 更新allPlayers中的选中状态
      const allPlayers = this.data.allPlayers.map((p: any) => {
        if (p.id === player.id) {
          return { ...p, selected: false }
        }
        return p
      })

      this.setData({
        currentPlayers,
        allPlayers,
        selectedCount: currentPlayers.filter((p: any) => p.id).length,
      })
    },

    // === 选择玩家加入牌桌 ===
    onPlayerSelect(e: any) {
      const player = e.currentTarget.dataset.player
      const allPlayers = [...this.data.allPlayers]
      const currentPlayers = [...this.data.currentPlayers]

      const playerIndex = allPlayers.findIndex((p: any) => p.id === player.id)
      if (playerIndex < 0) return

      if (allPlayers[playerIndex].selected) {
        // 取消选择 -> 从座位移除
        allPlayers[playerIndex] = { ...allPlayers[playerIndex], selected: false }
        const seatIndex = currentPlayers.findIndex((p: any) => p.id === player.id)
        if (seatIndex >= 0) {
          currentPlayers[seatIndex] = { id: 0, nickname: '', username: '', avatar: '', selected: false }
        }
      } else {
        // 选择 -> 加入空座位
        const emptySeat = currentPlayers.findIndex((p: any) => !p.id)
        if (emptySeat < 0) {
          wx.showToast({ title: '座位已满，请先移除一位', icon: 'none' })
          return
        }
        allPlayers[playerIndex] = { ...allPlayers[playerIndex], selected: true }
        currentPlayers[emptySeat] = { ...allPlayers[playerIndex] }
      }

      this.setData({
        allPlayers,
        currentPlayers,
        selectedCount: currentPlayers.filter((p: any) => p.id).length,
      })
    },

    // === 确认玩家，进入类型选择 ===
    confirmPlayers() {
      const validPlayers = this.data.currentPlayers.filter((p: any) => p.id)
      if (validPlayers.length !== 4) {
        wx.showToast({ title: '需要4位玩家', icon: 'none' })
        return
      }

      // 更新牌桌玩家到后端
      const userIds = validPlayers.map((p: any) => p.id)
      updatePlayers(userIds)
        .then(() => {
          // 进入类型选择
          this.setData({ step: 1, gameType: '' })
        })
        .catch((err) => {
          console.error('更新玩家失败:', err)
          wx.showToast({ title: '更新失败', icon: 'none' })
        })
    },

    // === 选择游戏类型 ===
    selectGameType(e: any) {
      const type = e.currentTarget.dataset.type
      this.setData({ gameType: type })

      if (type === 'yundong') {
        // 运动类型直接进入步骤2
        this.setData({ step: 2 })
        return
      }

      // 准备 gamePlayers
      const gamePlayers = this.data.currentPlayers
        .filter((p: any) => p.id)
        .map((p: any) => ({
          ...p,
          gameInfo: {
            ...p.gameInfo,
            isWinner: false,
            isLoser: false,
            basePoints: 0,
            winTypes: [],
            multi: 1,
          },
        }))

      this.setData({
        step: 2,
        gamePlayers,
        basePoints: 3,
        winTypeList: JSON.parse(JSON.stringify(WIN_TYPES)),
        currentMulti: 1,
      })
    },

    // === 赢家切换 ===
    toggleWinner(e: any) {
      const index = e.currentTarget.dataset.index
      const gamePlayers = [...this.data.gamePlayers]
      const player = gamePlayers[index]

      if (this.data.gameType === 'hu') {
        // 胡牌最多3个赢家
        const winnerCount = gamePlayers.filter((p: any) => p.gameInfo.isWinner).length
        if (!player.gameInfo.isWinner && winnerCount >= 3) {
          wx.showToast({ title: '最多3个赢家', icon: 'none' })
          return
        }
      } else if (this.data.gameType === 'zimo') {
        // 自摸只能1个赢家
        if (!player.gameInfo.isWinner) {
          gamePlayers.forEach((p: any) => { p.gameInfo.isWinner = false })
        }
      }

      gamePlayers[index] = {
        ...player,
        gameInfo: { ...player.gameInfo, isWinner: !player.gameInfo.isWinner },
      }

      this.setData({ gamePlayers })
    },

    // === 相公输家切换 ===
    toggleXiangongLoser(e: any) {
      const index = e.currentTarget.dataset.index
      const gamePlayers = [...this.data.gamePlayers]
      // 相公只能选1个人
      gamePlayers.forEach((p: any, i: number) => {
        gamePlayers[i] = {
          ...p,
          gameInfo: { ...p.gameInfo, isLoser: i === index ? !p.gameInfo.isLoser : false },
        }
      })
      this.setData({ gamePlayers })
    },

    // === 底分选择 ===
    selectBasePoints(e: any) {
      this.setData({ basePoints: e.currentTarget.dataset.points })
    },

    decreaseBasePoints() {
      if (this.data.basePoints > 1) {
        this.setData({ basePoints: this.data.basePoints - 1 })
      }
    },

    increaseBasePoints() {
      this.setData({ basePoints: this.data.basePoints + 1 })
    },

    // === 番型选择 ===
    toggleWinType(e: any) {
      const index = e.currentTarget.dataset.index
      const winTypeList = [...this.data.winTypeList]
      winTypeList[index] = { ...winTypeList[index], selected: !winTypeList[index].selected }

      // 计算总倍率
      let multi = 1
      winTypeList.forEach((wt: any) => {
        if (wt.selected) multi *= wt.multiplier
      })

      this.setData({ winTypeList, currentMulti: multi })
    },

    // === 返回上一步 ===
    prevStep() {
      if (this.data.step > 0) {
        this.setData({ step: this.data.step - 1 })
      }
    },

    // === 提交记录 ===
    submitGame() {
      const { gameType, gamePlayers, basePoints, currentMulti, currentPlayers } = this.data
      const user = this.properties.user as any
      if (!user || !user.id) {
        wx.showToast({ title: '用户信息异常', icon: 'none' })
        return
      }

      const validPlayers = currentPlayers.filter((p: any) => p.id)
      const playerIds = validPlayers.map((p: any) => p.id)

      let gameTypeCode = 0
      let winners: RecordWinnerDTO[] = []
      let losers: number[] = []

      if (gameType === 'hu') {
        const winnerPlayers = gamePlayers.filter((p: any) => p.gameInfo.isWinner)
        if (winnerPlayers.length === 0) {
          wx.showToast({ title: '请选择赢家', icon: 'none' })
          return
        }
        // 根据赢家数量确定类型
        if (winnerPlayers.length === 1) gameTypeCode = 1 // 平胡
        else if (winnerPlayers.length === 2) gameTypeCode = 3 // 一炮双响
        else if (winnerPlayers.length === 3) gameTypeCode = 4 // 一炮三响

        const selectedWinTypes = this.data.winTypeList
          .filter((wt: any) => wt.selected)
          .map((wt: any) => wt.name)

        winners = winnerPlayers.map((p: any) => ({
          userId: p.id,
          basePoints: basePoints,
          winTypes: selectedWinTypes,
        }))

        losers = gamePlayers
          .filter((p: any) => !p.gameInfo.isWinner)
          .map((p: any) => p.id)
      } else if (gameType === 'zimo') {
        const winnerPlayer = gamePlayers.find((p: any) => p.gameInfo.isWinner)
        if (!winnerPlayer) {
          wx.showToast({ title: '请选择赢家', icon: 'none' })
          return
        }
        gameTypeCode = 2

        const selectedWinTypes = this.data.winTypeList
          .filter((wt: any) => wt.selected)
          .map((wt: any) => wt.name)

        winners = [{
          userId: winnerPlayer.id,
          basePoints: basePoints,
          winTypes: selectedWinTypes,
        }]

        losers = gamePlayers
          .filter((p: any) => !p.gameInfo.isWinner)
          .map((p: any) => p.id)
      } else if (gameType === 'xiangong') {
        gameTypeCode = 5
        const xiangongPlayer = gamePlayers.find((p: any) => p.gameInfo.isLoser)
        if (!xiangongPlayer) {
          wx.showToast({ title: '请选择相公者', icon: 'none' })
          return
        }

        // 相公者是输家，其他人是赢家
        winners = gamePlayers
          .filter((p: any) => !p.gameInfo.isLoser)
          .map((p: any) => ({
            userId: p.id,
            basePoints: 1,
            winTypes: [],
          }))

        losers = [xiangongPlayer.id]
      } else if (gameType === 'yundong') {
        gameTypeCode = 6
        winners = [{
          userId: user.id,
          basePoints: 10,
          winTypes: [],
        }]
        losers = []
        // 运动类型玩家只有记录者
      }

      const requestData: RecordMaJiangGameRequest = {
        gameType: gameTypeCode,
        players: gameType === 'yundong' ? [user.id] : playerIds,
        recorderId: user.id,
        winners,
        losers,
      }

      wx.showLoading({ title: '提交中...' })
      recordMaJiangGame(requestData)
        .then(() => {
          wx.hideLoading()
          wx.showToast({ title: '记录成功', icon: 'success' })
          this.triggerEvent('gameRecorded')
          // 关闭面板后重置到步骤1（保持玩家，方便连续记录）
          this.setData({
            step: 1,
            gameType: '',
            basePoints: 3,
            winTypeList: JSON.parse(JSON.stringify(WIN_TYPES)),
            currentMulti: 1,
          })
        })
        .catch((err) => {
          wx.hideLoading()
          console.error('记录失败:', err)
          wx.showToast({ title: typeof err === 'string' ? err : '记录失败', icon: 'none' })
        })
    },

    // === 重置 ===
    resetAll() {
      this.setData({
        step: 0,
        gameType: '',
        currentPlayers: [],
        allPlayers: [],
        gamePlayers: [],
        selectedCount: 0,
        basePoints: 3,
        winTypeList: JSON.parse(JSON.stringify(WIN_TYPES)),
        currentMulti: 1,
      })
    },
  },
})
