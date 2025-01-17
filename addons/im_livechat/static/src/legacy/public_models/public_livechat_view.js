/** @odoo-module **/

import PublicLivechatView from "@im_livechat/legacy/widgets/public_livechat_view/public_livechat_view";

import { attr, one, Model } from "@im_livechat/legacy/model";

Model({
    name: "PublicLivechatView",
    lifecycleHooks: {
        _created() {
            this.update({
                widget: new PublicLivechatView(this, this.messaging, { displayMarkAsRead: false }),
            });
        },
        _willDelete() {
            this.widget.destroy();
        },
    },
    fields: {
        publicLivechatWindowOwner: one("PublicLivechatWindow", {
            identifying: true,
            inverse: "publicLivechatView",
        }),
        widget: attr(),
    },
});
