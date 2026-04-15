const { mpUploadFile } = require('../../utils/request')

Component({
  properties: {
    // 已上传的文件URL列表
    fileList: {
      type: Array,
      value: [],
      observer(newVal) {
        this.setData({ internalFileList: newVal || [] })
      }
    },
    // 最大上传数量
    maxCount: {
      type: Number,
      value: 9
    },
    // 是否显示提示文字
    showText: {
      type: Boolean,
      value: true
    },
    // 提示文字
    placeholder: {
      type: String,
      value: '上传图片'
    }
  },

  data: {
    internalFileList: [],
    uploading: false
  },

  methods: {
    // 选择图片
    async onChooseImage() {
      const remaining = this.properties.maxCount - this.data.internalFileList.length
      
      if (remaining <= 0) {
        wx.showToast({ title: `最多上传${this.properties.maxCount}张图片`, icon: 'none' })
        return
      }

      const res = await wx.chooseMedia({
        count: remaining,
        mediaType: ['image'],
        sizeType: ['compressed'],
        sourceType: ['album', 'camera']
      })

      this.setData({ uploading: true })

      // 批量上传
      const uploadPromises = res.tempFiles.map(file => {
        return mpUploadFile(file.tempFilePath).then(uploadRes => {
          if (uploadRes && Number(uploadRes.isSuccess) === 1 && uploadRes.result) {
            return uploadRes.result.url || uploadRes.result.path
          }
          throw new Error('上传失败')
        })
      })

      const uploadedUrls = await Promise.all(uploadPromises)
      const newFileList = [...this.data.internalFileList, ...uploadedUrls]

      this.setData({ 
        internalFileList: newFileList,
        uploading: false
      })

      // 触发change事件
      this.triggerEvent('change', {
        fileList: newFileList
      })

      wx.showToast({ title: '上传成功', icon: 'success' })
    },

    // 删除图片
    onDeleteImage(e) {
      const index = e.currentTarget.dataset.index
      const newFileList = [...this.data.internalFileList]
      newFileList.splice(index, 1)

      this.setData({ internalFileList: newFileList })

      // 触发change事件
      this.triggerEvent('change', {
        fileList: newFileList
      })
    },

    // 预览图片
    onPreviewImage(e) {
      const url = e.currentTarget.dataset.url
      wx.previewImage({
        current: url,
        urls: this.data.internalFileList
      })
    },

    // 获取文件列表
    getFileList() {
      return this.data.internalFileList
    },

    // 清空文件列表
    clear() {
      this.setData({ internalFileList: [] })
      this.triggerEvent('change', {
        fileList: []
      })
    }
  }
})
