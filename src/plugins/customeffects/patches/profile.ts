import { after } from "@api/patcher";
import { findByFilePath, findByProps } from "@metro";

import { customEffects, userEffectData,userEffects } from "./effects";

const ProfileEffects = findByProps("getProfileEffects", "getProfileEffectsFromCategories");
const UseProfileEffect = findByFilePath("modules/collectibles/profile_effects/useProfileEffect.tsx");

export const patchGetUserProfile = () =>
    after("getUserProfile", findByProps("getUserProfile"), (_args: unknown[], profile: any | undefined) => {
        if (!profile) return profile;

        const customEffect = userEffectData[profile.userId];
        if (!customEffect) return profile;

        profile.profileEffect = { skuId: customEffect.skuId };
        return profile;
    });

export const patchGetAllProfileEffects = () =>
    after("getProfileEffects", ProfileEffects, (_args: unknown[], effects: any[]) => {
        const known = new Set(effects.map(effect => effect.skuId));
        effects.push(...[...Object.values(customEffects), ...userEffects].filter(effect => !known.has(effect.skuId)));
        return effects;
    });

export const patchGetProfileEffect = () =>
    after("default", UseProfileEffect, (args: unknown[], effect: any | undefined) => {
        if (effect) return effect;
        const id = args[0] as string;

        if (customEffects[id]) return customEffects[id];

        const userEffect = userEffects.find(e => e.skuId === id);
        return userEffect ?? effect;
    });
