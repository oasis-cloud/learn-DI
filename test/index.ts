import {InjectableSingleton, registerSingleton} from "../src";
import {IToast, ToastService} from "./ToastService";

// 手动注入
// registerSingleton("IToast", new ToastService());

// 自动注入
@InjectableSingleton("IToast")
export class Toast implements IToast {
    // ...
    id
}
