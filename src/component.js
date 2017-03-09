// 自定义一些类似微信系统方法
const is = require("./is")
const extend = require("./extend")
const originPage = Page

function noop() {}

function isEventFn(name, value) {
	return /^on/.test(name) && is.fn(value)
}

// 封装下微信的Page方法
function _Page(origin) {

  // 加载的组件列表
  let needs = origin.components
  let childrens = {}

  // 创建新的config
  let config = {
  	data: {}
  }

  if (!needs) {
    return originPage(origin)
  }

  // components.forEach()
  for (let item in needs) {
    let props = needs[item] || {}
    let component = new Component(require(`../components/${item}/index`))
    let componentConfig = component.config

    // 合并components的props
    component.setProps(props)

    childrens[item] = component

    // 传递组件的方法等自定义字段
    extend(true, config, origin, componentConfig)

    // 把props传给data
    extend(component.data, component.props)

    // 生成组件特有的data
    config.data[item] = {}
    extend(true, config.data[item], component.data)

    // 传递组件的data
    extend(true, config.data, origin.data)

    // 合并组件的事件function
    // 只有on[fnName]才合并
    for (let prop in componentConfig) {
      if (isEventFn(prop, componentConfig[prop])) {
        if (prop in origin) {
          config[prop] = function() {

            component.parent || component.setParent(this)

            componentConfig[prop].apply(this, arguments)
            origin[prop].apply(this, arguments)
          }
        }
      }

      if ("methods" == prop) {
        for (let fnName in componentConfig[prop]) {
          config[fnName] = componentConfig[prop][fnName].bind(component)
        }
      }
    }

    component.name || component.setName(item)
  }

  // 把组件方法传给`childrens`
  extend(config, {
    childrens
  })

  return originPage(config)
}

// 定义组件
// 构造函数形式创建
// 防止同一个组件多个应用出现重复更新的问题
function Component(config) {

  for (let name in config) {
    this[name] = config[name]
  }

  config.onLoad = config.onLoad || config.attached || noop
  config.onUnload = config.onUnload || config.detached || noop

  this.data = this.data || {}
  this.config = config

  this.setMethods(config.methods)
}

Component.prototype = {
  constructor: Component,
  setData(data) {
    let name = this.name
    let parent = this.parent
    let _data = parent.data[name]
    let mergeData = extend(true, _data, data)
    let newData = {}

    newData[name] = mergeData
    this.data = mergeData
    parent.setData(newData)
  },
  setProps(props) {
    this.props = extend(this.props, props)
  },
  setName(name) {
    this.name = name
  },
  setParent(parent) {
    this.parent = parent
  },
  setMethods(methods) {
    for (let name in methods) {
      this[name] = methods[name]
    }
  }
}

// 重新定义微信内置的Page
Page = function(config) {
  return _Page(config)
}

module.exports = {
  originPage,
	Page,
  Component
}