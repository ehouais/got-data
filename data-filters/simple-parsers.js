define([], function() {
    var xsvparser = function(separator) {
            return function(xsv) {
                var params = this,
                    rows = xsv.trim().split('\n').map(function(row) {
                        return row.split(separator).map(function(value) {
                            return value.trim();
                        });
                    }),
                    cols = rows[0].map(function (cell, i) {
                        return {label: params.useheader ? cell : 'col#'+(i+1)};
                    });

                return {cols: cols, rows: rows.slice(params.useheader ? 1 : 0)};
            };
        },
        mlparser = function(type) {
            return function(ml) {
                return new DOMParser().parseFromString(ml, type);
            };
        };

    return {
        'csv-parser': {
            process: xsvparser(','),
            useheader: function(csv) {
                return {
                    options: ['not using', 'using'],
                    default: false
                };
            }
        },
        'tsv-parser': {
            process: xsvparser('\t'),
            useheader: function(tsv) {
                return {
                    options: ['not using', 'using'],
                    default: false
                };
            }
        },
        'json-parser': {
            process: function(json) {
                try {
                    return JSON.parse(json);
                } catch(e) {
                    console.log(e);
                }
            },
            type: function(json) {
                return {default: 'js/object'};
            }
        },
        'html-parser': {
            process: mlparser('text/html')
        },
        'xml-parser': {
            process: mlparser('text/xml')
        },
        'sql-parser': {
            process: function(sql) {
                // regexp comes from https://github.com/datagica/parse-sql
                var tables = {},
                    match,
                    regexp = /insert\s+into\s+(\w+)\s+\(\s*((?:\w+)(?:\s*,\s*\w+)*)\)\s+values\s+\(\s*((?:\d+|'[^']+')(?:\s*,\s*(?:\d+|'[^']+')?)*)\)/gi;

                while ((match = regexp.exec(sql)) != null) {
                    var table = match[1],
                        keys = match[2].split(', '), // TODO: accept commas without following space
                        values = match[3].replace(/\r\n/gi, '\\n').replace(/\n/gi, '\\n').split(', '),
                        obj = {};

                    if (!tables[table]) tables[table] = [];

                    for (var i=0; i < keys.length; i++) {
                        var value = values[i],
                            match;

                        if (typeof value == 'undefined') {
                            value = null;
                        } else if (match = value.match(/^'([^']*)'$/)) {
                            value = match[1];
                        }
                        obj[keys[i]] = value;
                    }

                    tables[table].push(obj);
                }

                return tables;
            }
        }
    }
});
