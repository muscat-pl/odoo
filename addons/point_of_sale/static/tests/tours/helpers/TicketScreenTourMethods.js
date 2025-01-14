/** @odoo-module */

import { createTourMethods } from "@point_of_sale/../tests/tours/helpers/utils";

class Do {
    clickNewTicket() {
        return [{ trigger: ".ticket-screen .highlight" }];
    }
    clickDiscard() {
        return [{ trigger: ".ticket-screen button.discard" }];
    }
    selectOrder(orderName) {
        return [
            {
                trigger: `.ticket-screen .order-row > .col:nth-child(2):contains("${orderName}")`,
            },
        ];
    }
    deleteOrder(orderName) {
        return [
            {
                trigger: `.ticket-screen .orders > .order-row > .col:contains("${orderName}") ~ .col[name="delete"]`,
            },
        ];
    }
    selectFilter(name) {
        return [
            {
                content: "open search bar",
                trigger: "button.search",
                mobile: true,
            },
            {
                trigger: `.pos-search-bar .filter`,
            },
            {
                trigger: `.pos-search-bar .filter ul`,
                run: () => {},
            },
            {
                trigger: `.pos-search-bar .filter ul li:contains("${name}")`,
            },
            {
                content: "close search bar",
                trigger: "button.arrow-left",
                mobile: true,
            },
        ];
    }
    search(field, searchWord) {
        return [
            {
                content: "open search bar",
                trigger: "button.search",
                mobile: true,
            },
            {
                trigger: ".pos-search-bar input",
                run: `text ${searchWord}`,
            },
            {
                /**
                 * Manually trigger keyup event to show the search field list
                 * because the previous step do not trigger keyup event.
                 */
                trigger: ".pos-search-bar input",
                run: function () {
                    document
                        .querySelector(".pos-search-bar input")
                        .dispatchEvent(new KeyboardEvent("keyup", { key: "" }));
                },
            },
            {
                trigger: `.pos-search-bar .search ul li:contains("${field}")`,
            },
            {
                content: "close search bar",
                trigger: "button.arrow-left",
                mobile: true,
            },
        ];
    }
    settleTips() {
        return [
            {
                trigger: ".ticket-screen .buttons .settle-tips",
            },
        ];
    }
    clickControlButton(name) {
        return [
            {
                trigger: `.ticket-screen .control-button:contains("${name}")`,
            },
        ];
    }
    clickOrderline(name) {
        return [
            {
                trigger: `.ticket-screen .orderline:not(:has(.selected)) .product-name:contains("${name}")`,
            },
            {
                trigger: `.ticket-screen .orderline.selected .product-name:contains("${name}")`,
                run: () => {},
            },
        ];
    }
    pressNumpad(key) {
        let trigger;
        if (".0123456789".includes(key)) {
            trigger = `.numpad .number-char:contains("${key}")`;
        } else if (key === "Backspace") {
            trigger = `.numpad .numpad-backspace`;
        } else if (key === "+/-") {
            trigger = `.numpad .numpad-minus`;
        }
        return [
            {
                trigger,
            },
        ];
    }
    confirmRefund() {
        return [
            {
                trigger: ".ticket-screen .button.pay",
            },
        ];
    }
}

class Check {
    checkStatus(orderName, status) {
        return [
            {
                trigger: `.ticket-screen .order-row > .col:nth-child(2):contains("${orderName}") ~ .col:nth-child(6):contains(${status})`,
                run: () => {},
                mobile: false,
            },
            {
                trigger: `.ticket-screen .order-row .col:nth-child(2) div:contains("${orderName}") ~ div:contains(${status})`,
                run: () => {},
                mobile: true,
            },
        ];
    }
    /**
     * Check if the nth row contains the given string.
     * Note that 1st row is the header-row.
     */
    nthRowContains(n, string) {
        return [
            {
                trigger: `.ticket-screen .orders > .order-row:nth-child(${n}):contains("${string}")`,
                run: () => {},
            },
        ];
    }
    contains(string) {
        return [
            {
                trigger: `.ticket-screen .orders:contains("${string}")`,
                run: () => {},
            },
        ];
    }
    noNewTicketButton() {
        return [
            {
                trigger: ".ticket-screen .controls .buttons:nth-child(1):has(.discard)",
                run: () => {},
            },
        ];
    }
    orderWidgetIsNotEmpty() {
        return [
            {
                trigger: ".ticket-screen:not(:has(.order-empty))",
                run: () => {},
            },
        ];
    }
    filterIs(name) {
        return [
            {
                content: "open search bar",
                trigger: "button.search",
                mobile: true,
            },
            {
                trigger: `.ticket-screen .pos-search-bar .filter span:contains("${name}")`,
                run: () => {},
            },
            {
                content: "close search bar",
                trigger: "button.arrow-left",
                mobile: true,
            },
        ];
    }
    partnerIs(name) {
        return [
            {
                trigger: `.ticket-screen .set-partner:contains("${name}")`,
                run: () => {},
            },
        ];
    }
    toRefundTextContains(text) {
        return [
            {
                trigger: `.ticket-screen .to-refund-highlight:contains("${text}")`,
                run: () => {},
            },
        ];
    }
    refundedNoteContains(text) {
        return [
            {
                trigger: `.ticket-screen .refund-note:contains("${text}")`,
                run: () => {},
            },
        ];
    }
    tipContains(amount) {
        return [
            {
                trigger: `.ticket-screen .tip-cell:contains("${amount}")`,
                run: () => {},
            },
        ];
    }
}

class Execute {}

// FIXME: this is a horrible hack to export an object as named exports.
// eslint-disable-next-line no-undef
Object.assign(__exports, createTourMethods("TicketScreen", Do, Check, Execute));
