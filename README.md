wx-component
========

一种微信小程序组件化解决方案

### 使用

#### 拷贝文件
拷贝`src`路径下的所有文件到项目里，例如到`libs/`目录下

#### 引用

在`app.js`中引用`wx-component`组件

**app.js**

```
require("/libs/wx-component/index")
...

App({
	onLaunch() {

  },
  globalData: {
    ...
  }
})
```

### 推荐的目录结构

```
├─project                小程序前端
  ├─components           业务功能组件
    ├─login              登录组件
      ├─index.wxss
      ├─index.wxml
      ├─index.js
  ├─pages                小程序页面
```

### 定义component

**/components/login/index.js**

```
module.exports = {
  // 组件名
  // 也可以不填，不填写会用`components/X/index.js`中的X命名
  name: "login",

  // 组件私有数据
  data: {
    item: [1, 2, 3]
  },

  // 组件属性
  // 可以预先定义默认值
  // 也可以外部传入覆盖默认值
  props: {
    text: "start"
  },

  // 当组件被加载
  onLoad() {
    this.setData({
      is_loaded: true
    })
  },
  // 当组件被卸载
  onUnload() {
    this.setData({
      is_unloaded: true
    })
  },

  // 组件私有方法
  methods: {
    getMsg() {
      ...
    },
    sendMsg() {
      ...
    }
  },

  // 其他
  ....
}
```

### JS中注册component

**/components/grabRedPacket/index.js**

```
Page({
  data: {
   state: 1
  },
  components: {
   login: {
     text: "start from parent",
     onLogin() {
     	  ...
     }
   }
  },
  onShow() {
    ...
  }
  ...
})
```

### WXML中引入component

**/components/grabRedPacket/index.wxml**
**注意 template 便签中的两处 data需要固定写 `{{...componentName}}`**

```
<import src='../../components/login/index.wxml'/>

<view>
  <template is="login" data="{{...login}}"></template>
</view>
```

### app.wxss中引入component

**/app.wxss**

```
@import "../../components/login/index.wxss";
```

**命名规范**
组件最外层的`className`用双下划线开头的命名空间，如：`__login`。

### API

#### Page依赖组件
每次组件被依赖，都会实例化(new)一个`Component`，防止被多次依赖不停修改。

#### Page的`childrens`
每个Page如果依赖组件，都有一个`childrens`属性，组件的集合。

```
Page({
  components: {
    login: {}
  },
  onShow() {
    console.log(this.childrens) // {login: ....}
  }
})
```

#### 组件的`parent`方法
**components/login/index.js**
```
module.exports = {
  data: {
    text: "start"
  },
  props: {
    ...
  },
  attached() {
    console.log(this.parent) // Page
  }
}

```

**pages/index/index.js**
```
module.exports = {
  data: {}
  components: {
    login: {
      ...
    }
  }
}
```

#### 组件的`setData`方法
每个被实例化的组件都有自己的`setData`方法，只能设置自身的data，不能改变父级Page的data，如：

```
Page({
  components: {
    login: {}
  },
  onShow() {
    this.childrens.login.setData({
      text: "start"
    })
  }
})
```

#### Page的`data`
Page的data结构：

```
data: {
  // Page自身的data
  state: "index",
  // 组件的data
  login: {
    text: "state"
  },
  another_component: {
    text: "state"
  }
}
```

### 注意
不管是 page 的 data 或是 component 的 data，都不要出现和组件名一样的字段，例如：存在一个叫`banner`的组件，那么都不要存在如下的data结构：

```
Page{
	data: {
	  banner: "...."
  }
}
```

因为banner字段是留给组件的，不要自定义它，否则会被组件data覆盖。

