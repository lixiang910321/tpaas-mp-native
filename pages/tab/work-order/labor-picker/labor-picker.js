Page({
  data: {
    loading: false,
    keyword: '',
    list: [],
    selectedIds: [],
    workTypeName: ''
  },

  // 跨搜索保留已选人员详情（不用 setData，避免大对象开销）
  selectedMap: {},

  onLoad(options) {
    let selectedIds = []
    this.selectedMap = {}

    if (options.selectedLaborers) {
      try {
        const laborers = JSON.parse(decodeURIComponent(options.selectedLaborers)) || []
        laborers.forEach(l => {
          if (l == null || l.id == null) return
          const id = String(l.id)
          this.selectedMap[id] = {
            id,
            name: l.name || l.realName || '',
            workTypeId: l.workTypeId || l.professionTypeId || '',
            workTypeName: l.workTypeName || l.professionTypeName || ''
          }
        })
        selectedIds = Object.keys(this.selectedMap)
      } catch (e) {
        console.error('解析已选劳务人员失败', e)
      }
    } else if (options.selectedIds) {
      try {
        selectedIds = (JSON.parse(decodeURIComponent(options.selectedIds)) || []).map(id => String(id))
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

    const id = String(item.id)
    item.selected = !item.selected

    const selectedIds = (this.data.selectedIds || []).map(String)
    const idIndex = selectedIds.indexOf(id)
    if (item.selected) {
      if (idIndex === -1) selectedIds.push(id)
      this.selectedMap[id] = {
        id,
        name: item.realName || '',
        workTypeId: item.professionTypeId || '',
        workTypeName: item.professionTypeName || ''
      }
    } else if (idIndex > -1) {
      selectedIds.splice(idIndex, 1)
      delete this.selectedMap[id]
    }

    this.setData({ list, selectedIds })
  },

  onConfirm() {
    const selectedIds = (this.data.selectedIds || []).map(String)
    if (selectedIds.length === 0) {
      wx.showToast({ title: '请选择劳务人员', icon: 'none' })
      return
    }

    // 按 selectedIds 顺序组装，优先取跨搜索缓存，其次当前列表
    const selectedLaborers = selectedIds.map(id => {
      if (this.selectedMap[id]) return this.selectedMap[id]
      const fromList = (this.data.list || []).find(item => String(item.id) === id)
      if (!fromList) return null
      return {
        id,
        name: fromList.realName || '',
        workTypeId: fromList.professionTypeId || '',
        workTypeName: fromList.professionTypeName || ''
      }
    }).filter(Boolean)

    if (selectedLaborers.length === 0) {
      wx.showToast({ title: '请选择劳务人员', icon: 'none' })
      return
    }

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
      const selectedIdSet = new Set((this.data.selectedIds || []).map(String))
      const list = records.map(item => {
        const id = String(item.id)
        const selected = selectedIdSet.has(id)
        // 已选人员再次出现在列表时，刷新缓存详情
        if (selected) {
          this.selectedMap[id] = {
            id,
            name: item.realName || '',
            workTypeId: item.professionTypeId || '',
            workTypeName: item.professionTypeName || ''
          }
        }
        return {
          ...item,
          selected
        }
      })
      this.setData({ list, loading: false })
    } else {
      this.setData({ list: [], loading: false })
    }
  }
})
