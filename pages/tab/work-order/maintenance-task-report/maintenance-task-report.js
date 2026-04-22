Page({
  data: {
    loading: true, submitting: false, task: {}, taskId: '',
    form: { 
      completedQuantity: '',
      materialLines: [],
      completedImages: [],
      remark: ''
    }
  },

  onLoad(options) {
    const taskId = options.id ? decodeURIComponent(String(options.id)) : ''
    this.setData({ taskId })
    this.loadTaskDetail()
  },

  // 完成量输入
  onCompletedQuantityInput(e) { this.setData({ 'form.completedQuantity': e.detail.value }) },

  // 备注输入
  onRemarkInput(e) { this.setData({ 'form.remark': e.detail.value }) },

  // 完成图片-变化
  onCompletedImagesChange(e) {
    this.setData({ 'form.completedImages': e.detail.fileList })
  },

  // 物料-选择(多选)
  onSelectMaterial() {
    const selectedIds = this.data.form.materialLines.map(m => m.id)
    wx.navigateTo({
      url: `/pages/tab/work-order/material-picker/material-picker?selectedIds=${encodeURIComponent(JSON.stringify(selectedIds))}`,
      events: {
        selectMaterials: (data) => {
          // data.materials 是选中的物料列表,包含后端返回的完整信息
          this.setData({ 
            'form.materialLines': data.materials.map(m => ({
              id: m.id,
              name: m.name,
              categoryName: m.categoryName || m.name,
              modelSpec: m.modelSpec,
              unit: m.unit || '个',  // 使用物料自带的单位
              quantity: ''
            }))
          })
        }
      }
    })
  },

  // 物料-删除
  onDeleteMaterial(e) {
    const index = e.currentTarget.dataset.index
    const materialLines = [...this.data.form.materialLines]
    materialLines.splice(index, 1)
    this.setData({ 'form.materialLines': materialLines })
  },

  // 物料-数量输入
  onMaterialQuantityInput(e) {
    const index = e.currentTarget.dataset.index
    const materialLines = [...this.data.form.materialLines]
    materialLines[index].quantity = e.detail.value
    this.setData({ 'form.materialLines': materialLines })
  },

  onCancel() { wx.navigateBack() },

  async loadTaskDetail() {
    const taskId = this.data.taskId
    if (!taskId) {
      this.setData({ loading: false })
      wx.showToast({ title: '缺少任务ID', icon: 'none' })
      setTimeout(() => wx.navigateBack(), 1500)
      return
    }
    const app = getApp()
    const res = await app.mpGetAuth(`/mp/maintenanceTask/detail?id=${encodeURIComponent(taskId)}`)
    if (res && Number(res.isSuccess) === 1 && res.result) {
      const task = res.result
      
      // 回显上一次的提报数据
      const formData = this.buildReportFormData(task)
      
      this.setData({ 
        task: task,
        loading: false,
        form: formData
      })
    } else {
      this.setData({ loading: false })
      wx.showToast({ title: '加载失败', icon: 'none' })
      setTimeout(() => wx.navigateBack(), 1500)
    }
  },

  // 构建提报表单数据(支持回显)
  buildReportFormData(task) {
    const formData = {
      completedQuantity: '',
      materialLines: [],
      completedImages: [],
      remark: ''
    }

    // 回显完成量
    if (task.reportCompletionQty) {
      formData.completedQuantity = String(task.reportCompletionQty)
    }

    // 回显完成图片 - upload-images组件需要字符串数组
    if (task.reportCompletionFileUrls) {
      try {
        const urls = typeof task.reportCompletionFileUrls === 'string' 
          ? JSON.parse(task.reportCompletionFileUrls) 
          : task.reportCompletionFileUrls
        // 直接使用URL字符串数组,不需要转换为对象
        formData.completedImages = Array.isArray(urls) ? urls : []
      } catch (e) {
        console.error('解析完成图片失败:', e)
        formData.completedImages = []
      }
    }

    // 回显备注
    if (task.reportCompletionRemark) {
      formData.remark = task.reportCompletionRemark
    }

    // 回显物料清单
    if (task.reportMaterialJson) {
      try {
        const materials = typeof task.reportMaterialJson === 'string'
          ? JSON.parse(task.reportMaterialJson)
          : task.reportMaterialJson
        formData.materialLines = materials.map(m => ({
          id: m.materialId,
          name: m.materialName,
          categoryName: m.materialName,
          modelSpec: '',
          unit: m.unit || '个',
          quantity: m.quantity || ''
        }))
      } catch (e) {
        console.error('解析物料清单失败:', e)
      }
    }

    return formData
  },

  async onSubmit() {
    this.setData({ submitting: true })
    const app = getApp()
    
    // 构建物料明细
    const materials = this.data.form.materialLines.map(m => ({
      materialId: String(m.id),
      materialName: m.name,
      quantity: m.quantity,
      unit: m.unit
    }))

    const res = await app.mpPostAuth('/mp/maintenanceTask/submit', {
      taskId: this.data.taskId,
      completionQty: this.data.form.completedQuantity,
      completionUnit: '站',
      completionFileUrls: this.data.form.completedImages,
      completionRemark: this.data.form.remark,
      materials: materials
    })
    if (res && Number(res.isSuccess) === 1) {
      wx.showToast({ title: '提报成功', icon: 'success' })
      setTimeout(() => wx.navigateBack(), 1500)
    } else {
      wx.showToast({ title: res?.errorMsg || '提报失败', icon: 'none' })
    }
    this.setData({ submitting: false })
  }
})
