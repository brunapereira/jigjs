import {Container, DIInjectionToken, DIRegistration} from "./di";
import {componentFactoryFor, JigWindow, RehydrateService} from "../components/component";

export type ModuleProvider<T> = DIRegistration<T> & { provide: DIInjectionToken<T> };

interface JigModuleProps {
    components?: any[];
    providers?: ModuleProvider<any>[];
    modules?: JigModule[];
}

type RegistrationCallback = (container: Container) => JigModule;

export class JigModule {
    private readonly registrationCallbacks: RegistrationCallback[];

    constructor(private readonly props: JigModuleProps = {}) {
        this.registrationCallbacks = [];
    }

    register(window: JigWindow, container) {
        this.props.modules?.forEach((module) => {
            module.register(window, container);
        });

        this.props.providers?.forEach((provider) => {
            container.register(provider.provide, provider as any);
        });

        this.props.components?.forEach((component) => {
            container.register(component, component);
            componentFactoryFor(component).registerComponent(window, container);
        });

        this.registrationCallbacks.forEach((callback) => {
            callback(container).register(window, container);
        });
    }

    andThen(afterRegistration: (container) => JigModule) {
        this.registrationCallbacks.push(afterRegistration);
        return this;
    }
}
