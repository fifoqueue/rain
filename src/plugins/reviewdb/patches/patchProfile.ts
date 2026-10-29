import { after } from "@api/patcher";
import { getComponentPatchTarget } from "@api/react/patchTarget";
import { findInReactTree } from "@lib/utils";
import { findByTypeName } from "@metro";
import { React } from "@metro/common";

import ReviewSection from "../components/ReviewSection";

let UserProfile = findByTypeName("UserProfile");
if (UserProfile === undefined)
    UserProfile = findByTypeName("UserProfileContent");

export default () =>
    after(...getComponentPatchTarget({ component: UserProfile }, "component"), (args, ret) => {
        const profileSections = findInReactTree(
            ret,
            r =>
                r?.type?.displayName === "View" &&
                // UserProfileBio still exists even when the user has no bio. Yep.
                Array.isArray(r?.props?.children) && r.props.children.findIndex(
                    (i: any) =>
                        i?.type?.name === "UserProfileBio" ||
                        i?.type?.name === "UserProfileAboutMeCard",
                ) !== -1,
        )?.props?.children;

        let userId = args[0]?.userId;
        if (userId === undefined) userId = args[0]?.user?.id;

        profileSections?.push(React.createElement(ReviewSection, { userId }));
    });
