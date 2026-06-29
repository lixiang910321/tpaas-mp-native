Page({
  data: {
    loading: false,
    areaId: '',
    flatList: [],             // 一次性加载的扁平分类数据
    emptyText: '',             // 空状态提示文案
    currentLevel: 1,           // 当前所在层级（1/2/3+）
    levelStack: [],            // 层级栈 [{level, items, selectedItem}]
    items: [],                 // 当前层级的数据
    canConfirm: false,         // 是否可以确认（>= 第3级时为 true）
    // 大类（模板归属）
    selectedTemplateOwner: { id: '', value: '', name: '' },
    // 中类（模板）
    selectedTemplate: { id: '', code: '', name: '' },
    // 末级分类
    selectedCategoryId: '',    // 最终选中的末级分类 id
    selectedCategoryName: '',  // 最终选中的末级分类名称
    selectedCategoryPath: []   // 完整路径 [{id, name}, ...]
  },

  onLoad(options) {
    // areaId 为必传参数
    if (!options.areaId) {
      wx.showToast({ title: '缺少区域参数', icon: 'none' })
      setTimeout(() => wx.navigateBack(), 1500)
      return
    }
    this.setData({ areaId: options.areaId })

    // 回显参数（可选）
    if (options.selectedTemplateOwnerId) {
      this.setData({
        'selectedTemplateOwner.id': options.selectedTemplateOwnerId,
        'selectedTemplateOwner.value': options.selectedTemplateOwnerValue || '',
        'selectedTemplateOwner.name': options.selectedTemplateOwnerName ? decodeURIComponent(options.selectedTemplateOwnerName) : ''
      })
    }
    if (options.selectedTemplateId) {
      this.setData({
        'selectedTemplate.id': options.selectedTemplateId,
        'selectedTemplate.code': options.selectedTemplateCode || '',
        'selectedTemplate.name': options.selectedTemplateName ? decodeURIComponent(options.selectedTemplateName) : ''
      })
    }

    this.loadAllCategories()
  },

  // ===== 一次性加载所有分类数据 =====
  async loadAllCategories() {
    const app = getApp()
    this.setData({ loading: true })
    try {
      const res = await app.mpGetAuth('/mp/facility/categoriesByArea', { areaId: this.data.areaId })
      if (res && Number(res.isSuccess) === 1 && res.result) {
        const flatList = res.result || []
        this.setData({ flatList })
        if (flatList.length === 0) {
          this.setData({ items: [], emptyText: '该区域暂无设施' })
          return
        }
        this.loadLevel1()
        // 回显：自动跳转到已选层级
        this.applyEchoState()
      } else {
        this.setData({ items: [], emptyText: '加载失败' })
      }
    } catch (e) {
      wx.showToast({ title: '加载失败', icon: 'none' })
      this.setData({ emptyText: '加载失败' })
    } finally {
      this.setData({ loading: false })
    }
  },

  // ===== 回显：自动跳转到已保存的层级 =====
  applyEchoState() {
    if (!this.data.selectedTemplateOwner.id) return
    const ownerId = this.data.selectedTemplateOwner.id
    // 此时 this.data.items 为第1级数据
    const ownerItem = this.data.items.find(i => i.id === ownerId)
    if (!ownerItem) return

    // 模拟选中第1级
    this.setData({
      levelStack: [{ level: 1, items: this.data.items, selectedItem: ownerItem }]
    })
    this.loadLevel2(ownerId)

    if (!this.data.selectedTemplate.id) return
    const templateId = this.data.selectedTemplate.id
    // 此时 this.data.items 为第2级数据
    const templateItem = this.data.items.find(i => i.id === templateId)
    if (!templateItem) return

    // 模拟选中第2级
    const stack = [...this.data.levelStack, { level: 2, items: this.data.items, selectedItem: templateItem }]
    this.setData({ levelStack: stack })
    this.loadCategoryChildren(templateId, null)
  },

  // ===== 第1级：从 flatList 按 templateOwnerId 去重 =====
  loadLevel1() {
    const seen = new Set()
    const items = []
    this.data.flatList.forEach(item => {
      const key = item.templateOwnerId
      if (key && !seen.has(key)) {
        seen.add(key)
        items.push({
          id: item.templateOwnerId,
          value: item.templateOwnerValue,
          name: item.templateOwnerName || item.templateOwnerValue
        })
      }
    })
    this.setData({ items, currentLevel: 1, levelStack: [], canConfirm: false, emptyText: '' })
  },

  // ===== 选择第1级（大类）=====
  onSelectLevel1(e) {
    const item = e.currentTarget.dataset.item
    this.setData({
      'selectedTemplateOwner.id': item.id,
      'selectedTemplateOwner.value': item.value,
      'selectedTemplateOwner.name': item.name,
      levelStack: [{ level: 1, items: this.data.items, selectedItem: item }]
    })
    this.loadLevel2(item.id)
  },

  // ===== 第2级：按 templateOwnerId 过滤，按 templateId 去重 =====
  loadLevel2(ownerId) {
    const seen = new Set()
    const items = []
    this.data.flatList.forEach(item => {
      if (item.templateOwnerId === ownerId && !seen.has(item.templateId)) {
        seen.add(item.templateId)
        items.push({
          id: item.templateId,
          code: item.templateCode,
          name: item.templateName
        })
      }
    })
    this.setData({ items, currentLevel: 2, canConfirm: false })
  },

  // ===== 选择第2级（中类）=====
  onSelectLevel2(e) {
    const item = e.currentTarget.dataset.item
    const stack = [...this.data.levelStack]
    stack.push({ level: 2, items: this.data.items, selectedItem: item })
    this.setData({
      'selectedTemplate.id': item.id,
      'selectedTemplate.code': item.code,
      'selectedTemplate.name': item.name,
      levelStack: stack
    })
    this.loadCategoryChildren(item.id, null)
  },

  // ===== 第3级+：从 flatList 解析分类路径，构建分类树 =====
  loadCategoryChildren(templateId, parentId) {
    // 筛选该 templateId 的所有记录
    const records = this.data.flatList.filter(item => item.templateId === templateId)

    // 收集所有分类路径
    const paths = []
    records.forEach(record => {
      try {
        const ids = JSON.parse(record.categoryIds || '[]')
        const names = JSON.parse(record.categoryNames || '[]')
        if (ids.length > 0) {
          paths.push({ ids, names })
        }
      } catch (e) { /* ignore */ }
    })

    let items = []
    if (!parentId) {
      // 第3级入口：提取根节点（每条路径的第1个元素）
      const seen = new Set()
      paths.forEach(p => {
        if (p.ids[0] && !seen.has(p.ids[0])) {
          seen.add(p.ids[0])
          items.push({ id: p.ids[0], name: p.names[0] || '' })
        }
      })
    } else {
      // 第4级+：找 parentId 在路径中的位置，取下一个节点
      const seen = new Set()
      paths.forEach(p => {
        const idx = p.ids.indexOf(parentId)
        if (idx >= 0 && idx + 1 < p.ids.length) {
          const childId = p.ids[idx + 1]
          if (!seen.has(childId)) {
            seen.add(childId)
            items.push({ id: childId, name: p.names[idx + 1] || '' })
          }
        }
      })
    }

    this.setData({
      items,
      currentLevel: parentId ? this.data.currentLevel + 1 : 3,
      canConfirm: items.length === 0
    })
  },

  // ===== 选择第 N 级分类（N >= 3）=====
  onSelectCategory(e) {
    const item = e.currentTarget.dataset.item
    const level = this.data.currentLevel
    const stack = [...this.data.levelStack]
    stack.push({ level, items: this.data.items, selectedItem: item })
    this.setData({
      levelStack: stack,
      selectedCategoryId: item.id,
      selectedCategoryName: item.name,
      canConfirm: true
    })

    // 尝试加载下一级
    const templateId = this.data.selectedTemplate.id
    this.loadCategoryChildren(templateId, item.id)
  },

  // ===== 返回上一级 =====
  onBackLevel() {
    const stack = [...this.data.levelStack]
    if (stack.length === 0) {
      wx.navigateBack()
      return
    }
    const prev = stack.pop()
    // 新的当前层级：若栈为空则回到第1级，否则为上一级被选中的层级+1
    const newCurrentLevel = stack.length === 0 ? 1 : stack[stack.length - 1].level + 1
    const canConfirm = newCurrentLevel >= 3
    // 恢复选中状态（仅当栈顶是分类层级 level>=3 时）
    let selCatId = ''
    let selCatName = ''
    if (canConfirm && stack.length > 0) {
      const top = stack[stack.length - 1]
      if (top.level >= 3) {
        selCatId = top.selectedItem.id
        selCatName = top.selectedItem.name
      }
    }
    this.setData({
      currentLevel: newCurrentLevel,
      levelStack: stack,
      items: prev.items,
      canConfirm: canConfirm,
      selectedCategoryId: selCatId,
      selectedCategoryName: selCatName
    })
  },

  // ===== 确认选择 =====
  onConfirm() {
    if (!this.data.canConfirm) {
      wx.showToast({ title: '请至少选择到第三级分类', icon: 'none' })
      return
    }
    if (!this.data.selectedCategoryId) {
      wx.showToast({ title: '请选择设施分类', icon: 'none' })
      return
    }

    // 构建分类路径
    const categoryPath = []
    // 从第三级开始（levelStack中 level >= 3 的）
    for (const entry of this.data.levelStack) {
      if (entry.level >= 3) {
        categoryPath.push({ id: entry.selectedItem.id, name: entry.selectedItem.name })
      }
    }
    // 加上当前选中的末级
    if (this.data.selectedCategoryId) {
      // 检查是否已在路径中（避免重复）
      const alreadyInPath = categoryPath.some(p => p.id === this.data.selectedCategoryId)
      if (!alreadyInPath) {
        categoryPath.push({ id: this.data.selectedCategoryId, name: this.data.selectedCategoryName })
      }
    }

    const eventChannel = this.getOpenerEventChannel()
    if (eventChannel) {
      eventChannel.emit('selectFacilityCategory', {
        // 大类（模板归属）
        templateOwnerId: this.data.selectedTemplateOwner.id,
        templateOwnerValue: this.data.selectedTemplateOwner.value,
        templateOwnerName: this.data.selectedTemplateOwner.name,
        // 中类（模板）
        templateId: this.data.selectedTemplate.id,
        templateCode: this.data.selectedTemplate.code,
        templateName: this.data.selectedTemplate.name,
        // 多级分类
        categoryId: this.data.selectedCategoryId,
        categoryName: this.data.selectedCategoryName,
        categoryIds: categoryPath.map(i => i.id),
        categoryNames: categoryPath.map(i => i.name)
      })
    }

    wx.navigateBack()
  }
})
