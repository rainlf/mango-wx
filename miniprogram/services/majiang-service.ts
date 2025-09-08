import {request} from "./request-service";


export const getMajiangLog = (limit: number = 10, offset: number = 0): Promise<MajiangLog[]> => {
    return request({
        url: `/majiang/games?limit=${limit}&offset=${offset}`,
        method: 'GET',
    });
}

export const getMajiangLogByUser = (userId: number, limit: number = 10, offset: number = 0): Promise<MajiangLog[]> => {
    // Validate userId parameter
    if (!userId || typeof userId !== 'number' || isNaN(userId)) {
        console.warn('Invalid userId parameter in getMajiangLogByUser:', userId);
        return Promise.reject(new Error('Invalid userId parameter'));
    }
    
    return request({
        url: `/majiang/user/games?userId=${userId}&limit=${limit}&offset=${offset}`,
        method: 'GET',
    });
}

export const deleteMajiangLog = (gameId: number, userId: number): Promise<void> => {
    // Validate parameters
    if (!gameId || typeof gameId !== 'number' || isNaN(gameId)) {
        console.warn('Invalid gameId parameter in deleteMajiangLog:', gameId);
        return Promise.reject(new Error('Invalid gameId parameter'));
    }
    
    if (!userId || typeof userId !== 'number' || isNaN(userId)) {
        console.warn('Invalid userId parameter in deleteMajiangLog:', userId);
        return Promise.reject(new Error('Invalid userId parameter'));
    }
    
    return request({
        url: `/majiang/game?id=${gameId}&userId=${userId}`,
        method: 'DELETE',
    });
}

export const getMajiangPlayers = (): Promise<MajiangPlayers> => {
    return request({
        url: `/majiang/game/players`,
        method: 'GET',
    });
}

export const saveMaJiangGame = (data: any): Promise<number> => {
    return request({
        url: `/majiang/game`,
        method: 'POST',
        data,
    });
}

