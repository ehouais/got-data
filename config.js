define(['http'], function(Http) {
    var arrayBufferToString = function(buffer, type) {
            var bufView = new Uint8Array(buffer);
            var length = bufView.length;
            var str = '';
            var step = Math.pow(2, 16)-1;

            for (var i=0; i < length; i += step){
                if (i+step > length) {
                    step = length-i;
                }
                str += String.fromCharCode.apply(null, bufView.subarray(i, i+step));
            }
            if (type.substr(0, 5) == 'text/' || type == 'application/json') {
                str = decodeURIComponent(escape(str));
            }
            return str;
        },
        types = {
            'application/json': {label: 'JSON', filter: 'json-parser', renderers: ['text']},
            'application/vnd.ms-excel': {label: 'XLS', filter: 'excel-parser'},
            'application/vnd.ms-office': {label: 'MS Office doc', filter: 'excel-parser'},
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': {label: 'XLSX', filter: 'excel-parser'},
            'application/x-yaml': {label: 'YAML', filter: 'yaml-parser'},
            'js/dataset': {label: 'dataset', renderers: ['table', 'vbars', 'hbars', 'pie', 'map', 'lines']},
            'js/dom-document': {label: 'DOM document', filter: 'dom-to-text'},
            'js/dom-node': {label: 'DOM node', filter: 'dom-to-text'},
            'js/object': {label: 'generic object', renderers: ['object-tree']},
            'js/workbook': {label: 'spreadsheet workbook', filter: 'workbook-to-dataset'},
            'text/csv': {label: 'CSV', filter: 'csv-parser', renderers: ['text']},
            'text/html': {label: 'HTML', filter: 'html-parser', renderers: ['text']},
            'text/javascript': {label: 'javascript', renderers: ['text']},
            'text/plain': {label: 'text', renderers: ['text']},
            'text/sql': {label: 'SQL dump', filter: 'sql-parser', renderers: ['text']},
            'text/tab-separated-values': {label: 'TSV', filter: 'tsv-parser', renderers: ['text']},
            'text/vnd.flowchartjs': {label: 'flowchart.js syntax', renderers: ['flowchart']},
            'text/vnd.graphviz': {label: 'Graphviz DOT syntax', renderers: ['graph']},
            'text/vnd.plantuml.sequence': {label: 'PlantUML sequence diagram', renderers: ['uml-sequence']},
            'text/x-railroad-diagram': {label: 'Railroad diagram', renderers: ['railroad-diagram']},
            'text/xml': {label: 'XML', filter: 'xml-parser', renderers: ['text']},
            'text/yaml': {label: 'YAML', filter: 'yaml-parser', renderers: ['text']},
        },
        filters = [
            {
                id: 'regexp',
                label: 'Regular expression',
                description: 'Apply [regular expression](https://en.wikipedia.org/wiki/Regular_expression) "{{pattern}}" to the string',
                params: {
                    pattern: {type: 'regexp'}
                },
                in: 'text/plain',
                out: 'text/plain',
                bundle: 'selectors'
            },
            {
                id: 'xml-parser',
                label: 'XML parser',
                description: 'Parse the XML into a DOM document object',
                in: 'text/xml',
                out: 'js/dom-document',
                bundle: 'simple-parsers'
            },
            {
                id: 'html-parser',
                label: 'HTML parser',
                description: 'Parse the HTML into a DOM document object',
                in: 'text/html',
                out: 'js/dom-document',
                bundle: 'simple-parsers'
            },
            {
                id: 'excel-parser',
                label: 'Excel parser',
                description: 'Parse the Excel data into a workbook object',
                in: ['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
                out: 'js/workbook',
                bundle: 'excel-parser'
            },
            {
                id: 'xpath',
                label: 'XPath selector',
                description: 'Apply [XPath](https://en.wikipedia.org/wiki/XPath) selector "{{selector}}" to the DOM document',
                params: {
                    selector: {type: 'xpath'}
                },
                in: 'js/dom-document',
                out: 'js/dom-node',
                bundle: 'selectors'
            },
            {
                id: 'jspath',
                label: 'JSPath selector',
                description: 'Apply [JSPath](https://github.com/dfilatov/jspath#documentation) selector "{{selector}}" to the generic object',
                params: {
                    selector: {type: 'jspath'}
                },
                in: 'js/object',
                out: 'js/object',
                bundle: 'jspath'
            },
            {
                id: 'css-selector',
                label: 'CSS selector',
                description: 'Apply [CSS selector](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Selectors) "{{selector}}" to the DOM document',
                params: {
                    selector: {type: 'css-selector'}
                },
                in: 'js/dom-document',
                out: 'js/dom-node',
                bundle: 'selectors'
            },
            {
                id: 'dom-table-to-dataset',
                label: 'DOM table to dataset',
                description: 'Transform a DOM table into a dataset, {{useheader}} first row as header',
                params: {
                    useheader: {type: 'boolean'}
                },
                in: 'js/dom-node',
                out: 'js/dataset',
                bundle: 'dataset-filters'
            },
            {
                id: 'csv-parser',
                label: 'CSV parser',
                description: 'Parse the CSV string into a dataset, {{useheader}} first row as header',
                params: {
                    useheader: {type: 'boolean'}
                },
                in: ['text/csv'],
                out: 'js/dataset',
                bundle: 'simple-parsers'
            },
            {
                id: 'tsv-parser',
                label: 'TSV parser',
                description: 'Parse the TSV string into a dataset, {{useheader}} first row as header',
                params: {
                    useheader: {type: 'boolean'}
                },
                in: ['text/tab-separated-values'],
                out: 'js/dataset',
                bundle: 'simple-parsers'
            },
            {
                id: 'json-parser',
                label: 'JSON parser',
                description: 'Parse [JSON](http://json.org) into a {{type}}',
                in: 'application/json',
                out: 'js/object',
                params: {
                    type: {type: 'string'}
                },
                bundle: 'simple-parsers'
            },
            {
                id: 'workbook-to-dataset',
                label: 'workbook to dataset',
                description: 'Extract values from sheet "{{sheetindex}}" into a dataset, {{useheader}} first row as header',
                in: 'js/workbook',
                out: 'js/dataset',
                params: {
                    sheetindex: {type: 'integer'},
                    useheader: {type: 'boolean'}
                },
                bundle: 'dataset-filters'
            },
            {
                id: 'select-columns',
                label: 'Dataset columns selector',
                description: 'Extract columns {{indices}} from dataset',
                in: 'js/dataset',
                out: 'js/dataset',
                params: {
                    indices: {type: 'array'}
                },
                bundle: 'dataset-filters'
            },
            {
                id: 'select-rows',
                label: 'select rows',
                description: 'Extract rows {{range}} from dataset',
                in: 'js/dataset',
                out: 'js/dataset',
                params: {
                    range: {type: 'range'}
                },
                bundle: 'dataset-filters'
            },
            {
                id: 'dom-to-text',
                label: 'DOM node to text',
                description: 'Get DOM node textual representation',
                in: ['js/dom-document', 'js/dom-node'],
                out: 'text/plain',
                bundle: 'dom-filters'
            },
            {
                id: 'dom-to-object',
                label: 'DOM node to object',
                description: 'Convert DOM node into generic object',
                in: ['js/dom-document', 'js/dom-node'],
                out: 'js/object',
                bundle: 'dom-filters'
            },
            {
                id: 'yaml-parser',
                label: 'YAML parser',
                description: 'Parse [YAML](http://yaml.org) into generic data object',
                in: ['application/x-yaml', 'text/yaml'],
                out: 'js/object',
                bundle: 'yaml-parser'
            },
            {
                id: 'object-to-dataset',
                label: 'Generic object to dataset',
                description: 'Get dataset from generic object',
                in: 'js/object',
                out: 'js/dataset',
                bundle: 'dataset-filters'
            },
            {
                id: 'sql-parser',
                label: 'SQL dump to object',
                description: 'Parse SQL dump data into an object',
                in: 'text/sql',
                out: 'js/object',
                bundle: 'simple-parsers'
            },
        ].reduce(function(obj, filter) {
            obj[filter.id] = filter;
            return obj;
        }, {});

    return {
        arrayBufferToString: arrayBufferToString,
        resolve: function(config, cb) {
            // build array of necessary filter bundles {filename: [filter ids], ...}
            var bundles = (config.filters || []).reduce(function(requires, filter) {
                    var bundle = filters[filter.type].bundle;
                    if (bundle) {
                        var filename = '/assets/got-data/dev/data-filters/'+bundle+'.js';
                        if (!requires[filename]) requires[filename] = [];
                        requires[filename].push(filter.type);
                    }
                    return requires;
                }, {}),
                filenames = Object.keys(bundles);

            // require them all and process pipeline
            require(filenames, function() {
                // add implementations in filter
                Array.prototype.slice.call(arguments).forEach(function(bundle, i) {
                    if (Object.prototype.toString.call(bundle) == '[object Function]') {
                        filters[bundles[filenames[i]][0]].impl = bundle;
                    } else {
                        for (var filter in bundle) {
                            filters[filter].impl = bundle[filter];
                        }
                    }
                });

                // apply filters stack to source data
                cb((config.filters || []).reduce(function(result, step) {
                    var filter = filters[step.type],
                        params = step.params,
                        paramValues = {};

                    // use default value for missing filter params
                    for (var key in filter.params) {
                        var param = (params[key] = params[key] || {}),
                            def = filter.impl[key](result.value);

                        // Compute options and default value
                        if (def.options) {
                            param.options = def.options;
                        }
                        if (!param.hasOwnProperty('value')) param.value = def.default;

                        paramValues[key] = param.value;
                    }

                    return {
                        type: filter.out,
                        value: filter.impl.process.call(paramValues, result.value)
                    };
                }, {type: config.sourceType || config.sourceData.type, value: config.sourceData.value}));
            });
        },
        setFilters: function(config, newFilters, noDefault) {
            // Compute last data type provided by pipeline
            var lastType = newFilters && newFilters.length
                ? filters[newFilters[newFilters.length-1].type].out
                : config.sourceType || config.sourceData.type;

            // add default filters if requested and possible
            if (!noDefault) {
                var filter;

                while (filter = types[lastType].filter) {
                    if (typeof filter == 'string') filter = {type: filter, params: {}};
                    newFilters.push(filter);
                    lastType = filters[filter.type].out;
                }
            }
            config.filters = newFilters;

            // set default vizType if possible
            var vizTypes = types[lastType].renderers;
            config.vizType = vizTypes && vizTypes[0];

            return config;
        },
        proxyFetch: function(uri, cb) { // cb = f(body, status, headers)
            // proxify non-local URIs
            if (!uri.match(/https?:\/\/[^\/]*(localhost|local|127\.0\.0\.1)/)) {
                uri = '/proxy?url='+encodeURIComponent(uri);
            }
            Http.get(uri, function(body, status, headers) {
                var type = headers['content-type'].trim().split(';')[0];
                cb({
                    value: arrayBufferToString(body, type),
                    type: type
                });
            }, true, function(xhr) {
                xhr.responseType = 'arraybuffer';
            });
        },
        types: types,
        filters: filters,
        renderers: {
            'text': 'text page',
            'object-tree': 'object tree',
            'table': 'table',
            'vbars': 'vertical bar chart',
            'hbars': 'horizontal bar chart',
            'pie': 'pie chart',
            'map': 'map',
            'lines': 'timeplot',
            'uml-sequence': 'sequence diagram',
            'flowchart': 'flow chart',
            'graph': 'graph',
            'railroad-diagram': 'Railroad diagram'
        }
    };
});
