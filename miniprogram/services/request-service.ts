const ONLINE_SERVER = 'https://wx.guanshantech.com'
const LOCAL_SERVER = 'http://localhost:8080'

const getServer = (): string => {
  const envVersion = wx.getAccountInfoSync().miniProgram.envVersion
  const { platform } = wx.getSystemInfoSync()

  switch (envVersion) {
    case 'develop':
      return platform === 'devtools' ? LOCAL_SERVER : ONLINE_SERVER
    case 'trial':
      return ONLINE_SERVER
    case 'release':
      return ONLINE_SERVER
    default:
      return LOCAL_SERVER
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
        const response = res.data as any
        // 后端返回格式: { code: 0, message: "success", data: ... }
        if (response.code === 0) {
          resolve(response.data as T)
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
