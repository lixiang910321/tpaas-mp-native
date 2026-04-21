Page({
  data: {
    loading: true,
    loadError: '',
    projects: [],
    filteredList: [],
    selectedId: null,
    submitting: false,
    searchKeyword: '',
    currentProjectId: null
  },

  onLoad() {
    const app = getApp()
    const currentProject = app.globalData.currentProject
    if (currentProject && currentProject.id != null) {
      this.setData({ currentProjectId: String(currentProject.id) })
    }
    this.fetchProjects()
  },

  // 搜索输入
  onSearchInput(e) {
    const keyword = e.detail.value.trim().toLowerCase()
    this.setData({ searchKeyword: keyword })
    this._applyFilter(keyword)
  },

  // 清除搜索
  onSearchClear() {
    this.setData({ searchKeyword: '', filteredList: this.data.projects })
  },

  _applyFilter(keyword) {
    if (!keyword) {
      this.setData({ filteredList: this.data.projects })
      return
    }
    const filtered = this.data.projects.filter(p => {
      const name = (p.name || '').toLowerCase()
      const code = (p.code || '').toLowerCase()
      const id = String(p.id || '')
      return name.includes(keyword) || code.includes(keyword) || id.includes(keyword)
    })
    this.setData({ filteredList: filtered })
  },

  // 根据ID选中项目
  selectProjectById(projectId) {
    const projects = this.data.projects.map(p => ({
      ...p,
      selected: String(p.id) === String(projectId)
    }))
    const keyword = this.data.searchKeyword
    const filtered = keyword
      ? projects.filter(p => {
          const name = (p.name || '').toLowerCase()
          const code = (p.code || '').toLowerCase()
          const id = String(p.id || '')
          return name.includes(keyword) || code.includes(keyword) || id.includes(keyword)
        })
      : projects

    this.setData({ projects, filteredList: filtered, selectedId: projectId })
  },

  // 选择项目
  onSelectProject(e) {
    const project = e.currentTarget.dataset.project
    if (project && project.id != null) {
      this.selectProjectById(project.id)
    }
  },

  showToast(msg) {
    wx.showToast({ title: msg, icon: 'none' })
  },

  // 获取项目列表（已登录，走认证接口）
  async fetchProjects() {
    this.setData({ loading: true, loadError: '' })
    const app = getApp()

    const res = await app.mpGetAuth('/mp/user/project/list').catch(err => null)

    if (!res || res.isSuccess !== 1) {
      this.setData({
        loadError: res?.errorMsg || '获取项目失败',
        projects: [],
        filteredList: [],
        loading: false
      })
      return
    }

    const list = res.result || []
    const currentProjectId = this.data.currentProjectId
    const projects = Array.isArray(list)
      ? list.map(p => ({
          ...p,
          id: p.id != null ? String(p.id) : p.id,
          selected: currentProjectId != null && String(p.id) === String(currentProjectId)
        }))
      : []

    this.setData({ projects, filteredList: projects, loading: false })

    // 默认选中当前项目
    if (currentProjectId) {
      const found = projects.find(p => String(p.id) === String(currentProjectId))
      if (found) {
        this.setData({ selectedId: currentProjectId })
      }
    } else if (projects.length === 1) {
      this.selectProjectById(projects[0].id)
    }
  },

  // 确认切换
  async onConfirm() {
    if (this.data.selectedId == null) {
      this.showToast('请选择项目')
      return
    }

    // 如果选的就是当前项目，直接返回
    if (String(this.data.selectedId) === String(this.data.currentProjectId)) {
      wx.navigateBack()
      return
    }

    this.setData({ submitting: true })
    const app = getApp()

    const res = await app.mpPostAuth('/mp/user/project/switch', {
      projectId: String(this.data.selectedId)
    }).catch(err => null)

    if (!res || res.isSuccess !== 1) {
      this.showToast(res?.errorMsg || '切换失败')
      this.setData({ submitting: false })
      return
    }

    const token = res.result?.accessToken
    if (!token) {
      this.showToast('未返回令牌')
      this.setData({ submitting: false })
      return
    }

    // 更新 token 和项目信息
    app.setLoginInfo({ token, userInfo: res.result?.userData ?? res.result })

    // 找到选中的项目对象并保存
    const selectedProject = this.data.projects.find(p => String(p.id) === String(this.data.selectedId))
    if (selectedProject) {
      app.setProjectInfo({ ...selectedProject })
    }

    // 保存租户信息（如果有）
    if (res.result?.tenantVO) {
      app.setTenantInfo({
        id: res.result.tenantVO.tenantId,
        name: res.result.tenantVO.tenantName,
        tenantKind: res.result.tenantVO.tenantKind
      })
    }

    this.showToast('切换成功')
    setTimeout(() => {
      wx.reLaunch({ url: '/pages/tab/work-order/index/index' })
    }, 600)
    this.setData({ submitting: false })
  }
})
