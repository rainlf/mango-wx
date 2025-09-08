import {getMajiangPlayers, saveMaJiangGame} from "../../services/majiang-service";

Component({
    properties: {
        showDrawer: {
            type: Boolean,
            value: true
        }
    },
    data: {
        gameType: '胡牌', // 默认选中胡牌
        allPlayers: [] as User[],
        winPlayers: [] as User[],
        losePlayers: [] as User[],
        changingPlayers: false,
        selectUserToPlayList: [] as number[],
        showButton: true,

        // 底分
        points: [
            {name: 3, point: 3, selected: false},
            {name: 4, point: 4, selected: false},
            {name: 5, point: 5, selected: false},
            {name: 6, point: 6, selected: false},
            {name: 7, point: 7, selected: false},
            {name: '🍒', point: 10, selected: false},
        ],

        // 牌型
        winTypes: [
            {name: '一条龙', multi: 2, selected: false},
            {name: '大吊车', multi: 2, selected: false},
            {name: '碰碰胡', multi: 2, selected: false},
            {name: '门前清', multi: 2, selected: false},
            {name: '混一色', multi: 2, selected: false},
            {name: '清一色', multi: 4, selected: false},
            {name: '小七对', multi: 4, selected: false},
            {name: '龙七对', multi: 8, selected: false},
            {name: '杠开花', multi: 2, selected: false},
        ],
    },
    observers: {
        'showDrawer': function (val) {
            if (val) {
                this.loadData()
            }
        }
    },
    methods: {
        // 数据初始化
        loadData() {
            getMajiangPlayers().then((res) => {
                // 场上玩家
                const currentPlayers = res.currentPlayers

                // 场上玩家ids
                const currentIds = currentPlayers.map((player: User) => (player.id))

                // 赢家
                const winPlayers = currentPlayers.map((player: User, index: number) => ({
                    ...player,
                    selected: index === 0,
                    lastSelected: index === 0,
                    gameInfo: {basePoints: 0, winTypes: [], multi: 1},
                }))
                const selectedWinPlayerId = winPlayers.filter(x => x.selected)[0].id

                // 输家
                const losePlayers = currentPlayers.filter(x => x.id !== selectedWinPlayerId).map((player: User) => ({
                    ...player,
                    selected: false
                }))

                // 全部玩家
                const allPlayers = res.allPlayers
                    .map((player: User) => {
                        if (currentIds.includes(player.id)) {
                            return {...player, selected: true}
                        } else {
                            return {...player, selected: false}
                        }
                    })

                this.setData({
                    winPlayers,
                    losePlayers,
                    allPlayers,
                    selectUserToPlayList: currentIds,
                })
            })
        },

        // 清空按钮
        handleDelete(e: any) {
            // 当前选中的用户id
            const userId = e.currentTarget.dataset.userid;
            // Validate userId before proceeding
            if (!userId || typeof userId !== 'number') {
                console.warn('Invalid userId in handleDelete:', userId);
                return;
            }
            // 选中用户，清空积分
            const winPlayers = this.data.winPlayers.map((player: User) => player.id === userId ? {
                ...player,
                gameInfo: {basePoints: 0, winTypes: [], multi: 1}
            } : player)
            // 底分和牌型重置
            const points = this.data.points.map((point: any) => ({...point, selected: false}))
            const winTypes = this.data.winTypes.map((winType: any) => ({...winType, selected: false}))

            this.setData({
                winPlayers,
                points,
                winTypes,
            })
        },

        // 底分
        selectBasePoints(e: any) {
            const name = e.currentTarget.dataset.name;
            // const selected = e.currentTarget.dataset.selected;
            const point = e.currentTarget.dataset.point;
            const userId = e.currentTarget.dataset.userid;
            
            // Validate userId before proceeding
            if (!userId || typeof userId !== 'number') {
                console.warn('Invalid userId in selectBasePoints:', userId);
                return;
            }

            this.setData({
                points: this.data.points.map((point: any) => {
                    if (point.name === name) {
                        return {...point, selected: true};
                    } else {
                        return {...point, selected: false};
                    }
                }),
                winPlayers: this.data.winPlayers.map((user: User) => {
                    if (user.id === userId) {
                        return {...user, selected: true, gameInfo: {...user.gameInfo, basePoints: point}}
                    } else {
                        return user
                    }
                })
            })
        },
        handleDecrease(e: any) {
            const userId = e.currentTarget.dataset.userid;
            
            // Validate userId before proceeding
            if (!userId || typeof userId !== 'number') {
                console.warn('Invalid userId in handleDecrease:', userId);
                return;
            }

            const user = this.data.winPlayers.filter(x => x.id === userId)[0]
            const target = user.gameInfo.basePoints - 1
            if (target < 0) {
                wx.showToast({
                    title: '底分不能小于 0 呀 😏',
                    icon: 'none',
                    duration: 1000
                })
                return;
            }
            this.setData({
                winPlayers: this.data.winPlayers.map((player: User) => {
                    if (player.id === userId) {
                        return {...player, selected: true, gameInfo: {...player.gameInfo, basePoints: target}};
                    } else {
                        return player
                    }
                }),
                points: this.data.points.map((point: any) => ({...point, selected: point.point === target})),
            })
        },
        handleIncrease(e: any) {
            const userId = e.currentTarget.dataset.userid;
            
            // Validate userId before proceeding
            if (!userId || typeof userId !== 'number') {
                console.warn('Invalid userId in handleIncrease:', userId);
                return;
            }
            
            const user = this.data.winPlayers.filter(x => x.id === userId)[0]
            const target = user.gameInfo.basePoints + 1
            if (target > 20) {
                wx.showToast({
                    title: '底分是不是太大了呀 😏',
                    icon: 'none',
                    duration: 1000
                })
                return;
            }
            this.setData({
                winPlayers: this.data.winPlayers.map((player: User) => {
                    if (player.id === userId) {
                        return {...player, selected: true, gameInfo: {...player.gameInfo, basePoints: target}};
                    } else {
                        return player
                    }
                }),
                points: this.data.points.map((point: any) => ({...point, selected: point.point === target})),
            })
        },

        // 翻倍牌型
        toggleWinType(e: any) {
            const name = e.currentTarget.dataset.name;
            const multi = e.currentTarget.dataset.multi;
            const selected = e.currentTarget.dataset.selected;
            const userId = e.currentTarget.dataset.userid;

            this.setData({
                winTypes: this.data.winTypes.map((type: any) => {
                    if (type.name === name) {
                        return {...type, selected: !type.selected}
                    } else {
                        return type
                    }
                }),
                winPlayers: this.data.winPlayers.map((player: User) => {
                    if (player.id === userId) {
                        let totalMulti = player.gameInfo.multi
                        let totalWinTypes = player.gameInfo.winTypes
                        if (selected) {
                            // 取消点击
                            totalMulti /= multi
                            totalWinTypes = totalWinTypes.filter(x => x !== name)
                        } else {
                            // 点击
                            totalMulti *= multi
                            totalWinTypes = [...totalWinTypes, name]
                        }
                        return {
                            ...player,
                            selected: true,
                            gameInfo: {...player.gameInfo, winTypes: totalWinTypes, multi: totalMulti}
                        }
                    } else {
                        return player
                    }
                })
            })
        },

        // 选择胡牌类型
        selectWinType(e: any) {
            const type = e.currentTarget.dataset.type;
            this.setData({
                gameType: type,
                // 全部用户积分配置清零
                winPlayers: this.data.winPlayers.map((player: User, index: number) => {
                    return {
                        ...player,
                        selected: index === 0,
                        lastSelected: index === 0,
                        gameInfo: {basePoints: 0, winTypes: [], multi: 1}
                    }
                }),
                // 底分全部反选
                points: this.data.points.map((point: any) => ({...point, selected: false})),
                // 牌型全部反选
                winTypes: this.data.winTypes.map((winType: any) => ({...winType, selected: false})),
            });
        },

        // 选择赢家
        selectWinPlayer(e: any) {
            const playerId = e.currentTarget.dataset.id;
            const selected = e.currentTarget.dataset.selected;
            const lastSelected = e.currentTarget.dataset.lastselected;

            // 胡牌场景
            if (this.data.gameType === '胡牌') {
                // 点击检测，最多3个玩家赢牌
                let count = 0
                this.data.winPlayers.forEach((player: User) => {
                    if (player.selected) {
                        count++
                    }
                })
                if (selected === false && count >= 3) {
                    wx.showToast({
                        title: '最多 3 个赢家 😏',
                        icon: 'none',
                        duration: 1000
                    })
                    return;
                }

                // 用 selected 来标记是否选中，用 lastSelected 来标记是否当前选中
                // 点击未选中玩家时，lastSelected 为 false
                // 点击已选中玩家时，lastSelected 为 true
                if (selected && lastSelected) {
                    // 玩家从当前选中状态再次被点击
                    this.setData({
                        // 当前选中的玩家，lastSelected 改为 false，其他玩家改为 false
                        winPlayers: this.data.winPlayers.map((player: User) => player.id === playerId ? {
                            ...player,
                            selected: false,
                            lastSelected: false
                        } : {...player, lastSelected: false})
                    })
                    let firstSelectId = -1
                    this.data.winPlayers.forEach((player: User) => {
                        if (firstSelectId === -1 && player.selected) {
                            firstSelectId = player.id;
                        }
                    })
                    if (firstSelectId != -1) {
                        this.setData({
                            winPlayers: this.data.winPlayers.map((player: User) => player.id === firstSelectId ? {
                                ...player,
                                lastSelected: true
                            } : player)
                        })
                    }
                } else {
                    // 玩家从非选中状态被点击
                    this.setData({
                        // 当前选中的玩家，lastSelected 改为 true，其他玩家改为 false
                        winPlayers: this.data.winPlayers.map((player: User) => player.id === playerId ? {
                            ...player,
                            selected: true,
                            lastSelected: true
                        } : {...player, lastSelected: false})
                    })
                }

                // 玩家从非当前选中到当前选中状态
                if (!lastSelected) {
                    // 拿到当前选中的玩家记分信息
                    const user = this.data.winPlayers.filter(x => x.id === playerId)[0]
                    const targetPoints = user.gameInfo.basePoints
                    const targetWinTypes = user.gameInfo.winTypes
                    // 渲染至当前记分面板
                    this.setData({
                        points: this.data.points.map((point: any) => ({
                            ...point,
                            selected: point.point === targetPoints
                        })),
                        winTypes: this.data.winTypes.map((winType: any) => ({
                            ...winType,
                            selected: targetWinTypes.includes(winType.name)
                        })),
                    })
                }
            }

            // 自摸
            if (this.data.gameType === '自摸' || this.data.gameType === '相公') {
                this.setData({
                    // 清除非选中玩家的选中状态和记分信息
                    winPlayers: this.data.winPlayers.map((player: User) => player.id === playerId ? {
                            ...player,
                            selected: true,
                            lastSelected: true
                        } : {
                            ...player,
                            selected: false,
                            lastSelected: false,
                            gameInfo: {basePoints: 0, winTypes: [], multi: 1}
                        }
                    ),
                })
                // 玩家从非当前选中到当前选中状态，记分状态重置
                if (!lastSelected) {
                    this.setData({
                        points: this.data.points.map((point: any) => ({...point, selected: false})),
                        winTypes: this.data.winTypes.map((winType: any) => ({...winType, selected: false})),
                    })
                }
            }

            // 输家从赢家外的玩家选
            const selectedPlayerId: number[] = this.data.winPlayers
                .filter((player: User) => player.selected)
                .map((player: User) => player.id)
            this.setData({
                losePlayers: this.data.winPlayers
                    .filter(x => !selectedPlayerId.includes(x.id))
                    .map((player: User) => ({
                        ...player,
                        selected: false
                    }))
            })
        },
        selectLosePlayer(e: any) {
            const playerId = e.currentTarget.dataset.id;

            const winIds = this.data.winPlayers.filter((player: User) => player.selected).map((player: User) => player.id)
            if (winIds.includes(playerId)) {
                return;
            }

            this.setData({
                losePlayers: this.data.losePlayers.map((player: User) => {
                    if (player.id === playerId) {
                        return {...player, selected: true}
                    } else {
                        // 反选其他
                        return {...player, selected: false}
                    }
                }),
            })
        },
        selectPlayerToPlay(e: any) {
            const playerId = e.currentTarget.dataset.id;
            const selected = e.currentTarget.dataset.selected;

            if (selected === false && this.data.selectUserToPlayList.length >= 4) {
                wx.showToast({
                    title: '最多 4 人 PLAY 😏',
                    icon: 'none',
                    duration: 1000
                })
                return;
            }
            if (this.data.selectUserToPlayList.includes(playerId)) {
                let temp = [...this.data.selectUserToPlayList]
                temp.splice(this.data.selectUserToPlayList.indexOf(playerId), 1)
                this.setData({
                    selectUserToPlayList: [...temp]
                })
            } else {
                this.setData({
                    selectUserToPlayList: [...this.data.selectUserToPlayList, playerId]
                })
            }
            this.setData({
                allPlayers: this.data.allPlayers.map((player: User) => {
                    if (player.id === playerId) {
                        return {...player, selected: !player.selected}
                    } else {
                        return player
                    }
                }),
            })
        },
        // 换人按钮
        startChangePlayers() {
            this.setData({
                changingPlayers: true,
                showButton: false,
            })
        },
        stopChangePlayers() {
            const selectUser = this.data.allPlayers
                .filter((player: User) => (this.data.selectUserToPlayList.includes(player.id)))
                .map((player: User) => ({...player, selected: false}))
            if (selectUser.length != 4) {
                wx.showToast({
                    title: '游戏需要 4 名玩家哦 😏',
                    icon: 'none',
                    duration: 1000
                })
                return;
            }
            this.setData({
                changingPlayers: false,
                showButton: true,
                winPlayers: selectUser.map((player: User, index: number) => ({
                    ...player,
                    selected: index === 0,
                    lastSelected: index === 0,
                    gameInfo: {basePoints: 0, winTypes: [], multi: 1}
                })),
                losePlayers: [...selectUser],
            })
        },

        closeDrawer() {
            this.setData({
                showDrawer: false,
                // 底分全部反选
                points: this.data.points.map((point: any) => ({...point, selected: false})),
                // 牌型全部反选
                winTypes: this.data.winTypes.map((winType: any) => ({...winType, selected: false})),
            })
        },

        showSubmit() {
            // 胡牌，自摸
            let winners: User[] = []
            let losers: User[] = []
            if (this.data.gameType === '胡牌' || this.data.gameType === '自摸') {
                winners = this.data.winPlayers.filter((player: User) => {
                    return player.selected
                })
                losers = this.data.losePlayers.filter((player: User) => {
                    return player.selected
                })
            }
            if (this.data.gameType === '相公') {
                winners = this.data.winPlayers.filter((player: User) => {
                    return !player.selected
                })
                losers = this.data.winPlayers.filter((player: User) => {
                    return player.selected
                })
                winners.forEach((player: User) => {player.gameInfo.basePoints = 1})
                losers.forEach((player: User) => {player.gameInfo.basePoints = 3})
            }


            let exit = false
            winners.forEach((player: User) => {
                if (player.gameInfo.basePoints <= 0) {
                    exit = true
                }
            })
            if (exit) {
                wx.showToast({
                    title: '赢家得分必须大于 0 哦 🍑',
                    icon: 'none',
                    duration: 1000
                })
                return;
            }

            if (this.data.gameType === '胡牌') {
                if (winners.length < 1) {
                    wx.showToast({
                        title: '请至少选择一个赢家 🥕',
                        icon: 'none',
                        duration: 1000
                    })
                    return;
                }
                if (losers.length != 1) {
                    wx.showToast({
                        title: '请选择一个输家 🍌',
                        icon: 'none',
                        duration: 1000
                    })
                    return;
                }
            }
            if (this.data.gameType === '自摸') {
                if (winners.length != 1) {
                    wx.showToast({
                        title: '请选择一个赢家 🥕',
                        icon: 'none',
                        duration: 1000
                    })
                    return;
                }
                losers = this.data.losePlayers.filter((player: User) => {
                    return player.id !== winners[0].id
                })
            }
            if (this.data.gameType === '相公') {
                if (losers.length != 1) {
                    wx.showToast({
                        title: '是谁相公了呀 🦆',
                        icon: 'none',
                        duration: 1000
                    })
                    return;
                }
            }

            let gameType = 1
            if (this.data.gameType === '胡牌') {
                if (winners.length === 1) {
                    // 平胡
                    gameType = 1
                } else if (winners.length === 2) {
                    // 一炮双响
                    gameType = 3
                } else if (winners.length === 3) {
                    // 一炮三响
                    gameType = 4
                }
            } else if (this.data.gameType === '自摸') {
                gameType = 2
            } else if (this.data.gameType === '相公') {
                gameType = 5
            }

            let message = ''
            winners.forEach((player: User) => {
                message += `赢家：${player.username}, 得分: ${player.gameInfo.basePoints * player.gameInfo.multi} 分\n`
            })
            message += `输家: `
            losers.forEach((player: User) => {
                message += `${player.username}, `
            })
            message = message.replace(/..$/, '');
            message += ``

            wx.showModal({
                title: '提交确认',
                content: message,
                confirmText: "确定",
                cancelText: "记错了",
                success: (res) => {
                    if (res.confirm) {
                        this.submit(gameType, winners, losers)
                    }
                }
            });
        },

        submit(gameType: number, winners: User[], losers: User[]) {
            const data = {
                gameType: gameType,
                players: this.data.winPlayers.map((player: User) => (player.id)),
                recorderId: wx.getStorageSync('user').id,
                winners: winners.map((player: User) => ({
                    userId: player.id,
                    basePoints: player.gameInfo.basePoints,
                    winTypes: player.gameInfo.winTypes,
                })),
                losers: losers.map((player: User) => player.id),
            }
            saveMaJiangGame(data).then(() => {
                this.closeDrawer()
                wx.showToast({
                    title: '提交成功',
                    icon: 'success',
                    duration: 1500
                })
                try {
                    // 触发父页面方法（带参数）
                    this.triggerEvent('refreshData', {
                        from: 'component',
                    }, {
                        bubbles: true,  // 是否冒泡
                        composed: true  // 是否跨越组件边界
                    })
                } catch (e) {
                    console.error(e)
                }
            })
        }
    }
})