// vim:set ts=4 sw=4 sts=0:

;(function($) {
    'use strict';

    var methods = {
        init: function(options) {
            var settings = $.extend({
                container: 'parent',
                selectedClass: 'multiple-sortable-selected',
                orientation: 'vertical',
                click: function(e) {},
                start: function(event, ui) {},
                sort: function(event, ui) {},
                receive: function(event, ui) {},
            }, options);

            return this.each(function() {
                var $this = $(this);
                var multipleSortable = new MultipleSortable($this, settings).sortable();
                var clickable = settings.cancel ? appendNot(settings.items, settings.cancel) : settings.items;
                $this
                    .on('click', clickable, function(e) { multipleSortable.click(e); })
                    .data('plugin_multipleSortable', multipleSortable)
                    .disableSelection();
            });
        },
    };

    var appendNot = function(target, not) {
        return target + ':not("' + not + '")';
    };

    var sum = function(jq, calculator) {
        var memo = 0;
        jq.each(function(i, el) {
            memo += calculator(el);
        });
        return memo;
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
                var that = this;
                var sortableOptions = $.extend(true, {}, this.settings, {
                    start: function(event, ui) {
                        that.start(event, ui);
                        // TODO: 配列で返す？
                        that.settings.start(event, ui);
                    },
                    sort: function(event, ui) {
                        that.sort(event, ui);
                        // TODO: 配列で返す？
                        that.settings.sort(event, ui);
                    },
                    receive: function(event, ui) {
                        that.receive(event, ui);
                        // TODO: 配列で返す？
                        that.settings.receive(event, ui);
                    },
                });

                this.$el.sortable(sortableOptions);
                return this;
            },

            click: function(e) {
                this.toggleSelected($(e.currentTarget));
                this.settings.click(e);
            },

            toggleSelected: function($item) {
                if (this.isSelecting($item)) {
                    $item.removeClass(this.settings.selectedClass);
                } else {
                    $item.addClass(this.settings.selectedClass);
                }
            },

            $selectedItems: function($item) {
                return this.$container($item)
                    .find('.' + this.settings.selectedClass + ':not(".ui-sortable-placeholder")');
            },

            $container: function($item) {
                if (this.settings.container === 'parent') {
                    return $item.parent();
                } else if (typeof this.settings.container === 'function') {
                    return this.settings.container($item);
                }
                return $(this.settings.container);
            },

            isSelecting: function($item) {
                return $item.hasClass(this.settings.selectedClass);
            },

            start: function(event, ui) {
                ui.item.addClass(this.settings.selectedClass);
                this['adjustSize_' + this.settings.orientation](ui);
            },

            adjustSize_vertical: function(ui) {
                var height = sum(this.$selectedItems(ui.item), function(el) {
                    return $(el).outerHeight();
                });
                ui.placeholder.height(height);
            },

            adjustSize_horizontal: function(ui) {
                var width = sum(this.$selectedItems(ui.item), function(el) {
                    return $(el).outerWidth();
                });
                ui.placeholder.width(width);
            },

            sort: function(event, ui) {
                var $items = this.$selectedItems(ui.item);
                var index = $items.index(ui.item);
                var $prevItems = $items.filter(':lt(' + index + ')');
                var $followingItems = $items.filter(':gt(' + index + ')');
                this['sort_' + this.settings.orientation](ui.item, $prevItems, $followingItems);
            },

            sort_vertical: function($item, $prevItems, $followingItems) {
                var itemPosition = $item.position(),
                    height = 0,
                    zIndex = this.sortableOption('zIndex'),
                    that = this;

                $prevItems.get().reverse().forEach(function(el) {
                    var $el = $(el);
                    height += $el.outerHeight();
                    that.changePosition($el, itemPosition.top - height, itemPosition.left, 'absolute', zIndex);
                });

                height = $item.outerHeight();
                $followingItems.each(function(i, el) {
                    var $el = $(el);
                    that.changePosition($el, itemPosition.top + height, itemPosition.left, 'absolute', zIndex);
                    height += $el.outerHeight();
                });
            },

            sort_horizontal: function($item, $prevItems, $followingItems) {
                var itemPosition = $item.position(),
                    width = 0,
                    zIndex = this.sortableOption('zIndex'),
                    that = this;

                $prevItems.get().reverse().forEach(function(el) {
                    var $el = $(el);
                    width += $el.outerWidth();
                    that.changePosition($el, itemPosition.top, itemPosition.left - width, 'absolute', zIndex);
                });

                width = $item.outerWidth();
                $followingItems.each(function(i, el) {
                    var $el = $(el);
                    that.changePosition($el, itemPosition.top, itemPosition.left + width, 'absolute', zIndex);
                    width += $el.outerWidth();
                });
            },

            sortableOption: function(name) {
                return this.$el.sortable('option', name);
            },

            receive: function(event, ui) {
                this.$selectedItems().removeClass(this.settings.selectedClass);
            },

            changePosition: function($item, top, left, position, zIndex) {
                $item.css({ top: top, left: left, position: position, zIndex: zIndex });
            },
        });

        return MultipleSortable;
    })();

})(jQuery);
