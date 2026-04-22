Page({
  data: {
    loading: false,
    keyword: '',
    list: [],
    selectedId: null
  },

  onLoad(options) {
    if (options.selectedId) {
      this.setData({ selectedId: decodeURIComponent(String(options.selectedId)) })
    }
    this.loadList()
  },

  onKeywordInput(e) {
    this.setData({ keyword: e.detail.value })
    // 防抖搜索
    clearTimeout(this.searchTimer)
    this.searchTimer = setTimeout(() => {
      this.loadList()
    }, 300)
  },

  onSelect(e) {
    const item = e.currentTarget.dataset.item
    if (!item) return
    
    // 使用事件通道返回数据
    const eventChannel = this.getOpenerEventChannel()
    if (eventChannel) {
      eventChannel.emit('selectEmployee', {
        id: item.id,
        name: item.name
      })
    }
    
    wx.navigateBack()
  },

  async loadList() {
    this.setData({ loading: true })
    const app = getApp()
    const params = { current: 1, size: 100 }
    if (this.data.keyword) {
      params.keyword = this.data.keyword
    }
    
    const res = await app.mpGetAuth('/mp/refactor/employee/page', params)
    
    if (res && Number(res.isSuccess) === 1 && res.result) {
      this.setData({ list: res.result.records || [], loading: false })
    } else {
      this.setData({ list: [], loading: false })
    }
  }
})
