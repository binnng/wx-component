// 自定义一些类似微信系统方法
const is = require("./is")
const extend = require("./extend")
const originalPage = Page

const EVNET_LIST = [
  "onLoad",
  "onUnload"
]
const COMPONENT_KEYS = [
  "name",
  "data",
  "props",
  "onLoad",
  "onUnload",
  "methods"
]

function noop() {}

class WPage {

  constructor(origin) {

    this.origin = origin
    this.config = {
      data: {}
    }
    this.childrens = {}
    this.childrensEvents = {}

    let needs = this.needs = origin.components

    if (!needs) {
      return originalPage(origin)
    }

    for (let item in needs) {
      let props = needs[item] || {}
      let component = new Component(require(`../components/${item}/index`))

      component.name || component.setName(item)

      this.setChildProps(component, props)
      this.pushChild(item, component)

      this.mergeData(item, component)
      this.mergeMethods(item, component)
      this.mergeChildEvents(item, component)
    }

    this.setChildrens()
    this.mergePageEvent()

    return originalPage(this.config)
  }

  pushChild(name, component) {
    this.childrens[name] = component
  }

  setChildProps(component, props) {
    for (let key in props) {
      let val = props[key]
      if (is.fn(val)) {
        props[key] = val.bind(component)
      }
    }
    component.setProps(props)
  }

  mergeMethods(item, component) {
    for (let fnName in component.methods) {
      this.config[fnName] = component.methods[fnName].bind(component)
    }
  }

  mergeData(item, component) {
    let config = this.config
    let origin = this.origin

    // 传递组件的方法等自定义字段
    extend(true, config, origin, component.config)

    // 把props传给data
    extend(component.data, component.props)

    // 传递组件的data
    // 如果data中有组件名属性，报个错
    if (item in config.data || item in origin.data) {
      throw Error(`You need rename "${item}" in data, because it is the name of Component`);
    }
    extend(true, config.data, origin.data)

    // 生成组件特有的data
    config.data[item] = {}
    extend(true, config.data[item], component.data)
  }

  // 合并组件的事件
  mergeChildEvents(item, component) {
    let childrensEvents = this.childrensEvents
    childrensEvents[item] = {}
    EVNET_LIST.forEach((prop) => {
      childrensEvents[item][prop] = component.config[prop]
    })
  }

  // 把组件的事件合并到page里
  mergePageEvent() {
    let that = this
    EVNET_LIST.forEach((prop) => {
      that.config[prop] = function() {
        for (let item in that.needs) {
          let component = that.childrens[item]
          // 给组件注册parent
          if ("onLoad" == prop) {
            component.setParent(this)
          }
          that.childrensEvents[item][prop].apply(component, arguments)
        }
        that.origin[prop] && that.origin[prop].apply(this, arguments)
      }
    })
  }

  // 把组件方法传给`childrens`
  setChildrens() {
    this.config.childrens = this.childrens
  }

}

// 定义组件
// 防止同一个组件多个应用出现重复更新的问题
class Component {

  constructor(config) {

    for (let name in config) {
      if (!~COMPONENT_KEYS.join("|").indexOf(name)) this[name] = config[name]
    }

    config.onLoad = config.onLoad || noop
    config.onUnload = config.onUnload || noop

    this.data = config.data || {}
    this.config = config
    this.methods = config.methods || {}

    this.setMethods(config.methods)
  }

  setData(data) {
    let name = this.name
    let parent = this.parent
    let _data = parent.data[name]
    let mergeData = extend(true, _data, data)
    let newData = {}

    newData[name] = mergeData
    this.data = mergeData
    parent.setData(newData)
  }

  setProps(props) {
    this.props = extend(this.props, props)
  }

  setName(name) {
    this.name = name
  }

  setParent(parent) {
    this.parent = parent
  }

  setMethods(methods) {
    for (let name in methods) {
      this[name] = methods[name]
    }
  }
}

// 重新定义微信内置的Page
Page = function(config) {
  return new WPage(config)
}

module.exports = {
  originalPage,
  Page,
  Component
}
