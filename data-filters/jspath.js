define(['jspath'], function(JSPath) {
    return {
        'jspath': {
            process: function(obj) {
                try {
                    if (this.selector) obj = JSPath.apply(this.selector, obj);
                } catch(e) {
                    console.log(e);
                }
                return obj;
            },
            selector: function(obj) {
                return {default: ''};
            }
        }
    }
});
