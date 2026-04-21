import { getUserInfo, getUserRank } from '../../services/user-service'
import { getGameList, getGameListByUser, cancelGame } from '../../services/majiang-service'
import { convertUserDTO, convertGameDTO, updateAvatarFromCache } from '../../utils/util'

const PAGE_SIZE = 10

Page({
  data: {
    user: null as any,
    // 视图控制
    showUserRank: true,
    showGameLog: false,
    showUserGameLog: false,
    // 排行榜
    rankList: [] as User[],
    // 全局对局记录
    gameLogList: [] as MajiangLog[],
    gameLogOffset: 0,
    gameLogHasMore: true,
    // 个人对局记录
    userGameLogList: [] as MajiangLog[],
    userGameLogOffset: 0,
    userGameLogHasMore: true,
    currentViewUser: null as any,
  },

  onLoad() {
    const user = wx.getStorageSync('user')
    if (user) {
      this.setData({ user })
    }
    this.fetchUserRank()
  },

  onShow() {
    // 刷新用户信息
    const user = wx.getStorageSync('user')
    if (user && user.id) {
      getUserInfo(user.id)
        .then((dto) => {
          const updatedUser = convertUserDTO(dto)
          wx.setStorageSync('user', updatedUser)
          this.setData({ user: updatedUser })
        })
        .catch(() => {})
    }
  },

  // 刷新用户信息
  refreshUser() {
    const user = this.data.user
    if (user && user.id) {
      getUserInfo(user.id)
        .then((dto) => {
          const updatedUser = convertUserDTO(dto)
          wx.setStorageSync('user', updatedUser)
          this.setData({ user: updatedUser })
        })
        .catch(() => {})
    }
  },

  // === 视图切换 ===
  switchToRank() {
    this.setData({
      showUserRank: true,
      showGameLog: false,
      showUserGameLog: false,
    })
    this.fetchUserRank()
  },

  switchToGameLog() {
    this.setData({
      showUserRank: false,
      showGameLog: true,
      showUserGameLog: false,
      gameLogList: [],
      gameLogOffset: 0,
      gameLogHasMore: true,
    })
    this.fetchGameList(false)
  },

  // === 排行榜 ===
  fetchUserRank() {
    getUserRank()
      .then((dtos) => {
        const rankList = dtos.map((dto: UserDTO) => convertUserDTO(dto))
        // 缓存头像
        const avatars = rankList.map((u: User) => ({ id: u.id, avatar: u.avatar }))
        wx.setStorageSync('avatars', avatars)
        this.setData({ rankList })
      })
      .catch((err) => {
        console.error('获取排行榜失败:', err)
      })
  },

  // 点击排行榜头像 → 切换到个人对局视图
  onClickUserAvatar(e: any) {
    const user = e.detail
    this.setData({
      showUserRank: false,
      showGameLog: false,
      showUserGameLog: true,
      currentViewUser: user,
      userGameLogList: [],
      userGameLogOffset: 0,
      userGameLogHasMore: true,
    })
    this.fetchUserGameList(user.id, false)
  },

  // === 全局对局记录 ===
  fetchGameList(isLoadMore: boolean) {
    if (isLoadMore && !this.data.gameLogHasMore) {
      this.notifyComponentLoadMoreComplete('game-log')
      return
    }

    const offset = isLoadMore ? this.data.gameLogOffset : 0
    const currentUserId = this.data.user ? this.data.user.id : 0

    getGameList(PAGE_SIZE, offset)
      .then((dtos) => {
        const avatars = wx.getStorageSync('avatars') || []
        let logs = dtos.map((dto: GameDTO) => {
          const log = convertGameDTO(dto, currentUserId)
          // 更新头像缓存
          if (avatars.length > 0) {
            this.updateLogAvatars(log, avatars)
          }
          return log
        })

        if (isLoadMore) {
          logs = [...this.data.gameLogList, ...logs]
        }

        this.setData({
          gameLogList: logs,
          gameLogOffset: offset + dtos.length,
          gameLogHasMore: dtos.length >= PAGE_SIZE,
        })
        this.notifyComponentLoadMoreComplete('game-log')
      })
      .catch((err) => {
        console.error('获取对局记录失败:', err)
        this.notifyComponentLoadMoreComplete('game-log')
      })
  },

  // === 个人对局记录 ===
  fetchUserGameList(userId: number, isLoadMore: boolean) {
    if (isLoadMore && !this.data.userGameLogHasMore) {
      this.notifyComponentLoadMoreComplete('user-game-log')
      return
    }

    const offset = isLoadMore ? this.data.userGameLogOffset : 0
    const currentUserId = this.data.user ? this.data.user.id : 0

    getGameListByUser(userId, PAGE_SIZE, offset)
      .then((dtos) => {
        const avatars = wx.getStorageSync('avatars') || []
        let logs = dtos.map((dto: GameDTO) => {
          const log = convertGameDTO(dto, currentUserId)
          log.forOnePlayer = true
          log.playerWin = dto.players.some(
            (p: any) => p.user.id === userId && p.role_code === 1
          )
          if (avatars.length > 0) {
            this.updateLogAvatars(log, avatars)
          }
          return log
        })

        if (isLoadMore) {
          logs = [...this.data.userGameLogList, ...logs]
        }

        this.setData({
          userGameLogList: logs,
          userGameLogOffset: offset + dtos.length,
          userGameLogHasMore: dtos.length >= PAGE_SIZE,
        })
        this.notifyComponentLoadMoreComplete('user-game-log')
      })
      .catch((err) => {
        console.error('获取个人对局记录失败:', err)
        this.notifyComponentLoadMoreComplete('user-game-log')
      })
  },

  // 更新对局记录中的头像
  updateLogAvatars(log: MajiangLog, avatars: any[]) {
    const updateAvatar = (user: User) => {
      if (user && user.id) {
        const cached = updateAvatarFromCache(user.id, avatars)
        if (cached) user.avatar = cached
      }
    }
    updateAvatar(log.player1)
    updateAvatar(log.player2)
    updateAvatar(log.player3)
    updateAvatar(log.player4)
    log.winners.forEach((item) => updateAvatar(item.user))
    log.losers.forEach((item) => updateAvatar(item.user))
    if (log.recorder) updateAvatar(log.recorder.user)
  },

  // 通知子组件加载更多完成
  notifyComponentLoadMoreComplete(componentId: string) {
    const comp = this.selectComponent(`#${componentId}`) as any
    if (comp && comp.loadMoreComplete) {
      comp.loadMoreComplete()
    }
  },

  // === 事件处理 ===
  handleLoadMore() {
    if (this.data.showGameLog) {
      this.fetchGameList(true)
    } else if (this.data.showUserGameLog && this.data.currentViewUser) {
      this.fetchUserGameList(this.data.currentViewUser.id, true)
    }
  },

  handleDeleteLog(e: any) {
    const { gameId } = e.detail
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这条对局记录吗？',
      success: (res) => {
        if (res.confirm) {
          cancelGame(gameId)
            .then(() => {
              wx.showToast({ title: '已删除', icon: 'success' })
              // 刷新当前视图
              this.refreshCurrentView()
            })
            .catch((err) => {
              console.error('删除失败:', err)
              wx.showToast({ title: '删除失败', icon: 'none' })
            })
        }
      },
    })
  },

  handleRefreshGameLog() {
    this.setData({
      gameLogList: [],
      gameLogOffset: 0,
      gameLogHasMore: true,
    })
    this.fetchGameList(false)
  },

  handleRefreshUserGameLog() {
    if (this.data.currentViewUser) {
      this.setData({
        userGameLogList: [],
        userGameLogOffset: 0,
        userGameLogHasMore: true,
      })
      this.fetchUserGameList(this.data.currentViewUser.id, false)
    }
  },

  // 打开记分面板
  openGamePanel() {
    const comp = this.selectComponent('#majiang-game') as any
    if (comp && comp.openPanel) {
      comp.openPanel()
    }
  },

  // 记录完成后刷新
  onGameRecorded() {
    this.refreshUser()
    this.refreshCurrentView()
  },

  refreshCurrentView() {
    if (this.data.showUserRank) {
      this.fetchUserRank()
    } else if (this.data.showGameLog) {
      this.handleRefreshGameLog()
    } else if (this.data.showUserGameLog && this.data.currentViewUser) {
      this.handleRefreshUserGameLog()
    }
  },
})
