Page({
  data: {
    loading: false,
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
    // 支持回显
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
    this.loadLevel1()
  },

  // ===== 加载第一级（大类 / templateOwner）=====
  async loadLevel1() {
    this.setData({ loading: true, currentLevel: 1, canConfirm: false })
    try {
      const app = getApp()
      const res = await app.mpGetAuth('/mp/dict/templateOwner')
      if (res && Number(res.isSuccess) === 1 && res.result) {
        const items = res.result.map(item => ({
          id: String(item.id),
          value: item.value || '',
          name: item.name || ''
        }))
        this.setData({ items, 'levelStack': [] })
      }
    } catch (e) {
      wx.showToast({ title: '加载失败', icon: 'none' })
    } finally {
      this.setData({ loading: false })
    }
  },

  // ===== 选择第一级（大类）=====
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

  // ===== 加载第二级（中类 / template）=====
  async loadLevel2(ownerId) {
    this.setData({ loading: true, currentLevel: 2 })
    try {
      const app = getApp()
      const res = await app.mpGetAuth(`/mp/dict/template?ownerId=${ownerId}`)
      if (res && Number(res.isSuccess) === 1 && res.result) {
        const items = res.result.map(item => ({
          id: String(item.id),
          code: item.code || '',
          name: item.name || '',
          ownerId: item.ownerId || '',
          ownerValue: item.ownerValue || '',
          ownerName: item.ownerName || ''
        }))
        this.setData({ items })
      } else {
        this.setData({ items: [] })
      }
    } catch (e) {
      wx.showToast({ title: '加载失败', icon: 'none' })
    } finally {
      this.setData({ loading: false })
    }
  },

  // ===== 选择第二级（中类）=====
  onSelectLevel2(e) {
    const item = e.currentTarget.dataset.item
    const stack = [...this.data.levelStack]
    stack.push({ level: 2, items: this.data.items, selectedItem: item })
    this.setData({
      'selectedTemplate.id': item.id,
      'selectedTemplate.code': item.code,
      'selectedTemplate.name': item.name,
      levelStack: stack,
      currentLevel: 3  // 下一级为分类第一级（第三级）
    })
    this.loadCategoryChildren(item.id, null)
  },

  // ===== 加载分类子级（第三级+）=====
  async loadCategoryChildren(templateId, parentId) {
    this.setData({ loading: true })
    try {
      const app = getApp()
      let url = `/mp/dict/categoryChildren?templateId=${templateId}`
      if (parentId) {
        url += `&parentId=${parentId}`
      }
      const res = await app.mpGetAuth(url)
      if (res && Number(res.isSuccess) === 1 && res.result) {
        const items = (res.result || []).map(item => ({
          id: String(item.id),
          name: item.name || ''
        }))
        this.setData({ items })
        if (items.length === 0) {
          // 没有子级了，允许确认
          this.setData({ canConfirm: true })
        }
      } else {
        this.setData({ items: [] })
      }
    } catch (e) {
      wx.showToast({ title: '加载失败', icon: 'none' })
    } finally {
      this.setData({ loading: false })
    }
  },

  // ===== 选择第 N 级分类（N >= 3）=====
  onSelectCategory(e) {
    const item = e.currentTarget.dataset.item
    const level = this.data.currentLevel
    const stack = [...this.data.levelStack]
    stack.push({ level, items: this.data.items, selectedItem: item })
    this.setData({
      currentLevel: level + 1,
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
