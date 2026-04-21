import { request } from './request-service'

// 获取全局对局记录
export const getGameList = (limit: number, offset: number): Promise<GameDTO[]> => {
  return request<GameDTO[]>({
    url: '/api/game/recent',
    method: 'GET',
    data: { limit, offset },
  })
}

// 获取用户个人对局记录
export const getGameListByUser = (userId: number, limit: number, offset: number): Promise<GameDTO[]> => {
  return request<GameDTO[]>({
    url: '/api/game/user/list',
    method: 'GET',
    data: { userId, limit, offset },
  })
}

// 取消/删除对局记录
export const cancelGame = (gameId: number): Promise<any> => {
  return request<any>({
    url: '/api/game/cancel',
    method: 'POST',
    data: { game_id: gameId },
    header: { 'content-type': 'application/json' },
  })
}

// 获取牌桌玩家
export const getPlayers = (): Promise<PlayersResponse> => {
  return request<PlayersResponse>({
    url: '/api/game/players',
    method: 'GET',
  })
}

export const getMajiangPlayers = (): Promise<MajiangPlayers> => {
  return getPlayers().then((res) => ({
    currentPlayers: res.current_players || [],
    allPlayers: res.all_players || [],
  }))
}

// 更新牌桌玩家
export const updatePlayers = (userIds: number[]): Promise<any> => {
  return request<any>({
    url: '/api/game/players',
    method: 'POST',
    data: { user_ids: userIds },
    header: { 'content-type': 'application/json' },
  })
}

// 记录一局麻将
export const recordMaJiangGame = (data: RecordMaJiangGameRequest): Promise<any> => {
  return request<any>({
    url: '/api/game/record',
    method: 'POST',
    data: data,
    header: { 'content-type': 'application/json' },
  })
}

export const saveMaJiangGame = (data: RecordMaJiangGameRequest): Promise<any> => {
  return recordMaJiangGame(data)
}

export const deleteMajiangLog = (gameId: number, _userId: number): Promise<any> => {
  return cancelGame(gameId)
}
