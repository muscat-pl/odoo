/** @odoo-module **/

import { uniqueId } from "@web/core/utils/functions";
import options from "web_editor.snippets.options";

options.registry.TableOfContent = options.Class.extend({
    /**
     * @override
     */
    start: function () {
        this.targetedElements = 'h1, h2';
        this.oldHeadingsEls = [];
        const $headings = this.$target.find(this.targetedElements);
        if ($headings.length > 0) {
            this._generateNav();
        }
        // Generate the navbar if the content changes
        const targetNode = this.$target.find('.s_table_of_content_main')[0];
        const config = {attributes: false, childList: true, subtree: true, characterData: true};
        this.observer = new MutationObserver(() => this._generateNav());
        this.observer.observe(targetNode, config);
        this.$target.on('content_changed', () => this._generateNav());
        return this._super(...arguments);
    },
    /**
     * @override
     */
    destroy: function () {
        // The observer needs to be disconnected first.
        this.observer.disconnect();
        this._super(...arguments);
    },
    /**
     * @override
     */
    onRemove() {
        this._disposeScrollSpy();
        const exception = (tocEl) => tocEl === this.$target[0];
        this._activateScrollSpy(exception);
    },
    /**
     * @override
     */
    onClone: function () {
        this._generateNav();
    },

    //--------------------------------------------------------------------------
    // Private
    //--------------------------------------------------------------------------

    /**
     * @param  {Function} exception
     */
    _activateScrollSpy(exception) {
        for (const tocEl of this.ownerDocument.querySelectorAll('#wrapwrap .s_table_of_content')) {
            if (exception(tocEl)) {
                continue;
            }
            this.trigger_up('widgets_start_request', {
                $target: $(tocEl),
                editableMode: true,
            });
        }
    },
    /**
     * @private
     */
    _disposeScrollSpy() {
        const scrollingEl = $().getScrollingElement(this.ownerDocument)[0];
        const scrollSpyInstance =
            this.$target[0].ownerDocument.defaultView.ScrollSpy.getInstance(scrollingEl);
        if (scrollSpyInstance) {
            scrollSpyInstance.dispose();
        }
    },
    /**
     * @private
     */
    _generateNav: function (ev) {
        this.options.wysiwyg && this.options.wysiwyg.odooEditor.unbreakableStepUnactive();
        const headingsEls = this.$target.find(this.targetedElements).toArray()
            .filter(el => !el.closest('.o_snippet_desktop_invisible'));
        const areHeadingsEqual = this.oldHeadingsEls.length === headingsEls.length
            && this.oldHeadingsEls.every((el, i) => el.isEqualNode(headingsEls[i]));
        if (areHeadingsEqual) {
            // If the content of the navbar before the change of the DOM is
            // equal to the content of the navbar after the change of the DOM,
            // then there is no need to regenerate the navbar.
            // This is especially important as to regenerate it, we also have
            // to restart scrollSpy, which is done by restarting widgets. But
            // restarting all widgets inside the ToC would certainly lead to
            // DOM changes... which would then regenerate the navbar and lead to
            // an infinite loop.
            return;
        }
        // We dispose the scrollSpy because the navbar will be updated.
        this._disposeScrollSpy();
        const $nav = this.$target.find('.s_table_of_content_navbar');
        $nav.empty();
        headingsEls.forEach((el) => {
            const $el = $(el);
            const id = uniqueId("table_of_content_heading_" + new Date().getTime() + "_");
            $('<a>').attr('href', "#" + id)
                    .addClass('table_of_content_link list-group-item list-group-item-action py-2 border-0 rounded-0')
                    .text($el.text())
                    .appendTo($nav);
            $el.attr('id', id);
            $el[0].dataset.anchor = 'true';
        });
        const exception = (tocEl) => !tocEl.querySelector('.s_table_of_content_navbar a');
        this._activateScrollSpy(exception);
        this.oldHeadingsEls = [...headingsEls.map(el => el.cloneNode(true))];
    },
});

options.registry.TableOfContentNavbar = options.Class.extend({

    //--------------------------------------------------------------------------
    // Options
    //--------------------------------------------------------------------------

    /**
     * Change the navbar position.
     *
     * @see this.selectClass for parameters
     */
    navbarPosition: function (previewMode, widgetValue, params) {
        const $navbar = this.$target;
        const $mainContent = this.$target.parent().find('.s_table_of_content_main');
        if (widgetValue === 'top' || widgetValue === 'left') {
            $navbar.prev().before($navbar);
        }
        if (widgetValue === 'left' || widgetValue === 'right') {
            $navbar.removeClass('s_table_of_content_horizontal_navbar col-lg-12').addClass('s_table_of_content_vertical_navbar col-lg-3');
            $mainContent.removeClass('col-lg-12').addClass('col-lg-9');
            $navbar.find('.s_table_of_content_navbar').removeClass('list-group-horizontal-md');
        }
        if (widgetValue === 'right') {
            $navbar.next().after($navbar);
        }
        if (widgetValue === 'top') {
            $navbar.removeClass('s_table_of_content_vertical_navbar col-lg-3').addClass('s_table_of_content_horizontal_navbar col-lg-12');
            $navbar.find('.s_table_of_content_navbar').addClass('list-group-horizontal-md');
            $mainContent.removeClass('col-lg-9').addClass('col-lg-12');
        }
    },

    //--------------------------------------------------------------------------
    // Private
    //--------------------------------------------------------------------------

    /**
     * @override
     */
    _computeWidgetState: function (methodName, params) {
        switch (methodName) {
            case 'navbarPosition': {
                const $navbar = this.$target;
                if ($navbar.hasClass('s_table_of_content_horizontal_navbar')) {
                    return 'top';
                } else {
                    const $mainContent = $navbar.parent().find('.s_table_of_content_main');
                    return $navbar.prev().is($mainContent) === true ? 'right' : 'left';
                }
            }
        }
        return this._super(...arguments);
    },
});

options.registry.TableOfContentMainColumns = options.Class.extend({
    forceNoDeleteButton: true,

    /**
     * @override
     */
    start: function () {
        const leftPanelEl = this.$overlay.data('$optionsSection')[0];
        leftPanelEl.querySelector('.oe_snippet_clone').classList.add('d-none'); // TODO improve the way to do that
        return this._super.apply(this, arguments);
    },
});
