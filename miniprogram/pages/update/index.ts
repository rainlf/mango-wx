import {getServer} from "../../services/request-service";
import {updateUsername} from "../../services/user-service";

const defaultAvatarUrl = 'https://mmbiz.qpic.cn/mmbiz/icTdbqWNOwNRna42FI242Lcia07jQodd2FJGIYQfG0LAJGFxM4FbnQP6yfMxBgJ0F3YRqJCJ1aPAK2dQagdusBZg/0'

Page({
    data: {
        motto: '请更新头像',
        userInfo: {
            avatarUrl: defaultAvatarUrl,
            nickName: '',
        },
        user: {} as User,
        hasUserInfo: false,
        canIUseGetUserProfile: wx.canIUse('getUserProfile'),
        canIUseNicknameComp: wx.canIUse('input.type.nickname'),
    },
    onLoad() {
        const user: User = wx.getStorageSync('user')
        if (user) {
            this.setData({
                user,
                'userInfo.avatarUrl': user.avatar,
                'userInfo.nickName': user.username,
            })
        }
    },
    onChooseAvatar(e: any) {
        const {avatarUrl} = e.detail
        const {nickName} = this.data.userInfo
        this.setData({
            'userInfo.avatarUrl': avatarUrl,
            hasUserInfo: nickName && avatarUrl && avatarUrl !== defaultAvatarUrl,
        })

    },
    onInputChange(e: any) {
        const nickName = e.detail.value
        const {avatarUrl} = this.data.userInfo
        this.setData({
            'userInfo.nickName': nickName,
            hasUserInfo: nickName && avatarUrl && avatarUrl !== defaultAvatarUrl,
        })
    },
    getUserProfile() {
        // 推荐使用wx.getUserProfile获取用户信息，开发者每次通过该接口获取用户个人信息均需用户确认，开发者妥善保管用户快速填写的头像昵称，避免重复弹窗
        wx.getUserProfile({
            desc: '展示用户信息', // 声明获取用户个人信息后的用途，后续会展示在弹窗中，请谨慎填写
            success: (res) => {
                this.setData({
                    userInfo: res.userInfo,
                    hasUserInfo: true
                })
            }
        })
    },
    login() {
        if (this.data.userInfo.avatarUrl === this.data.user.avatar && this.data.userInfo.nickName === this.data.user.username) {
            console.log('nothing change, back to home')
            wx.navigateBack()
            return;
        }
        if (this.data.userInfo.avatarUrl === this.data.user.avatar && this.data.userInfo.nickName !== this.data.user.username) {
            console.log('username change, just update username')
            updateUsername(this.data.user.id, this.data.userInfo.nickName)
                .then(() => {
                    console.log('username change success, back to home')
                    wx.setStorageSync('user', {
                        ...this.data.user,
                        username: this.data.userInfo.nickName,
                    })
                    wx.navigateBack()
                })
            return;
        }

        console.log('update user', this.data.userInfo)
        wx.uploadFile({
            url: `${getServer()}/user/info`,
            filePath: this.data.userInfo.avatarUrl,
            name: 'avatar',
            formData: {
                'userId': this.data.user.id,
                'username': this.data.userInfo.nickName,
            },
            success(res) {
                // 用户信息埋入 wx storage
                wx.setStorageSync('user', JSON.parse(res.data));
                wx.navigateBack()
            }
        })
    },
    },
    
    back() {
        wx.navigateBack()
    }
})
