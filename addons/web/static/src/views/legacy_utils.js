/** @odoo-module **/
import fieldRegistry from "web.field_registry";
import { parseArch } from "web.viewUtils";
import { parse } from "web.field_utils";
import { traverse } from "web.utils";

import { serializeDate, serializeDateTime } from "@web/core/l10n/dates";

const { date: parseDate, datetime: parseDateTime } = parse;

export function mapWowlValueToLegacy(value, type) {
    switch (type) {
        case "date":
            // from luxon to moment
            return value ? parseDate(serializeDate(value), null, { isUTC: true }) : false;
        case "datetime":
            // from luxon to moment
            return value ? parseDateTime(serializeDateTime(value), null, { isUTC: true }) : false;
        case "many2one":
            return value ? { id: value[0], display_name: value[1] } : false;
        case "reference":
            return value
                ? { id: value.resId, display_name: value.displayName, model: value.resModel }
                : false;
        case "one2many":
        case "many2many":
            if (value.operation === "REPLACE_WITH") {
                return { operation: "REPLACE_WITH", ids: value.resIds };
            }
            return value;
        default:
            return value;
    }
}

export function mapViews(views, env) {
    const res = {};
    for (const [viewType, viewDescr] of Object.entries(views || {})) {
        const arch = parseArch(viewDescr.__rawArch);
        traverse(arch, function (node) {
            if (typeof node === "string") {
                return false;
            }
            node.attrs.modifiers = node.attrs.modifiers ? JSON.parse(node.attrs.modifiers) : {};
            return true;
        });
        // the basic model expects the former shape of load_views result, where we don't know
        // all co-model fields, only those in the subview, so we filter the fields here
        const fields = {};
        for (const f in viewDescr.activeFields) {
            fields[f] = viewDescr.fields[f];
        }
        res[viewType] = {
            arch,
            fields,
            type: viewType,
            fieldsInfo: mapActiveFieldsToFieldsInfo(viewDescr.activeFields, fields, viewType, env),
        };
        for (const fieldName in res[viewType].fieldsInfo[viewType]) {
            if (!res[viewType].fields[fieldName]) {
                res[viewType].fields[fieldName] = {
                    name: fieldName,
                    type: res[viewType].fieldsInfo[viewType][fieldName].type,
                };
            }
        }
    }
    return res;
}

export function mapActiveFieldsToFieldsInfo(activeFields, fields, viewType, env) {
    const fieldsInfo = {};
    fieldsInfo[viewType] = {};
    for (const [fieldName, fieldDescr] of Object.entries(activeFields)) {
        const views = mapViews(fieldDescr.views, env);
        let Widget;
        if (fieldDescr.widget) {
            Widget = fieldRegistry.getAny([`${viewType}.${fieldDescr.widget}`, fieldDescr.widget]);
        } else {
            Widget = fieldRegistry.getAny([
                `${viewType}.${fields[fieldName].type}`,
                fields[fieldName].type,
            ]);
        }
        Widget = Widget || fieldRegistry.get("abstract");
        let domain;
        if (fieldDescr.domain) {
            domain = fieldDescr.domain.toString();
        }
        let mode = fieldDescr.viewMode;
        if (mode && mode.split(",").length !== 1) {
            mode = env.isSmall ? "kanban" : "list";
        }
        const fieldInfo = {
            Widget, // remove this when we no longer support legacy fields inside wowl views
            specialData: fieldDescr.field && fieldDescr.field.legacySpecialData,
            domain,
            context: fieldDescr.context,
            fieldDependencies: [], // ??
            force_save: fieldDescr.forceSave,
            mode,
            modifiers: fieldDescr.modifiers,
            name: fieldName,
            options: fieldDescr.options,
            views,
            widget: fieldDescr.widget,
            __WOWL_FIELD_DESCR__: fieldDescr,
        };

        if (fieldDescr.field && fieldDescr.field.limit) {
            fieldInfo.limit = fieldDescr.field.limit;
        }

        if (fieldDescr.modifiers && fieldDescr.modifiers.invisible === true) {
            fieldInfo.__no_fetch = true;
        }

        if (!fieldInfo.__no_fetch && fieldDescr.field && fieldDescr.field.relatedFields) {
            let relatedFields = fieldDescr.field.relatedFields;
            if (relatedFields instanceof Function) {
                relatedFields = relatedFields(fieldInfo.__WOWL_FIELD_DESCR__);
            }
            relatedFields = Object.fromEntries(relatedFields.map((f) => [f.name, f]));
            fieldInfo.relatedFields = { ...relatedFields };
            fieldInfo.viewType = "default";
            const defaultView = {};
            for (const fieldName of Object.keys(relatedFields)) {
                defaultView[fieldName] = {};
                if (fieldDescr.relatedFields[fieldName]) {
                    defaultView[fieldName].__WOWL_FIELD_DESCR__ =
                        fieldDescr.relatedFields[fieldName];
                }
            }
            fieldInfo.fieldsInfo = { default: defaultView };
        }
        if (fieldDescr.views && fieldDescr.views[fieldDescr.viewMode]) {
            fieldInfo.limit = fieldDescr.views[fieldDescr.viewMode].limit || 40;
            fieldInfo.orderedBy = fieldDescr.views[fieldDescr.viewMode].defaultOrder;
        }
        if (fieldDescr.onChange && !fields[fieldName].onChange) {
            fields[fieldName].onChange = "1";
        }
        // FIXME? FieldWidget in kanban undefined
        fieldsInfo[viewType][fieldName] = fieldInfo;
    }
    return fieldsInfo;
}
