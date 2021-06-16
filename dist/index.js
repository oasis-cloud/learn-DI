"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InjectableSingleton = exports.registerSingleton = exports.instantiateSingleton = exports.InjectProperty = exports.InjectableClass = void 0;
// 可注入的 class
function InjectableClass() {
    return makeConstructorInjectable;
}
exports.InjectableClass = InjectableClass;
// 可注入的属性
function InjectProperty(dependencyId) {
    return function (prototype, propertyName) {
        if (prototype.__injections__) {
            prototype.__injections = [];
        }
        prototype.__injections__.push([propertyName, dependencyId]);
    };
}
exports.InjectProperty = InjectProperty;
// 代理可注入的 calss 返回 代理对象
function makeConstructorInjectable(origConstructor) {
    if (!origConstructor.prototype.__injections__) {
        origConstructor.prototype.__injections__ = [];
    }
    var proxyHandler = {
        construct: function (target, args, newTarget) {
            var obj = Reflect.construct(target, args, newTarget);
            try {
                var injections = origConstructor.prototype.__injections__;
                resolvePropertyDependencies(obj, injections);
            }
            catch (err) {
                throw err;
            }
            return obj;
        }
    };
    return new Proxy(origConstructor, proxyHandler);
}
// 解析属性注入的依赖，使用单例模式注入
function resolvePropertyDependencies(obj, injections) {
    if (injections) {
        for (var _i = 0, injections_1 = injections; _i < injections_1.length; _i++) {
            var injection = injections_1[_i];
            var dependencyId = injection[1];
            var singleton = instantiateSingleton(dependencyId);
            if (!singleton) {
                throw new Error("Failed to insttantiate singleton " + dependencyId);
            }
            var propertyName = injection[0];
            obj[propertyName] = singleton;
        }
    }
}
// 单例模式注入的辅助方法
var singletonConstructors = new Map();
var instantiatedSingletons = new Map();
function instantiateSingleton(dependencyId) {
    try {
        var existingSingleton = instantiatedSingletons.get(dependencyId);
        if (existingSingleton) {
            return existingSingleton;
        }
        var singletonConstructor = singletonConstructors.get(dependencyId);
        if (!singletonConstructor) {
            var msg = "No constructor found for singleton " + dependencyId;
            throw new Error(msg);
        }
        var instantiatedSingleton = Reflect.construct(makeConstructorInjectable(singletonConstructor), []);
        instantiatedSingletons.set(dependencyId, instantiatedSingleton);
        return instantiatedSingleton;
    }
    catch (err) {
        console.error("Failed to instantiate singleton " + dependencyId);
        console.error(err && err.stack || err);
        throw err;
    }
}
exports.instantiateSingleton = instantiateSingleton;
// 注册管理
function registerSingleton(dependencyId, singleton) {
    instantiatedSingletons.set(dependencyId, singleton);
}
exports.registerSingleton = registerSingleton;
function InjectableSingleton(dependencyId) {
    return function (target) {
        singletonConstructors.set(dependencyId, target);
    };
}
exports.InjectableSingleton = InjectableSingleton;
