import {request} from "./request-service";


export const login = (code: string): Promise<User> => {
    return request({
        url: `/user/login?code=${code}`,
        method: 'GET',
    });
}

export const updateUsername = (userId: number, username: string): Promise<void> => {
    // Validate userId parameter
    if (!userId || typeof userId !== 'number' || isNaN(userId)) {
        console.warn('Invalid userId parameter in updateUsername:', userId);
        return Promise.reject(new Error('Invalid userId parameter'));
    }
    
    // Validate username parameter
    if (!username || typeof username !== 'string') {
        console.warn('Invalid username parameter in updateUsername:', username);
        return Promise.reject(new Error('Invalid username parameter'));
    }
    
    return request({
        url: `/user/username?userId=${userId}&username=${username}`,
        method: 'POST',
    });
}

export const getUserInfo = (userId: number): Promise<User> => {
    // Validate userId parameter
    if (!userId || typeof userId !== 'number' || isNaN(userId)) {
        console.warn('Invalid userId parameter in getUserInfo:', userId);
        return Promise.reject(new Error('Invalid userId parameter'));
    }
    
    return request({
        url: `/user/info?userId=${userId}`,
        method: 'GET',
    });
}

export const getUserRank = (): Promise<User[]> => {
    return request({
        url: `/user/rank`,
        method: 'GET',
    });
}

