Page({
  data: {
    loading: true,
    submitting: false,
    taskId: '',
    workTypes: [], // 工种列表，从项点获取
    form: {
      personnelLines: [], // [{workTypeId: xxx, workTypeName: '电工', requiredQuantity: 2, persons: [{id: 'xxx', name: '张三'}]}]
      machines: [], // [{id: 'xxx', name: 'xxx'}]
      iotDeviceId: '',
      iotDeviceName: '',
      briefingFiles: [], // 交底附图URL列表
      measureFiles: [] // 措施附图URL列表
    }
  },

  onLoad(options) {
    const taskId = options.id ? decodeURIComponent(String(options.id)) : ''
    this.setData({ taskId })
    this.loadTaskDetail()
  },

  // 添加人员行(工种)
  onAddPersonnelLine() {
    if (this.data.workTypes.length === 0) {
      wx.showToast({ title: '暂无可选工种', icon: 'none' })
      return
    }

    const itemList = this.data.workTypes.map(wt => wt.workTypeName)
    
    wx.showActionSheet({
      itemList: itemList,
      success: (res) => {
        const selectedWorkType = this.data.workTypes[res.tapIndex]
        const personnelLines = this.data.form.personnelLines
        
        // 检查是否已添加该工种
        const exists = personnelLines.some(line => line.workTypeId === selectedWorkType.workTypeId)
        if (exists) {
          wx.showToast({ title: '该工种已添加', icon: 'none' })
          return
        }

        personnelLines.push({
          workTypeId: selectedWorkType.workTypeId,
          workTypeName: selectedWorkType.workTypeName,
          requiredQuantity: selectedWorkType.quantity,
          persons: []
        })
        this.setData({ 'form.personnelLines': personnelLines })
      }
    })
  },

  // 添加人员
  onAddPerson(e) {
    const lineIndex = e.currentTarget.dataset.index
    const personnelLine = this.data.form.personnelLines[lineIndex]
    const selectedIds = personnelLine.persons.map(p => p.id)
    
    wx.navigateTo({
      url: `/pages/tab/work-order/labor-picker/labor-picker?workTypeName=${encodeURIComponent(personnelLine.workTypeName)}&selectedIds=${encodeURIComponent(JSON.stringify(selectedIds))}`,
      events: {
        selectLaborer: (data) => {
          const personnelLines = this.data.form.personnelLines
          // 替换该工种的所有人员
          personnelLines[lineIndex].persons = data.laborers.map(laborer => ({
            id: laborer.id,
            name: laborer.name
          }))
          this.setData({ 'form.personnelLines': personnelLines })
        }
      }
    })
  },

  // 删除人员
  onDeletePerson(e) {
    const lineIndex = e.currentTarget.dataset.lineIndex
    const personIndex = e.currentTarget.dataset.personIndex
    const personnelLines = this.data.form.personnelLines
    personnelLines[lineIndex].persons.splice(personIndex, 1)
    this.setData({ 'form.personnelLines': personnelLines })
  },

  // 删除工种行
  onDeletePersonnelLine(e) {
    const index = e.currentTarget.dataset.index
    const personnelLines = this.data.form.personnelLines
    
    wx.showModal({
      title: '提示',
      content: `确定删除"${personnelLines[index].workTypeName}"工种吗？`,
      success: (res) => {
        if (res.confirm) {
          personnelLines.splice(index, 1)
          this.setData({ 'form.personnelLines': personnelLines })
        }
      }
    })
  },

  // 选择机械
  onSelectMachine() {
    const selectedIds = this.data.form.machines.map(m => m.id)
    wx.navigateTo({
      url: `/pages/tab/work-order/machine-picker/machine-picker?selectedIds=${encodeURIComponent(JSON.stringify(selectedIds))}`,
      events: {
        selectMachines: (data) => {
          this.setData({
            'form.machines': data.machines
          })
        }
      }
    })
  },

  // 删除机械
  onDeleteMachine(e) {
    const index = e.currentTarget.dataset.index
    const machines = this.data.form.machines
    machines.splice(index, 1)
    this.setData({ 'form.machines': machines })
  },

  // 选择物联设备
  onSelectIotDevice() {
    wx.navigateTo({
      url: `/pages/tab/work-order/iot-device-picker/iot-device-picker?selectedId=${this.data.form.iotDeviceId}`,
      events: {
        selectIotDevice: (data) => {
          this.setData({
            'form.iotDeviceId': data.id,
            'form.iotDeviceName': data.name
          })
        }
      }
    })
  },

  // 清除物联设备
  onClearIotDevice() {
    this.setData({
      'form.iotDeviceId': '',
      'form.iotDeviceName': ''
    })
  },

  // 交底图片变化
  onBriefingFilesChange(e) {
    this.setData({
      'form.briefingFiles': e.detail.fileList
    })
  },

  // 措施图片变化
  onMeasureFilesChange(e) {
    this.setData({
      'form.measureFiles': e.detail.fileList
    })
  },

  // 加载任务详情
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
      // 加载工种列表
      await this.loadWorkTypes()
      this.setData({ loading: false })
    } else {
      this.setData({ loading: false })
      wx.showToast({ title: '加载失败', icon: 'none' })
      setTimeout(() => wx.navigateBack(), 1500)
    }
  },

  // 加载项点工种需求
  async loadWorkTypes() {
    const app = getApp()
    const res = await app.mpGetAuth(`/mp/maintenanceTask/workTypes?taskId=${this.data.taskId}`)
    if (res && Number(res.isSuccess) === 1 && res.result) {
      this.setData({ workTypes: res.result || [] })
    }
  },

  // 提交申请
  async onSubmit() {
    // 验证必填项
    if (this.data.form.personnelLines.length === 0) {
      wx.showToast({ title: '请添加人员', icon: 'none' })
      return
    }

    // 验证每个工种都有人员
    for (let i = 0; i < this.data.form.personnelLines.length; i++) {
      if (this.data.form.personnelLines[i].persons.length === 0) {
        wx.showToast({ title: `请选择${this.data.form.personnelLines[i].workTypeName}人员`, icon: 'none' })
        return
      }
    }

    this.setData({ submitting: true })
    const app = getApp()
    
    // 构建提交数据
    const submitData = {
      taskId: this.data.taskId,
      personnelLines: this.data.form.personnelLines.map(line => {
        const laborerIds = line.persons.map(p => String(p.id))
        console.log('工种:', line.workTypeName, '人员:', line.persons, 'laborerIds:', laborerIds)
        return {
          laborerIds: laborerIds
        }
      }),
      machineIds: this.data.form.machines.map(m => m.id),
      iotDeviceId: this.data.form.iotDeviceId,
      iotDeviceName: this.data.form.iotDeviceName,
      briefingFileUrls: this.data.form.briefingFiles,
      measureFileUrls: this.data.form.measureFiles
    }
    
    console.log('提交数据:', JSON.stringify(submitData))

    const res = await app.mpPostAuth('/mp/maintenanceTask/apply', submitData)
    if (res && Number(res.isSuccess) === 1) {
      wx.showToast({ title: '申请成功', icon: 'success' })
      setTimeout(() => wx.navigateBack(), 1500)
    } else {
      wx.showToast({ title: res?.errorMsg || '申请失败', icon: 'none' })
    }
    this.setData({ submitting: false })
  }
})
