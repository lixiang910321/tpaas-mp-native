function parseJsonArray(val) {
  if (!val) return []
  try {
    const parsed = typeof val === 'string' ? JSON.parse(val) : val
    return Array.isArray(parsed) ? parsed : []
  } catch (e) {
    return []
  }
}

Page({
  data: {
    loading: true,
    submitting: false,
    task: {},
    taskId: '',
    form: {
      repairResult: '',
      repairResultId: null,
      repairResultName: '',
      unfixReason: '',
      constructionCategoryId: null,
      constructionCategoryName: '',
      actualProjectPointId: null,
      actualProjectPointName: '',
      repairLaborers: [],
      materialLines: [],
      completionPhotos: [],
      submitRemark: '',
      // 实际侧：模板归属（大类）
      actualTemplateOwnerId: '',
      actualTemplateOwnerValue: '',
      actualTemplateOwnerName: '',
      // 实际侧：模板（中类）
      actualTemplateId: '',
      actualTemplateCode: '',
      actualTemplateName: '',
      // 实际侧：设施分类（多级分类）
      actualCategoryId: '',
      actualCategoryName: '',
      actualCategoryIds: [],
      actualCategoryNames: [],
      actualCategoryDisplayName: '',
      // 实际设施
      actualFacilityId: '',
      actualFacilityName: ''
    },
    repairResultOptions: [],
    constructionCategoryOptions: [
      { id: 10, name: '维修' },
      { id: 20, name: '更换' }
    ],
    constructionCategoryIndex: 0
  },

  onLoad(options) {
    const taskId = options.id ? decodeURIComponent(String(options.id)) : ''
    this.setData({ taskId })
    this.loadRepairResultOptions()
    this.loadTaskDetail()
  },

  // 维修结果选择
  onRepairResultChange(e) {
    const index = e.detail.value
    const selected = this.data.repairResultOptions[index]
    this.setData({
      'form.repairResultId': selected.id,
      'form.repairResultName': selected.name,
      'form.repairResult': selected.name
    })
  },

  // 未修复原因输入
  onUnfixReasonInput(e) {
    this.setData({ 'form.unfixReason': e.detail.value })
  },

  // 施工类别选择
  onConstructionCategoryChange(e) {
    const index = Number(e.detail.value)
    const selected = this.data.constructionCategoryOptions[index]
    if (!selected) return
    this.setData({
      constructionCategoryIndex: index,
      'form.constructionCategoryId': selected.id,
      'form.constructionCategoryName': selected.name
    })
  },

  // 实际项点选择
  onSelectActualProjectPoint() {
    const categoryIds = this.data.form.actualCategoryIds
    const categoryId = this.data.form.actualCategoryId
    const params = ['taskType=1']
    // 优先传完整路径（按层级位置匹配）
    if (categoryIds && categoryIds.length > 0) {
      params.push(`categoryIds=${encodeURIComponent(categoryIds.join(','))}`)
    } else if (categoryId) {
      params.push(`categoryId=${categoryId}`)
    }
    params.push(`selectedId=${this.data.form.actualProjectPointId || ''}`)
    wx.navigateTo({
      url: `/pages/tab/work-order/project-point-picker/project-point-picker?${params.join('&')}`,
      events: {
        selectProjectPoint: (data) => {
          this.setData({
            'form.actualProjectPointId': data.id,
            'form.actualProjectPointName': data.name
          })
        }
      }
    })
  },

  // 实际设施分类选择
  onSelectActualFacilityCategory() {
    const areaId = this.data.task && this.data.task.areaId
    if (!areaId) {
      wx.showToast({ title: '请先选择区域', icon: 'none' })
      return
    }
    const params = [`areaId=${areaId}`]
    // 区域路径传递（按层级位置匹配）
    try {
      const areaPathIds = this.data.task.areaIds ? (typeof this.data.task.areaIds === 'string' ? JSON.parse(this.data.task.areaIds) : this.data.task.areaIds) : []
      if (Array.isArray(areaPathIds) && areaPathIds.length > 0) {
        params.push(`areaIds=${encodeURIComponent(areaPathIds.join(','))}`)
      }
    } catch (e) { /* ignore */ }
    if (this.data.form.actualTemplateOwnerId) {
      params.push(`selectedTemplateOwnerId=${this.data.form.actualTemplateOwnerId}`)
      params.push(`selectedTemplateOwnerValue=${encodeURIComponent(this.data.form.actualTemplateOwnerValue || '')}`)
      params.push(`selectedTemplateOwnerName=${encodeURIComponent(this.data.form.actualTemplateOwnerName || '')}`)
    }
    if (this.data.form.actualTemplateId) {
      params.push(`selectedTemplateId=${this.data.form.actualTemplateId}`)
      params.push(`selectedTemplateCode=${encodeURIComponent(this.data.form.actualTemplateCode || '')}`)
      params.push(`selectedTemplateName=${encodeURIComponent(this.data.form.actualTemplateName || '')}`)
    }
    wx.navigateTo({
      url: `/pages/tab/work-order/facility-category-picker/facility-category-picker?${params.join('&')}`,
      events: {
        selectFacilityCategory: (data) => {
          console.log('维修提报 - 选择实际设施分类结果:', data)
          this.setData({
            // 大类（模板归属）
            'form.actualTemplateOwnerId': data.templateOwnerId || '',
            'form.actualTemplateOwnerValue': data.templateOwnerValue || '',
            'form.actualTemplateOwnerName': data.templateOwnerName || '',
            // 中类（模板）
            'form.actualTemplateId': data.templateId || '',
            'form.actualTemplateCode': data.templateCode || '',
            'form.actualTemplateName': data.templateName || '',
            // 多级分类
            'form.actualCategoryId': data.categoryId || '',
            'form.actualCategoryName': data.categoryName || '',
            'form.actualCategoryIds': data.categoryIds || [],
            'form.actualCategoryNames': data.categoryNames || [],
            'form.actualCategoryDisplayName': (data.categoryNames || []).join(' / '),
            // 设施分类变更 → 清空实际设施 + 实际项点
            'form.actualFacilityId': '',
            'form.actualFacilityName': '',
            'form.actualProjectPointId': null,
            'form.actualProjectPointName': ''
          })
        }
      }
    })
  },

  // 实际设施选择
  onSelectActualFacility() {
    const areaId = this.data.task && this.data.task.areaId
    if (!areaId) {
      wx.showToast({ title: '请先选择区域', icon: 'none' })
      return
    }
    const params = [`areaId=${areaId}`]
    // 区域路径传递（按层级位置匹配）
    try {
      const areaPathIds = this.data.task.areaIds ? (typeof this.data.task.areaIds === 'string' ? JSON.parse(this.data.task.areaIds) : this.data.task.areaIds) : []
      if (Array.isArray(areaPathIds) && areaPathIds.length > 0) {
        params.push(`areaIds=${encodeURIComponent(areaPathIds.join(','))}`)
      }
    } catch (e) { /* ignore */ }
    // 分类筛选优先传完整路径（按层级位置匹配）
    if (this.data.form.actualCategoryIds && this.data.form.actualCategoryIds.length > 0) {
      params.push(`categoryIds=${encodeURIComponent(this.data.form.actualCategoryIds.join(','))}`)
    } else if (this.data.form.actualCategoryId) {
      params.push(`categoryId=${this.data.form.actualCategoryId}`)
    }
    if (this.data.form.actualFacilityId) {
      params.push(`selectedId=${this.data.form.actualFacilityId}`)
      params.push(`selectedName=${encodeURIComponent(this.data.form.actualFacilityName)}`)
    }
    wx.navigateTo({
      url: `/pages/tab/work-order/facility-picker/facility-picker?${params.join('&')}`,
      events: {
        selectFacility: (data) => {
          this.setData({
            'form.actualFacilityId': data.id,
            'form.actualFacilityName': data.name,
            // 反向赋值 actual* 分类字段
            'form.actualTemplateOwnerId': data.templateOwnerId || '',
            'form.actualTemplateOwnerValue': data.templateOwnerValue || '',
            'form.actualTemplateOwnerName': data.templateOwnerName || '',
            'form.actualTemplateId': data.templateId || '',
            'form.actualTemplateCode': data.templateCode || '',
            'form.actualTemplateName': data.templateName || '',
            'form.actualCategoryId': data.categoryId || '',
            'form.actualCategoryName': data.categoryName || '',
            'form.actualCategoryIds': data.categoryIds || [],
            'form.actualCategoryNames': data.categoryNames || [],
            'form.actualCategoryDisplayName': (data.categoryNames || []).join(' / '),
            // 设施变更 → 清空项点
            'form.actualProjectPointId': null,
            'form.actualProjectPointName': ''
          })
        }
      }
    })
  },

  // 维修人员选择
  onSelectRepairLaborer() {
    const selected = this.data.form.repairLaborers || []
    const selectedIds = selected.map(l => l.id)
    const params = [
      `selectedIds=${encodeURIComponent(JSON.stringify(selectedIds))}`,
      `selectedLaborers=${encodeURIComponent(JSON.stringify(selected))}`
    ]
    wx.navigateTo({
      url: `/pages/tab/work-order/labor-picker/labor-picker?${params.join('&')}`,
      events: {
        selectLaborer: (data) => {
          this.setData({
            'form.repairLaborers': (data.laborers || []).map(l => ({
              id: l.id,
              name: l.name,
              workTypeId: l.workTypeId,
              workTypeName: l.workTypeName
            }))
          })
        }
      }
    })
  },

  // 删除维修人员
  onDeleteRepairLaborer(e) {
    const index = e.currentTarget.dataset.index
    const repairLaborers = [...this.data.form.repairLaborers]
    repairLaborers.splice(index, 1)
    this.setData({ 'form.repairLaborers': repairLaborers })
  },

  // 物料选择
  onSelectMaterial() {
    const existingMap = {}
    ;(this.data.form.materialLines || []).forEach(m => {
      if (m && m.id != null) existingMap[String(m.id)] = m
    })
    const selected = Object.keys(existingMap).map(id => existingMap[id])
    const selectedIds = selected.map(m => m.id)
    const params = [
      `selectedIds=${encodeURIComponent(JSON.stringify(selectedIds))}`,
      `selectedMaterials=${encodeURIComponent(JSON.stringify(selected.map(m => ({ id: m.id, name: m.name, unit: m.unit }))))}`
    ]
    wx.navigateTo({
      url: `/pages/tab/work-order/material-picker/material-picker?${params.join('&')}`,
      events: {
        selectMaterials: (data) => {
          const materials = (data.materials || []).map(m => {
            const prev = existingMap[String(m.id)]
            return {
              id: m.id,
              name: m.name || '',
              unit: m.unit || (prev && prev.unit) || '个',
              quantity: prev && prev.quantity != null && prev.quantity !== '' ? prev.quantity : ''
            }
          })
          this.setData({ 'form.materialLines': materials })
        }
      }
    })
  },

  // 删除物料
  onDeleteMaterial(e) {
    const index = e.currentTarget.dataset.index
    const materialLines = [...this.data.form.materialLines]
    materialLines.splice(index, 1)
    this.setData({ 'form.materialLines': materialLines })
  },

  // 物料数量输入
  onMaterialQuantityInput(e) {
    const index = e.currentTarget.dataset.index
    const materialLines = [...this.data.form.materialLines]
    materialLines[index].quantity = e.detail.value
    this.setData({ 'form.materialLines': materialLines })
  },

  // 完工图片变化
  onCompletionPhotosChange(e) {
    this.setData({ 'form.completionPhotos': e.detail.fileList })
  },

  // 提报备注输入
  onSubmitRemarkInput(e) {
    this.setData({ 'form.submitRemark': e.detail.value })
  },

  onCancel() {
    wx.navigateBack()
  },

  async loadRepairResultOptions() {
    const app = getApp()
    const res = await app.mpGetAuth('/mp/repairTask/repairResultOptions')
    if (res && Number(res.isSuccess) === 1 && res.result) {
      this.setData({ repairResultOptions: res.result })
    }
  },

  async loadTaskDetail() {
    const taskId = this.data.taskId
    if (!taskId) {
      this.setData({ loading: false })
      wx.showToast({ title: '缺少任务ID', icon: 'none' })
      setTimeout(() => wx.navigateBack(), 1500)
      return
    }

    try {
      const app = getApp()
      const res = await app.mpGetAuth(`/mp/repairTask/detail?id=${encodeURIComponent(taskId)}`)

      if (res && Number(res.isSuccess) === 1 && res.result) {
        const task = res.result
        task.planCategoryDisplayName = parseJsonArray(task.planCategoryNames).join(' / ')
        
        // 回显上一次的提报数据
        const formData = this.buildReportFormData(task)
        const constructionCategoryIndex = this.findConstructionCategoryIndex(
          formData.constructionCategoryId,
          formData.constructionCategoryName
        )
        
        this.setData({ 
          task: task,
          loading: false,
          form: formData,
          constructionCategoryIndex
        })
      } else {
        this.setData({ loading: false })
        wx.showToast({ title: '加载失败', icon: 'none' })
        setTimeout(() => wx.navigateBack(), 1500)
      }
    } catch (error) {
      console.error('加载任务详情异常:', error)
      this.setData({ loading: false })
      wx.showToast({ title: '加载失败', icon: 'none' })
      setTimeout(() => wx.navigateBack(), 1500)
    }
  },

  // 构建提报表单数据(支持回显和重新提报)
  buildReportFormData(task) {
    const formData = {
      repairResult: '',
      repairResultId: null,
      repairResultName: '',
      unfixReason: '',
      constructionCategoryId: null,
      constructionCategoryName: '',
      actualProjectPointId: null,
      actualProjectPointName: '',
      repairLaborers: [],
      materialLines: [],
      completionPhotos: [],
      submitRemark: '',
      // 实际侧：默认带入计划值
      actualTemplateOwnerId: '',
      actualTemplateOwnerValue: '',
      actualTemplateOwnerName: '',
      actualTemplateId: '',
      actualTemplateCode: '',
      actualTemplateName: '',
      actualCategoryId: '',
      actualCategoryName: '',
      actualCategoryIds: [],
      actualCategoryNames: [],
      actualCategoryDisplayName: '',
      actualFacilityId: '',
      actualFacilityName: ''
    }

    // 回显维修结果 (10=已修复, 20=未修复)
    if (task.repairResult) {
      formData.repairResultId = task.repairResult
      formData.repairResultName = task.repairResult === 10 ? '已修复' : (task.repairResult === 20 ? '未修复' : '')
      formData.repairResult = formData.repairResultName
    }

    // 回显未修复原因 (后端字段名: unrepairReason)
    if (task.unrepairReason) {
      formData.unfixReason = task.unrepairReason
    }

    // 回显施工类别
    if (task.constructionCategoryId != null && task.constructionCategoryId !== '') {
      formData.constructionCategoryId = task.constructionCategoryId
      formData.constructionCategoryName = task.constructionCategoryName || ''
    } else if (task.actualConstructionCategoryId != null && task.actualConstructionCategoryId !== '') {
      formData.constructionCategoryId = task.actualConstructionCategoryId
      formData.constructionCategoryName = task.actualConstructionCategoryName || ''
    }

    // 回显实际项点（默认从计划项点获取，优先使用已保存的实际项点）
    if (task.actualProjectPointId) {
      formData.actualProjectPointId = task.actualProjectPointId
      formData.actualProjectPointName = task.actualProjectPointName || ''
    } else if (task.planProjectPointId) {
      formData.actualProjectPointId = task.planProjectPointId
      formData.actualProjectPointName = task.planProjectPointName
    }

    // 回显实际设施分类（默认从计划值获取，优先使用已保存的实际值）
    // 大类（模板归属）
    if (task.actualTemplateOwnerId) {
      formData.actualTemplateOwnerId = task.actualTemplateOwnerId
      formData.actualTemplateOwnerValue = task.actualTemplateOwnerValue || ''
      formData.actualTemplateOwnerName = task.actualTemplateOwnerName || ''
    } else if (task.planTemplateOwnerId) {
      formData.actualTemplateOwnerId = task.planTemplateOwnerId
      formData.actualTemplateOwnerValue = task.planTemplateOwnerValue || ''
      formData.actualTemplateOwnerName = task.planTemplateOwnerName || ''
    }
    // 中类（模板）
    if (task.actualTemplateId) {
      formData.actualTemplateId = task.actualTemplateId
      formData.actualTemplateCode = task.actualTemplateCode || ''
      formData.actualTemplateName = task.actualTemplateName || ''
    } else if (task.planTemplateId) {
      formData.actualTemplateId = task.planTemplateId
      formData.actualTemplateCode = task.planTemplateCode || ''
      formData.actualTemplateName = task.planTemplateName || ''
    }
    // 多级分类
    if (task.actualCategoryId) {
      formData.actualCategoryId = task.actualCategoryId
      formData.actualCategoryName = task.actualCategoryName || ''
      formData.actualCategoryIds = parseJsonArray(task.actualCategoryIds)
      formData.actualCategoryNames = parseJsonArray(task.actualCategoryNames)
      formData.actualCategoryDisplayName = formData.actualCategoryNames.join(' / ')
    } else if (task.planCategoryId) {
      formData.actualCategoryId = task.planCategoryId
      formData.actualCategoryName = task.planCategoryName || ''
      formData.actualCategoryIds = parseJsonArray(task.planCategoryIds)
      formData.actualCategoryNames = parseJsonArray(task.planCategoryNames)
      formData.actualCategoryDisplayName = formData.actualCategoryNames.join(' / ')
    }
    // 实际设施
    if (task.actualFacilityId) {
      formData.actualFacilityId = task.actualFacilityId
      formData.actualFacilityName = task.actualFacilityName || ''
    } else if (task.planFacilityId) {
      formData.actualFacilityId = task.planFacilityId
      formData.actualFacilityName = task.planFacilityName || ''
    }

    // 回显完工图片 (后端字段名: completionPhotoUrls)
    if (task.completionPhotoUrls) {
      try {
        const photos = typeof task.completionPhotoUrls === 'string' 
          ? JSON.parse(task.completionPhotoUrls) 
          : task.completionPhotoUrls
        formData.completionPhotos = Array.isArray(photos) ? photos : []
      } catch (e) {
        console.error('解析完工图片失败:', e)
        formData.completionPhotos = []
      }
    }

    // 回显备注 (后端字段名: repairRemark)
    if (task.repairRemark) {
      formData.submitRemark = task.repairRemark
    }

    // 回显维修人员：优先历史提报人员，否则回显工单申请执行人员
    if (task.reportPersonnelList && task.reportPersonnelList.length > 0) {
      try {
        formData.repairLaborers = task.reportPersonnelList.map(l => ({
          id: l.laborerId,
          name: l.laborerName,
          workTypeId: l.workTypeId || '',
          workTypeName: l.workTypeName || ''
        }))
      } catch (e) {
        console.error('解析维修人员失败:', e)
      }
    } else if (task.applyPersonnelList && task.applyPersonnelList.length > 0) {
      try {
        formData.repairLaborers = task.applyPersonnelList.map(l => ({
          id: l.laborerId,
          name: l.laborerName,
          workTypeId: l.professionTypeId != null ? String(l.professionTypeId) : '',
          workTypeName: l.professionTypeName || ''
        }))
      } catch (e) {
        console.error('解析工单申请人员失败:', e)
      }
    }

    // 回显物料清单（后端字段名：reportMaterialList）
    if (task.reportMaterialList && task.reportMaterialList.length > 0) {
      try {
        formData.materialLines = task.reportMaterialList.map(m => ({
          id: m.materialId,
          name: m.materialName || '',
          unit: m.unit || '个',
          quantity: m.quantity != null ? String(m.quantity) : ''
        }))
      } catch (e) {
        console.error('解析物料清单失败:', e)
      }
    }

    return formData
  },

  findConstructionCategoryIndex(id, name) {
    const options = this.data.constructionCategoryOptions || []
    const idNum = id != null && id !== '' ? Number(id) : NaN
    let idx = options.findIndex(o => Number(o.id) === idNum)
    if (idx < 0 && name) {
      idx = options.findIndex(o => o.name === name)
    }
    return idx >= 0 ? idx : 0
  },

  /** 仅「更换」时物料必填；优先按名称判断，避免 picker 下标绑错导致 id 失真 */
  isReplaceConstructionCategory() {
    const name = this.data.form.constructionCategoryName
    if (name) return name === '更换'
    return Number(this.data.form.constructionCategoryId) === 20
  },

  async onSubmit() {
    // 校验必填项
    if (!this.data.form.repairResultId) {
      wx.showToast({ title: '请选择维修结果', icon: 'none' })
      return
    }
    if (this.data.form.repairResultId === 20 && !this.data.form.unfixReason) {
      wx.showToast({ title: '请填写未修复原因', icon: 'none' })
      return
    }
    if (!this.data.form.actualCategoryId) {
      wx.showToast({ title: '请选择实际设施分类', icon: 'none' })
      return
    }
    if (!this.data.form.constructionCategoryId && !this.data.form.constructionCategoryName) {
      wx.showToast({ title: '请选择施工类别', icon: 'none' })
      return
    }
    // 施工类别为「更换」时，物料必填
    if (this.isReplaceConstructionCategory()) {
      const materialLines = this.data.form.materialLines || []
      const hasMaterial = materialLines.some(m => m && m.id != null && String(m.id) !== '')
      if (!hasMaterial) {
        wx.showToast({ title: '当前物料还未提报，请填写物料后再提报', icon: 'none' })
        return
      }
    }
    // 已添加物料时，数量必填
    const materialLines = this.data.form.materialLines || []
    if (materialLines.length > 0) {
      const missingQty = materialLines.some(m => {
        if (!m) return true
        const q = m.quantity
        if (q === '' || q == null) return true
        const num = Number(q)
        return Number.isNaN(num) || num <= 0
      })
      if (missingQty) {
        wx.showToast({ title: '请填写物料数量', icon: 'none' })
        return
      }
    }

    this.setData({ submitting: true })
    const app = getApp()
    
    // 构建物料明细
    const materials = this.data.form.materialLines.map(m => ({
      materialId: String(m.id),
      materialName: m.name || '',
      unit: m.unit,
      quantity: m.quantity
    }))

    // 构建维修人员
    const repairLaborers = this.data.form.repairLaborers.map(l => ({
      laborerId: String(l.id),
      laborerName: l.name,
      workTypeId: l.workTypeId,
      workTypeName: l.workTypeName
    }))

    try {
      const res = await app.mpPostAuth('/mp/repairTask/submit', {
        repairTaskId: this.data.taskId,
        repairResult: this.data.form.repairResultId,
        repairResultName: this.data.form.repairResultName,
        unfixReason: this.data.form.unfixReason,
        constructionCategoryId: this.data.form.constructionCategoryId,
        constructionCategoryName: this.data.form.constructionCategoryName,
        actualProjectPointId: this.data.form.actualProjectPointId,
        actualProjectPointName: this.data.form.actualProjectPointName,
        repairLaborers: repairLaborers,
        materials: materials,
        completionPhotos: this.data.form.completionPhotos,
        submitRemark: this.data.form.submitRemark,
        // 实际侧：模板归属（大类）
        actualTemplateOwnerId: this.data.form.actualTemplateOwnerId || null,
        actualTemplateOwnerValue: this.data.form.actualTemplateOwnerValue || null,
        actualTemplateOwnerName: this.data.form.actualTemplateOwnerName || null,
        // 实际侧：模板（中类）
        actualTemplateId: this.data.form.actualTemplateId || null,
        actualTemplateCode: this.data.form.actualTemplateCode || null,
        actualTemplateName: this.data.form.actualTemplateName || null,
        // 实际侧：设施分类（多级分类）
        actualCategoryId: this.data.form.actualCategoryId || null,
        actualCategoryName: this.data.form.actualCategoryName || null,
        actualCategoryIds: this.data.form.actualCategoryIds.length > 0 ? JSON.stringify(this.data.form.actualCategoryIds) : null,
        actualCategoryNames: this.data.form.actualCategoryNames.length > 0 ? JSON.stringify(this.data.form.actualCategoryNames) : null,
        // 实际设施
        actualFacilityId: this.data.form.actualFacilityId || null,
        actualFacilityName: this.data.form.actualFacilityName || null
      })
      
      if (res && Number(res.isSuccess) === 1) {
        wx.showToast({ title: '提报成功', icon: 'success' })
        setTimeout(() => wx.navigateBack(), 1500)
      } else {
        wx.showToast({ title: res?.errorMsg || '提报失败', icon: 'none' })
      }
    } catch (error) {
      // mpPostAuth 失败时已通过 showGlobalError 弹出提示，此处仅兜底
      console.error('提报请求异常:', error)
    } finally {
      this.setData({ submitting: false })
    }
  }
})
