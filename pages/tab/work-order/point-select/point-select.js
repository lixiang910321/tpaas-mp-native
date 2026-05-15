Page({
  data: {
    // 各步骤选中数据
    selectedArea: { id: null, name: '', pathIds: [], pathNames: [] },
    selectedFacility: { id: null, name: '' },
    selectedFaultType: { faultTypeId: null, faultTypeName: '', diseaseLibraryId: null, diseaseLibraryName: '' },
    selectedPoint: { id: null, name: '' },

    // 步骤状态: 0-未完成, 1-已完成
    stepStatus: [0, 0, 0, 0]
  },

  onLoad(options) {
    // 接收回显数据（如果有）
    if (options.selectedAreaId) {
      this.setData({
        selectedArea: {
          id: options.selectedAreaId,
          name: decodeURIComponent(options.selectedAreaName || '')
        }
      })
    }
    this.updateStepStatus()
  },

  onShow() {
    // 每次显示时刷新步骤状态
    this.updateStepStatus()
  },

  updateStepStatus() {
    const status = [
      this.data.selectedArea.id ? 1 : 0,
      this.data.selectedFacility.id ? 1 : 0,
      this.data.selectedFaultType.faultTypeId ? 1 : 0,
      this.data.selectedPoint.id ? 1 : 0
    ]
    this.setData({ stepStatus: status })
  },

  /** ① 选择区域 */
  onStep1() {
    const params = []
    if (this.data.selectedArea.id) {
      params.push(`selectedId=${this.data.selectedArea.id}`)
      params.push(`selectedName=${encodeURIComponent(this.data.selectedArea.name)}`)
    }
    const query = params.length > 0 ? `?${params.join('&')}` : ''
    wx.navigateTo({
      url: `/pages/tab/work-order/area-picker/area-picker${query}`,
      events: {
        selectArea: (data) => {
          this.setData({
            selectedArea: {
              id: data.id,
              name: data.name,
              pathIds: data.pathIds || [],
              pathNames: data.pathNames || []
            },
            // 级联清空：区域变更 → 清空设施、故障类型、项点
            selectedFacility: { id: null, name: '' },
            selectedFaultType: { faultTypeId: null, faultTypeName: '', diseaseLibraryId: null, diseaseLibraryName: '' },
            selectedPoint: { id: null, name: '' }
          })
          this.updateStepStatus()
        }
      }
    })
  },

  /** ② 选择设施（需先选区域） */
  onStep2() {
    if (!this.data.selectedArea.id) {
      wx.showToast({ title: '请先选择区域', icon: 'none' })
      return
    }
    const params = [`areaId=${this.data.selectedArea.id}`]
    if (this.data.selectedFacility.id) {
      params.push(`selectedId=${this.data.selectedFacility.id}`)
      params.push(`selectedName=${encodeURIComponent(this.data.selectedFacility.name)}`)
    }
    const query = `?${params.join('&')}`
    wx.navigateTo({
      url: `/pages/tab/work-order/facility-picker/facility-picker${query}`,
      events: {
        selectFacility: (data) => {
          this.setData({
            selectedFacility: { id: data.id, name: data.name },
            // 级联清空：设施变更 → 清空故障类型、项点
            selectedFaultType: { faultTypeId: null, faultTypeName: '', diseaseLibraryId: null, diseaseLibraryName: '' },
            selectedPoint: { id: null, name: '' }
          })
          this.updateStepStatus()
        }
      }
    })
  },

  /** ③ 选择故障类型（需先选设施） */
  onStep3() {
    if (!this.data.selectedFacility.id) {
      wx.showToast({ title: '请先选择设施', icon: 'none' })
      return
    }
    const params = [`facilityId=${this.data.selectedFacility.id}`]
    if (this.data.selectedFaultType.faultTypeId) {
      params.push(`selectedFaultTypeId=${this.data.selectedFaultType.faultTypeId}`)
      params.push(`selectedFaultTypeName=${encodeURIComponent(this.data.selectedFaultType.faultTypeName)}`)
    }
    const query = `?${params.join('&')}`
    wx.navigateTo({
      url: `/pages/tab/work-order/fault-type-picker/fault-type-picker${query}`,
      events: {
        selectFaultType: (data) => {
          this.setData({
            selectedFaultType: {
              faultTypeId: data.faultTypeId,
              faultTypeName: data.faultTypeName,
              diseaseLibraryId: data.diseaseLibraryId,
              diseaseLibraryName: data.diseaseLibraryName
            },
            // 级联清空：故障类型变更 → 清空项点
            selectedPoint: { id: null, name: '' }
          })
          this.updateStepStatus()
        }
      }
    })
  },

  /** ④ 选择项点（需先选故障类型） */
  onStep4() {
    if (!this.data.selectedFaultType.faultTypeId) {
      wx.showToast({ title: '请先选择故障类型', icon: 'none' })
      return
    }
    const params = [
      `facilityId=${this.data.selectedFacility.id}`,
      `faultTypeId=${this.data.selectedFaultType.faultTypeId}`,
      'taskType=1'
    ]
    if (this.data.selectedPoint.id) {
      params.push(`selectedId=${this.data.selectedPoint.id}`)
      params.push(`selectedName=${encodeURIComponent(this.data.selectedPoint.name)}`)
    }
    const query = `?${params.join('&')}`
    wx.navigateTo({
      url: `/pages/tab/work-order/project-point-picker/project-point-picker${query}`,
      events: {
        selectProjectPoint: (data) => {
          this.setData({
            selectedPoint: { id: data.id, name: data.name }
          })
          this.updateStepStatus()
        }
      }
    })
  },

  /** 确认返回 */
  onConfirm() {
    if (!this.data.selectedPoint.id) {
      wx.showToast({ title: '请完成所有步骤', icon: 'none' })
      return
    }

    const eventChannel = this.getOpenerEventChannel()
    if (eventChannel) {
      eventChannel.emit('selectProjectPoint', {
        // 最终选中项点
        id: this.data.selectedPoint.id,
        name: this.data.selectedPoint.name,
        // 冗余信息
        areaInfo: {
          id: this.data.selectedArea.id,
          name: this.data.selectedArea.name,
          pathIds: this.data.selectedArea.pathIds,
          pathNames: this.data.selectedArea.pathNames
        },
        facilityInfo: {
          id: this.data.selectedFacility.id,
          name: this.data.selectedFacility.name
        },
        diseaseLibraryInfo: {
          id: this.data.selectedFaultType.diseaseLibraryId,
          name: this.data.selectedFaultType.diseaseLibraryName
        },
        faultTypeInfo: {
          id: this.data.selectedFaultType.faultTypeId,
          name: this.data.selectedFaultType.faultTypeName
        }
      })
    }
    wx.navigateBack()
  }
})
