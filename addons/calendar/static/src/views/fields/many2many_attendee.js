/** @odoo-module **/

import { registry } from "@web/core/registry";
import {
    Many2ManyTagsAvatarField,
    many2ManyTagsAvatarField,
} from "@web/views/fields/many2many_tags_avatar/many2many_tags_avatar_field";

export class Many2ManyAttendee extends Many2ManyTagsAvatarField {
    get tags() {
        const { partner_ids: partnerIds } = this.props.record.preloadedData;
        const tags = super.tags.map((tag) => {
            const partner = partnerIds.find((partner) => tag.resId === partner.id);
            if (partner) {
                tag.imageClass = `o_attendee_border o_attendee_border_${partner.status}`;
            }
            return tag;
        });

        const organizer = partnerIds.find((partner) => partner.is_organizer);
        if (organizer) {
            const orgId = organizer.id;
            // sort elements according to the partner id
            tags.sort((a, b) => {
                const a_org = a.resId === orgId;
                return a_org ? -1 : 1;
            });
        }
        return tags;
    }
}

export const many2ManyAttendee = {
    ...many2ManyTagsAvatarField,
    component: Many2ManyAttendee,
    additionalClasses: ["o_field_many2many_tags_avatar", "w-100"],
    legacySpecialData: "_fetchSpecialAttendeeStatus",
};

registry.category("fields").add("many2manyattendee", many2ManyAttendee);

export function preloadMany2ManyAttendee(orm, record, fieldName, { context }) {
    return orm.call(
        "res.partner",
        "get_attendee_detail",
        [record.data[fieldName].records.map((rec) => rec.resId), [record.resId || false]],
        {
            context,
        }
    );
}

registry.category("preloadedData").add("many2manyattendee", {
    loadOnTypes: ["many2many"],
    preload: preloadMany2ManyAttendee,
});
