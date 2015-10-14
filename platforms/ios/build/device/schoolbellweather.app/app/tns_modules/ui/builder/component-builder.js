var observable = require("data/observable");
var dockLayoutDef = require("ui/layouts/dock-layout");
var gridLayoutModule = require("ui/layouts/grid-layout");
var absoluteLayoutDef = require("ui/layouts/absolute-layout");
var types = require("utils/types");
var fs = require("file-system");
var gestures = require("ui/gestures");
var bindingBuilder = require("ui/builder/binding-builder");
var platform = require("platform");
var UI_PATH = "ui/";
var MODULES = {
    "TabViewItem": "ui/tab-view",
    "FormattedString": "text/formatted-string",
    "Span": "text/span",
    "ActionItem": "ui/action-bar",
    "NavigationButton": "ui/action-bar",
    "SegmentedBarItem": "ui/segmented-bar",
};
var ROW = "row";
var COL = "col";
var COL_SPAN = "colSpan";
var ROW_SPAN = "rowSpan";
var DOCK = "dock";
var LEFT = "left";
var TOP = "top";
exports.specialProperties = [
    ROW,
    COL,
    COL_SPAN,
    ROW_SPAN,
    DOCK,
    LEFT,
    TOP,
];
var eventHandlers = {};
function getComponentModule(elementName, namespace, attributes, exports) {
    var instance;
    var instanceModule;
    var componentModule;
    elementName = elementName.split("-").map(function (s) { return s[0].toUpperCase() + s.substring(1); }).join("");
    var moduleId = MODULES[elementName] || UI_PATH +
        (elementName.toLowerCase().indexOf("layout") !== -1 ? "layouts/" : "") +
        elementName.split(/(?=[A-Z])/).join("-").toLowerCase();
    try {
        if (types.isString(namespace)) {
            var pathInsideTNSModules = fs.path.join(fs.knownFolders.currentApp().path, "tns_modules", namespace);
            if (fs.Folder.exists(pathInsideTNSModules)) {
                moduleId = pathInsideTNSModules;
            }
            else {
                moduleId = fs.path.join(fs.knownFolders.currentApp().path, namespace);
            }
        }
        instanceModule = require(moduleId);
        var instanceType = instanceModule[elementName] || Object;
        instance = new instanceType();
    }
    catch (ex) {
        throw new Error("Cannot create module " + moduleId + ". " + ex + ". StackTrace: " + ex.stack);
    }
    if (instance && instanceModule) {
        var bindings = new Array();
        for (var attr in attributes) {
            var attrValue = attributes[attr];
            if (attr.indexOf(":") !== -1) {
                var platformName = attr.split(":")[0].trim();
                if (platformName.toLowerCase() === platform.device.os.toLowerCase()) {
                    attr = attr.split(":")[1].trim();
                }
                else {
                    continue;
                }
            }
            if (attr.indexOf(".") !== -1) {
                var subObj = instance;
                var properties = attr.split(".");
                var subPropName = properties[properties.length - 1];
                var i;
                for (i = 0; i < properties.length - 1; i++) {
                    if (types.isDefined(subObj)) {
                        subObj = subObj[properties[i]];
                    }
                }
                if (types.isDefined(subObj)) {
                    setPropertyValue(subObj, instanceModule, exports, subPropName, attrValue);
                }
            }
            else {
                setPropertyValue(instance, instanceModule, exports, attr, attrValue);
            }
        }
        eventHandlers = {};
        componentModule = { component: instance, exports: instanceModule, bindings: bindings };
    }
    return componentModule;
}
exports.getComponentModule = getComponentModule;
function setSpecialPropertyValue(instance, propertyName, propertyValue) {
    if (propertyName === ROW) {
        gridLayoutModule.GridLayout.setRow(instance, !isNaN(+propertyValue) && +propertyValue);
    }
    else if (propertyName === COL) {
        gridLayoutModule.GridLayout.setColumn(instance, !isNaN(+propertyValue) && +propertyValue);
    }
    else if (propertyName === COL_SPAN) {
        gridLayoutModule.GridLayout.setColumnSpan(instance, !isNaN(+propertyValue) && +propertyValue);
    }
    else if (propertyName === ROW_SPAN) {
        gridLayoutModule.GridLayout.setRowSpan(instance, !isNaN(+propertyValue) && +propertyValue);
    }
    else if (propertyName === LEFT) {
        absoluteLayoutDef.AbsoluteLayout.setLeft(instance, !isNaN(+propertyValue) && +propertyValue);
    }
    else if (propertyName === TOP) {
        absoluteLayoutDef.AbsoluteLayout.setTop(instance, !isNaN(+propertyValue) && +propertyValue);
    }
    else if (propertyName === DOCK) {
        console.log('set dock: ' + propertyName + ' -> ' + propertyValue);
        dockLayoutDef.DockLayout.setDock(instance, propertyValue);
    }
    else {
        return false;
    }
    return true;
}
exports.setSpecialPropertyValue = setSpecialPropertyValue;
function setPropertyValue(instance, instanceModule, exports, propertyName, propertyValue) {
    var isEventOrGesture = isKnownEventOrGesture(propertyName, instance);
    if (isBinding(propertyValue) && instance.bind) {
        if (isEventOrGesture) {
            attachEventBinding(instance, propertyName, propertyValue);
        }
        else {
            var bindOptions = bindingBuilder.getBindingOptions(propertyName, getBindingExpressionFromAttribute(propertyValue));
            instance.bind({
                sourceProperty: bindOptions[bindingBuilder.bindingConstants.sourceProperty],
                targetProperty: bindOptions[bindingBuilder.bindingConstants.targetProperty],
                expression: bindOptions[bindingBuilder.bindingConstants.expression],
                twoWay: bindOptions[bindingBuilder.bindingConstants.twoWay]
            }, bindOptions[bindingBuilder.bindingConstants.source]);
        }
    }
    else if (isEventOrGesture) {
        var handler = exports && exports[propertyValue];
        if (types.isFunction(handler)) {
            instance.on(propertyName, handler);
        }
    }
    else if (setSpecialPropertyValue(instance, propertyName, propertyValue)) {
    }
    else {
        var attrHandled = false;
        if (instance._applyXmlAttribute) {
            attrHandled = instance._applyXmlAttribute(propertyName, propertyValue);
        }
        if (!attrHandled) {
            var valueAsNumber = +propertyValue;
            if (!isNaN(valueAsNumber)) {
                instance[propertyName] = valueAsNumber;
            }
            else if (propertyValue && (propertyValue.toLowerCase() === "true" || propertyValue.toLowerCase() === "false")) {
                instance[propertyName] = propertyValue.toLowerCase() === "true" ? true : false;
            }
            else {
                instance[propertyName] = propertyValue;
            }
        }
    }
}
exports.setPropertyValue = setPropertyValue;
function attachEventBinding(instance, eventName, value) {
    eventHandlers[eventName] = function (args) {
        if (args.propertyName === "bindingContext") {
            var handler = instance.bindingContext && instance.bindingContext[getBindingExpressionFromAttribute(value)];
            if (types.isFunction(handler)) {
                instance.on(eventName, handler, instance.bindingContext);
            }
            instance.off(observable.Observable.propertyChangeEvent, eventHandlers[eventName]);
        }
    };
    instance.on(observable.Observable.propertyChangeEvent, eventHandlers[eventName]);
}
function isKnownEventOrGesture(name, instance) {
    if (types.isString(name)) {
        var evt = name + "Event";
        return instance.constructor && evt in instance.constructor ||
            gestures.fromString(name.toLowerCase()) !== undefined;
    }
    return false;
}
function getBindingExpressionFromAttribute(value) {
    return value.replace("{{", "").replace("}}", "").trim();
}
function isBinding(value) {
    var isBinding;
    if (types.isString(value)) {
        var str = value.trim();
        isBinding = str.indexOf("{{") === 0 && str.lastIndexOf("}}") === str.length - 2;
    }
    return isBinding;
}
