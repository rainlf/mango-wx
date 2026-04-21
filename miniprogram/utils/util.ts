export const formatTime = (date: Date) => {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hour = date.getHours()
  const minute = date.getMinutes()
  const second = date.getSeconds()

  return (
    [year, month, day].map(formatNumber).join('/') +
    ' ' +
    [hour, minute, second].map(formatNumber).join(':')
  )
}

const formatNumber = (n: number) => {
  const s = n.toString()
  return s[1] ? s : '0' + s
}

// 从缓存中更新头像
export const updateAvatarFromCache = (userId: number, avatars: any[]): string | null => {
  if (!avatars || avatars.length === 0) return null
  const userInfo = avatars.find((item: any) => item.id === userId)
  return userInfo ? userInfo.avatar : null
}

// 将后端 UserDTO 转为前端 User 结构
export const convertUserDTO = (dto: UserDTO): User => {
  return {
    id: dto.id,
    username: dto.nickname || '',
    nickname: dto.nickname || '',
    avatar: dto.avatar || '',
    points: dto.total_points || 0,
    totalGames: dto.total_games || 0,
    winCount: dto.win_count || 0,
    lastTags: [],
    createdTime: dto.created_at || '',
    updatedTime: dto.updated_at || '',
    selected: false,
    lastSelected: false,
    gameInfo: { basePoints: 0, winTypes: [], multi: 1 },
  }
}

// 将后端 GameDTO 转为前端 MajiangLog 结构
export const convertGameDTO = (dto: GameDTO, currentUserId: number): MajiangLog => {
  // 按座位排序获取4个玩家
  const sortedPlayers = [...dto.players]
    .filter(p => p.role_code !== 3) // 排除纯记录者角色
    .sort((a, b) => a.seat - b.seat)
  
  // 如果不足4人（运动类型等），用空用户补齐
  const emptyUser: User = {
    id: 0, username: '', nickname: '', avatar: '', points: 0,
    totalGames: 0, winCount: 0, lastTags: [], createdTime: '', updatedTime: '',
    selected: false, lastSelected: false,
    gameInfo: { basePoints: 0, winTypes: [], multi: 1 },
  }

  const allParticipants = dto.players.filter(p => p.role_code === 1 || p.role_code === 2 || p.role_code === 4)
  const playerList = allParticipants.sort((a, b) => a.seat - b.seat)

  const player1 = playerList[0] ? convertUserDTO(playerList[0].user) : emptyUser
  const player2 = playerList[1] ? convertUserDTO(playerList[1].user) : emptyUser
  const player3 = playerList[2] ? convertUserDTO(playerList[2].user) : emptyUser
  const player4 = playerList[3] ? convertUserDTO(playerList[3].user) : emptyUser

  // 构建赢家列表
  const winners: MajiangLogItem[] = dto.players
    .filter(p => p.role_code === 1)
    .map(p => ({
      user: convertUserDTO(p.user),
      points: p.final_points,
      tags: p.win_types ? p.win_types.map(wt => wt.name) : [],
    }))

  // 构建输家列表
  const losers: MajiangLogItem[] = dto.players
    .filter(p => p.role_code === 2)
    .map(p => ({
      user: convertUserDTO(p.user),
      points: p.final_points,
      tags: p.win_types ? p.win_types.map(wt => wt.name) : [],
    }))

  // 运动类型特殊处理：构建"银行"输家
  if (dto.type_code === 6 && losers.length === 0 && winners.length > 0) {
    const totalWinPoints = winners.reduce((sum, w) => sum + w.points, 0)
    losers.push({
      user: { ...emptyUser, username: '银行', nickname: '银行' },
      points: -totalWinPoints,
      tags: [],
    })
  }

  // 找到记录者
  const recorderPlayer = dto.players.find(p => p.role_code === 3) || dto.players[0]
  const recorder: MajiangLogItem = {
    user: recorderPlayer ? convertUserDTO(recorderPlayer.user) : emptyUser,
    points: recorderPlayer ? recorderPlayer.final_points : 0,
    tags: [],
  }

  // 删除图标：只有记录者本人可以删除
  const deleteIcon = (recorderPlayer && recorderPlayer.user.id === currentUserId) ? '/images/delete.png' : ''

  // 是否为当前用户的个人视图下的对局
  const currentPlayerInGame = dto.players.find(p => p.user.id === currentUserId)
  const playerWin = currentPlayerInGame ? currentPlayerInGame.role_code === 1 : false

  return {
    id: dto.id,
    type: dto.type,
    typeCode: dto.type_code,
    status: dto.status,
    sessionId: dto.session_id,
    player1,
    player2,
    player3,
    player4,
    createdTime: dto.created_at,
    updatedTime: dto.settled_at || dto.created_at,
    winners,
    losers,
    recorder,
    deleteIcon,
    forOnePlayer: false,
    playerWin,
    remark: dto.remark || '',
  }
}
