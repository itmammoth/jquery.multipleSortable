// vim:set ts=4 sw=4 sts=0:

;(function($) {
    'use strict';

    var methods = {
        init: function(options) {
            var settings = $.extend({
                selectedClass: 'multiple-sortable-selected',
                orientation: 'vertical',
                mousedown: function(e) {},
                click: function(e) {},
            }, options);

            return this.each(function() {
                var $this = $(this);
                var multipleSortable = new MultipleSortable($this, settings).sortable();
                var clickable = settings.cancel ? appendNot(settings.items, settings.cancel) : settings.items;
                $this
                    .on('mousedown', clickable, function(e) { multipleSortable.mouseDown(e); })
                    .on('click', clickable, function(e) { multipleSortable.click(e); })
                    .data('plugin_multipleSortable', multipleSortable)
                    .disableSelection();
            });
        },
    };

    var appendNot = function(target, not) {
        return target + ':not("' + not + '")';
    };

    /*
     * Make it jQuery plugin
     */
    $.fn.multipleSortable = function(method) {
        if (methods[method]) {
            return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
        } else if (typeof method === 'object' || !method) {
            return methods.init.apply(this, arguments);
        } else {
            $.error('Method ' +  method + ' does not exist on jQuery.multipleSortable');
        }
    };

    /*
     * Plugin class
     */
    var MultipleSortable = (function() {

        /*
         * Constructor
         */
        var MultipleSortable = function($el, settings) {
            this.$el = $el;
            this.settings = settings;
        };

        /*
         * Instance methods
         */
        $.extend(MultipleSortable.prototype, {

            sortable: function() {
                this.$el.sortable(this.settings);
                return this;
            },

            mouseDown: function(e) {
                var $item = $(e.currentTarget);

                if (e.ctrlKey || e.metaKey) {
                    this.addSelectedItem($item);
                } else if (e.shiftKey) {
                    this.expandSelection($item);
                } else {
                    this.selectItem($item);
                }

                this.settings.mousedown(e);
            },

            click: function(e) {
                var $item = $(e.currentTarget);

                if (!e.ctrlKey && !e.metaKey && !e.shiftKey) {
                    this.selectOnlyAnItem($item);
                }

                this.settings.click(e);
            },

            addSelectedItem: function($item) {
                if (this.isSelecting($item)) {
                    $item.removeClass(this.settings.selectedClass);
                } else {
                    $item.addClass(this.settings.selectedClass);
                    this.$lastSelectedItem = $item;
                }
            },

            expandSelection: function($item) {
                var myIndex = $item.index(),
                    lsiIndex,
                    until;

                if (this.$lastSelectedItem) {
                    lsiIndex = this.$lastSelectedItem.index();
                    until = lsiIndex < myIndex ? 'prevUntil' : 'nextUntil';
                } else {
                    lsiIndex = 0;
                    this.$lastSelectedItem = this.$el.find(this.settings.items).eq(0);
                    until = 'prevUntil';
                }

                $item[until](this.$lastSelectedItem[0]).add(this.$lastSelectedItem).add($item)
                    .addClass(this.settings.selectedClass);
            },

            selectItem: function($item) {
                if (this.isSelecting($item)) return;

                this.selectOnlyAnItem($item);
                this.$lastSelectedItem = $item;
            },

            selectOnlyAnItem: function($item) {
                this.globalSelectedItems().removeClass(this.settings.selectedClass);
                $item.addClass(this.settings.selectedClass);
            },

            globalSelectedItems: function() {
                return $('.' + this.settings.selectedClass);
            },

            isSelecting: function($item) {
                return $item.hasClass(this.settings.selectedClass);
            },
        });

        return MultipleSortable;
    })();

})(jQuery);
