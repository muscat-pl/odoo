/** @odoo-module */

import { ProductScreen } from "@point_of_sale/js/Screens/ProductScreen/ProductScreen";
import { useService } from "@web/core/utils/hooks";
import { NumberPopup } from "@point_of_sale/js/Popups/NumberPopup";
import { ErrorPopup } from "@point_of_sale/js/Popups/ErrorPopup";
import { Component } from "@odoo/owl";
import { sprintf } from "@web/core/utils/strings";
import { usePos } from "@point_of_sale/app/pos_hook";

export class DiscountButton extends Component {
    static template = "DiscountButton";

    setup() {
        this.pos = usePos();
        this.popup = useService("popup");
    }
    async click() {
        var self = this;
        const { confirmed, payload } = await this.popup.add(NumberPopup, {
            title: this.env._t("Discount Percentage"),
            startingValue: this.pos.globalState.config.discount_pc,
            isInputSelected: true,
        });
        if (confirmed) {
            const val = Math.round(Math.max(0, Math.min(100, parseFloat(payload))));
            await self.apply_discount(val);
        }
    }

    async apply_discount(pc) {
        const { globalState } = this.pos;
        const order = globalState.get_order();
        const lines = order.get_orderlines();
        const product = globalState.db.get_product_by_id(globalState.config.discount_product_id[0]);
        if (product === undefined) {
            await this.popup.add(ErrorPopup, {
                title: this.env._t("No discount product found"),
                body: this.env._t(
                    "The discount product seems misconfigured. Make sure it is flagged as 'Can be Sold' and 'Available in Point of Sale'."
                ),
            });
            return;
        }

        // Remove existing discounts
        lines
            .filter((line) => line.get_product() === product)
            .forEach((line) => order.remove_orderline(line));

        // Add one discount line per tax group
        const linesByTax = order.get_orderlines_grouped_by_tax_ids();
        for (const [tax_ids, lines] of Object.entries(linesByTax)) {
            // Note that tax_ids_array is an Array of tax_ids that apply to these lines
            // That is, the use case of products with more than one tax is supported.
            const tax_ids_array = tax_ids
                .split(",")
                .filter((id) => id !== "")
                .map((id) => Number(id));

            const baseToDiscount = order.calculate_base_amount(
                tax_ids_array,
                lines.filter(
                    (line) =>
                        !globalState.config.tip_product_id ||
                        line.product.id !== globalState.config.tip_product_id[0]
                )
            );

            // We add the price as manually set to avoid recomputation when changing customer.
            const discount = (-pc / 100.0) * baseToDiscount;
            if (discount < 0) {
                order.add_product(product, {
                    price: discount,
                    lst_price: discount,
                    tax_ids: tax_ids_array,
                    merge: false,
                    description:
                        `${pc}%, ` +
                        (tax_ids_array.length
                            ? sprintf(
                                  this.env._t("Tax: %s"),
                                  tax_ids_array
                                      .map((taxId) => globalState.taxes_by_id[taxId].amount + "%")
                                      .join(", ")
                              )
                            : this.env._t("No tax")),
                    extras: {
                        price_automatically_set: true,
                    },
                });
            }
        }
    }
}

ProductScreen.addControlButton({
    component: DiscountButton,
    condition: function () {
        const { module_pos_discount, discount_product_id } = this.pos.globalState.config;
        return module_pos_discount && discount_product_id;
    },
});
