import { uploadUserInfo } from '../../services/user-service'
import { getUserInfo } from '../../services/user-service'
import { convertUserDTO } from '../../utils/util'

Page({
  data: {
    user: null as any,
    userInfo: {
      avatarUrl: '',
      nickName: '',
    },
    canLogin: false,
  },

  onLoad() {
    const user = wx.getStorageSync('user')
    if (user) {
      this.setData({ user })
    }
  },

  onChooseAvatar(e: any) {
    const avatarUrl = e.detail.avatarUrl
    this.setData({
      'userInfo.avatarUrl': avatarUrl,
      canLogin: !!avatarUrl && !!this.data.userInfo.nickName,
    })
  },

  onNicknameInput(e: any) {
    const nickName = e.detail.value
    this.setData({
      'userInfo.nickName': nickName,
      canLogin: !!this.data.userInfo.avatarUrl && !!nickName,
    })
  },

  login() {
    if (!this.data.user || !this.data.user.id) {
      wx.showToast({ title: '用户信息异常', icon: 'none' })
      return
    }
    if (!this.data.userInfo.avatarUrl || !this.data.userInfo.nickName) {
      wx.showToast({ title: '请选择头像和输入昵称', icon: 'none' })
      return
    }

    wx.showLoading({ title: '提交中...' })
    uploadUserInfo(this.data.user.id, this.data.userInfo.nickName, this.data.userInfo.avatarUrl)
      .then(() => {
        // 重新获取用户信息
        return getUserInfo(this.data.user.id)
      })
      .then((userDTO) => {
        const user = convertUserDTO(userDTO)
        wx.setStorageSync('user', user)
        wx.hideLoading()
        wx.redirectTo({ url: '../majiang/index' })
      })
      .catch((err) => {
        wx.hideLoading()
        console.error('登录失败:', err)
        wx.showToast({ title: '提交失败', icon: 'none' })
      })
  },
})
