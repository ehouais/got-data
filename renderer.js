define([], function() {
    return function($container) {
        var $title = document.createElement('div'),
            $viz = document.createElement('div'),
            loadCss = (function() {
                var loaded = [];
                return function(url) {
                    if (loaded.indexOf(url) == -1) {
                        var link = document.createElement('link');
                        link.href = url;
                        link.type = 'text/css';
                        link.rel = 'stylesheet';
                        document.getElementsByTagName('head')[0].appendChild(link);
                        loaded.push(url);
                    }
                };
            })(),
            resizableSvg = function($svg) {
                var width = parseInt($svg.getAttribute('width')),
                    height = parseInt($svg.getAttribute('height'));
                
                $svg.setAttribute('width', '100%');
                $svg.setAttribute('height', '100%');
                $svg.setAttribute('viewBox', '0 0 '+width+' '+height);
            },
            resize,
            previous,
            setFontSize = function() {
                $title.style.fontSize = $container.offsetHeight/20+'px';
            };

        $container.innerHTML = '';
        $container.style.display = 'flex';
        $container.style.flexDirection = 'column';
        $title.style.textAlign = 'center';
        $container.appendChild($title);
        $viz.style.flex = 1;
        $viz.style.overflow = 'hidden';
        $container.appendChild($viz);

        return {
            render: function(vizType, data, title) {
                $title.textContent = title ? title.trim() : '';

                if (previous) $viz.classList.remove(previous);
                $viz.classList.add(previous = vizType);
                if (['hbars', 'vbars', 'pie', 'lines'].indexOf(vizType) != -1) {
                    require.config({
                        baseUrl: path,
                        paths: {
                            d3v3: '/assets/d3/3.5.5/d3.min', // v3 mandatory
                            nvd3: '/assets/nvd3/1.8.6/nv.d3.min',
                        },
                        shim: {
                            nvd3: {deps: ['d3v3'], exports: 'nv'}
                        }
                    });
                    loadCss('/assets/nvd3/1.8.6/nv.d3.min.css');
                    require(['d3v3', 'nvd3'], function(d3, nv) {
                        var series = function(table) {
                                return table.cols.slice(1).map(function(col, i) {
                                    return {
                                        key: col.label,
                                        values: table.rows.map(function(row) {
                                            return [row[0], row[i+1]];
                                        })
                                    };
                                });
                            };

                        $viz.setAttribute('id', 'nvd3');
                        $viz.innerHTML = '';

                        nv.addGraph(function() {
                            var chart,
                                vizdata;

                            if (vizType == 'hbars') {
                                chart = nv.models.multiBarHorizontalChart();
                                vizdata = series(data);
                            } else if (vizType == 'vbars') {
                                chart = nv.models.multiBarChart()
                                    .reduceXTicks(false);
                                vizdata = series(data);
                            } else if (vizType == 'pie') {
                                chart = nv.models.pieChart()
                                    .labelsOutside(true);
                                vizdata = data.rows;
                            } else if (vizType == 'lines') {
                                chart = nv.models.lineChart();
                                vizdata = series(data);
                            }

                            chart
                                .x(function(d) { return d[0]; })
                                .y(function(d) { return d[1]; })
                                .showLegend(data.cols.length > 2)
                                .duration(0);
                            if (chart.showValues) chart.showValues(true);
                            if (chart.showControls) chart.showControls(false);

                            d3.select('#nvd3').append('svg').datum(vizdata).call(chart);
                            nv.utils.windowResize(chart.update);

                            return chart;
                            // TODO: check tooltip div lifecycle
                        });
                    });
                } else if (['diagram', 'map'].indexOf(vizType) != -1) {
                    var path = '/assets/charts/0.3.2';
                    require.config({
                        baseUrl: path,
                        paths: {
                            leaflet: '/assets/leaflet/1.0.3/leaflet',
                            'snap.svg': '/assets/snap.svg/0.4.1/snap.svg-min'
                        },
                        shim: {
                            leaflet: {exports: 'L'}
                        }
                    });
                    $viz.innerHTML = '';
                    if (vizType == 'map') {
                        loadCss('/assets/leaflet/1.0.3/leaflet.css');
                        loadCss(path+'/map/default.css');
                    }
                    require([vizType+'/chart'], function(Chart) {
                        var chart = Chart($viz, {margin: 0.05});
                        chart.update(data);
                        resize = function() { chart.resize(); };
                    });
                } else if (vizType == 'object-tree') {
                    require.config({
                        paths: {
                            jsontree: '/assets/jsontree/0.2.1/jsontree.min'
                        },
                        shim: {
                            jsontree: {exports: 'JSONTree'}
                        }
                    });
                    loadCss('/assets/object-tree.css');
                    require(['jsontree'], function(JSONTree) {
                        $viz.innerHTML = JSONTree.create(data);
                    })
                } else if (vizType == 'table') {
                    require.config({
                        paths: {
                            tablesort: '/assets/tablesort/5.0.0/tablesort.min'
                        },
                        shim: {
                            tablesort: {exports: 'Tablesort'}
                        }
                    });
                    loadCss('/assets/table.css');
                    require(['tablesort'], function(Tablesort) {
                        var $table = document.createElement('table'),
                            $tbody = document.createElement('tbody'),
                            $row = function(row, header) {
                                return row.reduce(function($tr, value) {
                                    var $td = document.createElement(header ? 'th' : 'td');
                                    $td.textContent = value;
                                    $tr.appendChild($td);
                                    return $tr;
                                }, document.createElement('tr'))
                            };

                        if (data.cols) {
                            $table.appendChild($row(data.cols.map(function(col) {
                                return col.label;
                            }), true));
                            data = data.rows;
                        }
                        data.forEach(function(row) {
                            $tbody.appendChild($row(row));
                        });
                        $table.appendChild($tbody);
                        $viz.innerHTML = '';
                        $viz.appendChild($table);
                        new Tablesort($table);
                    })
                } else if (vizType == 'text') {
                    loadCss('/assets/text.css');
                    $viz.textContent = data;
                } else if (vizType == 'uml-sequence') {
                    require.config({
                        baseUrl: path,
                        paths: {
                            webfont: '/assets/webfont/1.6.28/webfontloader',
                            'snap.svg': '/assets/snap.svg/0.4.1/snap.svg-min',
                            underscore: '/assets/underscore/1.8.3/underscore-min',
                            'sequence-diagram': '/assets/js-sequence-diagrams/2.0.1/sequence-diagram'
                        },
                        shim: {
                            underscore: {exports: '_'},
                            'sequence-diagram': {exports: 'Diagram', deps: ['webfont', 'snap.svg', 'underscore']},
                        }
                    });
                    require(['sequence-diagram'], function(Diagram) {
                        var diagram = Diagram.parse(data);
                        $viz.innerHTML = '';
                        $viz.setAttribute('id', 'sequence');
                        diagram.drawSVG('sequence', {theme: 'snapSimple'});
                        resizableSvg($viz.firstChild);
                    });
                } else if (vizType == 'flowchart') {
                    require.config({
                        baseUrl: path,
                        paths: {
                            Raphael: '/assets/raphael/2.2.7/raphael.min',
                            flowchart: '/assets/flowchart/1.7.0/flowchart-latest'
                        },
                        shim: {
                            //Raphael: {exports: 'Raphael'},
                            flowchart: {exports: 'flowchart'},
                        }
                    });
                    require(['flowchart'], function(flowchart) {
                        var diagram = flowchart.parse(data);
                        $viz.innerHTML = '';
                        $viz.setAttribute('id', 'flowchart');
                        diagram.drawSVG('flowchart');
                        resizableSvg($viz.firstChild);
                    });
                } else if (vizType == 'graph') {
                    require.config({
                        baseUrl: path,
                        paths: {
                            d3: '/assets/d3/4.2.8/d3.min',
                            'dot-checker': '/assets/graph-viz-d3/0.9.50/dot-checker',
                            'layout-worker': '/assets/graph-viz-d3/0.9.50/layout-worker',
                            worker: '/assets/requirejs-web-workers/1.0.1/worker',
                            renderer: '/assets/graph-viz-d3/0.9.50/renderer'
                        }
                    });
                    require(['renderer'], function(renderer) {
                        $viz.innerHTML = '';
                        $viz.setAttribute('id', 'graph');
                        renderer.init('#graph');
                        renderer.renderHandler(function() {
                            resizableSvg($viz.firstChild);
                        });
                        renderer.render(data);
                    });
                } else if (vizType == 'railroad-diagram') {
                    loadCss('/assets/railroad-diagrams/railroad-diagrams.css');
                    require.config({
                        baseUrl: path,
                        paths: {
                            diagram: '/assets/railroad-diagrams/railroad-diagrams'
                        }
                    });
                    require(['diagram'], function(Diagram) {
                        $viz.innerHTML = '';
                        // Allow creating a function with arguments list only available at runtime
                        var newFunction = function(params, body) {
                                return new (Function.prototype.bind.apply(Function, [null].concat(params, [body])));
                            };
                        // Add Diagram member functions to local scope by using them as args of a dynamically created function (to avoid using 'with')
                        var scopedEval = newFunction(Object.keys(Diagram).concat(['data']), 'return eval(data)');
                        // Eval given syntax in 'Diagram' library scope
                        scopedEval.apply(this, Object.values(Diagram).concat(data)).format().addTo($viz);
                        resizableSvg($viz.firstChild);
                    });
                }
                setFontSize();
            },
            resize: function() {
                setFontSize();
                resize && resize();
            }
        };
    };
});
