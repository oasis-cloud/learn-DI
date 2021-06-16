// 可注入的 class
export function InjectableClass(): Function {
    return makeConstructorInjectable
}
// 可注入的属性
export function InjectProperty(dependencyId: string): Function {
    return (prototype: any, propertyName: string): void => {
        if (prototype.__injections__) {
            prototype.__injections = [];
        }
        prototype.__injections__.push([propertyName, dependencyId])
    }
}
// 代理可注入的 calss 返回 代理对象
function makeConstructorInjectable(origConstructor: Function): Function {
    if (!origConstructor.prototype.__injections__) {
        origConstructor.prototype.__injections__ = []
    }
    const proxyHandler = {
        construct(target: any, args: any[], newTarget: any) {
            const obj = Reflect.construct(target, args, newTarget)
            try {
                const injections = origConstructor.prototype.__injections__
                resolvePropertyDependencies(obj, injections)
            } catch (err) {
                throw err
            }
            return obj
        }
    }
    return new Proxy(origConstructor, proxyHandler)
}
// 解析属性注入的依赖，使用单例模式注入
function resolvePropertyDependencies(obj: any, injections: any[]): void {
    if (injections) {
        for (const injection of injections) {
            const dependencyId = injection[1]
            const singleton = instantiateSingleton(dependencyId)
            if (!singleton) {
                throw new Error(`Failed to insttantiate singleton ${dependencyId}`)
            }
            const propertyName = injection[0]
            obj[propertyName] = singleton
        }
    }
}

// 单例模式注入的辅助方法
const singletonConstructors = new Map<string, Function>()
const instantiatedSingletons = new Map<string, any>()

export function instantiateSingleton<T = any>(dependencyId:string):T {
    try {
        const existingSingleton = instantiatedSingletons.get(dependencyId)
        if(existingSingleton) {
            return existingSingleton
        }

        const singletonConstructor = singletonConstructors.get(dependencyId)
        if(!singletonConstructor) {
            const msg = `No constructor found for singleton ${dependencyId}`
            throw new Error(msg)
        }

        const instantiatedSingleton = Reflect.construct(makeConstructorInjectable(singletonConstructor), [])
        instantiatedSingletons.set(dependencyId, instantiatedSingleton)
        return instantiatedSingleton

    }catch (err) {
        console.error("Failed to instantiate singleton " + dependencyId);
        console.error(err && err.stack || err);
        throw err;
    }
}
// 注册管理
export function registerSingleton(dependencyId: string, singleton: any): void {
    instantiatedSingletons.set(dependencyId, singleton);
}

export function InjectableSingleton(dependencyId: string):Function {
    return (target: Function):void => {
        singletonConstructors.set(dependencyId, target)
    }
}
