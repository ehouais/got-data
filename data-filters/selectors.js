define([], function() {
    return {
        regexp: {
            process: function(str) {
                if (!this.pattern) return str;

                var res = (new RegExp(this.pattern)).exec(str);
                return res ? res[1] : '';
            },
            pattern: function(str) {
                return {default: '(.*)'};
            }
        },
        xpath: {
            process: function(doc) {
                if (!this.selector) return doc.body;

                return doc.evaluate(this.selector, doc.body, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
            },
            selector: function(doc) {
                return {default: ''};
            }
        },
        'css-selector': {
            process: function(doc) {
                if (!this.selector) return doc.body;

                try {
                    return doc.querySelector(this.selector);
                } catch(e) {
                    return doc.body;
                }
            },
            selector: function(doc) {
                return {default: ''};
            }
        }
    }
});
