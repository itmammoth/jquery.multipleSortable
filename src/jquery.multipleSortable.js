// vim:set ts=4 sw=4 sts=0:

;(function($) {
    'use strict';

    var JQUERY_SORTABLE_EVENTS = [
        'activate',
        'beforeStop',
        'change',
        'create',
        'deactivate',
        'out',
        'over',
        'receive',
        'remove',
        'sort',
        'start',
        'stop',
        'update',
    ];
    Object.freeze(JQUERY_SORTABLE_EVENTS);

    var methods = {
        init: function(options) {
            var settings = $.extend({
                container: 'parent',
                selectedClass: 'multiple-sortable-selected',
                orientation: 'vertical',
                keepSelection: true,
                click: function(e) {},
            }, options);

            var share = {}; // shared object

            return this.each(function() {
                var $this = $(this);
                var multipleSortable = new MultipleSortable($this, settings, share).sortable();
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

    var sum = function($jq, calculator) {
        var memo = 0;
        $jq.each(function(i, el) { memo += calculator(el); });
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
        var MultipleSortable = function($el, settings, share) {
            this.$el = $el;
            this.settings = settings;
            this.share = share;
        };

        /*
         * Instance methods
         */
        $.extend(MultipleSortable.prototype, {

            sortable: function() {
                var that = this;
                var sortableEvents = {};
                JQUERY_SORTABLE_EVENTS.forEach(function(jse) {
                    sortableEvents[jse] = function(event, ui) {
                        that[jse] && that[jse](event, ui);
                        that.settings[jse] && that.settings[jse](event, ui, that.share.$draggingItems);
                    };
                });
                this.$el.sortable($.extend(true, {}, this.settings, sortableEvents));

                return this;
            },

            click: function(e) {
                this.toggleSelected($(e.currentTarget));
                this.settings.click(e);
            },

            sort: function(event, ui) {
                var partitionedItems = this.partition(this.share.$draggingItems, ui.item);
                this['sort_' + this.settings.orientation](ui.item, partitionedItems.prev, partitionedItems.following);
            },

            start: function(event, ui) {
                ui.item.addClass(this.settings.selectedClass);
                this.share.$draggingItems = this.$containerOf(ui.item)
                    .find('.' + this.settings.selectedClass + ':not(".ui-sortable-placeholder")');
                this['adjustSize_' + this.settings.orientation](ui);
            },

            stop: function(event, ui) {
                var $handleItem = ui.item;
                this.changePosition(this.share.$draggingItems, '', '', '', '');
                var partitionedItems = this.partition(this.share.$draggingItems, $handleItem);
                $handleItem
                    .before(partitionedItems.prev)
                    .after(partitionedItems.following);
                if (!this.settings.keepSelection) {
                    this.share.$draggingItems.removeClass(this.settings.selectedClass);
                }
            },

            toggleSelected: function($item) {
                if (this.isSelecting($item)) {
                    $item.removeClass(this.settings.selectedClass);
                } else {
                    $item.addClass(this.settings.selectedClass);
                }
            },

            $containerOf: function($item) {
                if (this.settings.container === 'parent') {
                    return $item.parent();
                } else if (this.settings.container instanceof jQuery) {
                    return this.settings.container;
                } else if (typeof this.settings.container === 'function') {
                    return this.settings.container($item);
                }
                return $(this.settings.container);
            },

            isSelecting: function($item) {
                return $item.hasClass(this.settings.selectedClass);
            },

            adjustSize_vertical: function(ui) {
                var height = sum(this.share.$draggingItems, function(el) {
                    return $(el).outerHeight();
                });
                ui.placeholder.height(height);
            },

            adjustSize_horizontal: function(ui) {
                var width = sum(this.share.$draggingItems, function(el) {
                    return $(el).outerWidth();
                });
                ui.placeholder.width(width);
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

            partition: function($items, $item) {
                var index = $items.index($item);
                return {
                    prev: $items.filter(':lt(' + index + ')'),
                    following: $items.filter(':gt(' + index + ')'),
                };
            },

            changePosition: function($jq, top, left, position, zIndex) {
                $jq.css({ top: top, left: left, position: position, zIndex: zIndex });
            },
        });

        return MultipleSortable;
    })();

})(jQuery);
