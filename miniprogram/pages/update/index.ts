import { uploadUserInfo, updateUsername, getUserInfo } from '../../services/user-service'
import { convertUserDTO } from '../../utils/util'

Page({
  data: {
    user: null as any,
    avatarUrl: '',
    nickname: '',
    avatarChanged: false,
  },

  onLoad() {
    const user = wx.getStorageSync('user')
    if (user) {
      this.setData({
        user,
        nickname: user.nickname || user.username || '',
      })
    }
  },

  onChooseAvatar(e: any) {
    this.setData({
      avatarUrl: e.detail.avatarUrl,
      avatarChanged: true,
    })
  },

  onNicknameInput(e: any) {
    this.setData({ nickname: e.detail.value })
  },

  save() {
    const { user, nickname, avatarUrl, avatarChanged } = this.data
    if (!user || !user.id) return

    wx.showLoading({ title: '保存中...' })

    let savePromise: Promise<any>
    if (avatarChanged && avatarUrl) {
      // 头像和昵称都更新
      savePromise = uploadUserInfo(user.id, nickname, avatarUrl)
    } else if (nickname !== (user.nickname || user.username || '')) {
      // 只更新昵称
      savePromise = updateUsername(user.id, nickname)
    } else {
      wx.hideLoading()
      wx.showToast({ title: '未做修改', icon: 'none' })
      return
    }

    savePromise
      .then(() => getUserInfo(user.id))
      .then((userDTO) => {
        const updatedUser = convertUserDTO(userDTO)
        wx.setStorageSync('user', updatedUser)
        this.setData({ user: updatedUser })
        wx.hideLoading()
        wx.showToast({ title: '保存成功', icon: 'success' })
        setTimeout(() => this.back(), 500)
      })
      .catch((err) => {
        wx.hideLoading()
        console.error('保存失败:', err)
        wx.showToast({ title: '保存失败', icon: 'none' })
      })
  },

  back() {
    wx.navigateBack()
  },
})
