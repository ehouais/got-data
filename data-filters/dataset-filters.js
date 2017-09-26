define(['ui-utils'], function($) {
    return {
        'object-to-dataset': {
            process: function(obj) {
                if (!Array.isArray(obj)) obj = [obj];

                var labels = Object.keys(obj[0]),
                    cols = labels.map(function(label) {
                        return {label: label};
                    });

                return {
                    cols: cols,
                    rows: obj.map(function(row) {
                        return labels.map(function(label) {
                            return row[label] || null;
                        });
                    })
                }
            }
        },
        'dom-table-to-dataset': {
            process: function(table) {
                var params = this,
                    ds = {cols: [], rows: []},
                    rowType;

                if (table && table.rows) {
                    ds.cols = $.selectAll('th, td', table.rows[0]).map(function(cell, i) {
                        return {label: params.useheader ? cell.textContent : 'col#'+(i+1)};
                    });

                    for (var i=(params.useheader ? 1 : 0), tr; tr = table.rows[i]; i++) {
                        ds.rows.push($.selectAll('th, td', tr).map(function(cell) {
                            return cell.textContent;
                        }));
                    }
                }
                return ds;
            },
            useheader: function(table) {
                return {
                    options: ['not using', 'using'],
                    default: !!$.select('th', table.rows[0])
                };
            }
        },
        'workbook-to-dataset': {
            process: (function() {
                var range = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
                    xl2coords = function(coords) {
                        var tmp = coords.match(/([A-Z]+)([0-9]+)/),
                            col = tmp[1].split('').reduce(function(col, letter) {
                                return 26*col+range.indexOf(letter)+1;
                            }, 0);

                        return {row: +tmp[2]-1, col: col-1};
                    },
                    coords2xl = function(coords) {
                        var col = '',
                            ccol = coords.col,
                            modulo;

                        while (true) {
                            modulo = ccol % 26;
                            col = range[modulo]+col;
                            if (ccol < 26) break;
                            ccol = Math.floor((ccol+1 - modulo) / 26);
                        }
                        return col+(coords.row+1);
                    };

                return function(workbook) {
                    var params = this,
                        sheet = workbook.Sheets[workbook.SheetNames[params.sheetindex]],
                        range = sheet['!ref'].split(':'),
                        topleft = xl2coords(range[0]),
                        bottomright = xl2coords(range[1]),
                        cols,
                        rows,
                        row,
                        cell;

                    cols = [];
                    for (var i=topleft.col; i <= bottomright.col; i++) {
                        cols[i] = {label: params.useheader ? sheet[coords2xl({row: 0, col: i})].v : 'col#'+(i+1)};
                    }

                    rows = [];
                    for (var j=topleft.row+(params.useheader ? 1 : 0); j <= bottomright.row; j++) {
                        row = [];
                        for (var i=topleft.col; i <= bottomright.col; i++) {
                            cell = sheet[coords2xl({row: j, col: i})];
                            row.push(cell ? ''+cell.v : '');
                        }
                        rows.push(row);
                    }

                    return {cols: cols, rows: rows};
                };
            })(),
            sheetindex: function(workbook) {
                return {
                    options: workbook.SheetNames,
                    default: 0
                };
            },
            useheader: function(workbook) {
                return {
                    options: ['not using', 'using'],
                    default: false
                };
            }
        },
        'select-columns': {
            process: function(dataset) {
                if (this.indices) {
                    var indices = this.indices.split(',');
                    dataset = {
                        cols: indices.map(function(index) {
                            return dataset.cols[index-1];
                        }),
                        rows: dataset.rows.map(function(row) {
                            return indices.map(function(index) {
                                return row[index-1];
                            });
                        })
                    }
                }
                return dataset;
            },
            indices: function(dataset) {
                return {default: dataset.cols.map(function(col, i) {
                    return i+1;
                }).join(',')};
            }
        },
        'select-rows': {
            process: function(dataset) {
                if (this.range) {
                    var tokens = this.range.split('-');
                    dataset.rows = dataset.rows.slice(tokens[0]-1, tokens[1] || dataset.rows.length);
                }
                return dataset;
            },
            range: function(dataset) {
                return {default: '1-'+dataset.rows.length};
            }
        }
    }
});
