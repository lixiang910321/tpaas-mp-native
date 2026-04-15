Page({
  data: {
    loading: false,
    keyword: '',
    list: [],
    selectedIds: [],
    workTypeName: ''
  },

  onLoad(options) {
    let selectedIds = []
    if (options.selectedIds) {
      try {
        selectedIds = JSON.parse(decodeURIComponent(options.selectedIds))
      } catch (e) {
        console.error('解析已选劳务人员ID失败', e)
      }
    }
    this.setData({ selectedIds })
    if (options.workTypeName) {
      this.setData({ workTypeName: decodeURIComponent(options.workTypeName) })
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
    const index = e.currentTarget.dataset.index
    const list = this.data.list
    const item = list[index]
    if (!item) return

    // 切换选中状态
    item.selected = !item.selected
    this.setData({ list })

    // 同步更新 selectedIds
    const selectedIds = this.data.selectedIds
    const idIndex = selectedIds.indexOf(item.id)
    if (item.selected && idIndex === -1) {
      selectedIds.push(item.id)
    } else if (!item.selected && idIndex > -1) {
      selectedIds.splice(idIndex, 1)
    }
    this.setData({ selectedIds })
  },

  onConfirm() {
    if (this.data.selectedIds.length === 0) {
      wx.showToast({ title: '请选择劳务人员', icon: 'none' })
      return
    }

    const selectedLaborers = this.data.list
      .filter(item => item.selected)
      .map(item => ({
        id: item.id,
        name: item.realName,
        workTypeId: item.professionTypeId,
        workTypeName: item.professionTypeName
      }))

    // 使用事件通道返回数据
    const eventChannel = this.getOpenerEventChannel()
    if (eventChannel) {
      eventChannel.emit('selectLaborer', {
        laborers: selectedLaborers
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
    
    const res = await app.mpGetAuth('/mp/refactor/laborer/page', params)
    
    if (res && Number(res.isSuccess) === 1 && res.result) {
      const records = res.result.records || []
      // 给每条数据添加 selected 属性
      const list = records.map(item => ({
        ...item,
        selected: this.data.selectedIds.indexOf(item.id) > -1
      }))
      this.setData({ list, loading: false })
    } else {
      this.setData({ list: [], loading: false })
    }
  }
})
