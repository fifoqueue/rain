interface SemanticReference {
    type: "color" | "raw";
    value: string;
    opacity?: number;
}

interface BackgroundDefinition {
    url: string;
    blur?: number;
    opacity?: number;
}

export interface RainColorManifest extends RainManifest {
    spec: 3;
    main: {
        type: "dark" | "light";
        semantic?: Record<string, string | SemanticReference>;
        raw?: Record<string, string>;
        background?: BackgroundDefinition;
    }
}

export interface ThemeManifest {
    spec: 2;
    name: string;
    description?: string;
    authors?: Author[];
    semanticColors?: Record<string, (string | false)[]>;
    rawColors?: Record<string, string>;
    background?: {
        url: string;
        blur?: number;
        alpha?: number;
    };
}

/** @internal */
export interface InternalColorDefinition {
    spec: 1 | 2 | 3;
    reference: "darker" | "light";
    semantic: Record<string, {
        value: string;
        opacity: number;
    }>;
    raw: Record<string, string>;
    background?: BackgroundDefinition;
    display?: {
        name: string;
        description?: string;
        authors?: Author[];
    };
}

export interface EnmityColorManifest {
    spec?: 1;
    name: string;
    description?: string;
    authors?: Author[];
    theme_color_map?: Record<string, (string | false)[]>;
    colours?: Record<string, string>;
    colors?: Record<string, string>;
    unsafe_colors?: Record<string, string>;
    background?: BackgroundDefinition;
}

export type ColorManifest = RainColorManifest | ThemeManifest | EnmityColorManifest;

export type Author = { name: string, id?: `${bigint}`; };

export interface RainManifest {
    readonly id: string;
    readonly spec: number;
    readonly version: string;
    readonly type: string;
    readonly display: {
        readonly name: string;
        readonly description?: string;
        readonly authors?: Author[];
    };
    readonly main: unknown;
    readonly extras?: {
        readonly [key: string]: any;
    };
}
