const app = getApp()

Page({
  data: {
    imageIndex: 0,
    imagePath: '../../images/triger-red.png',
    imagePaths: ['../../images/triger-red.png', '../../images/triger-blue.png', '../../images/triger-green.png'],
    chooseBarColor: { 'noun': 'white', 'mix': 'red'},
    // 选择的词汇类型 noun:全为名词， mix:出现的三个词中第二个为动词
    curVocabType: 'mix',
    curVocabs: [],
    vocabColors: [],
    vocabBaseColors: ['#DC143C', '#FF1493', '#C71585', '#FF00FF', '#8B008B', '#9400D3', '#4B0082', '#7B68EE', '#483D8B', '#0000FF', '#191970', '#00008B',
      '#1E90FF', '#2F4F4F', '#00FF7F', '#008080', '#2E8B57', '#32CD32', '#228B22', '#006400', '#556B2F', '#808000', '#FFD700',
      '#DAA520', '#FFA500', '#FF8C00', '#CD853F', '#D2691E', '#8B4513', '#FF4500', '#FF0000', '#8B0000', '#000000'],
    openid: '',

    // 当前名词和动词数目
    nounNum: 7418,
    verbNum: 4334,

    //当前被编辑过的输入框
    editInputIndex: -1,

    //临时数据
    queryResult: {}


  },
  randInt: function (max) {
    // 0<=Math.random()<1
    return Math.floor(Math.random() * max)
  },
  addVocabColor: function(vocabs){
    var vocabBaseColors = this.data.vocabBaseColors;
    var maxIndex = vocabBaseColors.length;
    var curVocabs = [];
    for(var i=0; i < vocabs.length; i ++){
      curVocabs.push({ 'text': vocabs[i], 'color': vocabBaseColors[this.randInt(maxIndex)]});
    }
    return curVocabs

  },
  getVocabId: function (vocabName) {
    var totalNum = this.data.nounNum
    if (vocabName == 'verb') {
      totalNum = this.data.verbNum
    }
    return {'_id': vocabName + '_' + (this.randInt(totalNum) + 1).toString()}

  },
  onLoad: function () {

    // 获取openid
    if (app.globalData.openid) {
      this.setData({
        openid: app.globalData.openid
      })
    }
    this.setData({
      curVocabs: this.addVocabColor(['', '', ''])
    });
    this.change();

  },

  onAdd: function () {
    const db = wx.cloud.database()
    db.collection('counters').add({
      data: {
        count: 1
      },
      success: res => {
        // 在返回结果中会包含新创建的记录的 _id
        this.setData({
          counterId: res._id,
          count: 1
        })
        wx.showToast({
          title: '新增记录成功',
        })
        console.log('[数据库] [新增记录] 成功，记录 _id: ', res._id)
      },
      fail: err => {
        wx.showToast({
          icon: 'none',
          title: '新增记录失败'
        })
        console.error('[数据库] [新增记录] 失败：', err)
      }
    })
  },
  onQuery: function () {
    // 若选择的是混合模式，则第二个为动词
    var ids = [this.getVocabId('noun')];
    if (this.data.curVocabType == 'mix'){
      ids.push(this.getVocabId('verb'))
    } else{
      ids.push(this.getVocabId('noun'))

    }
    ids.push(this.getVocabId('noun'))
    console.log(ids);
    const db = wx.cloud.database(); //{env: '环境ID'}
    const _ = db.command;
    db.collection('vocabs').where(_.or(ids)).get({
      success: res => {
        console.log('[数据库] [查询记录] 成功: ', res.data)
        var data = res.data
        if (data.length != 3) {
          console.log('query vocabs is null')
          return
        }
        // 返回顺序verb成了最后一个，需要调整
        if (data[2]._id.indexOf("verb") >= 0){
          var tmp = data[2].text;
          data[2].text =  data[1].text;
          data[1].text = tmp;
        }
        //确保有3个
        while (data.length < 3){
          // 注意 -1 为undefined，只能取目前数组的最后一个
          data.push(data[data.length - 1])
        }

        var vocabs = [];
        for (var i=0; i < this.data.curVocabs.length; i++){
          if (i == this.data.editInputIndex){
            vocabs.push(this.data.curVocabs[i].text)
          }else{
            vocabs.push(data[i].text)
          }
        }
        this.setData({
          curVocabs: this.addVocabColor(vocabs)
        })
      },
      fail: err => {
        wx.showToast({
          icon: 'none',
          title: '查询记录失败'
        })
        console.error('[数据库] [查询记录] 失败：', err)
      }
    })
  },

  
  change: function(){
    var index = this.data.imageIndex; // 获取状态
    var imagePaths = this.data.imagePaths;
    index = index + 1;
    if (index == 3){
      index = 0;
    }
    this.onQuery();
    this.setData({
      imageIndex: index, // 改变状态
      imagePath: imagePaths[index]
    })
  },
  chooseNoun: function(){
    this.setData({
      chooseBarColor: { 'noun': 'red', 'mix': 'white' },
      curVocabType: 'noun'
    })
  },
  chooseMix: function () {
    this.setData({
      chooseBarColor: { 'noun': 'white', 'mix': 'red' },
      curVocabType: 'mix'
    })
  },

  inputChangeHandle: function(e){
    let value = e.detail.value.replace(/^\s+|\s+$/g, "");
    var index = e.target.dataset.index;
    var editInputIndex = this.data.editInputIndex;
    if (value != ""){
      editInputIndex = index
    }else{
      editInputIndex = -1
    }
    var curVocabs = this.data.curVocabs
    for (var i = 0; i < curVocabs.length; i++){
      if (i == index){
        curVocabs[i] = {'text': value, 'color': curVocabs[i].color};
      }
    }
    console.log(curVocabs)
    this.setData({
      editInputIndex: editInputIndex,
      curVocabs: curVocabs
    })
  }

  



})
