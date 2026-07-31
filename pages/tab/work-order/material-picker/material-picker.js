Page({
  data: {
    loading: false,
    keyword: '',
    list: [],
    selectedIds: []
  },

  // 跨搜索保留已选物料详情
  selectedMap: {},

  onLoad(options) {
    let selectedIds = []
    this.selectedMap = {}

    if (options.selectedMaterials) {
      try {
        const materials = JSON.parse(decodeURIComponent(options.selectedMaterials)) || []
        materials.forEach(m => {
          if (m == null || m.id == null) return
          const id = String(m.id)
          this.selectedMap[id] = {
            id,
            name: m.name || '',
            unit: m.unit || '个'
          }
        })
        selectedIds = Object.keys(this.selectedMap)
      } catch (e) {
        console.error('解析已选物料失败', e)
      }
    } else if (options.selectedIds) {
      try {
        selectedIds = (JSON.parse(decodeURIComponent(options.selectedIds)) || []).map(id => String(id))
      } catch (e) {
        console.error('解析已选物料ID失败', e)
      }
    }

    this.setData({ selectedIds })
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
        name: item.name || '',
        unit: item.unit || '个'
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
      wx.showToast({ title: '请至少选择一个物料', icon: 'none' })
      return
    }

    const selectedMaterials = selectedIds.map(id => {
      if (this.selectedMap[id]) return this.selectedMap[id]
      const fromList = (this.data.list || []).find(item => String(item.id) === id)
      if (!fromList) return null
      return {
        id,
        name: fromList.name || '',
        unit: fromList.unit || '个'
      }
    }).filter(Boolean)

    if (selectedMaterials.length === 0) {
      wx.showToast({ title: '请至少选择一个物料', icon: 'none' })
      return
    }

    const eventChannel = this.getOpenerEventChannel()
    if (eventChannel) {
      eventChannel.emit('selectMaterials', {
        materials: selectedMaterials
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

    const res = await app.mpGetAuth('/mp/refactor/material/page', params)

    if (res && Number(res.isSuccess) === 1 && res.result) {
      const records = res.result.records || []
      const selectedIdSet = new Set((this.data.selectedIds || []).map(String))
      const list = records.map(item => {
        const id = String(item.id)
        const selected = selectedIdSet.has(id)
        if (selected) {
          this.selectedMap[id] = {
            id,
            name: item.name || '',
            unit: item.unit || '个'
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
