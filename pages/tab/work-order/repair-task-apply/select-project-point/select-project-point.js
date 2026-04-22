Page({
  data: {
    loading: false,
    list: [],
    hasMore: true,
    pageIndex: 1,
    pageSize: 10,
    keyword: '',
    selectedId: null,
    selectedName: '',
    taskType: null // 1-维修项点 2-维保项点
  },

  onLoad(options) {
    if (options.selectedId) {
      this.setData({
        selectedId: options.selectedId,
        selectedName: options.selectedName || ''
      })
    }
    
    // 获取来源页面路径（上一个页面）
    const pages = getCurrentPages()
    const prevPage = pages.length > 1 ? pages[pages.length - 2] : null
    const fromPageRoute = prevPage ? (prevPage.route || '') : ''
    
    console.log('项点选择器 - onLoad')
    console.log('项点选择器 - 页面栈长度:', pages.length)
    console.log('项点选择器 - 来源页面:', fromPageRoute)
    
    // 根据来源页面自动判断任务类型
    let taskType = null
    if (options.taskType) {
      // 显式传入 taskType
      taskType = Number(options.taskType)
    } else if (fromPageRoute.indexOf('defect/confirm') !== -1) {
      // 病害确认页面：维修项点
      taskType = 1
    } else if (fromPageRoute.indexOf('maintenance') !== -1) {
      // 维保任务页面：维保项点
      taskType = 2
    } else if (fromPageRoute.indexOf('repair-task') !== -1) {
      // 维修任务页面：维修项点
      taskType = 1
    }
    
    this.setData({
      fromPage: fromPageRoute,
      taskType: taskType
    })
    this.loadData()
  },

  onSearchInput(e) {
    this.setData({ keyword: e.detail.value })
  },

  onSearch() {
    this.setData({ pageIndex: 1, hasMore: true, list: [] })
    this.loadData()
  },

  onClear() {
    this.setData({ keyword: '', pageIndex: 1, hasMore: true, list: [] })
    this.loadData()
  },

  onSelect(e) {
    const item = e.currentTarget.dataset.item
    this.setData({
      selectedId: item.id,
      selectedName: item.name
    })
  },

  onConfirm() {
    if (!this.data.selectedId) {
      wx.showToast({ title: '请选择项点', icon: 'none' })
      return
    }

    const pages = getCurrentPages()
    const prevPage = pages[pages.length - 2]
    if (prevPage) {
      // 根据来源页面判断设置哪个字段
      const fromPage = this.data.fromPage || ''
      console.log('项点选择器 - 来源页面:', fromPage)
      console.log('项点选择器 - 选中ID:', this.data.selectedId)
      console.log('项点选择器 - 选中名称:', this.data.selectedName)
      
      if (fromPage.indexOf('defect/confirm') !== -1) {
        // 病害确认页面：设置计划项点
        console.log('设置计划项点字段')
        prevPage.setData({
          'form.planProjectPointId': this.data.selectedId,
          'form.planProjectPointName': this.data.selectedName
        })
      } else {
        // 维修任务申请页面：设置实际项点
        console.log('设置实际项点字段')
        prevPage.setData({
          'form.actualProjectPointId': this.data.selectedId,
          'form.actualProjectPointName': this.data.selectedName
        })
      }
    }
    wx.navigateBack()
  },

  async loadData() {
    if (this.data.loading) return
    this.setData({ loading: true })

    const app = getApp()
    const params = {
      pageIndex: this.data.pageIndex,
      pageSize: this.data.pageSize
    }
    if (this.data.keyword) {
      params.keyword = this.data.keyword
    }
    // 根据任务类型过滤项点
    if (this.data.taskType) {
      params.type = this.data.taskType
    }

    const res = await app.mpGetAuth('/mp/refactor/projectPoint/page', params)

    if (res && Number(res.isSuccess) === 1 && res.result) {
      const records = res.result.records || []

      if (this.data.pageIndex === 1) {
        this.setData({
          list: records,
          hasMore: records.length >= this.data.pageSize
        })
      } else {
        this.setData({
          list: [...this.data.list, ...records],
          hasMore: records.length >= this.data.pageSize
        })
      }

      if (this.data.hasMore) {
        this.setData({ pageIndex: this.data.pageIndex + 1 })
      }
    }

    this.setData({ loading: false })
  },

  loadMore() {
    if (this.data.hasMore && !this.data.loading) {
      this.loadData()
    }
  }
})
