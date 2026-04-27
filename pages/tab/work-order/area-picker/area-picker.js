Page({
  data: {
    loading: false,
    currentAreas: [],        // 当前级显示的区域列表
    areaLevelStack: [],      // [{id, name}] 面包屑路径栈
    selectedArea: { id: null, name: '' },  // 当前选中
    areaCache: {}            // { parentId → [areas] } 缓存，root 用 'root'
  },

  onLoad(options) {
    if (options.selectedId && options.selectedName) {
      this.setData({
        selectedArea: {
          id: options.selectedId,
          name: decodeURIComponent(options.selectedName)
        }
      })
    }
    this.loadRootAreas()
  },

  // === 数据加载 ===

  // 加载根级区域列表
  async loadRootAreas() {
    this.setData({ loading: true })
    try {
      const app = getApp()
      const res = await app.mpGetAuth('/mp/area/list')
      if (res && Number(res.isSuccess) === 1 && res.result) {
        const areas = res.result || []
        this.data.areaCache['root'] = areas
        this.setData({
          currentAreas: areas,
          areaLevelStack: [],
          loading: false
        })
        // 树加载完后，若有已选区域，按名称路径逐级恢复面包屑
        if (this.data.selectedArea.id) {
          await this.restoreSelected()
        }
      } else {
        this.setData({ loading: false })
        wx.showToast({ title: '加载区域失败', icon: 'none' })
      }
    } catch (e) {
      console.error('加载区域失败', e)
      this.setData({ loading: false })
      wx.showToast({ title: '网络错误', icon: 'none' })
    }
  },

  // 按 parentId 加载子级（带缓存）
  async loadChildren(parentId) {
    const key = String(parentId)
    if (this.data.areaCache[key]) {
      return this.data.areaCache[key]
    }
    const app = getApp()
    const res = await app.mpGetAuth('/mp/area/list', { parentId })
    const children = (res && Number(res.isSuccess) === 1 && res.result) ? res.result : []
    this.data.areaCache[key] = children
    return children
  },

  // === 交互 ===

  // 点击区域项：异步判断是否有子级
  async onAreaTap(e) {
    const area = e.currentTarget.dataset.item
    const children = await this.loadChildren(area.id)

    if (children.length > 0) {
      // 有子级 → 下钻
      const stack = this.data.areaLevelStack
      stack.push({ id: area.id, name: area.name })
      this.setData({
        areaLevelStack: stack,
        currentAreas: children
      })
    } else {
      // 无子级 → 切换选中
      if (this.data.selectedArea.id === area.id) {
        this.setData({ selectedArea: { id: null, name: '' } })
      } else {
        this.setData({
          selectedArea: { id: area.id, name: area.name }
        })
      }
    }
  },

  // 点击对勾直接选中（不触发下钻）
  onSelectDirect(e) {
    const area = e.currentTarget.dataset.item
    if (this.data.selectedArea.id === area.id) {
      this.setData({ selectedArea: { id: null, name: '' } })
    } else {
      this.setData({
        selectedArea: { id: area.id, name: area.name }
      })
    }
  },

  // 点击面包屑回退
  async onBreadcrumbTap(e) {
    const index = parseInt(e.currentTarget.dataset.index, 10)
    let stack, areas

    if (index === -1) {
      stack = []
      areas = this.data.areaCache['root'] || []
    } else {
      stack = this.data.areaLevelStack.slice(0, index + 1)
      const last = stack[stack.length - 1]
      areas = await this.loadChildren(last.id)
    }

    this.setData({
      areaLevelStack: stack,
      currentAreas: areas
    })
  },

  // === 编辑回显：按全路径名逐级恢复 ===
  async restoreSelected() {
    const selectedName = this.data.selectedArea.name
    // fullName 格式： "线路一 - 东段 - A区"
    const nameParts = selectedName.split(' - ').filter(s => s)
    if (nameParts.length === 0) return

    let stack = []
    let parentId = null  // null = 根级
    let found = true

    for (let i = 0; i < nameParts.length; i++) {
      const partName = nameParts[i]
      const areas = parentId === null
        ? (this.data.areaCache['root'] || [])
        : await this.loadChildren(parentId)

      const matched = areas.find(a => a.name === partName)
      if (!matched) {
        found = false
        break
      }

      if (i < nameParts.length - 1) {
        // 非最后一级 → 入栈面包屑
        stack.push({ id: matched.id, name: matched.name })
        parentId = matched.id
      } else {
        // 最后一级 = 已选区域（不放入面包屑）
        // 但仍需展开其同级列表供编辑
        break
      }
    }

    // 回退到选中节点的父级，显示同级列表
    let currentAreas = this.data.areaCache['root'] || []
    if (stack.length > 0) {
      const lastStack = stack[stack.length - 1]
      const siblings = await this.loadChildren(lastStack.id)
      currentAreas = siblings
    }

    this.setData({
      areaLevelStack: stack,
      currentAreas: currentAreas
    })
  },

  // === 确认 ===

  onConfirm() {
    if (!this.data.selectedArea.id) {
      wx.showToast({ title: '请选择区域', icon: 'none' })
      return
    }

    const breadcrumbNames = this.data.areaLevelStack.map(item => item.name)
    const breadcrumbIds = this.data.areaLevelStack.map(item => item.id)
    // 全路径 id 和 name（含选中节点）
    const pathIds = [...breadcrumbIds, this.data.selectedArea.id]
    const pathNames = [...breadcrumbNames, this.data.selectedArea.name]
    const fullName = pathNames.join(' - ')

    const eventChannel = this.getOpenerEventChannel()
    if (eventChannel) {
      eventChannel.emit('selectArea', {
        id: this.data.selectedArea.id,
        name: fullName,
        levelName: this.data.selectedArea.name,
        pathIds: pathIds,
        pathNames: pathNames
      })
    }
    wx.navigateBack()
  }
})
