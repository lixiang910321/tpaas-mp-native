const app = getApp()

Page({
  data: {
    workOrderId: '',
    loading: true,
    submitting: false,
    error: '',

    // 班组人员
    teamMembers: [],
    selectedMembers: {}, // { laborerId: true }

    // 机械列表
    machines: [],  // [{id: 'xxx', name: 'xxx'}]

    // 单兵设备列表
    iotDevices: [],  // [{id: 'xxx', name: 'xxx'}]

    // 安全交底照片
    briefingFileUrls: [],

    // 申请备注
    applyRemark: ''
  },

  onLoad(options) {
    const workOrderId = options.workOrderId ? decodeURIComponent(String(options.workOrderId)) : ''
    if (!workOrderId) {
      this.setData({ loading: false, error: '缺少工单 id' })
      return
    }
    this.setData({ workOrderId })
    this.loadData()
  },

  // 加载班组人员和备选资源
  async loadData() {
    this.setData({ loading: true, error: '' })
    try {
      const id = this.data.workOrderId
      // 并行加载班组人员
      const [memberRes] = await Promise.all([
        app.mpGetAuth(`/mp/workOrder/teamMembers/${encodeURIComponent(id)}`)
      ])

      if (memberRes && Number(memberRes.isSuccess) === 1) {
        const members = (memberRes.result || []).map(m => ({
          ...m,
          selected: false
        }))
        this.setData({ teamMembers: members })
      } else {
        this.setData({ error: (memberRes && memberRes.errorMsg) || '加载班组人员失败' })
      }
    } catch (e) {
      this.setData({ error: e && e.message ? e.message : '网络错误' })
    } finally {
      this.setData({ loading: false })
    }
  },

  // 切换人员选择
  onToggleMember(e) {
    const id = e.currentTarget.dataset.id
    if (id == null) return
    // 占用人员不可选
    const member = this.data.teamMembers.find(m => m.laborerId == id)
    if (member && member.occupied) return
    const selectedMembers = { ...this.data.selectedMembers }
    if (selectedMembers[id]) {
      delete selectedMembers[id]
    } else {
      selectedMembers[id] = true
    }
    this.setData({ selectedMembers })
  },

  // 选择机械（多选）
  onSelectMachine() {
    const selectedIds = this.data.machines.map(m => m.id)
    wx.navigateTo({
      url: `/pages/tab/work-order/machine-picker/machine-picker?selectedIds=${encodeURIComponent(JSON.stringify(selectedIds))}`,
      events: {
        selectMachines: (data) => {
          this.setData({
            machines: data.machines || []
          })
        }
      },
      fail: () => wx.showToast({ title: '页面跳转失败', icon: 'none' })
    })
  },

  // 删除机械
  onDeleteMachine(e) {
    const index = e.currentTarget.dataset.index
    const machines = [...this.data.machines]
    machines.splice(index, 1)
    this.setData({ machines })
  },

  // 选择单兵设备（多选）
  onSelectIotDevice() {
    const selectedIds = this.data.iotDevices.map(d => d.id)
    wx.navigateTo({
      url: `/pages/tab/work-order/iot-device-picker/iot-device-picker?selectedIds=${encodeURIComponent(JSON.stringify(selectedIds))}&multiSelect=true`,
      events: {
        selectIotDevices: (data) => {
          this.setData({
            iotDevices: data.devices || []
          })
        }
      },
      fail: () => wx.showToast({ title: '页面跳转失败', icon: 'none' })
    })
  },

  // 删除单兵设备
  onDeleteIotDevice(e) {
    const index = e.currentTarget.dataset.index
    const iotDevices = [...this.data.iotDevices]
    iotDevices.splice(index, 1)
    this.setData({ iotDevices })
  },

  // 安全交底照片变更
  onBriefingImagesChange(e) {
    this.setData({ briefingFileUrls: e.detail.fileList || [] })
  },

  // 备注输入
  onRemarkInput(e) {
    this.setData({ applyRemark: e.detail.value || '' })
  },

  // 提交申请
  async onSubmit() {
    const { workOrderId, selectedMembers, briefingFileUrls, applyRemark } = this.data

    // 校验
    const selectedPersonIds = Object.keys(selectedMembers)
    if (selectedPersonIds.length === 0) {
      wx.showToast({ title: '请至少选择一名人员', icon: 'none' })
      return
    }
    if (!briefingFileUrls || briefingFileUrls.length === 0) {
      wx.showToast({ title: '请上传安全交底照片', icon: 'none' })
      return
    }

    this.setData({ submitting: true })

    try {
      const body = {
        workOrderId: workOrderId,
        personnelLines: [{
          laborerIds: selectedPersonIds,
          workTypeName: ''
        }],
        machineIds: this.data.machines.map(m => m.id),
        iotDeviceIds: this.data.iotDevices.map(d => d.id),
        applyRemark: applyRemark || undefined,
        briefingFileUrls: briefingFileUrls
      }

      const res = await app.mpPostAuth('/mp/workOrder/apply', body)

      if (res && Number(res.isSuccess) === 1) {
        wx.showToast({ title: '申请成功', icon: 'success' })
        // 返回上一页
        setTimeout(() => {
          wx.navigateBack()
        }, 1500)
      } else {
        wx.showToast({
          title: (res && res.errorMsg) || '申请失败',
          icon: 'none',
          duration: 3000
        })
      }
    } catch (e) {
      wx.showToast({
        title: e && e.message ? e.message : '网络错误',
        icon: 'none'
      })
    } finally {
      this.setData({ submitting: false })
    }
  }
})
