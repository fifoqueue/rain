/** Resolve the mutable render slot without assuming memo wraps forwardRef. */
export function getComponentPatchTarget(parent: any, key: string): [string, any] {
    let component = parent?.[key];

    while (component && typeof component === "object" && component.type) {
        parent = component;
        key = "type";
        component = component.type;
    }

    if (typeof component?.render === "function") return ["render", component];
    if (typeof component?.prototype?.render === "function") return ["render", component.prototype];
    if (typeof component === "function") return [key, parent];

    throw new Error(`Cannot patch React component at ${key}`);
}
