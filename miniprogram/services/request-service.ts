const getServer = (): string => {
  const envVersion = wx.getAccountInfoSync().miniProgram.envVersion
  switch (envVersion) {
    case 'develop':
      return 'http://localhost:8080'
    case 'trial':
      return 'https://mp.guanshantech.com'
    case 'release':
      return 'https://mp.guanshantech.com'
    default:
      return 'http://localhost:8080'
  }
}

export { getServer }

interface RequestOptions {
  url: string
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  data?: any
  header?: Record<string, string>
}

export const request = <T>(options: RequestOptions): Promise<T> => {
  const fullUrl = options.url.startsWith('http') ? options.url : `${getServer()}${options.url}`
  return new Promise((resolve, reject) => {
    wx.request({
      ...options,
      url: fullUrl,
      success: (res) => {
        const response = res.data as ApiResponse<T>
        if (response.success) {
          resolve(response.data)
        } else {
          reject(response.message || '请求失败')
        }
      },
      fail: () => {
        reject('网络连接失败')
      },
    })
  })
}
