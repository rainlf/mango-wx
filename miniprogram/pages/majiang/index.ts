import {getUserInfo, getUserRank} from "../../services/user-service";
import {getMajiangLog, getMajiangLogByUser} from "../../services/majiang-service";
import {updateAvatarFromCache} from "../../utils/util";

Page({
    data: {
        user: {} as User,
        isRefreshing: false,
        isLoadingMore: false,
        hasMoreData: true,
        currentPage: 0,
        pageSize: 10,
        rankList: [] as User[],
        gameList: [] as MajiangLog[],
        userGameList: [] as MajiangLog[],
        showUserRank: true,
        showGameLog: false,
        showUserGameLog: false,
        showUserRankBtn: false,
        showDrawer: false,
        currentUserId: 0,
    },
    onLoad() {
    },
    onShow(): void | Promise<void> {
        const user: User = wx.getStorageSync('user')
        if (user) {
            this.setData({user})
        }

        this.fetchUserInfo()
        // this.fetchGameList()
        this.fetchUserRank()
    },

    // 子组件下拉刷新触发
    handleRankListLoad() {
        this.fetchUserInfo()
        // this.fetchGameList()
        this.fetchUserRank()
    },
    handleGameListLoad() {
        this.fetchUserInfo()
        this.fetchGameList()
        // this.fetchUserRank()
    },

    // 后台获取数据
    fetchUserRank() {
        getUserRank().then(rankList => {
            this.setData({rankList})
            // 本地头像缓存
            const avatars = rankList.map((item) => ({id: item.id, avatar: item.avatar}))
            wx.setStorageSync('avatars', avatars)
        })
    },
    fetchGameList(isLoadMore: boolean = false) {
        if (this.data.isLoadingMore) return;
        
        const page = isLoadMore ? this.data.currentPage + 1 : 0;
        const offset = page * this.data.pageSize;
        
        if (isLoadMore) {
            this.setData({ isLoadingMore: true });
        }
        
        getMajiangLog(this.data.pageSize, offset).then(data => {
            const user: User = wx.getStorageSync("user")
            const avatars = wx.getStorageSync('avatars')
            
            // 增强数据检查，确保data是数组
            if (!Array.isArray(data)) {
                console.error('返回的数据不是数组:', data);
                this.setData({ isLoadingMore: false });
                this.notifyComponentLoadMoreComplete();
                return;
            }
            
            console.log(`获取到第${page}页游戏数据，共${data.length}条记录`);
            
            const formattedList = data.map(item => {
                if (item.recorder.user.id === user.id) {
                    return {
                        ...item,
                        deleteIcon: '/images/delete.png',
                        player1: {...item.player1, avatar: updateAvatarFromCache(item.player1.id, avatars)},
                        player2: {...item.player2, avatar: updateAvatarFromCache(item.player2.id, avatars)},
                        player3: {...item.player3, avatar: updateAvatarFromCache(item.player3.id, avatars)},
                        player4: {...item.player4, avatar: updateAvatarFromCache(item.player4.id, avatars)},
                        losers: item.losers.map(loser => ({
                            ...loser,
                            user: {...loser.user, avatar: updateAvatarFromCache(loser.user.id, avatars)},
                        })),
                        winners: item.winners.map(winner => ({
                            ...winner,
                            user: {...winner.user, avatar: updateAvatarFromCache(winner.user.id, avatars)},
                        }))
                    }
                } else {
                    return {
                        ...item,
                        deleteIcon: '/images/delete2.png',
                        player1: {...item.player1, avatar: updateAvatarFromCache(item.player1.id, avatars)},
                        player2: {...item.player2, avatar: updateAvatarFromCache(item.player2.id, avatars)},
                        player3: {...item.player3, avatar: updateAvatarFromCache(item.player3.id, avatars)},
                        player4: {...item.player4, avatar: updateAvatarFromCache(item.player4.id, avatars)},
                        losers: item.losers.map(loser => ({
                            ...loser,
                            user: {...loser.user, avatar: updateAvatarFromCache(loser.user.id, avatars)},
                        })),
                        winners: item.winners.map(winner => ({
                            ...winner,
                            user: {...winner.user, avatar: updateAvatarFromCache(winner.user.id, avatars)},
                        }))
                    }
                }
            })
            
            const newGameList = isLoadMore ? [...this.data.gameList, ...formattedList] : formattedList;
            // 分页加载日志
            console.log(`分页加载 - 当前页: ${page}, 偏移量: ${offset}, 返回数据量: ${formattedList.length}, pageSize: ${this.data.pageSize}`);
            
            // hasMoreData判断逻辑：只要返回了数据且数据量等于pageSize，就认为可能还有更多数据
            // 这样可以确保当后端有更多数据时能正确加载
            const hasMoreData = formattedList.length > 0 && formattedList.length === this.data.pageSize;
            
            // 添加hasMoreData状态变更日志
            console.log(`分页状态更新 - 新的hasMoreData: ${hasMoreData}, 当前游戏列表总数: ${newGameList.length}`);
            
            this.setData({
                gameList: newGameList,
                currentPage: page,
                hasMoreData,
                isLoadingMore: false
            })
            
            // 通知组件加载完成
            this.notifyComponentLoadMoreComplete();
        }).catch(() => {
            this.setData({ isLoadingMore: false });
            
            // 通知组件加载完成
            this.notifyComponentLoadMoreComplete();
        })
    },
    fetchUserInfo() {
        // Check if user and user.id are defined before making the API call
        if (!this.data.user || !this.data.user.id) {
            console.warn('User or user ID is undefined, cannot fetch user info');
            return;
        }
        
        getUserInfo(this.data.user.id).then(user => {
            this.setData({user});
        }).catch(error => {
            console.error('Failed to fetch user info:', error);
        })
    },
    fetchUserGameList(userId: number, isLoadMore: boolean = false) {
        if (this.data.isLoadingMore && isLoadMore) return;
        
        // Validate userId for initial load
        if (!isLoadMore && (!userId || typeof userId !== 'number')) {
            console.warn('Invalid userId for fetching user game list:', userId);
            return;
        }
        
        // 保存当前查看的用户ID
        if (!isLoadMore) {
            this.setData({ currentUserId: userId });
        }
        
        const page = isLoadMore ? this.data.currentPage + 1 : 0;
        const offset = page * this.data.pageSize;
        
        if (isLoadMore) {
            this.setData({ isLoadingMore: true });
        }
        
        const targetUserId = isLoadMore ? this.data.currentUserId : userId;
        
        // Validate targetUserId before making API call
        if (!targetUserId || typeof targetUserId !== 'number') {
            console.warn('Invalid targetUserId for fetching user game list:', targetUserId);
            this.setData({ isLoadingMore: false });
            this.notifyComponentLoadMoreComplete();
            return;
        }
        
        getMajiangLogByUser(targetUserId, this.data.pageSize, offset).then(data => {
            const avatars = wx.getStorageSync('avatars')
            
            // 增强数据检查，确保data是数组
            if (!Array.isArray(data)) {
                console.error('返回的数据不是数组:', data);
                this.setData({ isLoadingMore: false });
                this.notifyComponentLoadMoreComplete();
                return;
            }
            
            console.log(`获取到用户ID ${targetUserId} 的第${page}页游戏数据，共${data.length}条记录`);
            
            const formattedList = data.map(item => {
                return {
                    ...item,
                    player1: {...item.player1, avatar: updateAvatarFromCache(item.player1.id, avatars)},
                    player2: {...item.player2, avatar: updateAvatarFromCache(item.player2.id, avatars)},
                    player3: {...item.player3, avatar: updateAvatarFromCache(item.player3.id, avatars)},
                    player4: {...item.player4, avatar: updateAvatarFromCache(item.player4.id, avatars)},
                    losers: item.losers.map(loser => ({
                        ...loser,
                        user: {...loser.user, avatar: updateAvatarFromCache(loser.user.id, avatars)},
                    })),
                    winners: item.winners.map(winner => ({
                        ...winner,
                        user: {...winner.user, avatar: updateAvatarFromCache(winner.user.id, avatars)},
                    }))
                }
            })
            
            const newUserGameList = isLoadMore ? [...this.data.userGameList, ...formattedList] : formattedList;
            // 分页加载日志
            console.log(`用户分页加载 - 当前页: ${page}, 偏移量: ${offset}, 返回数据量: ${formattedList.length}, pageSize: ${this.data.pageSize}`);
            
            // hasMoreData判断逻辑：只要返回了数据且数据量等于pageSize，就认为可能还有更多数据
            // 这样可以确保当后端有更多数据时能正确加载
            const hasMoreData = formattedList.length > 0 && formattedList.length === this.data.pageSize;
            
            // 添加hasMoreData状态变更日志
            console.log(`用户分页状态更新 - 新的hasMoreData: ${hasMoreData}, 当前用户游戏列表总数: ${newUserGameList.length}`);
            
            this.setData({
                userGameList: newUserGameList,
                currentPage: page,
                hasMoreData,
                isLoadingMore: false
            })
            
            // 通知组件加载完成
            this.notifyComponentLoadMoreComplete();
        }).catch(() => {
            this.setData({ isLoadingMore: false });
            
            // 通知组件加载完成
            this.notifyComponentLoadMoreComplete();
        })
    },


    // 处理下拉刷新事件（微信小程序原生方法）
    onPullDownRefresh() {
        this.onRefresh();
    },

    // 原有的刷新逻辑
    onRefresh() {
        if (this.data.isRefreshing) {
            return;
        }

        this.setData({
            isRefreshing: true,
        });

        this.loadData().finally(() => {
            this.setData({
                isRefreshing: false,
            });
            // 通知微信小程序下拉刷新已完成
            wx.stopPullDownRefresh();
        });
    },

    async loadData() {
        this.fetchUserInfo()
        // this.fetchGameList()
        this.fetchUserRank()
    },

    // 点击玩家排行按钮
    openUserRank() {
        this.fetchUserInfo()
        this.fetchUserRank()
        this.setData({
            showUserRank: true,
            showGameLog: false,
            showUserGameLog: false,
            showUserRankBtn: false,
        })
    },

    // 点击游戏记录按钮
    openGameLog() {
        this.fetchUserInfo()
        this.fetchGameList()
        this.setData({
            showUserRank: false,
            showGameLog: true,
            showUserGameLog: false,
            showUserRankBtn: true
        })
    },

    // 子组件点击头像
    handleClickUserAvatar(e: any) {
        const userId = e.detail.userId
        this.fetchUserGameList(userId)
        this.setData({
            showUserRank: false,
            showGameLog: false,
            showUserGameLog: true,
            showUserRankBtn: true
        })
    },

    // 刷新分数、排名、记录
    refreshData() {
        this.fetchUserInfo()
        this.fetchUserRank()
        this.fetchGameList()
    },

    showSaveGameLog() {
        this.setData({
            showDrawer: true
        })
    },
    
    // 通知组件加载更多完成
    notifyComponentLoadMoreComplete() {
        console.log('通知组件加载更多完成');
        
        // 重置页面自身的加载状态，确保状态同步
        this.setData({
            isLoadingMore: false
        });
        
        // 获取majiang-log组件实例
        try {
            // 根据当前显示的列表类型选择对应的组件id
            let componentId = '';
            if (this.data.showGameLog) {
                componentId = '#game-log-component';
            } else if (this.data.showUserGameLog) {
                componentId = '#user-game-log-component';
            }
            
            if (componentId) {
                // 使用selectComponent方法获取组件实例
                const component = this.selectComponent(componentId);
                if (component) {
                    console.log(`成功获取${componentId}组件实例并调用loadMoreComplete`);
                    component.loadMoreComplete();
                } else {
                    console.warn(`未能通过selectComponent获取${componentId}组件实例`);
                }
            } else {
                console.warn('未找到当前显示的majiang-log组件类型');
            }
        } catch (error) {
            console.error('调用组件loadMoreComplete方法失败:', error);
        }
    },
    
    // 处理加载更多事件
    handleLoadMore() {
        if (this.data.showGameLog) {
            this.fetchGameList(true);
        } else if (this.data.showUserGameLog && this.data.currentUserId) {
            this.fetchUserGameList(this.data.currentUserId, true);
        }
    }
})
