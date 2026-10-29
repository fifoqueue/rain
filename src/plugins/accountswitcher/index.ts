import { after } from "@api/patcher";
import { findByProps, findByStoreName } from "@metro";
import { definePlugin } from "@plugins";
import { Developers } from "@rain/Developers";

const AccountDispatcher = findByProps("getCanUseMultiAccountMobile");
const MultiAccountStore = findByStoreName("MultiAccountStore");
const patches: (() => boolean)[] = [];
let notificationsDescriptor: PropertyDescriptor | undefined;

export default definePlugin({
    name: "AccountSwitcher",
    description: "Enables account switcher because discord got rid of experiment",
    author: [Developers.John, Developers.cocobo1],
    id: "accountswitcher",
    version: "1.1.0",
    start() {
        patches.push(
            after("getCanUseMultiAccountMobile", AccountDispatcher, () => {
                return true;
            }),
        );

        notificationsDescriptor = Object.getOwnPropertyDescriptor(MultiAccountStore, "canUseMultiAccountNotifications");
        Object.defineProperty(MultiAccountStore, "canUseMultiAccountNotifications", {
            get: () => true,
            configurable: true,
        });
    },
    stop() {
        for (const unpatch of patches.splice(0).reverse()) unpatch();
        if (notificationsDescriptor) Object.defineProperty(MultiAccountStore, "canUseMultiAccountNotifications", notificationsDescriptor);
        else delete (MultiAccountStore as any).canUseMultiAccountNotifications;
    }
});
