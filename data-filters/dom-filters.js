define([], function() {
    return {
        'dom-to-object': {
            process: function(node) {
                var nodeToObj = function(node) {
                    if (node.nodeType == 3) { // text
                        var value = node.nodeValue.trim();
                        return value != '' ? value : undefined;
                    }

                    if (node.childNodes.length == 1 && node.childNodes.item(0).nodeType == 3) {
                        return nodeToObj(node.childNodes.item(0));
                    }

                    var obj = {};

                    if (node.nodeType == 1) { // element
                        // do attributes
                        if (node.attributes.length > 0) {
                        obj["@attributes"] = {};
                            for (var j = 0; j < node.attributes.length; j++) {
                                var attribute = node.attributes.item(j);
                                obj["@attributes"][attribute.nodeName] = attribute.nodeValue;
                            }
                        }
                    }

                    // do children
                    if (node.hasChildNodes()) {
                        for (var i = 0; i < node.childNodes.length; i++) {
                            var item = node.childNodes.item(i),
                                nodeName = item.nodeName,
                                rec = nodeToObj(item);

                            if (rec) {
                                if (!isNaN(rec)) rec = parseFloat(rec);

                                if (typeof(obj[nodeName]) == "undefined") {
                                    obj[nodeName] = rec;
                                } else {
                                    if (!Array.isArray(obj[nodeName])) {
                                        obj[nodeName] = [obj[nodeName]];
                                    }
                                    obj[nodeName].push(rec);
                                }
                            }
                        }
                    }

                    return obj;
                };

                return nodeToObj(node);
            }
        },
        'dom-to-text': {
            process: function(node) {
                if (node.contentType == 'text/html') {
                    if (node.body) node = node.body;
                    return node && node.outerHTML || '';
                } else {
                    return new XMLSerializer().serializeToString(node);
                }
            }
        }
    }
});
