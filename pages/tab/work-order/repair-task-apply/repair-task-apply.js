Page({
  data: {
    loading: true,
    submitting: false,
    task: {},
    taskId: '',
    form: {
      applyRemark: '',
      actualProjectPointId: null,
      actualProjectPointName: ''
    }
  },

  onLoad(options) {
    const taskId = options.id ? decodeURIComponent(String(options.id)) : ''
    this.setData({ taskId })
    this.loadTaskDetail()
  },

  onRemarkInput(e) {
    this.setData({ 'form.applyRemark': e.detail.value })
  },

  onSelectProjectPoint() {
    const params = []
    // 传递任务类型：1-维修项点
    params.push('taskType=1')
    if (this.data.form.actualProjectPointId) {
      params.push(`selectedId=${this.data.form.actualProjectPointId}`)
      params.push(`selectedName=${encodeURIComponent(this.data.form.actualProjectPointName)}`)
    }
    const query = params.length > 0 ? `?${params.join('&')}` : ''
    wx.navigateTo({
      url: `/pages/tab/work-order/repair-task-apply/select-project-point/select-project-point${query}`
    })
  },

  onCancel() {
    wx.navigateBack()
  },

  async loadTaskDetail() {
    const taskId = this.data.taskId
    if (!taskId) {
      this.setData({ loading: false })
      wx.showToast({ title: '缺少任务ID', icon: 'none' })
      setTimeout(() => wx.navigateBack(), 1500)
      return
    }

    const app = getApp()
    const res = await app.mpGetAuth(`/mp/repairTask/detail?id=${encodeURIComponent(taskId)}`)

    if (res && Number(res.isSuccess) === 1 && res.result) {
      const task = res.result
      this.setData({ 
        task,
        loading: false,
        'form.actualProjectPointId': task.planProjectPointId,
        'form.actualProjectPointName': task.planProjectPointName
      })
    } else {
      this.setData({ loading: false })
      wx.showToast({ title: '加载失败', icon: 'none' })
      setTimeout(() => wx.navigateBack(), 1500)
    }
  },

  async onSubmit() {
    if (!this.data.form.actualProjectPointId) {
      wx.showToast({ title: '请选择作业项点', icon: 'none' })
      return
    }

    this.setData({ submitting: true })

    const app = getApp()
    const res = await app.mpPostAuth('/mp/repairTask/apply', {
      repairTaskId: this.data.taskId,
      actualProjectPointId: this.data.form.actualProjectPointId,
      actualProjectPointName: this.data.form.actualProjectPointName,
      applyRemark: this.data.form.applyRemark
    })

    if (res && Number(res.isSuccess) === 1) {
      wx.showToast({ title: '申请成功', icon: 'success' })
      setTimeout(() => wx.navigateBack(), 1500)
    } else {
      wx.showToast({ title: res?.errorMsg || '申请失败', icon: 'none' })
    }

    this.setData({ submitting: false })
  }
})
